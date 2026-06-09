import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const publicMainnetRpcEndpoint = process.env.ZEC_PUBLIC_RPC_URL ?? "https://docs-demo.zec-mainnet.quiknode.pro/";
const publicExplorerApiBase = process.env.ZEC_EXPLORER_API_BASE ?? "https://api.blockchair.com/zcash";
let frostDemoCache = null;
const frostDemoCacheByMessage = new Map();
const defaultTransparentAddress = "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd";
const defaultProofTxid = "b138c395dd721c9cee3d5676cfe41dd343aec5e6d2514cbb03b018e1babcc368";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

function sha256Hex(value) {
  return createHash("sha256").update(String(value)).digest("hex");
}

function classifyViewingKey(viewingKey) {
  const key = viewingKey.trim();
  const lowered = key.toLowerCase();
  const wordCount = key.split(/\s+/).filter(Boolean).length;

  if (!key) {
    return { valid: false, type: "missing", message: "Paste a full viewing key to start a read-only sync." };
  }

  if (wordCount >= 12 || lowered.startsWith("secret") || lowered.includes("spending")) {
    return {
      valid: false,
      type: "dangerous-secret",
      message: "This looks like seed or spending-key material. ZecSafe only accepts viewing keys.",
    };
  }

  if (lowered.startsWith("uview1") || lowered.startsWith("uvf1")) {
    return { valid: true, type: "Unified full viewing key", message: "Unified full viewing key accepted." };
  }

  if (lowered.startsWith("zviews")) {
    return { valid: true, type: "Sapling full viewing key", message: "Sapling full viewing key accepted." };
  }

  if (lowered.startsWith("uivk1") || lowered.startsWith("uvi1") || lowered.startsWith("zivks")) {
    return {
      valid: false,
      type: "incoming-viewing-key",
      message: "Incoming viewing keys are not enough for this balance route. Use a full viewing key.",
    };
  }

  if (lowered.includes("test")) {
    return {
      valid: false,
      type: "testnet-key",
      message: "This prototype is configured for Zcash mainnet. Use a mainnet full viewing key.",
    };
  }

  return {
    valid: false,
    type: "unknown",
    message: "Unsupported viewing key format. Expected uview1, uvf1, or zviews...",
  };
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64_000) {
      throw new Error("Request body is too large.");
    }
  }

  return body ? JSON.parse(body) : {};
}

function zcashRpcConfig() {
  const url = process.env.ZEC_RPC_URL ?? process.env.ZCASH_RPC_URL;
  const user = process.env.ZEC_RPC_USER ?? process.env.ZCASH_RPC_USER;
  const password = process.env.ZEC_RPC_PASSWORD ?? process.env.ZCASH_RPC_PASSWORD;

  if (!url) return null;

  const headers = { "Content-Type": "application/json" };
  if (user || password) {
    headers.Authorization = `Basic ${Buffer.from(`${user ?? ""}:${password ?? ""}`).toString("base64")}`;
  }

  return { url, headers };
}

async function callZcashRpc(method, params) {
  const config = zcashRpcConfig();
  if (!config) {
    return {
      configured: false,
      message: "Local zcashd RPC is not configured.",
    };
  }

  const rpcResponse = await fetch(config.url, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({
      jsonrpc: "1.0",
      id: `zecsafe-${method}`,
      method,
      params,
    }),
  });

  if (!rpcResponse.ok) {
    throw new Error(`zcashd RPC returned HTTP ${rpcResponse.status}.`);
  }

  const payload = await rpcResponse.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? "zcashd RPC returned an error.");
  }

  return { configured: true, result: payload.result };
}

async function callPublicMainnetRpc(method, params) {
  const rpcResponse = await fetch(publicMainnetRpcEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `zecsafe-public-${method}`,
      method,
      params,
    }),
  });

  if (!rpcResponse.ok) {
    throw new Error(`Public mainnet RPC returned HTTP ${rpcResponse.status}.`);
  }

  const payload = await rpcResponse.json();
  if (payload.error) {
    throw new Error(payload.error.message ?? "Public mainnet RPC returned an error.");
  }

  return payload.result;
}

async function callMainnetRpc(method, params) {
  const attempts = [];

  try {
    const localRpc = await callZcashRpc(method, params);
    if (localRpc.configured) {
      return {
        result: localRpc.result,
        source: "local-zcashd-rpc",
        sourceLabel: "Local zcashd RPC",
      };
    }
    attempts.push(localRpc.message);
  } catch (error) {
    attempts.push(`Local zcashd RPC: ${error.message}`);
  }

  try {
    return {
      result: await callPublicMainnetRpc(method, params),
      source: publicMainnetRpcEndpoint,
      sourceLabel: "Public Zcash mainnet RPC",
    };
  } catch (error) {
    attempts.push(`Public mainnet RPC: ${error.message}`);
  }

  const unavailable = new Error(
    "Zcash mainnet RPC is unavailable. Configure ZEC_RPC_URL for local zcashd, or set ZEC_PUBLIC_RPC_URL to a working RPC endpoint.",
  );
  unavailable.status = "unavailable";
  unavailable.source = "mainnet-rpc-unavailable";
  unavailable.attempts = attempts.filter(Boolean);
  return Promise.reject(unavailable);
}

async function callMainnetRpcResult(method, params) {
  const rpc = await callMainnetRpc(method, params);
  return rpc.result;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ZecSafe/1.0 read-only-mainnet-proof",
    },
  });

  if (!response.ok) {
    throw new Error(`Public explorer API returned HTTP ${response.status}.`);
  }

  return response.json();
}

async function getExplorerTransactionProof(txid, localError) {
  const [transactionPayload, statsPayload] = await Promise.all([
    fetchJson(`${publicExplorerApiBase}/dashboards/transaction/${txid}`),
    fetchJson(`${publicExplorerApiBase}/stats`),
  ]);
  const record = transactionPayload?.data?.[txid];
  const transaction = record?.transaction;

  if (!transaction) {
    throw new Error(localError ? `${localError.message}; public explorer could not find transaction.` : "Public explorer could not find transaction.");
  }

  const blockHeight = transaction.block_id ?? null;
  const bestBlockHeight = statsPayload?.data?.best_block_height ?? transactionPayload?.context?.state ?? null;
  const confirmations = blockHeight && bestBlockHeight ? bestBlockHeight - blockHeight + 1 : null;
  const outputs = record.outputs ?? [];
  const shieldedInputs = transaction.shielded_input_raw ?? [];
  const shieldedOutputs = transaction.shielded_output_raw ?? [];
  const joinsplits = transaction.join_split_raw ?? [];
  const blockTimeIso = transaction.time ? new Date(`${transaction.time.replace(" ", "T")}Z`).toISOString() : null;

  return {
    txid: transaction.hash,
    source: "blockchair-public-explorer-api",
    sourceUrl: `${publicExplorerApiBase}/dashboards/transaction/${txid}`,
    height: blockHeight,
    confirmations,
    blockhash: null,
    blocktime: blockTimeIso ? Math.floor(Date.parse(blockTimeIso) / 1000) : null,
    blockTimeIso,
    transparentOutputTotal: outputs.reduce((sum, output) => sum + Number(output.value ?? 0), 0),
    transparentOutputCount: outputs.length,
    shieldedSpendCount: shieldedInputs.length + joinsplits.length,
    shieldedOutputCount: shieldedOutputs.length + joinsplits.length,
    orchardActionCount: 0,
    fee: transaction.fee ?? null,
    bestBlockHeight,
    fallback: true,
    fallbackReason: localError?.message ?? "Local node proof unavailable.",
  };
}

function mainnetUnavailablePayload(error, message) {
  return {
    status: "unavailable",
    message,
    source: error.source ?? "mainnet-rpc-unavailable",
    errors: error.attempts ?? [error.message],
    docsLink: "https://zechub.wiki/developers",
    requiredEnvironment: ["ZEC_RPC_URL", "ZEC_RPC_USER", "ZEC_RPC_PASSWORD", "ZEC_PUBLIC_RPC_URL"],
  };
}

async function handleViewingKeyBalance(request, response) {
  try {
    const body = await readJsonBody(request);
    const viewingKey = String(body.viewingKey ?? "");
    const minConfirmations = Math.max(1, Number(body.minConfirmations ?? 1));
    const classification = classifyViewingKey(viewingKey);

    if (!classification.valid) {
      sendJson(response, 200, {
        status: "rejected",
        balance: null,
        source: "input-validation",
        keyType: classification.type,
        message: classification.message,
      });
      return;
    }

    const rpc = await callZcashRpc("z_getbalanceforviewingkey", [viewingKey.trim(), minConfirmations]);

    if (!rpc.configured) {
      sendJson(response, 200, {
        status: "unavailable",
        balance: null,
        source: "public-rpc-unavailable",
        keyType: classification.type,
        message:
          "Viewing key balance requires a local zcashd with z_getbalanceforviewingkey support. Connect a local node via ZEC_RPC_URL to enable this feature.",
        docsLink: "https://zechub.wiki/developers",
        requiredEnvironment: ["ZEC_RPC_URL", "ZEC_RPC_USER", "ZEC_RPC_PASSWORD"],
        commandExample:
          'zcash-cli z_getbalanceforviewingkey "<full-viewing-key>" 1',
      });
      return;
    }

    sendJson(response, 200, {
      status: "success",
      balance: rpc.result,
      source: "local-zcashd-rpc",
      keyType: classification.type,
      message: "Balance returned by z_getbalanceforviewingkey.",
      result: rpc.result,
    });
  } catch (error) {
    sendJson(response, 200, {
      status: "unavailable",
      balance: null,
      source: "public-rpc-unavailable",
      message: error.message,
      docsLink: "https://zechub.wiki/developers",
    });
  }
}

async function handleMainnetStatus(_request, response) {
  try {
    const [chainCall, blockCountCall, mempoolCall, peersCall] = await Promise.all([
      callMainnetRpc("getblockchaininfo", []),
      callMainnetRpc("getblockcount", []),
      callMainnetRpc("getmempoolinfo", []),
      callMainnetRpc("getpeerinfo", []),
    ]);
    const chain = chainCall.result;
    const blockCount = blockCountCall.result;
    const mempool = mempoolCall.result;
    const peers = peersCall.result;

    sendJson(response, 200, {
      status: "success",
      message: "Connected to Zcash mainnet infrastructure.",
      source: chainCall.source,
      result: {
        chain: chain.chain,
        blocks: blockCount,
        headers: chain.headers,
        initialBlockDownloadComplete: chain.initial_block_download_complete,
        difficulty: chain.difficulty,
        bestblockhash: chain.bestblockhash,
        verificationprogress: chain.verificationprogress,
        estimatedheight: chain.estimatedheight,
        mempoolSize: mempool.size,
        mempoolBytes: mempool.bytes,
        mempoolUsage: mempool.usage,
        connectedPeers: peers.length,
        consensus: chain.consensus,
        timestamp: new Date().toISOString(),
        valuePools: chain.valuePools ?? [],
        upgrades: Object.values(chain.upgrades ?? {}).map((upgrade) => ({
          name: upgrade.name,
          activationheight: upgrade.activationheight,
          status: upgrade.status,
        })),
      },
    });
  } catch (error) {
    sendJson(
      response,
      200,
      mainnetUnavailablePayload(
        error,
        "Mainnet status is temporarily unavailable. Configure a local zcashd RPC or a working public RPC endpoint to enable live chain status.",
      ),
    );
  }
}

async function handleAddressBalance(request, response) {
  try {
    const body = await readJsonBody(request);
    const address = String(body.address ?? "").trim();

    if (!/^t[13][1-9A-HJ-NP-Za-km-z]{20,}$/.test(address)) {
      sendJson(response, 400, {
        status: "rejected",
        message: "Enter a valid transparent Zcash mainnet address starting with t1 or t3.",
      });
      return;
    }

    const balanceCall = await callMainnetRpc("getaddressbalance", [{ addresses: [address] }]);
    const balance = balanceCall.result;

    sendJson(response, 200, {
      status: "success",
      message: "Transparent address balance returned from Zcash mainnet.",
      source: balanceCall.source,
      result: {
        address,
        balance: balance.balance,
        received: balance.received,
      },
    });
  } catch (error) {
    sendJson(
      response,
      200,
      mainnetUnavailablePayload(
        error,
        "Address balance lookup is temporarily unavailable. The address was accepted, but ZecSafe needs a working Zcash mainnet RPC source to fetch balance data.",
      ),
    );
  }
}

async function handleTransactionProof(request, response) {
  try {
    const body = await readJsonBody(request);
    const txid = String(body.txid ?? "").trim().toLowerCase();

    if (!/^[0-9a-f]{64}$/.test(txid)) {
      sendJson(response, 400, {
        status: "rejected",
        message: "Enter a 64-character Zcash transaction ID.",
      });
      return;
    }

    const proof = await getTransactionProof(txid);

    sendJson(response, 200, {
      status: "success",
      message: "Transaction proof found on Zcash mainnet.",
      source: proof.source,
      result: proof,
    });
  } catch (error) {
    sendJson(
      response,
      200,
      mainnetUnavailablePayload(
        error,
        "Transaction proof lookup is temporarily unavailable. Connect ZecSafe to a working Zcash mainnet RPC source to verify confirmations.",
      ),
    );
  }
}

async function getTransactionProof(txid) {
  let transactionCall;
  let localError = null;

  try {
    transactionCall = await callMainnetRpc("getrawtransaction", [txid, 1]);
  } catch (error) {
    localError = error;
    return getExplorerTransactionProof(txid, localError);
  }

  const transaction = transactionCall.result;
  let block = null;
  let blockCount = null;

  try {
    [block, blockCount] = transaction.blockhash
      ? await Promise.all([
          callMainnetRpcResult("getblock", [transaction.blockhash, 1]),
          callMainnetRpcResult("getblockcount", []),
        ])
      : [null, null];
  } catch (error) {
    localError = error;
    return getExplorerTransactionProof(txid, localError);
  }

  const outputs = transaction.vout ?? [];
  const transparentOutputTotal = outputs.reduce((sum, output) => sum + Number(output.valueZat ?? 0), 0);
  const blockHeight = block?.height ?? transaction.height ?? null;
  const confirmations = blockHeight && blockCount ? blockCount - blockHeight + 1 : transaction.confirmations;

  return {
    txid: transaction.txid,
    source: transactionCall.source,
    height: blockHeight,
    confirmations,
    blockhash: transaction.blockhash,
    blocktime: transaction.blocktime,
    blockTimeIso: transaction.blocktime ? new Date(transaction.blocktime * 1000).toISOString() : null,
    transparentOutputTotal,
    transparentOutputCount: outputs.length,
    shieldedSpendCount: transaction.vShieldedSpend?.length ?? 0,
    shieldedOutputCount: transaction.vShieldedOutput?.length ?? 0,
    orchardActionCount: transaction.orchard?.actions?.length ?? 0,
  };
}

async function handleProofBundle(response) {
  const proofMessage = "ZecSafe proof bundle verification";
  const [chainResult, blockCountResult, mempoolResult, peersResult, balanceResult, transactionResult, frostResult] =
    await Promise.allSettled([
      callMainnetRpcResult("getblockchaininfo", []),
      callMainnetRpcResult("getblockcount", []),
      callMainnetRpcResult("getmempoolinfo", []),
      callMainnetRpcResult("getpeerinfo", []),
      callMainnetRpcResult("getaddressbalance", [{ addresses: [defaultTransparentAddress] }]),
      getTransactionProof(defaultProofTxid),
      runFrostDemoScript({
        message: proofMessage,
        proposalId: "proof-bundle",
        proposalPayloadHash: sha256Hex(proofMessage),
      }),
    ]);

  const errors = [chainResult, blockCountResult, mempoolResult, peersResult, balanceResult, transactionResult, frostResult]
    .filter((item) => item.status === "rejected")
    .map((item) => item.reason?.message ?? "Unknown proof-bundle error.");
  const chain = chainResult.status === "fulfilled" ? chainResult.value : null;
  const blockCount = blockCountResult.status === "fulfilled" ? blockCountResult.value : null;
  const mempool = mempoolResult.status === "fulfilled" ? mempoolResult.value : null;
  const peers = peersResult.status === "fulfilled" ? peersResult.value : null;
  const balance = balanceResult.status === "fulfilled" ? balanceResult.value : null;
  const transactionProof = transactionResult.status === "fulfilled" ? transactionResult.value : null;
  const frost = frostResult.status === "fulfilled" ? frostResult.value : null;

  sendJson(response, 200, {
    status: errors.length ? "partial" : "success",
    generatedAt: new Date().toISOString(),
    source: "mainnet-rpc-adapter",
    errors,
    mainnet: chain
      ? {
          chain: chain.chain,
          blocks: blockCount,
          mempoolSize: mempool?.size ?? null,
          connectedPeers: Array.isArray(peers) ? peers.length : null,
        }
      : null,
    addressBalance: balance
      ? {
          address: defaultTransparentAddress,
          balance: balance.balance,
          received: balance.received,
        }
      : null,
    transactionProof,
    frost: frost
      ? {
          verified: frost.verified === true,
          groupPublicKey: frost.groupPublicKey,
          aggregatedSignature: frost.aggregatedSignature,
          messageHash: frost.messageHash,
        }
      : null,
    realVsSimulated: {
      mainnetRpcReads: chain ? "real" : "unavailable",
      addressBalance: balance ? "real" : "unavailable",
      transactionProof: transactionProof ? "real" : "unavailable",
      frostKeyGeneration: frost?.verified === true ? "real-local" : "unavailable",
      guardianApprovals: "simulated",
      transactionBroadcast: "simulated",
      recoveryMigration: "simulated",
    },
  });
}

function runFrostDemoScript(options = {}) {
  return new Promise((resolve) => {
    const scriptPath = join(rootDir, "scripts", "frost-demo.mjs");
    const child = spawn(process.execPath, [scriptPath], {
      cwd: rootDir,
      windowsHide: true,
      env: {
        ...process.env,
        ZECSAFE_FROST_MESSAGE: options.message ?? "",
        ZECSAFE_PROPOSAL_ID: options.proposalId ?? "",
        ZECSAFE_PROPOSAL_PAYLOAD_HASH: options.proposalPayloadHash ?? "",
        ZECSAFE_PROPOSAL_PAYLOAD: options.proposalPayload ? JSON.stringify(options.proposalPayload) : "",
      },
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      resolve({
        error: "FROST demo timed out.",
        fallback: true,
        stderr,
      });
    }, 15_000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      try {
        const payload = JSON.parse(stdout);
        if (code === 0) {
          resolve(payload);
          return;
        }
        resolve({ ...payload, error: payload.error ?? `FROST demo exited with code ${code}.`, fallback: true });
      } catch (error) {
        resolve({
          error: stderr || error.message,
          fallback: true,
        });
      }
    });
  });
}

async function handleFrostDemo(request, response) {
  if (request.method === "POST") {
    const body = await readJsonBody(request);
    const message = String(body.message ?? "").trim();
    const proposalPayloadHash = String(body.proposalPayloadHash ?? "").trim();
    const proposalId = String(body.proposalId ?? "").trim();
    const proposalPayload = body.proposalPayload && typeof body.proposalPayload === "object" ? body.proposalPayload : null;
    const signingMessage = message || (proposalPayloadHash ? `ZecSafe proposal payload hash: ${proposalPayloadHash}` : "");
    const cacheKey = sha256Hex(JSON.stringify({ signingMessage, proposalPayloadHash, proposalId, proposalPayload }));

    if (!frostDemoCacheByMessage.has(cacheKey)) {
      frostDemoCacheByMessage.set(
        cacheKey,
        await runFrostDemoScript({
          message: signingMessage,
          proposalPayloadHash,
          proposalId,
          proposalPayload,
        }),
      );
    }

    const payload = frostDemoCacheByMessage.get(cacheKey);
    sendJson(response, payload.error ? 500 : 200, payload);
    return;
  }

  if (!frostDemoCache) {
    frostDemoCache = await runFrostDemoScript();
  }
  sendJson(response, frostDemoCache.error ? 500 : 200, frostDemoCache);
}

async function handleApi(request, response, pathname) {
  if (request.method === "GET" && pathname === "/api/mainnet/status") {
    await handleMainnetStatus(request, response);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/mainnet-status") {
    await handleMainnetStatus(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/mainnet/address-balance") {
    await handleAddressBalance(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/viewing-key-balance") {
    await handleViewingKeyBalance(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/transaction-proof") {
    await handleTransactionProof(request, response);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/frost-demo") {
    await handleFrostDemo(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/frost-demo") {
    await handleFrostDemo(request, response);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/proof-bundle") {
    await handleProofBundle(response);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      rpcConfigured: Boolean(zcashRpcConfig()),
      supportedViewingKeys: ["uview1", "uvf1", "zviews"],
      transactionProof: true,
      frostDemo: true,
    });
    return true;
  }

  return false;
}

function staticFilePath(pathname) {
  const requested = pathname === "/" ? "/index.html" : pathname;
  const decoded = decodeURIComponent(requested);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(rootDir, normalized);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (url.pathname.startsWith("/api/")) {
    const handled = await handleApi(request, response, url.pathname);
    if (!handled) sendJson(response, 404, { status: "not_found" });
    return;
  }

  try {
    const filePath = staticFilePath(url.pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    const file = await readFile(filePath);
    response.writeHead(200, {
      "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, () => {
  console.log(`ZecSafe listening on http://127.0.0.1:${port}`);
});

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createIntentV1, findIntentNumericSyntaxError } from "./src/intent-v1.mjs";

const rootDir = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT ?? 4173);
const publicMainnetRpcEndpoint = process.env.ZEC_PUBLIC_RPC_URL ?? "https://docs-demo.zec-mainnet.quiknode.pro/";
const publicExplorerApiBase = process.env.ZEC_EXPLORER_API_BASE ?? "https://api.blockchair.com/zcash";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
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

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  error.code = "bad_request";
  return error;
}

function sendInputError(response, error) {
  if (error?.statusCode !== 400) return false;

  sendJson(response, 400, {
    status: error.code ?? "bad_request",
    message: error.message,
  });
  return true;
}

async function readJsonBody(request) {
  let body = "";

  for await (const chunk of request) {
    body += chunk;
    if (body.length > 64_000) {
      throw badRequest("Request body is too large.");
    }
  }

  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    throw badRequest("Malformed JSON body.");
  }
}

async function readJsonBodyWithRaw(request) {
  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
    if (rawBody.length > 64_000) {
      throw badRequest("Request body is too large.");
    }
  }

  if (!rawBody) return { body: {}, rawBody: "" };

  try {
    return {
      body: JSON.parse(rawBody),
      rawBody,
    };
  } catch {
    throw badRequest("Malformed JSON body.");
  }
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
    if (sendInputError(response, error)) return;

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
    if (sendInputError(response, error)) return;

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

async function handleIntentCreate(request, response) {
  try {
    const { body, rawBody } = await readJsonBodyWithRaw(request);
    const numericSyntaxError = findIntentNumericSyntaxError(rawBody);
    if (numericSyntaxError) throw badRequest(numericSyntaxError);

    const result = createIntentV1(body);
    sendJson(response, 200, {
      status: "success",
      message: "Intent created",
      intent: result.intent,
      canonical_intent_json: result.canonical_intent_json,
      intent_commitment: result.intent_commitment,
    });
  } catch (error) {
    if (sendInputError(response, error)) return;

    if (error?.name === "IntentValidationError") {
      sendJson(response, 400, {
        status: error.code ?? "invalid_intent",
        message: error.message,
      });
      return;
    }

    throw error;
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


async function handleApi(request, response, pathname) {
  // Current chain observation. This is NOT proof of FROST provenance: the recorded proof is
  // fixtures/verified-mainnet-run/proof.json, verified by `make judge-proof-mainnet`.
  if (request.method === "GET" && pathname === "/api/mainnet/status") {
    await handleMainnetStatus(request, response);
    return true;
  }

  // Chain-observation helper for a caller-supplied txid. Never a source of judge proof.
  if (request.method === "POST" && pathname === "/api/transaction-proof") {
    await handleTransactionProof(request, response);
    return true;
  }

  if (request.method === "POST" && pathname === "/api/intent/create") {
    await handleIntentCreate(request, response);
    return true;
  }

  if (request.method === "GET" && pathname === "/api/health") {
    sendJson(response, 200, {
      status: "ok",
      rpcConfigured: Boolean(zcashRpcConfig()),
      transactionProof: true,
      intentV1: true,
      proofSource: "fixtures/verified-mainnet-run/proof.json",
      judgeProofCommand: "make judge-proof-mainnet",
    });
    return true;
  }

  return false;
}

function staticFilePath(pathname) {
  const requested = pathname === "/" || pathname === "/demo" ? "/index.html" : pathname;
  const decoded = decodeURIComponent(requested);
  const normalized = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  return join(rootDir, normalized);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

  if (url.pathname.startsWith("/api/")) {
    try {
      const handled = await handleApi(request, response, url.pathname);
      if (!handled) sendJson(response, 404, { status: "not_found" });
    } catch {
      sendJson(response, 500, {
        status: "server_error",
        message: "ZecSafe could not complete this API request.",
      });
    }
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

server.requestTimeout = 15_000;
server.headersTimeout = 16_000;

server.listen(port, () => {
  console.log(`ZecSafe listening on http://127.0.0.1:${port}`);
});

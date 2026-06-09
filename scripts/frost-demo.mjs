import { spawn } from "node:child_process";
import { access, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const demoRepo = "https://github.com/ZcashFoundation/frost-zcash-demo";
const scriptsDir = dirname(fileURLToPath(import.meta.url));

async function commandCandidates(command) {
  const candidates = [command];
  const cargoHome = process.env.CARGO_HOME ?? join(process.env.USERPROFILE ?? "", ".cargo");
  if (cargoHome) {
    candidates.push(join(cargoHome, "bin", process.platform === "win32" ? `${command}.exe` : command));
  }

  const existing = [];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      existing.push(candidate);
    } catch {
      if (candidate === command) existing.push(candidate);
    }
  }
  return existing;
}

async function findFile(root, filename, maxDepth = 6) {
  try {
    await access(root);
  } catch {
    return null;
  }

  async function walk(directory, depth) {
    if (depth > maxDepth) return null;
    let entries = [];
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return null;
    }

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      if (entry.isFile() && entry.name.toLowerCase() === filename.toLowerCase()) {
        return fullPath;
      }
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const match = await walk(join(directory, entry.name), depth + 1);
      if (match) return match;
    }

    return null;
  }

  return walk(root, 0);
}

async function commandExists(command, args = ["--version"]) {
  const candidates = await commandCandidates(command);
  for (const candidate of candidates) {
    const exists = await new Promise((resolve) => {
      const child = spawn(candidate, args, { windowsHide: true, shell: false });
      child.on("error", () => resolve(false));
      child.on("close", (code) => resolve(code === 0 || code === 1));
    });
    if (exists) return true;
  }
  return false;
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function runCommand(command, args = [], timeoutMs = 12_000) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      windowsHide: true,
      shell: false,
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      resolve({ ok: false, stdout, stderr: stderr || "Command timed out." });
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      resolve({ ok: false, stdout, stderr: error.message });
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      resolve({ ok: code === 0, stdout, stderr });
    });
  });
}

async function main() {
  const command = process.env.FROST_DEMO_COMMAND;
  const [cargoInstalled, rustcInstalled, linkOnPath, visualStudioLinker, windowsSdkKernelLib, frostClientInstalled, zcashSignInstalled] =
    await Promise.all([
      commandExists("cargo"),
      commandExists("rustc"),
      commandExists("link", ["/?"]),
      findFile("C:\\Program Files (x86)\\Microsoft Visual Studio\\2022\\BuildTools\\VC\\Tools\\MSVC", "link.exe"),
      findFile("C:\\Program Files (x86)\\Windows Kits\\10\\Lib", "kernel32.lib"),
      commandExists("frost-client", ["--help"]),
      commandExists("zcash-sign", ["--help"]),
    ]);
  const linkerInstalled = Boolean(linkOnPath || visualStudioLinker);
  const windowsSdkLibrariesInstalled = Boolean(windowsSdkKernelLib);

  if (!command && (!frostClientInstalled || !zcashSignInstalled)) {
    writeJson({
      status: "tooling-unavailable",
      library: "ZcashFoundation/frost-zcash-demo",
      repo: demoRepo,
      prerequisites: {
        cargoInstalled,
        rustcInstalled,
        linkerInstalled,
        windowsSdkLibrariesInstalled,
        frostClientInstalled,
        zcashSignInstalled,
      },
      groupPublicKey: null,
      keyShares: [],
      signingRound1: {},
      signingRound2: {},
      aggregatedSignature: null,
      verified: false,
      fallback: true,
      message:
        "Official Zcash FROST demo tooling is not fully configured. Install frost-client and zcash-sign, then set FROST_DEMO_COMMAND to a local wrapper that returns the expected JSON shape.",
      installHint:
        "Windows requires Rust plus Visual Studio C++ Build Tools. Then run: cargo install --git https://github.com/ZcashFoundation/frost-zcash-demo.git --locked frost-client",
    });
    return;
  }

  const commandToRun = command ?? process.execPath;
  const argsToRun = command ? [] : [join(scriptsDir, "frost-local-wrapper.mjs")];
  const result = await runCommand(commandToRun, argsToRun);
  if (!result.ok) {
    writeJson({
      status: "tooling-error",
      library: "ZcashFoundation/frost-zcash-demo",
      repo: demoRepo,
      prerequisites: {
        cargoInstalled,
        rustcInstalled,
        linkerInstalled,
        windowsSdkLibrariesInstalled,
        frostClientInstalled,
        zcashSignInstalled,
      },
      groupPublicKey: null,
      keyShares: [],
      signingRound1: {},
      signingRound2: {},
      aggregatedSignature: null,
      verified: false,
      fallback: true,
      message: "Configured FROST demo command failed.",
      error: result.stderr,
    });
    process.exitCode = 1;
    return;
  }

  try {
    const payload = JSON.parse(result.stdout);
    writeJson({
      status: "success",
      library: payload.library ?? "ZcashFoundation/frost-tools",
      repo: payload.repo ?? demoRepo,
      groupPublicKey: payload.groupPublicKey,
      keyShares: Array.isArray(payload.keyShares) ? payload.keyShares : [],
      signingRound1: payload.signingRound1 ?? {},
      signingRound2: payload.signingRound2 ?? {},
      aggregatedSignature: payload.aggregatedSignature,
      verified: Boolean(payload.verified),
      signedMessage: payload.signedMessage ?? process.env.ZECSAFE_FROST_MESSAGE ?? null,
      messageHash: payload.messageHash ?? (process.env.ZECSAFE_FROST_MESSAGE ? null : undefined),
      proposalId: payload.proposalId ?? process.env.ZECSAFE_PROPOSAL_ID ?? null,
      proposalPayloadHash: payload.proposalPayloadHash ?? process.env.ZECSAFE_PROPOSAL_PAYLOAD_HASH ?? null,
      proposalPayload: payload.proposalPayload ?? (process.env.ZECSAFE_PROPOSAL_PAYLOAD ? JSON.parse(process.env.ZECSAFE_PROPOSAL_PAYLOAD) : null),
      fallback: false,
      message: "Configured local FROST demo returned threshold-signing output.",
    });
  } catch (error) {
    writeJson({
      status: "parse-error",
      library: "ZcashFoundation/frost-zcash-demo",
      repo: demoRepo,
      prerequisites: {
        cargoInstalled,
        rustcInstalled,
        linkerInstalled,
        windowsSdkLibrariesInstalled,
        frostClientInstalled,
        zcashSignInstalled,
      },
      groupPublicKey: null,
      keyShares: [],
      signingRound1: {},
      signingRound2: {},
      aggregatedSignature: null,
      verified: false,
      fallback: true,
      message: "Configured FROST demo command did not return valid JSON.",
      error: error.message,
    });
    process.exitCode = 1;
  }
}

await main();

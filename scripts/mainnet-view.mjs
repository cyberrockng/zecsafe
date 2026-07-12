#!/usr/bin/env node
import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { readdir, readFile, stat, writeFile, mkdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  buildMainnetViewPreflight,
  formatMainnetViewSummary,
  MainnetViewError,
  parseAccountList,
  parseAddressInspect,
  parseBalanceCommand,
  parseMainnetInfo,
  sanitizeSyncFailure,
} from "../src/mainnet-view-v1.mjs";

const DEFAULT_ENV_FIXTURE = "fixtures/mainnet-demo/p0-017-mainnet-demo-env.json";
const ZECSAFE_HOME = process.env.ZECSAFE_HOME ?? join(homedir(), ".zecsafe");
const DEFAULT_RUN_ROOT = process.env.ZECSAFE_RUNS_ROOT ?? join(ZECSAFE_HOME, "runs");
const DEFAULT_ZCASH_DEVTOOL =
  process.env.ZECSAFE_ZCASH_DEVTOOL ??
  join(ZECSAFE_HOME, "toolchain", "zcash-devtool-p0-018-compat", "target", "debug", "zcash-devtool");
const DEFAULT_ZCASH_DEVTOOL_COMPAT_PATCH_REF = "sha256:4a44cfc533dec72fb4e93bcbf81406260d4b3f6e77344b53035426ab297c7d8e";
const DEFAULT_SERVER = "zecrocks";
const DEFAULT_CONNECTION = "direct";

function usage() {
  console.error(`Usage:
  mainnet-view preflight [--env fixture.json] [--run-root DIR] [--zcash-devtool PATH] [--out report.json] [--summary] [--sync] [--sync-timeout-ms MS]
  mainnet-view watch [--env fixture.json] [--run-root DIR] [--zcash-devtool PATH] [--out report.json] [--summary] [--sync] [--interval-ms MS] [--max-attempts N]`);
}

function parseFlags(argv, startIndex = 0) {
  const flags = { _: [] };
  for (let index = startIndex; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--summary") {
      flags.summary = true;
    } else if (arg === "--sync") {
      flags.sync = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replaceAll("-", "_");
      const value = argv[++index];
      if (value === undefined) {
        usage();
        process.exit(1);
      }
      flags[key] = value;
    } else {
      flags._.push(arg);
    }
  }
  return flags;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return `sha256:${hash.digest("hex")}`;
}

function runTool(tool, args, { timeout = 60000, allowFailure = false } = {}) {
  const result = spawnSync(tool, args, {
    encoding: "utf8",
    shell: false,
    timeout,
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error && result.error.code !== "ETIMEDOUT") throw result.error;
  if (!allowFailure && result.status !== 0) {
    const message = (result.stderr || result.stdout || `command failed: ${tool} ${args.join(" ")}`).trim();
    throw new MainnetViewError(message);
  }
  return {
    status: result.status,
    signal: result.signal ?? null,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    timed_out: result.error?.code === "ETIMEDOUT",
  };
}

async function scanCoordinatorWorkspace(walletDir) {
  const suspiciousSpendKey = [
    /secret-extended-key/i,
    /mnemonic/i,
    /seed phrase/i,
    /spending[_ -]?key/i,
  ];
  const suspiciousParticipant = [
    /(^|\/)(alice|bob|eve)\.toml$/i,
    /key-package/i,
    /secret_share/i,
    /signing_share/i,
    /participant_secret/i,
    /frost_secret/i,
  ];

  const files = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files.push(path);
    }
  }
  await walk(walletDir);

  let spendKeyAbsent = true;
  let participantShareAbsent = true;
  for (const file of files) {
    const normalized = file.split("\\").join("/");
    if (suspiciousParticipant.some((pattern) => pattern.test(normalized))) participantShareAbsent = false;
    if (suspiciousSpendKey.some((pattern) => pattern.test(normalized))) spendKeyAbsent = false;

    const info = await stat(file);
    if (info.size > 1024 * 1024 || /\.(sqlite|sqlite3|db)$/i.test(file)) continue;
    const buffer = await readFile(file);
    if (buffer.includes(0)) continue;
    const text = buffer.toString("utf8");
    if (suspiciousSpendKey.some((pattern) => pattern.test(text))) spendKeyAbsent = false;
    if (suspiciousParticipant.some((pattern) => pattern.test(text))) participantShareAbsent = false;
  }

  return {
    scan_scope: "view-only-wallet-dir",
    spend_key_absent: spendKeyAbsent,
    participant_share_absent: participantShareAbsent,
  };
}

async function buildReport(flags) {
  const envPath = resolve(flags.env ?? DEFAULT_ENV_FIXTURE);
  const env = await readJson(envPath);
  const runRoot = resolve(flags.run_root ?? DEFAULT_RUN_ROOT);
  const runDir = join(runRoot, env.run_id);
  const walletDir = join(runDir, "wallets", "frost-view");
  const usingDefaultTool = flags.zcash_devtool === undefined;
  const tool = resolve(flags.zcash_devtool ?? DEFAULT_ZCASH_DEVTOOL);
  const server = flags.server ?? DEFAULT_SERVER;
  const connection = flags.connection ?? DEFAULT_CONNECTION;

  let sync = { attempted: false, status: "NOT_REQUESTED", exit_status: null };
  if (flags.sync) {
    const syncResult = runTool(
      tool,
      ["wallet", "-w", walletDir, "sync", "-s", server, "--connection", connection],
      { timeout: Number(flags.sync_timeout_ms ?? 180000), allowFailure: true },
    );
    sync = {
      attempted: true,
      status: syncResult.status === 0 ? "SYNC_COMPLETE" : syncResult.timed_out ? "SYNC_TIMEOUT" : "SYNC_COMMAND_FAILED",
      exit_status: syncResult.status,
      failure_reason: sanitizeSyncFailure(syncResult),
    };
  }

  const mainnetInfo = parseMainnetInfo(
    runTool(tool, ["wallet", "-w", walletDir, "get-info", "-s", server, "--connection", connection]).stdout,
  );
  const account = parseAccountList(runTool(tool, ["wallet", "-w", walletDir, "list-accounts"]).stdout);
  const addressResult = runTool(tool, ["inspect", env.wallet.orchard_address]);
  const addressInspect = parseAddressInspect(`${addressResult.stdout}\n${addressResult.stderr}`);
  const balance = parseBalanceCommand(
    runTool(tool, ["wallet", "-w", walletDir, "balance", "--json"], { allowFailure: true }),
  );
  const coordinatorWorkspaceScan = await scanCoordinatorWorkspace(walletDir);
  const reportEnv = {
    ...env,
    toolchain: {
      ...env.toolchain,
      zcash_devtool_runtime: {
        mode: usingDefaultTool ? "p0-018-pre-ironwood-compat" : "custom",
        base_commit: env.toolchain?.zcash_devtool_commit,
        compatibility_patch_ref: usingDefaultTool ? DEFAULT_ZCASH_DEVTOOL_COMPAT_PATCH_REF : null,
        binary_ref: await sha256File(tool),
      },
    },
  };

  return buildMainnetViewPreflight({
    env: reportEnv,
    account,
    mainnet_info: mainnetInfo,
    address_inspect: addressInspect,
    balance,
    coordinator_workspace_scan: coordinatorWorkspaceScan,
    sync,
    recorded_at: flags.recorded_at,
  });
}

async function commandPreflight(argv) {
  const flags = parseFlags(argv, 0);
  const report = await buildReport(flags);
  if (flags.out) await writeJson(resolve(flags.out), report);
  if (flags.summary) console.log(formatMainnetViewSummary(report));
  else console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === "FAIL" ? 2 : 0;
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function commandWatch(argv) {
  const flags = parseFlags(argv, 0);
  const maxAttempts = Number(flags.max_attempts ?? 30);
  const intervalMs = Number(flags.interval_ms ?? 60000);
  if (!Number.isSafeInteger(maxAttempts) || maxAttempts < 1) throw new MainnetViewError("max-attempts must be a positive integer.");
  if (!Number.isSafeInteger(intervalMs) || intervalMs < 1000) throw new MainnetViewError("interval-ms must be at least 1000.");

  let latest = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    latest = await buildReport(flags);
    if (flags.summary) {
      console.log(`Attempt ${attempt}/${maxAttempts}`);
      console.log(formatMainnetViewSummary(latest));
    }
    if (latest.status === "PASS" || latest.status === "FAIL") break;
    if (attempt < maxAttempts) await sleep(intervalMs);
  }

  if (flags.out && latest) await writeJson(resolve(flags.out), latest);
  if (!flags.summary) console.log(JSON.stringify(latest, null, 2));
  process.exitCode = latest?.status === "PASS" ? 0 : latest?.status === "FAIL" ? 2 : 3;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  try {
    if (command === "preflight") await commandPreflight(rest);
    else if (command === "watch") await commandWatch(rest);
    else {
      usage();
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof MainnetViewError) {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

await main();

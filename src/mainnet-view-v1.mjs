import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";

export const MAINNET_VIEW_PREFLIGHT_SCHEMA_VERSION = "zecsafe-mainnet-view-preflight-v1";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const ADDRESS_PATTERN = /^u1[ac-hj-np-z02-9]{40,}$/i;

export class MainnetViewError extends Error {
  constructor(message) {
    super(message);
    this.name = "MainnetViewError";
    this.code = "invalid_mainnet_view_preflight_v1";
    this.statusCode = 400;
  }
}

function invalid(message) {
  throw new MainnetViewError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function requireRunId(value, label = "run_id") {
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalid(`${label} must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.`);
  }
  return value;
}

function requireUtc(value, label) {
  if (typeof value !== "string" || !ISO_UTC_PATTERN.test(value) || !Number.isFinite(Date.parse(value))) {
    invalid(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return new Date(Date.parse(value)).toISOString();
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalid(`${label} must be sha256:<64 hex>.`);
  return value;
}

function requireSafeInteger(value, label, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) invalid(`${label} must be a safe integer at least ${minimum}.`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") invalid(`${label} must be a non-empty string.`);
  return value.trim();
}

function check(name, status, evidence = {}) {
  if (!["PASS", "WAIT", "FAIL"].includes(status)) invalid(`invalid check status for ${name}.`);
  return { name, status, evidence };
}

function statusFromChecks(checks) {
  if (checks.some((item) => item.status === "FAIL")) return "FAIL";
  if (checks.some((item) => item.status === "WAIT")) return "WAIT_FUNDING";
  return "PASS";
}

export function sanitizeSyncFailure({ status, stdout = "", stderr = "", timed_out = false } = {}) {
  if (status === 0) return null;
  if (timed_out) return "sync_timeout";

  const combined = `${stdout}\n${stderr}`;
  if (/unrecognized shielded protocol/i.test(combined)) return "unrecognized_shielded_protocol";
  if (/failed to lookup address information|dns error/i.test(combined)) return "dns_error";
  if (/transport error/i.test(combined)) return "transport_error";
  if (/connection refused|failed to connect/i.test(combined)) return "connection_failed";
  return "sync_command_failed";
}

export function extractJsonObject(text) {
  if (typeof text !== "string") invalid("json text must be a string.");
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].startsWith("{") && lines[index].endsWith("}")) {
      return JSON.parse(lines[index]);
    }
  }
  invalid("command output did not contain a JSON object.");
}

export function parseMainnetInfo(stdout) {
  const info = extractJsonObject(stdout);
  return {
    chain_name: requireString(info.chain_name, "mainnet_info.chain_name"),
    chain_tip_height: requireSafeInteger(info.chain_tip_height, "mainnet_info.chain_tip_height"),
    server_uri: requireString(info.server_uri, "mainnet_info.server_uri"),
  };
}

export function parseAccountList(stdout) {
  if (typeof stdout !== "string") invalid("account list output must be a string.");
  const account = stdout.match(/^Account ([0-9a-f-]{36}) \(birthday height (\d+)\)$/m);
  if (!account) invalid("account list output did not include account id and birthday.");
  const name = stdout.match(/^\s+Name: (.+)$/m);
  const source = stdout.match(/^\s+Source: (.+)$/m);
  const purpose = stdout.match(/^\s+Purpose: (.+)$/m);
  return {
    account_id: account[1],
    birthday_height: Number(account[2]),
    name: name?.[1]?.trim() ?? null,
    source: source?.[1]?.trim() ?? null,
    purpose: purpose?.[1]?.trim() ?? null,
  };
}

export function parseAddressInspect(stdout) {
  if (typeof stdout !== "string") invalid("address inspect output must be a string.");
  const network = stdout.match(/^\s+- Network: (.+)$/m);
  const kind = stdout.match(/^\s+- Kind: (.+)$/m);
  const receivers = [...stdout.matchAll(/^\s+- ([A-Za-z]+)(?:\s|\()/gm)].map((match) => match[1]).filter((value) => value !== "Network" && value !== "Kind");
  return {
    network: network?.[1]?.trim() ?? null,
    kind: kind?.[1]?.trim() ?? null,
    receivers,
  };
}

export function parseBalanceCommand({ status, stdout = "", stderr = "" }) {
  const combined = `${stdout}\n${stderr}`;
  if (status === 0) {
    const json = extractJsonObject(stdout);
    return {
      available: true,
      command_status: "PASS",
      total_zatoshis: requireSafeInteger(json.total, "balance.total"),
      sapling_spendable_zatoshis: requireSafeInteger(json.sapling_spendable, "balance.sapling_spendable"),
      orchard_spendable_zatoshis: requireSafeInteger(json.orchard_spendable, "balance.orchard_spendable"),
      ironwood_spendable_zatoshis: requireSafeInteger(json.ironwood_spendable, "balance.ironwood_spendable"),
      transparent_spendable_zatoshis: requireSafeInteger(json.transparent_spendable, "balance.transparent_spendable"),
      chain_tip_height: requireSafeInteger(json.chain_tip_height, "balance.chain_tip_height"),
    };
  }
  if (/Insufficient information to build a wallet summary/i.test(combined)) {
    return {
      available: false,
      command_status: "WAIT",
      reason: "Insufficient information to build a wallet summary.",
      total_zatoshis: null,
      sapling_spendable_zatoshis: null,
      orchard_spendable_zatoshis: null,
      ironwood_spendable_zatoshis: null,
      transparent_spendable_zatoshis: null,
      chain_tip_height: null,
    };
  }
  return {
    available: false,
    command_status: "FAIL",
    reason: combined.trim() || "balance command failed.",
    total_zatoshis: null,
    sapling_spendable_zatoshis: null,
    orchard_spendable_zatoshis: null,
    ironwood_spendable_zatoshis: null,
    transparent_spendable_zatoshis: null,
    chain_tip_height: null,
  };
}

export function buildMainnetViewPreflight({
  env,
  account,
  mainnet_info,
  address_inspect,
  balance,
  coordinator_workspace_scan,
  sync = {},
  recorded_at,
} = {}) {
  if (!isPlainObject(env)) invalid("env must be a p0-017 mainnet demo env fixture.");
  if (!isPlainObject(account)) invalid("account must be parsed account metadata.");
  if (!isPlainObject(mainnet_info)) invalid("mainnet_info must be parsed server info.");
  if (!isPlainObject(address_inspect)) invalid("address_inspect must be parsed address inspection.");
  if (!isPlainObject(balance)) invalid("balance must be parsed balance command output.");
  if (!isPlainObject(coordinator_workspace_scan)) invalid("coordinator_workspace_scan must be an object.");

  const recordedAt = requireUtc(recorded_at ?? new Date().toISOString(), "recorded_at");
  const runId = requireRunId(env.run_id, "env.run_id");
  const address = requireString(env.wallet?.orchard_address, "env.wallet.orchard_address");
  if (!ADDRESS_PATTERN.test(address)) invalid("env.wallet.orchard_address must be a mainnet unified address.");

  const fundedValueObserved = balance.available && Number(balance.total_zatoshis) > 0;
  const balanceObserved = balance.available;
  const syncStatus = sync.status ?? (balanceObserved ? "SUMMARY_AVAILABLE" : "SUMMARY_UNAVAILABLE");
  const syncFailureReason = sync.failure_reason ?? null;
  const observedTip = balance.chain_tip_height ?? mainnet_info.chain_tip_height;

  const checks = [
    check("network_main", mainnet_info.chain_name === "main" && env.network === "main" ? "PASS" : "FAIL", {
      fixture_network: env.network,
      chain_name: mainnet_info.chain_name,
    }),
    check("wallet_type_view_only", account.purpose === "view-only" && env.wallet?.type === "view-only" ? "PASS" : "FAIL", {
      fixture_wallet_type: env.wallet?.type,
      account_purpose: account.purpose,
      account_source: account.source,
    }),
    check("birthday_height_recorded", Number.isSafeInteger(account.birthday_height) ? "PASS" : "FAIL", {
      birthday_height: account.birthday_height,
    }),
    check("observed_tip_recorded", Number.isSafeInteger(observedTip) ? "PASS" : "FAIL", {
      observed_tip_height: observedTip,
      source: balance.chain_tip_height === null ? "mainnet_info" : "balance_summary",
    }),
    check("address_main_orchard", address_inspect.network === "main" && address_inspect.kind === "Unified Address" && address_inspect.receivers.includes("Orchard") ? "PASS" : "FAIL", {
      address_type: env.wallet?.address_type,
      inspect_network: address_inspect.network,
      inspect_kind: address_inspect.kind,
      receivers: address_inspect.receivers,
    }),
    check("sync_status", balanceObserved ? "PASS" : "WAIT", {
      sync_status: syncStatus,
      failure_reason: syncFailureReason,
      balance_command_status: balance.command_status,
      reason: balance.reason ?? null,
    }),
    check("funded_value_observed", fundedValueObserved ? "PASS" : "WAIT", {
      balance_observed: balanceObserved,
      total_zatoshis: balance.total_zatoshis,
      minimum_required_zatoshis: 1,
    }),
    check("no_spend_key_in_coordinator_workspace", coordinator_workspace_scan.spend_key_absent === true ? "PASS" : "FAIL", {
      scan_scope: coordinator_workspace_scan.scan_scope ?? "view-only-wallet-dir",
    }),
    check("no_participant_share_in_coordinator_workspace", coordinator_workspace_scan.participant_share_absent === true ? "PASS" : "FAIL", {
      scan_scope: coordinator_workspace_scan.scan_scope ?? "view-only-wallet-dir",
    }),
  ];

  const payload = {
    schema_version: MAINNET_VIEW_PREFLIGHT_SCHEMA_VERSION,
    task_id: "ZSAFE-P0-018",
    source_env_task_id: env.task_id,
    source_env_run_id: runId,
    recorded_at: recordedAt,
    status: statusFromChecks(checks),
    network: "main",
    wallet_type: "UFVK/view-only",
    account: {
      account_id: account.account_id,
      birthday_height: account.birthday_height,
      name: account.name,
      source: account.source,
      purpose: account.purpose,
    },
    address: {
      orchard_address: address,
      inspect_network: address_inspect.network,
      inspect_kind: address_inspect.kind,
      receivers: address_inspect.receivers,
    },
    sync: {
      status: syncStatus,
      attempted: sync.attempted === true,
      exit_status: sync.exit_status ?? null,
      failure_reason: syncFailureReason,
      observed_tip_height: observedTip,
    },
    balance: {
      observed: balanceObserved,
      funded_value_observed: fundedValueObserved,
      total_zatoshis: balance.total_zatoshis,
      sapling_spendable_zatoshis: balance.sapling_spendable_zatoshis,
      orchard_spendable_zatoshis: balance.orchard_spendable_zatoshis,
      ironwood_spendable_zatoshis: balance.ironwood_spendable_zatoshis,
      transparent_spendable_zatoshis: balance.transparent_spendable_zatoshis,
    },
    toolchain: env.toolchain,
    coordinator_workspace: {
      scan_scope: coordinator_workspace_scan.scan_scope ?? "view-only-wallet-dir",
      spend_key_absent: coordinator_workspace_scan.spend_key_absent === true,
      participant_share_absent: coordinator_workspace_scan.participant_share_absent === true,
    },
    checks,
    limitations: [
      fundedValueObserved
        ? "Funded value was observed through the local UFVK/view-only wallet."
        : "This preflight remains WAIT_FUNDING until funded value is observed.",
      fundedValueObserved
        ? "P0-018 completion proves view-only synchronization and balance observation only."
        : "P0-018 is not complete until funded_value_observed is PASS.",
      "The public report excludes UFVK, wallet database contents, participant configs, contact tokens, shares, seeds, and spending keys.",
      "No transaction is created or broadcast by this preflight.",
    ],
  };

  if (payload.toolchain?.zcash_devtool_commit) requireString(payload.toolchain.zcash_devtool_commit, "toolchain.zcash_devtool_commit");
  if (payload.toolchain?.frost_tools_commit) requireString(payload.toolchain.frost_tools_commit, "toolchain.frost_tools_commit");
  if (payload.toolchain?.zcash_devtool_runtime) {
    const runtime = payload.toolchain.zcash_devtool_runtime;
    if (!isPlainObject(runtime)) invalid("toolchain.zcash_devtool_runtime must be an object.");
    requireString(runtime.mode, "toolchain.zcash_devtool_runtime.mode");
    requireString(runtime.base_commit, "toolchain.zcash_devtool_runtime.base_commit");
    if (runtime.compatibility_patch_ref !== null) {
      requireHash(runtime.compatibility_patch_ref, "toolchain.zcash_devtool_runtime.compatibility_patch_ref");
    }
    requireHash(runtime.binary_ref, "toolchain.zcash_devtool_runtime.binary_ref");
  }
  if (payload.group_fingerprint) requireHash(payload.group_fingerprint, "group_fingerprint");

  return {
    ...payload,
    preflight_ref: sha256Canonical(payload),
  };
}

export function formatMainnetViewSummary(report) {
  const lines = [
    `[${report.status}] P0-018 view-only mainnet preflight`,
    `Network: ${report.network}`,
    `Wallet type: ${report.wallet_type}`,
    `Birthday height: ${report.account.birthday_height}`,
    `Observed tip: ${report.sync.observed_tip_height}`,
    `Sync status: ${report.sync.status}`,
    ...(report.sync.failure_reason ? [`Sync failure reason: ${report.sync.failure_reason}`] : []),
    `Balance observed: ${report.balance.observed ? "YES" : "NO"}`,
    `Funded value observed: ${report.balance.funded_value_observed ? "YES" : "NO"}`,
  ];
  for (const item of report.checks) lines.push(`[${item.status}] ${item.name}`);
  return lines.join("\n");
}

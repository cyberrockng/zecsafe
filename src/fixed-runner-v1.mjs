import { mkdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { isAbsolute, relative, resolve } from "node:path";
import { createIntentV1, canonicalizeJson } from "./intent-v1.mjs";
import { bindIntentToPcztV1 } from "./pczt-bind-v1.mjs";
import { appendProofEventLog, validateProofEventV1 } from "./proof-event-v1.mjs";
import { selectSignersV1 } from "./signer-selection-v1.mjs";
import { prepareSigningContextV1 } from "./signing-context-v1.mjs";
import { reviewSignerPackageV1 } from "./signer-review-v1.mjs";
import { startFrostSessionV1 } from "./frost-session-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT } from "./pczt-inspect-v1.mjs";

export const FIXED_RUNNER_RESULT_SCHEMA_VERSION = "zecsafe-fixed-runner-result-v1";
export const DEFAULT_RUNNER_WORKSPACE_ROOT = "/home/dell/.zecsafe/runner";
export const DEFAULT_ZCASH_DEVTOOL_ROOT = "/home/dell/.zecsafe/toolchain/zcash-devtool";

export const FIXED_OPERATIONS = Object.freeze([
  "toolchain.status",
  "wallet.status",
  "intent.create",
  "pczt.create",
  "pczt.inspect",
  "pczt.bind",
  "signing.prepare",
  "signer.review",
  "frost.session.start",
  "frost.session.status",
  "pczt.sign.complete",
  "pczt.prove",
  "pczt.combine",
  "broadcast.preview",
  "broadcast.execute",
  "transaction.status",
  "proof.generate",
  "proof.verify",
]);

const OPERATIONS = new Set(FIXED_OPERATIONS);
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const MAX_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 15_000;
const MAX_CAPTURE_BYTES = 64_000;
const CONFUSING_PATH_CHARS = /[\u2024\u2025\uff0e\u2215\u2044\uff0f]/u;
const SHELL_META_CHARS = /[;&|`$<>]/;
const WINDOWS_DRIVE = /^[A-Za-z]:[\\/]/;

const ALLOWED_BINARY_COMMANDS = Object.freeze({
  node: process.execPath,
  git: "git",
  cargo: "cargo",
});

const REDACTION_PATTERNS = [
  [/-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/g, "[REDACTED_PRIVATE_KEY]"],
  [/\buview1[ac-hj-np-z02-9]{50,}\b/gi, "[REDACTED_VIEWING_KEY]"],
  [/\buvf1[ac-hj-np-z02-9]{50,}\b/gi, "[REDACTED_VIEWING_KEY]"],
  [/\bzviews[ac-hj-np-z02-9]{40,}\b/gi, "[REDACTED_VIEWING_KEY]"],
  [/\bsecret-extended-key-(?:main|test)[a-z0-9]{20,}\b/gi, "[REDACTED_SPENDING_KEY]"],
  [/\b(?:mnemonic|seed phrase)\s*[:=]\s*["']?(?:[a-z]+\s+){11,23}[a-z]+["']?/gi, "[REDACTED_MNEMONIC]"],
  [/\b(?:secret_share|signing_share|participant_secret|frost_secret)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/gi, "[REDACTED_FROST_SECRET]"],
  [/\b(?:randomizer|signing_randomizer|nonce)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/gi, "[REDACTED_SIGNING_SECRET]"],
];

export class FixedRunnerError extends Error {
  constructor(message) {
    super(message);
    this.name = "FixedRunnerError";
    this.code = "invalid_fixed_runner_request";
    this.statusCode = 400;
  }
}

function invalidRunner(message) {
  throw new FixedRunnerError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function utcNow() {
  return new Date().toISOString();
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

export function createRunId(prefix = "run") {
  return `${prefix}_${randomBytes(9).toString("hex")}`;
}

function normalizeRunId(runId) {
  if (runId === undefined || runId === null || runId === "") return createRunId();
  if (typeof runId !== "string" || !RUN_ID_PATTERN.test(runId)) {
    invalidRunner("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return runId;
}

function normalizeHost(host) {
  const value = host ?? "127.0.0.1";
  if (typeof value !== "string" || !LOCAL_HOSTS.has(value)) {
    invalidRunner("fixed runner is local-only; host must be localhost, 127.0.0.1, or ::1.");
  }
  return value;
}

function normalizeTimeout(timeoutMs) {
  if (timeoutMs === undefined || timeoutMs === null) return DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) {
    invalidRunner(`timeout_ms must be an integer from 1 to ${MAX_TIMEOUT_MS}.`);
  }
  return timeoutMs;
}

function normalizeOperation(operation) {
  if (typeof operation !== "string" || !OPERATIONS.has(operation)) {
    invalidRunner(`operation must be one of: ${FIXED_OPERATIONS.join(", ")}.`);
  }
  return operation;
}

function assertNoShellSyntax(value, label) {
  if (typeof value !== "string") invalidRunner(`${label} must be a string.`);
  if (value.includes("\0")) invalidRunner(`${label} must not contain NUL bytes.`);
  if (CONFUSING_PATH_CHARS.test(value)) invalidRunner(`${label} contains unsupported Unicode path characters.`);
  if (SHELL_META_CHARS.test(value)) invalidRunner(`${label} contains shell metacharacters.`);
}

export function resolveWorkspacePath(workspaceRoot, requestedPath, label = "path") {
  if (typeof requestedPath !== "string" || requestedPath.trim() === "") invalidRunner(`${label} is required.`);
  assertNoShellSyntax(requestedPath, label);
  if (WINDOWS_DRIVE.test(requestedPath)) invalidRunner(`${label} must not use Windows absolute path syntax.`);

  const root = resolve(workspaceRoot);
  const candidate = isAbsolute(requestedPath) ? resolve(requestedPath) : resolve(root, requestedPath);
  const pathRelativeToRoot = relative(root, candidate);

  if (pathRelativeToRoot === "" || pathRelativeToRoot.startsWith("..") || isAbsolute(pathRelativeToRoot)) {
    invalidRunner(`${label} escapes the fixed runner workspace.`);
  }

  return candidate;
}

export function redactText(text) {
  let output = String(text ?? "");
  for (const [pattern, replacement] of REDACTION_PATTERNS) output = output.replace(pattern, replacement);
  if (output.length > MAX_CAPTURE_BYTES) output = `${output.slice(0, MAX_CAPTURE_BYTES)}\n[TRUNCATED]`;
  return output;
}

function allowedEnvironment() {
  return {
    PATH: process.env.PATH ?? "",
    HOME: process.env.HOME ?? "",
    CARGO_HOME: process.env.CARGO_HOME ?? "",
    RUSTUP_HOME: process.env.RUSTUP_HOME ?? "",
  };
}

export function runAllowedBinary({ binaryId, args = [], cwd, timeoutMs = DEFAULT_TIMEOUT_MS, input, spawnImpl = spawnSync }) {
  if (!Object.hasOwn(ALLOWED_BINARY_COMMANDS, binaryId)) invalidRunner("binary is not in the fixed allowlist.");
  if (!Array.isArray(args)) invalidRunner("binary args must be an array.");
  for (const [index, arg] of args.entries()) {
    if (typeof arg !== "string") invalidRunner(`binary arg ${index} must be a string.`);
  }

  const startedAt = Date.now();
  const result = spawnImpl(ALLOWED_BINARY_COMMANDS[binaryId], args, {
    cwd,
    input,
    encoding: "utf8",
    shell: false,
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: MAX_CAPTURE_BYTES,
    env: allowedEnvironment(),
  });
  const durationMs = Date.now() - startedAt;

  return {
    binary_id: binaryId,
    args,
    exit_status: result.status ?? null,
    signal: result.signal ?? null,
    timed_out: Boolean(result.error?.code === "ETIMEDOUT" || result.signal === "SIGTERM"),
    stdout: redactText(result.stdout ?? ""),
    stderr: redactText(result.stderr ?? result.error?.message ?? ""),
    duration_ms: durationMs,
  };
}

async function readWorkspaceJson(workspaceRoot, requestedPath, label) {
  const path = resolveWorkspacePath(workspaceRoot, requestedPath, label);
  return JSON.parse(await readFile(path, "utf8"));
}

function notImplemented(operation, reason) {
  return {
    operation_status: "NOT_IMPLEMENTED",
    output: null,
    command_results: [],
    public_message: `${operation} is registered but not implemented in this proof gate.`,
    limitations: [reason],
  };
}

async function operationToolchainStatus(context) {
  const commands = [
    runAllowedBinary({ binaryId: "node", args: ["--version"], cwd: context.workspaceRoot, timeoutMs: 5_000, spawnImpl: context.spawnImpl }),
    runAllowedBinary({ binaryId: "git", args: ["--version"], cwd: context.workspaceRoot, timeoutMs: 5_000, spawnImpl: context.spawnImpl }),
    runAllowedBinary({ binaryId: "cargo", args: ["--version"], cwd: context.workspaceRoot, timeoutMs: 5_000, spawnImpl: context.spawnImpl }),
  ];

  return {
    operation_status: commands.every((command) => command.exit_status === 0) ? "PASS" : "FAIL",
    output: {
      node: commands[0].exit_status === 0,
      git: commands[1].exit_status === 0,
      cargo: commands[2].exit_status === 0,
    },
    command_results: commands,
    public_message: "Fixed runner checked allowed local toolchain binaries.",
    limitations: [],
  };
}

async function operationWalletStatus() {
  return {
    operation_status: "BLOCKED",
    output: {
      wallet_available: false,
      reason: "No fixed wallet workspace has been configured for this runner gate.",
    },
    command_results: [],
    public_message: "Wallet workspace is not configured.",
    limitations: ["P0-009 does not create or load wallet databases."],
  };
}

async function operationIntentCreate(context) {
  const input = context.input.intent ?? context.input;
  const result = createIntentV1(input);
  return {
    operation_status: "PASS",
    output: {
      intent_commitment: result.intent_commitment,
      canonical_intent_hash: sha256Canonical(result.intent),
    },
    command_results: [],
    public_message: "Intent commitment created through the fixed runner.",
    limitations: ["Full canonical intent is local operator data and should not be copied into public ProofEvent data."],
  };
}

async function operationPcztBind(context) {
  const intent =
    context.input.intent_path === undefined
      ? context.input.intent
      : await readWorkspaceJson(context.workspaceRoot, context.input.intent_path, "intent_path");
  const review =
    context.input.review_path === undefined
      ? context.input.pcztReview ?? context.input.review
      : await readWorkspaceJson(context.workspaceRoot, context.input.review_path, "review_path");

  const report = bindIntentToPcztV1({
    intent,
    pcztReview: review,
    runId: context.runId,
  });

  return {
    operation_status: report.status,
    output: report,
    command_results: [],
    public_message: report.status === "PASS" ? "Intent matched PCZT review." : "Intent did not match PCZT review; signing is blocked.",
    limitations: report.limitation,
  };
}

async function operationSigningPrepare(context) {
  const pcztPath = resolveWorkspacePath(context.workspaceRoot, context.input.pczt_path, "pczt_path");
  const pcztBytes = await readFile(pcztPath);
  const bindingReport =
    context.input.binding_report_path === undefined
      ? context.input.binding_report
      : await readWorkspaceJson(context.workspaceRoot, context.input.binding_report_path, "binding_report_path");
  const intent =
    context.input.intent_path === undefined
      ? context.input.intent
      : await readWorkspaceJson(context.workspaceRoot, context.input.intent_path, "intent_path");

  const command = runAllowedBinary({
    binaryId: "cargo",
    args: ["run", "--locked", "--quiet", "--", "pczt", "inspect"],
    cwd: context.zcashDevtoolRoot,
    timeoutMs: context.timeoutMs,
    input: pcztBytes,
    spawnImpl: context.spawnImpl,
  });
  const { report } = prepareSigningContextV1({
    pcztBytes,
    bindingReport,
    intent,
    toolResult: command,
    now: context.now,
    toolCommit: EXPECTED_ZCASH_DEVTOOL_COMMIT,
  });

  return {
    operation_status: "PASS",
    output: report,
    command_results: [{ ...command, args: ["pczt", "inspect"], stdout: "", stderr: "" }],
    public_message: "Signing context linked to the bound PCZT and prepared by the pinned tool.",
    limitations: report.limitations,
  };
}

async function operationFrostSessionStatus(context) {
  const selection = selectSignersV1({
    run_id: context.runId,
    ...context.input,
  });

  return {
    operation_status: selection.status,
    output: selection,
    command_results: [],
    public_message:
      selection.status === "SATISFIABLE"
        ? "Selected available participants satisfy the threshold."
        : "Signer availability does not allow a FROST session.",
    limitations: selection.limitations,
  };
}

async function operationSignerReview(context) {
  const reviewPackage =
    context.input.review_package_path === undefined
      ? context.input.review_package ?? context.input
      : await readWorkspaceJson(context.workspaceRoot, context.input.review_package_path, "review_package_path");
  const packagePcztPath = context.input.pczt_path ?? reviewPackage.pczt_path;
  const pcztBytes =
    packagePcztPath === undefined
      ? undefined
      : await readFile(resolveWorkspacePath(context.workspaceRoot, packagePcztPath, "pczt_path"));
  const review = reviewSignerPackageV1({
    reviewPackage,
    confirmation: context.input.confirmation,
    pcztBytes,
  });

  return {
    operation_status: review.status,
    output: review,
    command_results: [],
    public_message:
      review.status === "PASS"
        ? "Selected signer completed local semantic review before FROST authorization."
        : "Selected signer review did not allow FROST authorization.",
    limitations: review.limitations,
  };
}

async function operationFrostSessionStart(context) {
  const sessionPackage =
    context.input.session_package_path === undefined
      ? context.input.session_package ?? context.input
      : await readWorkspaceJson(context.workspaceRoot, context.input.session_package_path, "session_package_path");
  const session = startFrostSessionV1({ sessionPackage });

  return {
    operation_status: session.status,
    output: session,
    command_results: [],
    public_message:
      session.status === "THRESHOLD_REACHED"
        ? "Selected A+B FROST session reached threshold and verified an aggregate signature."
        : "FROST session did not reach threshold.",
    limitations: session.limitations,
  };
}

const OPERATION_HANDLERS = {
  "toolchain.status": operationToolchainStatus,
  "wallet.status": operationWalletStatus,
  "intent.create": operationIntentCreate,
  "pczt.bind": operationPcztBind,
  "signing.prepare": operationSigningPrepare,
  "signer.review": operationSignerReview,
  "frost.session.start": operationFrostSessionStart,
  "frost.session.status": operationFrostSessionStatus,
};

const OPERATION_STAGES = {
  "toolchain.status": "RUN",
  "wallet.status": "WALLET_SYNC",
  "intent.create": "INTENT",
  "pczt.create": "PCZT_CREATE",
  "pczt.inspect": "PCZT_CREATE",
  "pczt.bind": "PCZT_BINDING",
  "signing.prepare": "SIGNING_CONTEXT",
  "signer.review": "FROST_SESSION",
  "frost.session.start": "FROST_SESSION",
  "frost.session.status": "FROST_SESSION",
  "pczt.sign.complete": "SIGNED_PCZT",
  "pczt.prove": "PROVEN_PCZT",
  "pczt.combine": "PCZT_COMBINE",
  "broadcast.preview": "BROADCAST_GATE",
  "broadcast.execute": "BROADCAST",
  "transaction.status": "CHAIN_OBSERVATION",
  "proof.generate": "PROOF_BUNDLE",
  "proof.verify": "PROOF_VERIFY",
};

function proofStatusFor(operation, operationStatus) {
  if (operation === "wallet.status" && operationStatus === "BLOCKED") return "UNKNOWN";
  if (operationStatus === "NOT_IMPLEMENTED") return "BLOCKED";
  if (operation === "frost.session.status" && ["SATISFIABLE", "UNSATISFIABLE"].includes(operationStatus)) return operationStatus;
  if (operation === "frost.session.start" && ["THRESHOLD_REACHED", "UNSATISFIABLE", "BLOCKED"].includes(operationStatus)) {
    return operationStatus;
  }
  if (operationStatus === "PASS") return "PASS";
  if (operationStatus === "FAIL") return "FAIL";
  if (operationStatus === "BLOCKED") return "BLOCKED";
  return "INFO";
}

function publicDataFor(operation, operationStatus, output, commandResults) {
  const data = {
    operation_id: operation,
    operation_status: operationStatus,
    exit_status: commandResults.length === 1 ? commandResults[0].exit_status : null,
    timeout_status: commandResults.some((command) => command.timed_out) ? "TIMED_OUT" : "NOT_TIMED_OUT",
    redaction_status: "APPLIED",
  };

  if (operation === "toolchain.status") data.toolchain_status = output;
  if (operation === "wallet.status") data.wallet_sync_status = output?.wallet_available ? "READY" : "UNKNOWN";
  if (operation === "intent.create" && output?.intent_commitment) data.intent_commitment = output.intent_commitment;
  if (operation === "pczt.bind" && output) {
    data.intent_commitment = output.intent_commitment;
    data.pczt_fingerprint = output.pczt_fingerprint;
    data.source_fingerprint = output.source_fingerprint;
    data.binding_status = output.status;
    data.binding_report_ref = sha256Canonical(output);
    data.blocked_operations = output.blocked_operations;
    data.check_statuses = Object.fromEntries(output.checks.map((check) => [check.field, check.status]));
    data.limitations = output.limitation;
  }
  if (operation === "signing.prepare" && output) {
    data.pczt_fingerprint = output.pczt_fingerprint;
    data.binding_report_ref = output.binding_report_ref;
    data.sighash_fingerprint = output.sighash_fingerprint;
    data.expiry_status = output.expiry_status;
    data.signing_context_status = output.signing_context_status;
    data.limitations = output.limitations;
  }
  if (operation === "frost.session.status" && output) {
    data.threshold = output.threshold;
    data.participant_total = output.participant_total;
    data.unavailable_participant_count = output.unavailable_count;
    data.selected_public_fingerprints = output.selected_public_fingerprints;
    data.threshold_status = output.status === "BLOCKED" ? "UNSATISFIABLE" : output.status;
    data.frost_status = output.status === "BLOCKED" ? "UNSATISFIABLE" : output.status;
    data.group_fingerprint = output.group_fingerprint;
    data.limitations = output.limitations;
  }
  if (operation === "signer.review" && output) {
    data.signer_review_mode = output.signer_review_mode;
    data.signer_review_status = output.status;
    data.reviewer_participant_id = output.reviewer_participant_id;
    data.reviewer_public_fingerprint = output.reviewer_public_fingerprint;
    data.selected_public_fingerprints = output.selected_public_fingerprints;
    data.group_fingerprint = output.group_fingerprint;
    data.pczt_fingerprint = output.pczt_fingerprint;
    data.source_fingerprint = output.source_fingerprint;
    data.binding_report_ref = output.binding_report_ref;
    data.sighash_fingerprint = output.sighash_fingerprint;
    data.check_statuses = Object.fromEntries(output.checks.map((check) => [check.field, check.status]));
    data.limitations = output.limitations;
  }
  if (operation === "frost.session.start" && output) {
    data.threshold = output.threshold;
    data.participant_total = output.participant_total;
    data.unavailable_participant_count = output.unavailable_participant_count;
    data.selected_public_fingerprints = output.selected_public_fingerprints;
    data.group_fingerprint = output.group_fingerprint;
    data.session_fingerprint = output.session_fingerprint;
    data.pczt_fingerprint = output.pczt_fingerprint;
    data.binding_report_ref = output.binding_report_ref;
    data.sighash_fingerprint = output.sighash_fingerprint;
    data.threshold_status = output.threshold_status;
    data.frost_status = output.status;
    data.aggregate_signature_status = output.aggregate_signature_status;
    data.aggregate_signature_fingerprint = output.aggregate_signature_fingerprint;
    data.signature_byte_length = output.signature_byte_length;
    data.check_statuses = Object.fromEntries(output.checks.map((check) => [check.field, check.status]));
    data.limitations = output.limitations;
  }

  return data;
}

function resultStatusFrom(operationStatus) {
  if (["SATISFIABLE", "UNSATISFIABLE", "THRESHOLD_REACHED"].includes(operationStatus)) return operationStatus;
  if (["PASS", "FAIL", "BLOCKED", "NOT_IMPLEMENTED"].includes(operationStatus)) return operationStatus;
  return "INFO";
}

export async function runFixedOperation(request = {}, options = {}) {
  if (!isPlainObject(request)) invalidRunner("fixed runner request must be an object.");

  const operation = normalizeOperation(request.operation);
  const host = normalizeHost(request.host);
  const runId = normalizeRunId(request.run_id);
  const timeoutMs = normalizeTimeout(request.timeout_ms);
  const workspaceRoot = resolve(request.workspace_root ?? options.workspaceRoot ?? DEFAULT_RUNNER_WORKSPACE_ROOT);
  const input = isPlainObject(request.input) ? request.input : {};
  const spawnImpl = options.spawnImpl ?? spawnSync;
  const zcashDevtoolRoot = resolve(options.zcashDevtoolRoot ?? DEFAULT_ZCASH_DEVTOOL_ROOT);

  await mkdir(workspaceRoot, { recursive: true });

  const startedAt = utcNow();
  const startedAtMs = Date.now();
  let body;

  try {
    const handler = OPERATION_HANDLERS[operation];
    body = handler
      ? await handler({ operation, input, workspaceRoot, runId, timeoutMs, host, spawnImpl, zcashDevtoolRoot, now: options.now })
      : notImplemented(operation, "This operation is reserved for a later P0 task and cannot execute arbitrary commands.");
  } catch (error) {
    body = {
      operation_status: "FAIL",
      output: null,
      command_results: [],
      public_message: error.message,
      limitations: ["Operation failed before producing proof output."],
    };
  }

  const completedAt = utcNow();
  const durationMs = Date.now() - startedAtMs;
  const result = {
    schema_version: FIXED_RUNNER_RESULT_SCHEMA_VERSION,
    operation,
    run_id: runId,
    status: resultStatusFrom(body.operation_status),
    started_at: startedAt,
    completed_at: completedAt,
    duration_ms: durationMs,
    local_only: true,
    host,
    workspace_root: workspaceRoot,
    timeout_ms: timeoutMs,
    command_results: body.command_results,
    output: body.output,
    limitations: body.limitations,
  };

  const proofEvent = validateProofEventV1({
    schema_version: "proof-event-v1",
    sequence: Number.isSafeInteger(request.sequence) ? request.sequence : 1,
    run_id: runId,
    occurred_at: completedAt,
    stage: OPERATION_STAGES[operation],
    status: proofStatusFor(operation, body.operation_status),
    evidence_ref: sha256Canonical(result),
    public_message: body.public_message,
    data: publicDataFor(operation, body.operation_status, body.output, body.command_results),
  });

  if (request.events_path) {
    const eventsPath = resolveWorkspacePath(workspaceRoot, request.events_path, "events_path");
    await appendProofEventLog(eventsPath, proofEvent);
  }

  return {
    ...result,
    proof_event: proofEvent,
  };
}

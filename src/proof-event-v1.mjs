import { appendFile, mkdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { canonicalizeJson } from "./intent-v1.mjs";

export const PROOF_EVENT_SCHEMA_VERSION = "proof-event-v1";
export const RUN_STATE_SCHEMA_VERSION = "zecsafe-run-state-v1";

export const PROOF_EVENT_STAGES = Object.freeze([
  "RUN",
  "WALLET_SYNC",
  "INTENT",
  "PCZT_CREATE",
  "PCZT_BINDING",
  "SIGNING_CONTEXT",
  "FROST_SESSION",
  "FROST_ROUND_1",
  "FROST_ROUND_2",
  "FROST_AGGREGATE",
  "SIGNED_PCZT",
  "PROVEN_PCZT",
  "PCZT_COMBINE",
  "BROADCAST_GATE",
  "BROADCAST",
  "CHAIN_OBSERVATION",
  "PROOF_BUNDLE",
  "PROOF_VERIFY",
]);

export const FROST_STATUSES = Object.freeze([
  "UNSATISFIABLE",
  "SATISFIABLE",
  "SESSION_PREPARED",
  "ROUND_1",
  "ROUND_2",
  "THRESHOLD_REACHED",
  "AGGREGATE_SIGNATURE_VERIFIED",
  "SIGNED_PCZT",
  "FAILED",
  "EXPIRED",
]);

export const CHAIN_STATUSES = Object.freeze(["NOT_BROADCAST", "SUBMITTED", "OBSERVED", "MINED", "CONFIRMED", "REJECTED", "UNKNOWN"]);

const GENERAL_STATUSES = Object.freeze(["STARTED", "PASS", "FAIL", "BLOCKED", "WAIT", "INFO", "READY", "COMPLETE", "ALLOWED"]);
const ALLOWED_STATUSES = new Set([...GENERAL_STATUSES, ...FROST_STATUSES, ...CHAIN_STATUSES]);
const STAGES = new Set(PROOF_EVENT_STAGES);
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const PUBLIC_MESSAGE_MAX_LENGTH = 240;

const TOP_LEVEL_KEYS = new Set([
  "schema_version",
  "sequence",
  "run_id",
  "occurred_at",
  "stage",
  "status",
  "evidence_ref",
  "public_message",
  "data",
]);

const PUBLIC_DATA_KEYS = new Set([
  "network",
  "zecsafe_commit",
  "upstream_commits",
  "toolchain_status",
  "wallet_sync_status",
  "intent_commitment",
  "pczt_fingerprint",
  "source_fingerprint",
  "binding_status",
  "binding_report_ref",
  "blocked_operations",
  "limitations",
  "check_statuses",
  "threshold",
  "participant_total",
  "unavailable_participant_count",
  "selected_public_fingerprints",
  "reviewer_participant_id",
  "reviewer_public_fingerprint",
  "group_fingerprint",
  "session_fingerprint",
  "signer_review_mode",
  "signer_review_status",
  "sighash_fingerprint",
  "aggregate_signature_fingerprint",
  "signature_byte_length",
  "expiry_status",
  "signing_context_status",
  "threshold_status",
  "frost_status",
  "aggregate_signature_status",
  "signed_pczt_status",
  "proven_pczt_status",
  "pczt_combine_status",
  "final_binding_status",
  "broadcast_status",
  "chain_status",
  "txid",
  "block_height",
  "confirmation_count",
  "bundle_hash",
  "verifier_status",
  "tamper_status",
  "operation_id",
  "operation_status",
  "exit_status",
  "timeout_status",
  "redaction_status",
  "proof_bundle_hash",
  "proof_verify_status",
]);

const FORBIDDEN_PUBLIC_KEY_PATTERNS = [
  /mnemonic/i,
  /seed/i,
  /spending/i,
  /private/i,
  /secret/i,
  /share/i,
  /nonce/i,
  /randomizer/i,
  /wallet_db/i,
  /wallet_path/i,
  /recipient/i,
  /amount/i,
  /memo/i,
  /raw_pczt/i,
  /raw_inspect/i,
  /ufvk/i,
  /uivk/i,
  /viewing_key/i,
];

const FORBIDDEN_PUBLIC_VALUE_PATTERNS = [
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  /\buview1[ac-hj-np-z02-9]{50,}\b/i,
  /\buvf1[ac-hj-np-z02-9]{50,}\b/i,
  /\bzviews[ac-hj-np-z02-9]{40,}\b/i,
  /\bsecret-extended-key-(?:main|test)[a-z0-9]{20,}\b/i,
  /\b(?:mnemonic|seed phrase)\s*[:=]\s*(?:[a-z]+\s+){11,23}[a-z]+/i,
];

const CHECK_STATUS_KEYS = new Set([
  "source",
  "network",
  "recipient",
  "amount",
  "fee_policy",
  "memo_policy",
  "unexpected_output",
  "change_output",
  "binding",
  "pczt_fingerprint",
  "sighash",
  "group",
  "selected_signer",
  "confirmation",
  "threshold",
  "selected_signers",
  "signing_context",
  "signer_review",
  "session",
  "aggregate_signature",
]);

export class ProofEventValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProofEventValidationError";
    this.code = "invalid_proof_event";
    this.statusCode = 400;
  }
}

function invalidEvent(message) {
  throw new ProofEventValidationError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function assertNoUnknownTopLevelKeys(event) {
  for (const key of Object.keys(event)) {
    if (!TOP_LEVEL_KEYS.has(key)) invalidEvent(`unsupported proof event field: ${key}.`);
  }
}

function assertRunId(runId) {
  if (typeof runId !== "string" || !RUN_ID_PATTERN.test(runId)) {
    invalidEvent("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return runId;
}

function assertUtcTimestamp(value) {
  if (typeof value !== "string" || !ISO_UTC_PATTERN.test(value) || !Number.isFinite(Date.parse(value))) {
    invalidEvent("occurred_at must be an ISO-8601 UTC timestamp.");
  }
  return new Date(Date.parse(value)).toISOString();
}

function assertStage(stage) {
  if (!STAGES.has(stage)) invalidEvent(`stage must be one of: ${PROOF_EVENT_STAGES.join(", ")}.`);
  return stage;
}

function assertStatus(status, stage) {
  if (!ALLOWED_STATUSES.has(status)) invalidEvent("status is not in the frozen ProofEvent vocabulary.");
  if (stage === "CHAIN_OBSERVATION" && !CHAIN_STATUSES.includes(status)) {
    invalidEvent("CHAIN_OBSERVATION status must use the chain status vocabulary.");
  }
  if (["FROST_SESSION", "FROST_ROUND_1", "FROST_ROUND_2", "FROST_AGGREGATE"].includes(stage)) {
    const frostAllowed = new Set([...FROST_STATUSES, "PASS", "FAIL", "BLOCKED", "INFO"]);
    if (!frostAllowed.has(status)) invalidEvent(`${stage} status must use the FROST status vocabulary or a proof control status.`);
  }
  return status;
}

function assertEvidenceRef(value) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalidEvent("evidence_ref must be sha256:<64 hex>.");
  return value;
}

function assertPublicMessage(value) {
  if (typeof value !== "string" || value.trim() === "") invalidEvent("public_message is required.");
  if (value.length > PUBLIC_MESSAGE_MAX_LENGTH) invalidEvent("public_message is too long.");
  assertPublicSafeValue(value, "public_message");
  return value;
}

function assertPublicSafeKey(key, { topLevelData = false } = {}) {
  if (topLevelData && !PUBLIC_DATA_KEYS.has(key)) invalidEvent(`unsupported public data field: ${key}.`);
  if (FORBIDDEN_PUBLIC_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
    invalidEvent(`public event field is not allowed: ${key}.`);
  }
}

function assertPublicSafeValue(value, path) {
  if (typeof value === "string") {
    if (FORBIDDEN_PUBLIC_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      invalidEvent(`public event value at ${path} looks private.`);
    }
    return;
  }

  if (value === null || typeof value === "number" || typeof value === "boolean") return;

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) assertPublicSafeValue(value[index], `${path}[${index}]`);
    return;
  }

  if (isPlainObject(value)) {
    for (const [key, childValue] of Object.entries(value)) {
      if (path === "data.check_statuses") {
        if (!CHECK_STATUS_KEYS.has(key)) invalidEvent(`unsupported check status field: ${key}.`);
      } else {
        assertPublicSafeKey(key);
      }
      assertPublicSafeValue(childValue, `${path}.${key}`);
    }
    return;
  }

  invalidEvent(`public event value at ${path} must be JSON-safe.`);
}

function normalizePublicData(data) {
  if (data === undefined) return {};
  if (!isPlainObject(data)) invalidEvent("data must be an object when present.");

  const normalized = {};
  for (const [key, value] of Object.entries(data).sort(([left], [right]) => left.localeCompare(right))) {
    assertPublicSafeKey(key, { topLevelData: true });
    assertPublicSafeValue(value, `data.${key}`);
    normalized[key] = value;
  }
  return normalized;
}

export function validateProofEventV1(input) {
  if (!isPlainObject(input)) invalidEvent("ProofEvent input must be an object.");
  assertNoUnknownTopLevelKeys(input);

  if (input.schema_version !== PROOF_EVENT_SCHEMA_VERSION) {
    invalidEvent(`schema_version must be ${PROOF_EVENT_SCHEMA_VERSION}.`);
  }

  if (!Number.isSafeInteger(input.sequence) || input.sequence < 1) {
    invalidEvent("sequence must be a positive safe integer.");
  }

  const stage = assertStage(input.stage);
  const event = {
    schema_version: PROOF_EVENT_SCHEMA_VERSION,
    sequence: input.sequence,
    run_id: assertRunId(input.run_id),
    occurred_at: assertUtcTimestamp(input.occurred_at),
    stage,
    status: assertStatus(input.status, stage),
    evidence_ref: assertEvidenceRef(input.evidence_ref),
    public_message: assertPublicMessage(input.public_message),
    data: normalizePublicData(input.data),
  };

  return event;
}

export function validateProofEventSequence(events) {
  if (!Array.isArray(events)) invalidEvent("events must be an array.");
  if (events.length === 0) return [];

  const normalized = events.map((event) => validateProofEventV1(event));
  const runId = normalized[0].run_id;
  let previousSequence = 0;
  let previousTime = 0;

  for (const event of normalized) {
    if (event.run_id !== runId) invalidEvent("all events in a replay must use the same run_id.");
    if (event.sequence <= previousSequence) invalidEvent("event sequence must be strictly increasing.");

    const time = Date.parse(event.occurred_at);
    if (time < previousTime) invalidEvent("event timestamps must not move backward.");

    previousSequence = event.sequence;
    previousTime = time;
  }

  return normalized;
}

function lastStageEvent(stages, event) {
  stages[event.stage] = {
    status: event.status,
    sequence: event.sequence,
    occurred_at: event.occurred_at,
    evidence_ref: event.evidence_ref,
    public_message: event.public_message,
  };
}

function applyEventData(state, event) {
  const { data } = event;
  if (data.network) state.network = data.network;
  if (data.zecsafe_commit) state.zecsafe_commit = data.zecsafe_commit;
  if (data.upstream_commits) state.upstream_commits = data.upstream_commits;
  if (data.intent_commitment) state.intent_commitment = data.intent_commitment;
  if (data.pczt_fingerprint) state.pczt_fingerprint = data.pczt_fingerprint;
  if (data.source_fingerprint) state.source_fingerprint = data.source_fingerprint;
  if (data.limitations) state.limitations = [...new Set([...state.limitations, ...data.limitations])];

  if (event.stage === "PCZT_BINDING" || data.binding_status || data.binding_report_ref || data.blocked_operations) {
    state.binding.status = data.binding_status ?? event.status;
    state.binding.report_ref = data.binding_report_ref ?? state.binding.report_ref;
    state.binding.blocked_operations = data.blocked_operations ?? state.binding.blocked_operations;
    state.binding.check_statuses = data.check_statuses ?? state.binding.check_statuses;
  }

  if (
    event.stage.startsWith("FROST") ||
    data.threshold_status ||
    data.frost_status ||
    data.aggregate_signature_status ||
    data.selected_public_fingerprints
  ) {
    state.frost.threshold = data.threshold ?? state.frost.threshold;
    state.frost.participant_total = data.participant_total ?? state.frost.participant_total;
    state.frost.unavailable_participant_count = data.unavailable_participant_count ?? state.frost.unavailable_participant_count;
    state.frost.selected_public_fingerprints = data.selected_public_fingerprints ?? state.frost.selected_public_fingerprints;
    state.frost.group_fingerprint = data.group_fingerprint ?? state.frost.group_fingerprint;
    state.frost.session_fingerprint = data.session_fingerprint ?? state.frost.session_fingerprint;
    state.frost.threshold_status = data.threshold_status ?? state.frost.threshold_status;
    state.frost.status = data.frost_status ?? event.status;
    state.frost.aggregate_signature_status = data.aggregate_signature_status ?? state.frost.aggregate_signature_status;
    state.frost.aggregate_signature_fingerprint =
      data.aggregate_signature_fingerprint ?? state.frost.aggregate_signature_fingerprint;
    state.frost.signature_byte_length = data.signature_byte_length ?? state.frost.signature_byte_length;
  }

  if (data.signer_review_status || data.signer_review_mode || data.reviewer_public_fingerprint) {
    state.signer_review.status = data.signer_review_status ?? event.status;
    state.signer_review.mode = data.signer_review_mode ?? state.signer_review.mode;
    state.signer_review.reviewer_participant_id = data.reviewer_participant_id ?? state.signer_review.reviewer_participant_id;
    state.signer_review.reviewer_public_fingerprint = data.reviewer_public_fingerprint ?? state.signer_review.reviewer_public_fingerprint;
    state.signer_review.selected_public_fingerprints =
      data.selected_public_fingerprints ?? state.signer_review.selected_public_fingerprints;
    state.signer_review.check_statuses = data.check_statuses ?? state.signer_review.check_statuses;
  }

  if (data.signed_pczt_status || event.stage === "SIGNED_PCZT") state.pczt_completion.signed_pczt_status = data.signed_pczt_status ?? event.status;
  if (data.proven_pczt_status || event.stage === "PROVEN_PCZT") state.pczt_completion.proven_pczt_status = data.proven_pczt_status ?? event.status;
  if (data.pczt_combine_status || event.stage === "PCZT_COMBINE") state.pczt_completion.pczt_combine_status = data.pczt_combine_status ?? event.status;
  if (data.final_binding_status) state.pczt_completion.final_binding_status = data.final_binding_status;

  if (event.stage === "BROADCAST" || event.stage === "CHAIN_OBSERVATION" || data.chain_status || data.txid) {
    state.chain.status = data.chain_status ?? (event.stage === "CHAIN_OBSERVATION" ? event.status : state.chain.status);
    state.chain.broadcast_status = data.broadcast_status ?? state.chain.broadcast_status;
    state.chain.txid = data.txid ?? state.chain.txid;
    state.chain.block_height = data.block_height ?? state.chain.block_height;
    state.chain.confirmation_count = data.confirmation_count ?? state.chain.confirmation_count;
  }

  if (event.stage === "PROOF_BUNDLE" || event.stage === "PROOF_VERIFY" || data.bundle_hash || data.proof_bundle_hash) {
    state.proof.bundle_hash = data.bundle_hash ?? data.proof_bundle_hash ?? state.proof.bundle_hash;
    state.proof.verify_status = data.verifier_status ?? data.proof_verify_status ?? (event.stage === "PROOF_VERIFY" ? event.status : state.proof.verify_status);
    state.proof.tamper_status = data.tamper_status ?? state.proof.tamper_status;
  }
}

function readinessFor(state) {
  return {
    intent_created: state.stages.INTENT?.status === "PASS",
    pczt_created: state.stages.PCZT_CREATE?.status === "PASS",
    binding_passed: state.binding.status === "PASS",
    signing_allowed: state.binding.status === "PASS" && state.binding.blocked_operations.length === 0,
    signer_review_passed: state.signer_review.status === "PASS",
    threshold_reached: state.frost.threshold_status === "THRESHOLD_REACHED" || state.frost.status === "THRESHOLD_REACHED",
    aggregate_signature_verified: state.frost.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED",
    signed_pczt: state.pczt_completion.signed_pczt_status === "PASS" || state.pczt_completion.signed_pczt_status === "SIGNED_PCZT",
    proven_pczt: state.pczt_completion.proven_pczt_status === "PASS",
    combined_pczt: state.pczt_completion.pczt_combine_status === "PASS",
    chain_confirmed: state.chain.status === "CONFIRMED",
    proof_verified: state.proof.verify_status === "PASS",
  };
}

export function reduceProofEvents(events) {
  const normalized = validateProofEventSequence(events);
  const state = {
    schema_version: RUN_STATE_SCHEMA_VERSION,
    run_id: normalized[0]?.run_id ?? null,
    latest_sequence: normalized.at(-1)?.sequence ?? 0,
    last_event_at: normalized.at(-1)?.occurred_at ?? null,
    network: null,
    zecsafe_commit: null,
    upstream_commits: null,
    intent_commitment: null,
    pczt_fingerprint: null,
    source_fingerprint: null,
    stages: {},
    binding: {
      status: "UNKNOWN",
      report_ref: null,
      blocked_operations: [],
      check_statuses: null,
    },
    frost: {
      status: "UNKNOWN",
      threshold: null,
      participant_total: null,
      unavailable_participant_count: null,
      selected_public_fingerprints: [],
      group_fingerprint: null,
      session_fingerprint: null,
      threshold_status: "UNKNOWN",
      aggregate_signature_status: "UNKNOWN",
      aggregate_signature_fingerprint: null,
      signature_byte_length: null,
    },
    signer_review: {
      status: "UNKNOWN",
      mode: null,
      reviewer_participant_id: null,
      reviewer_public_fingerprint: null,
      selected_public_fingerprints: [],
      check_statuses: null,
    },
    pczt_completion: {
      signed_pczt_status: "UNKNOWN",
      proven_pczt_status: "UNKNOWN",
      pczt_combine_status: "UNKNOWN",
      final_binding_status: "UNKNOWN",
    },
    chain: {
      status: "NOT_BROADCAST",
      broadcast_status: "NOT_BROADCAST",
      txid: null,
      block_height: null,
      confirmation_count: null,
    },
    proof: {
      bundle_hash: null,
      verify_status: "UNKNOWN",
      tamper_status: "UNKNOWN",
    },
    limitations: [],
  };

  for (const event of normalized) {
    lastStageEvent(state.stages, event);
    applyEventData(state, event);
  }

  state.readiness = readinessFor(state);
  state.run_state_hash = sha256Canonical(state);
  return state;
}

export function projectPublicProofEvent(event) {
  return validateProofEventV1(event);
}

export function projectPublicProofEvents(events) {
  return validateProofEventSequence(events).map((event) => projectPublicProofEvent(event));
}

export function proofEventHash(event) {
  return sha256Canonical(validateProofEventV1(event));
}

export async function readProofEventLog(path) {
  const text = await readFile(path, "utf8");
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) return validateProofEventSequence(JSON.parse(trimmed));
  return validateProofEventSequence(trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line)));
}

export async function appendProofEventLog(path, event) {
  const existing = await readProofEventLog(path).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const normalized = validateProofEventV1(event);
  validateProofEventSequence([...existing, normalized]);
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(normalized)}\n`);
  return reduceProofEvents([...existing, normalized]);
}

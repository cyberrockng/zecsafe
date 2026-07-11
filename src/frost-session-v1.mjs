import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { validateProofEventV1 } from "./proof-event-v1.mjs";

export const FROST_SESSION_PACKAGE_SCHEMA_VERSION = "zecsafe-frost-session-package-v1";
export const FROST_SESSION_SCHEMA_VERSION = "zecsafe-frost-session-v1";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const BLOCKED_OPERATIONS = ["pczt.sign.complete", "pczt.prove", "pczt.combine", "broadcast.preview", "broadcast.execute"];
const CHECK_FIELDS = [
  "threshold",
  "selected_signers",
  "signing_context",
  "signer_review",
  "session",
  "sighash",
  "aggregate_signature",
];

export class FrostSessionError extends Error {
  constructor(message) {
    super(message);
    this.name = "FrostSessionError";
    this.code = "invalid_frost_session";
    this.statusCode = 400;
  }
}

function invalidSession(message) {
  throw new FrostSessionError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function requireRunId(value) {
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalidSession("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalidSession(`${label} must be sha256:<64 hex>.`);
  return value;
}

function requireSafeInteger(value, label, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) invalidSession(`${label} must be a safe integer at least ${minimum}.`);
  return value;
}

function normalizeFingerprints(values, label) {
  if (!Array.isArray(values)) invalidSession(`${label} must be an array.`);
  const normalized = values.map((value, index) => requireHash(value, `${label}[${index}]`));
  if (new Set(normalized).size !== normalized.length) invalidSession(`${label} values must be unique.`);
  return normalized;
}

function normalizeSigningContext(signingContext) {
  if (!isPlainObject(signingContext)) invalidSession("signing_context is required.");
  if (signingContext.schema_version !== "zecsafe-signing-context-v1") {
    invalidSession("signing_context.schema_version must be zecsafe-signing-context-v1.");
  }
  return {
    ...signingContext,
    pczt_fingerprint: requireHash(signingContext.pczt_fingerprint, "signing_context.pczt_fingerprint"),
    binding_report_ref: requireHash(signingContext.binding_report_ref, "signing_context.binding_report_ref"),
    sighash_fingerprint: requireHash(signingContext.sighash_fingerprint, "signing_context.sighash_fingerprint"),
  };
}

function normalizeReview(review, index) {
  if (!isPlainObject(review)) invalidSession(`signer_reviews[${index}] must be an object.`);
  if (review.schema_version !== "zecsafe-signer-review-v1") invalidSession(`signer_reviews[${index}].schema_version is unsupported.`);
  return {
    ...review,
    reviewer_public_fingerprint: requireHash(review.reviewer_public_fingerprint, `signer_reviews[${index}].reviewer_public_fingerprint`),
    pczt_fingerprint: requireHash(review.pczt_fingerprint, `signer_reviews[${index}].pczt_fingerprint`),
    binding_report_ref: requireHash(review.binding_report_ref, `signer_reviews[${index}].binding_report_ref`),
    sighash_fingerprint: requireHash(review.sighash_fingerprint, `signer_reviews[${index}].sighash_fingerprint`),
  };
}

function normalizeFrostOutput(frostOutput) {
  if (frostOutput === undefined || frostOutput === null) return null;
  if (!isPlainObject(frostOutput)) invalidSession("frost_output must be an object when provided.");
  return {
    session_fingerprint: requireHash(frostOutput.session_fingerprint, "frost_output.session_fingerprint"),
    sighash_fingerprint: requireHash(frostOutput.sighash_fingerprint, "frost_output.sighash_fingerprint"),
    aggregate_signature_fingerprint: requireHash(
      frostOutput.aggregate_signature_fingerprint,
      "frost_output.aggregate_signature_fingerprint",
    ),
    signature_byte_length: requireSafeInteger(frostOutput.signature_byte_length, "frost_output.signature_byte_length", {
      minimum: 1,
    }),
    aggregate_signature_status: frostOutput.aggregate_signature_status,
    tool_commit: typeof frostOutput.tool_commit === "string" ? frostOutput.tool_commit : null,
    artifact_ref: frostOutput.artifact_ref === undefined ? null : requireHash(frostOutput.artifact_ref, "frost_output.artifact_ref"),
  };
}

function normalizePackage(input) {
  if (!isPlainObject(input)) invalidSession("FROST session package must be an object.");
  if (input.schema_version !== FROST_SESSION_PACKAGE_SCHEMA_VERSION) {
    invalidSession(`schema_version must be ${FROST_SESSION_PACKAGE_SCHEMA_VERSION}.`);
  }

  const threshold = requireSafeInteger(input.threshold, "threshold", { minimum: 1 });
  const participantTotal = requireSafeInteger(input.participant_total, "participant_total", { minimum: 1 });
  if (threshold > participantTotal) invalidSession("threshold cannot exceed participant_total.");

  const selectedPublicFingerprints = normalizeFingerprints(input.selected_public_fingerprints, "selected_public_fingerprints");
  const signerReviews = Array.isArray(input.signer_reviews)
    ? input.signer_reviews.map((review, index) => normalizeReview(review, index))
    : [];

  return {
    ...input,
    run_id: requireRunId(input.run_id),
    group_fingerprint: requireHash(input.group_fingerprint, "group_fingerprint"),
    threshold,
    participant_total: participantTotal,
    unavailable_participant_count: requireSafeInteger(input.unavailable_participant_count, "unavailable_participant_count"),
    selected_public_fingerprints: selectedPublicFingerprints,
    signing_context: normalizeSigningContext(input.signing_context),
    signer_reviews: signerReviews,
    frost_output: normalizeFrostOutput(input.frost_output),
  };
}

function check(field, passed, reason) {
  if (!CHECK_FIELDS.includes(field)) invalidSession(`unsupported FROST session check field: ${field}.`);
  return {
    field,
    status: passed ? "PASS" : "FAIL",
    allows_session: passed,
    reason,
  };
}

function evaluateChecks(pkg) {
  const selected = new Set(pkg.selected_public_fingerprints);
  const passingReviews = pkg.signer_reviews.filter((review) => review.status === "PASS");
  const reviewedFingerprints = new Set(passingReviews.map((review) => review.reviewer_public_fingerprint));

  const thresholdSatisfiable = pkg.selected_public_fingerprints.length >= pkg.threshold;
  const allSelectedReviewed = pkg.selected_public_fingerprints.every((fingerprint) => reviewedFingerprints.has(fingerprint));
  const reviewsMatchContext = passingReviews.every(
    (review) =>
      selected.has(review.reviewer_public_fingerprint) &&
      review.pczt_fingerprint === pkg.signing_context.pczt_fingerprint &&
      review.binding_report_ref === pkg.signing_context.binding_report_ref &&
      review.sighash_fingerprint === pkg.signing_context.sighash_fingerprint,
  );
  const signingContextReady = pkg.signing_context.status === "PASS" && pkg.signing_context.signing_context_status === "READY";
  const frostOutput = pkg.frost_output;

  return [
    check(
      "threshold",
      thresholdSatisfiable,
      thresholdSatisfiable ? "Selected signer count satisfies threshold." : "Selected signer count is below threshold.",
    ),
    check(
      "selected_signers",
      pkg.unavailable_participant_count >= 1 && pkg.selected_public_fingerprints.length <= pkg.participant_total,
      "Selected signer set excludes the unavailable participant count recorded for the proof run.",
    ),
    check("signing_context", signingContextReady, "Signing context is ready and linked to a bound PCZT fingerprint."),
    check(
      "signer_review",
      thresholdSatisfiable && passingReviews.length >= pkg.threshold && allSelectedReviewed && reviewsMatchContext,
      "Selected signers have PASS reviews linked to the same PCZT, binding report, and SIGHASH fingerprint.",
    ),
    check(
      "session",
      Boolean(frostOutput?.session_fingerprint),
      frostOutput ? "FROST session emitted a public-safe session fingerprint." : "FROST session was not started.",
    ),
    check(
      "sighash",
      frostOutput?.sighash_fingerprint === pkg.signing_context.sighash_fingerprint,
      "FROST session signed the SIGHASH fingerprint from the prepared signing context.",
    ),
    check(
      "aggregate_signature",
      frostOutput?.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED" && frostOutput?.signature_byte_length === 64,
      "Aggregate signature was produced and verified by the supported FROST path.",
    ),
  ];
}

function sessionStatus(checks) {
  const thresholdOk = checks.find((item) => item.field === "threshold")?.allows_session === true;
  if (!thresholdOk) return "UNSATISFIABLE";
  return checks.every((item) => item.allows_session) ? "THRESHOLD_REACHED" : "BLOCKED";
}

function aggregateStatus(status, frostOutput) {
  if (status === "THRESHOLD_REACHED" && frostOutput?.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED") {
    return "AGGREGATE_SIGNATURE_VERIFIED";
  }
  return "UNKNOWN";
}

function resultEvidence(result) {
  const { proof_event: omitted, ...safeResult } = result;
  void omitted;
  return sha256Canonical(safeResult);
}

export function frostSessionProofEvent(session, options = {}) {
  return validateProofEventV1({
    schema_version: "proof-event-v1",
    sequence: options.sequence ?? 1,
    run_id: session.run_id,
    occurred_at: options.occurred_at ?? new Date().toISOString(),
    stage: "FROST_SESSION",
    status: session.status,
    evidence_ref: resultEvidence(session),
    public_message:
      session.status === "THRESHOLD_REACHED"
        ? "Selected A+B FROST session reached threshold and verified an aggregate signature."
        : "FROST session did not reach threshold.",
    data: {
      threshold: session.threshold,
      participant_total: session.participant_total,
      unavailable_participant_count: session.unavailable_participant_count,
      selected_public_fingerprints: session.selected_public_fingerprints,
      group_fingerprint: session.group_fingerprint,
      session_fingerprint: session.session_fingerprint,
      pczt_fingerprint: session.pczt_fingerprint,
      binding_report_ref: session.binding_report_ref,
      sighash_fingerprint: session.sighash_fingerprint,
      threshold_status: session.threshold_status,
      frost_status: session.status,
      aggregate_signature_status: session.aggregate_signature_status,
      aggregate_signature_fingerprint: session.aggregate_signature_fingerprint,
      signature_byte_length: session.signature_byte_length,
      check_statuses: Object.fromEntries(session.checks.map((item) => [item.field, item.status])),
      limitations: session.limitations,
    },
  });
}

export function startFrostSessionV1({ sessionPackage, sequence, occurred_at } = {}) {
  const pkg = normalizePackage(sessionPackage);
  const checks = evaluateChecks(pkg);
  const status = sessionStatus(checks);
  const thresholdStatus = status === "THRESHOLD_REACHED" ? "THRESHOLD_REACHED" : "UNSATISFIABLE";
  const result = {
    schema_version: FROST_SESSION_SCHEMA_VERSION,
    package_schema_version: pkg.schema_version,
    run_id: pkg.run_id,
    status,
    frost_session: status === "THRESHOLD_REACHED" ? "THRESHOLD_REACHED" : "NOT_STARTED",
    threshold_status: thresholdStatus,
    aggregate_signature_status: aggregateStatus(status, pkg.frost_output),
    blocked_operations: status === "THRESHOLD_REACHED" ? [] : [...BLOCKED_OPERATIONS],
    group_fingerprint: pkg.group_fingerprint,
    threshold: pkg.threshold,
    participant_total: pkg.participant_total,
    unavailable_participant_count: pkg.unavailable_participant_count,
    selected_public_fingerprints: pkg.selected_public_fingerprints,
    session_fingerprint: pkg.frost_output?.session_fingerprint ?? null,
    pczt_fingerprint: pkg.signing_context.pczt_fingerprint,
    binding_report_ref: pkg.signing_context.binding_report_ref,
    sighash_fingerprint: pkg.signing_context.sighash_fingerprint,
    aggregate_signature_fingerprint: pkg.frost_output?.aggregate_signature_fingerprint ?? null,
    signature_byte_length: pkg.frost_output?.signature_byte_length ?? null,
    tool_commit: pkg.frost_output?.tool_commit ?? null,
    artifact_ref: pkg.frost_output?.artifact_ref ?? null,
    checks,
    limitations: [
      "FROST session evidence emits fingerprints and statuses only; shares, nonces, randomizers, raw SIGHASH, raw signatures, configs, keys, and logs remain outside public evidence.",
      "The aggregate signature is not a completed PCZT until ZSAFE-P0-014 applies it through the pinned transaction-completion path.",
    ],
  };

  return {
    ...result,
    proof_event: frostSessionProofEvent(result, { sequence, occurred_at }),
  };
}

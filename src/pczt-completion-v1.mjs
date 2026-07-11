import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { BINDING_REPORT_SCHEMA_VERSION } from "./pczt-bind-v1.mjs";
import { FROST_SESSION_SCHEMA_VERSION } from "./frost-session-v1.mjs";
import { validateProofEventV1 } from "./proof-event-v1.mjs";

export const PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION = "zecsafe-pczt-completion-package-v1";
export const PCZT_COMPLETION_SCHEMA_VERSION = "zecsafe-pczt-completion-v1";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const CHECK_FIELDS = [
  "source_pczt",
  "signing_context",
  "frost_signature",
  "signed_pczt",
  "proven_pczt",
  "pczt_combine",
  "final_binding",
  "broadcast_gate",
];
const PRIVATE_KEY_PATTERNS = [
  /raw/i,
  /secret/i,
  /private/i,
  /mnemonic/i,
  /seed/i,
  /wallet_path/i,
  /wallet_db/i,
  /ufvk/i,
  /uview/i,
  /viewing_key/i,
  /signature_hex/i,
  /sighash_hex/i,
  /pczt_bytes/i,
  /artifact_path/i,
  /randomizer/i,
  /nonce/i,
  /share/i,
];
const PRIVATE_VALUE_PATTERNS = [
  /\buview1[ac-hj-np-z02-9]{50,}\b/i,
  /\buviewtest1[ac-hj-np-z02-9]{50,}\b/i,
  /\buvf1[ac-hj-np-z02-9]{50,}\b/i,
  /\bsecret-extended-key-(?:main|test)[a-z0-9]{20,}\b/i,
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
];

export class PcztCompletionError extends Error {
  constructor(message) {
    super(message);
    this.name = "PcztCompletionError";
    this.code = "invalid_pczt_completion";
    this.statusCode = 400;
  }
}

function invalidCompletion(message) {
  throw new PcztCompletionError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function requireRunId(value) {
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalidCompletion("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalidCompletion(`${label} must be sha256:<64 hex>.`);
  return value;
}

function requireStatus(value, label, allowed = ["PASS", "FAIL", "BLOCKED"]) {
  if (!allowed.includes(value)) invalidCompletion(`${label} must be one of: ${allowed.join(", ")}.`);
  return value;
}

function requireSafeInteger(value, label, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) invalidCompletion(`${label} must be a safe integer at least ${minimum}.`);
  return value;
}

function assertNoPrivateFields(value, path = "package") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPrivateFields(item, `${path}[${index}]`));
    return;
  }

  if (!isPlainObject(value)) {
    if (typeof value === "string" && PRIVATE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      invalidCompletion(`${path} contains private material.`);
    }
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      invalidCompletion(`${path}.${key} is not allowed in public PCZT completion packages.`);
    }
    assertNoPrivateFields(child, `${path}.${key}`);
  }
}

function normalizeSigningContext(input) {
  if (!isPlainObject(input)) invalidCompletion("signing_context is required.");
  if (input.schema_version !== "zecsafe-signing-context-v1") invalidCompletion("signing_context.schema_version must be zecsafe-signing-context-v1.");
  return {
    ...input,
    pczt_fingerprint: requireHash(input.pczt_fingerprint, "signing_context.pczt_fingerprint"),
    binding_report_ref: requireHash(input.binding_report_ref, "signing_context.binding_report_ref"),
    sighash_fingerprint: requireHash(input.sighash_fingerprint, "signing_context.sighash_fingerprint"),
  };
}

function normalizeFrostSession(input) {
  if (!isPlainObject(input)) invalidCompletion("frost_session is required.");
  if (input.schema_version !== FROST_SESSION_SCHEMA_VERSION) invalidCompletion(`frost_session.schema_version must be ${FROST_SESSION_SCHEMA_VERSION}.`);
  return {
    ...input,
    pczt_fingerprint: requireHash(input.pczt_fingerprint, "frost_session.pczt_fingerprint"),
    binding_report_ref: requireHash(input.binding_report_ref, "frost_session.binding_report_ref"),
    sighash_fingerprint: requireHash(input.sighash_fingerprint, "frost_session.sighash_fingerprint"),
    aggregate_signature_fingerprint: requireHash(input.aggregate_signature_fingerprint, "frost_session.aggregate_signature_fingerprint"),
    signature_byte_length: requireSafeInteger(input.signature_byte_length, "frost_session.signature_byte_length", { minimum: 1 }),
  };
}

function normalizeSignedPczt(input) {
  if (!isPlainObject(input)) invalidCompletion("signed_pczt is required.");
  return {
    status: requireStatus(input.status, "signed_pczt.status"),
    pool: input.pool === "ironwood" || input.pool === "orchard" || input.pool === "sapling" ? input.pool : invalidCompletion("signed_pczt.pool is unsupported."),
    input_pczt_fingerprint: requireHash(input.input_pczt_fingerprint, "signed_pczt.input_pczt_fingerprint"),
    output_pczt_fingerprint: requireHash(input.output_pczt_fingerprint, "signed_pczt.output_pczt_fingerprint"),
    sighash_fingerprint: requireHash(input.sighash_fingerprint, "signed_pczt.sighash_fingerprint"),
    aggregate_signature_fingerprint: requireHash(input.aggregate_signature_fingerprint, "signed_pczt.aggregate_signature_fingerprint"),
    signature_byte_length: requireSafeInteger(input.signature_byte_length, "signed_pczt.signature_byte_length", { minimum: 1 }),
    signature_source: input.signature_source,
    completion_flow: input.completion_flow,
    tool_commit: typeof input.tool_commit === "string" ? input.tool_commit : null,
  };
}

function normalizeProvenPczt(input) {
  if (!isPlainObject(input)) invalidCompletion("proven_pczt is required.");
  return {
    status: requireStatus(input.status, "proven_pczt.status"),
    input_pczt_fingerprint: requireHash(input.input_pczt_fingerprint, "proven_pczt.input_pczt_fingerprint"),
    output_pczt_fingerprint: requireHash(input.output_pczt_fingerprint, "proven_pczt.output_pczt_fingerprint"),
    proof_status: input.proof_status,
    tool_commit: typeof input.tool_commit === "string" ? input.tool_commit : null,
  };
}

function normalizeCombinedPczt(input) {
  if (!isPlainObject(input)) invalidCompletion("combined_pczt is required.");
  return {
    status: requireStatus(input.status, "combined_pczt.status"),
    signed_pczt_fingerprint: requireHash(input.signed_pczt_fingerprint, "combined_pczt.signed_pczt_fingerprint"),
    proven_pczt_fingerprint: requireHash(input.proven_pczt_fingerprint, "combined_pczt.proven_pczt_fingerprint"),
    output_pczt_fingerprint: requireHash(input.output_pczt_fingerprint, "combined_pczt.output_pczt_fingerprint"),
    inspect_ref: input.inspect_ref === undefined ? null : requireHash(input.inspect_ref, "combined_pczt.inspect_ref"),
    tool_commit: typeof input.tool_commit === "string" ? input.tool_commit : null,
  };
}

function normalizeFinalBinding(input) {
  if (!isPlainObject(input)) invalidCompletion("final_binding is required.");
  if (input.schema_version !== BINDING_REPORT_SCHEMA_VERSION) {
    invalidCompletion(`final_binding.schema_version must be ${BINDING_REPORT_SCHEMA_VERSION}.`);
  }
  return {
    ...input,
    status: requireStatus(input.status, "final_binding.status"),
    pczt_fingerprint: requireHash(input.pczt_fingerprint, "final_binding.pczt_fingerprint"),
    source_fingerprint: requireHash(input.source_fingerprint, "final_binding.source_fingerprint"),
  };
}

function normalizePackage(input) {
  if (!isPlainObject(input)) invalidCompletion("PCZT completion package must be an object.");
  assertNoPrivateFields(input);
  if (input.schema_version !== PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION) {
    invalidCompletion(`schema_version must be ${PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION}.`);
  }

  return {
    ...input,
    run_id: requireRunId(input.run_id),
    source_pczt_fingerprint: requireHash(input.source_pczt_fingerprint, "source_pczt_fingerprint"),
    signing_context: normalizeSigningContext(input.signing_context),
    frost_session: normalizeFrostSession(input.frost_session),
    signed_pczt: normalizeSignedPczt(input.signed_pczt),
    proven_pczt: normalizeProvenPczt(input.proven_pczt),
    combined_pczt: normalizeCombinedPczt(input.combined_pczt),
    final_binding: normalizeFinalBinding(input.final_binding),
  };
}

function makeCheck(field, passed, reason) {
  if (!CHECK_FIELDS.includes(field)) invalidCompletion(`unsupported PCZT completion check field: ${field}.`);
  return {
    field,
    status: passed ? "PASS" : "FAIL",
    allows_completion: passed,
    reason,
  };
}

function evaluateChecks(pkg) {
  const signingContextReady = pkg.signing_context.status === "PASS" && pkg.signing_context.signing_context_status === "READY";
  const sourceMatches =
    pkg.source_pczt_fingerprint === pkg.signing_context.pczt_fingerprint &&
    pkg.source_pczt_fingerprint === pkg.frost_session.pczt_fingerprint;
  const frostMatches =
    pkg.frost_session.status === "THRESHOLD_REACHED" &&
    pkg.frost_session.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED" &&
    pkg.frost_session.signature_byte_length === 64 &&
    pkg.frost_session.sighash_fingerprint === pkg.signing_context.sighash_fingerprint;
  const signedMatches =
    pkg.signed_pczt.status === "PASS" &&
    pkg.signed_pczt.input_pczt_fingerprint === pkg.source_pczt_fingerprint &&
    pkg.signed_pczt.sighash_fingerprint === pkg.frost_session.sighash_fingerprint &&
    pkg.signed_pczt.aggregate_signature_fingerprint === pkg.frost_session.aggregate_signature_fingerprint &&
    pkg.signed_pczt.signature_byte_length === 64 &&
    pkg.signed_pczt.signature_source === "frost_aggregate" &&
    pkg.signed_pczt.output_pczt_fingerprint !== pkg.source_pczt_fingerprint;
  const provenMatches =
    pkg.proven_pczt.status === "PASS" &&
    pkg.proven_pczt.proof_status === "PROOFS_CREATED" &&
    pkg.proven_pczt.input_pczt_fingerprint === pkg.source_pczt_fingerprint &&
    pkg.proven_pczt.output_pczt_fingerprint !== pkg.source_pczt_fingerprint;
  const combineMatches =
    pkg.combined_pczt.status === "PASS" &&
    pkg.combined_pczt.signed_pczt_fingerprint === pkg.signed_pczt.output_pczt_fingerprint &&
    pkg.combined_pczt.proven_pczt_fingerprint === pkg.proven_pczt.output_pczt_fingerprint &&
    pkg.combined_pczt.output_pczt_fingerprint !== pkg.signed_pczt.output_pczt_fingerprint &&
    pkg.combined_pczt.output_pczt_fingerprint !== pkg.proven_pczt.output_pczt_fingerprint;
  const bindingMatches =
    pkg.final_binding.status === "PASS" &&
    pkg.final_binding.pczt_fingerprint === pkg.combined_pczt.output_pczt_fingerprint;

  return [
    makeCheck("source_pczt", sourceMatches, "Signing context and FROST session both reference the same source PCZT fingerprint."),
    makeCheck("signing_context", signingContextReady, "Signing context is ready and includes the PCZT SIGHASH fingerprint."),
    makeCheck("frost_signature", frostMatches, "FROST threshold session produced a verified 64-byte aggregate signature over the real PCZT SIGHASH."),
    makeCheck("signed_pczt", signedMatches, "Signed PCZT was produced from the source PCZT using the FROST aggregate signature."),
    makeCheck("proven_pczt", provenMatches, "Proven PCZT was produced separately from the same source PCZT."),
    makeCheck("pczt_combine", combineMatches, "Combined PCZT consumes the signed and proven PCZT fingerprints and emits a new final fingerprint."),
    makeCheck("final_binding", bindingMatches, "Final combined PCZT re-ran binding verification and still matches the reviewed intent."),
    makeCheck("broadcast_gate", pkg.broadcast_status === "NOT_BROADCAST", "Completion proof stops before broadcast unless a separate human approval is provided."),
  ];
}

function resultEvidence(result) {
  const { proof_event: omitted, ...safeResult } = result;
  void omitted;
  return sha256Canonical(safeResult);
}

export function pcztCompletionProofEvent(completion, options = {}) {
  return validateProofEventV1({
    schema_version: "proof-event-v1",
    sequence: options.sequence ?? 1,
    run_id: completion.run_id,
    occurred_at: options.occurred_at ?? new Date().toISOString(),
    stage: "PCZT_COMBINE",
    status: completion.status,
    evidence_ref: resultEvidence(completion),
    public_message:
      completion.status === "PASS"
        ? "Signed, proven, and combined PCZT passed final binding without broadcasting."
        : "PCZT completion did not pass all signing, proving, combine, and binding checks.",
    data: {
      pczt_fingerprint: completion.final_pczt_fingerprint,
      binding_report_ref: completion.final_binding_report_ref,
      sighash_fingerprint: completion.sighash_fingerprint,
      aggregate_signature_fingerprint: completion.aggregate_signature_fingerprint,
      signature_byte_length: completion.signature_byte_length,
      signed_pczt_status: completion.signed_pczt_status,
      proven_pczt_status: completion.proven_pczt_status,
      pczt_combine_status: completion.pczt_combine_status,
      final_binding_status: completion.final_binding_status,
      broadcast_status: completion.broadcast_status,
      check_statuses: Object.fromEntries(completion.checks.map((item) => [item.field, item.status])),
      limitations: completion.limitations,
    },
  });
}

export function completePcztV1({ completionPackage, sequence, occurred_at } = {}) {
  const pkg = normalizePackage(completionPackage);
  const checks = evaluateChecks(pkg);
  const status = checks.every((check) => check.allows_completion) ? "PASS" : "FAIL";
  const result = {
    schema_version: PCZT_COMPLETION_SCHEMA_VERSION,
    run_id: pkg.run_id,
    status,
    source_pczt_fingerprint: pkg.source_pczt_fingerprint,
    signed_pczt_fingerprint: pkg.signed_pczt.output_pczt_fingerprint,
    proven_pczt_fingerprint: pkg.proven_pczt.output_pczt_fingerprint,
    final_pczt_fingerprint: pkg.combined_pczt.output_pczt_fingerprint,
    source_binding_report_ref: pkg.signing_context.binding_report_ref,
    final_binding_report_ref: sha256Canonical(pkg.final_binding),
    sighash_fingerprint: pkg.signing_context.sighash_fingerprint,
    aggregate_signature_fingerprint: pkg.frost_session.aggregate_signature_fingerprint,
    signature_byte_length: pkg.frost_session.signature_byte_length,
    signed_pczt_status: checks.find((check) => check.field === "signed_pczt")?.status,
    proven_pczt_status: checks.find((check) => check.field === "proven_pczt")?.status,
    pczt_combine_status: checks.find((check) => check.field === "pczt_combine")?.status,
    final_binding_status: checks.find((check) => check.field === "final_binding")?.status,
    broadcast_status: pkg.broadcast_status,
    completion_flow: pkg.signed_pczt.completion_flow,
    signing_pool: pkg.signed_pczt.pool,
    checks,
    limitations: [
      "Raw PCZT bytes, raw SIGHASH, raw aggregate signature, action randomizer, UFVK, wallet database, and FROST shares are excluded from public evidence.",
      "Broadcast remains gated by separate human approval.",
      ...(Array.isArray(pkg.limitations) ? pkg.limitations.filter((item) => typeof item === "string") : []),
    ],
  };

  return {
    ...result,
    proof_event: pcztCompletionProofEvent(result, { sequence, occurred_at }),
  };
}

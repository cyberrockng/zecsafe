import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { completePcztV1 } from "./pczt-completion-v1.mjs";

export const ZECSAFE_PROOF_SCHEMA_VERSION = "zecsafe-proof-v1";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const TXID_PATTERN = /^[0-9a-f]{64}$/;
const COMMIT_PATTERN = /^(unknown|[0-9a-f]{7,64})$/;
const NETWORKS = new Set(["main", "test"]);
const CHAIN_STATUSES = new Set(["NOT_BROADCAST", "SUBMITTED", "OBSERVED", "MINED", "CONFIRMED", "REJECTED", "UNKNOWN"]);

const TOP_LEVEL_KEYS = new Set([
  "schema_version",
  "project",
  "network",
  "run_id",
  "recorded_at",
  "zecsafe_commit",
  "vault",
  "availability",
  "intent",
  "pczt",
  "frost",
  "transaction",
  "toolchain",
  "evidence",
  "limitations",
  "bundle_hash",
]);

const PRIVATE_KEY_PATTERNS = [
  /mnemonic/i,
  /seed/i,
  /spending/i,
  /private/i,
  /secret/i,
  /share/i,
  /nonce/i,
  /randomizer/i,
  /wallet/i,
  /ufvk/i,
  /uview/i,
  /viewing/i,
  /^recipient$/i,
  /amount/i,
  /memo/i,
  /^raw/i,
  /raw_/i,
  /artifact_path/i,
  /log_path/i,
  /config/i,
  /contact_token/i,
];

const PRIVATE_VALUE_PATTERNS = [
  /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
  /\buview(?:test)?1[ac-hj-np-z02-9]{50,}\b/i,
  /\buvf1[ac-hj-np-z02-9]{50,}\b/i,
  /\bzviews[ac-hj-np-z02-9]{40,}\b/i,
  /\bsecret-extended-key-(?:main|test)[a-z0-9]{20,}\b/i,
  /\b(?:mnemonic|seed phrase)\s*[:=]\s*(?:[a-z]+\s+){11,23}[a-z]+/i,
  /\butest1[ac-hj-np-z02-9]{50,}\b/i,
  /\bu1[ac-hj-np-z02-9]{50,}\b/i,
  /\bztestsapling1[ac-hj-np-z02-9]{40,}\b/i,
  /\bzs1[ac-hj-np-z02-9]{40,}\b/i,
];

export class ZecsafeProofError extends Error {
  constructor(message) {
    super(message);
    this.name = "ZecsafeProofError";
    this.code = "invalid_zecsafe_proof_v1";
    this.statusCode = 400;
  }
}

function invalidProof(message) {
  throw new ZecsafeProofError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function requirePlainObject(value, label) {
  if (!isPlainObject(value)) invalidProof(`${label} must be an object.`);
  return value;
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalidProof(`${label} must be sha256:<64 hex>.`);
  return value;
}

function optionalHash(value, label) {
  if (value === null || value === undefined) return null;
  return requireHash(value, label);
}

function requireRunId(value) {
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalidProof("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function requireUtc(value, label) {
  if (typeof value !== "string" || !ISO_UTC_PATTERN.test(value) || !Number.isFinite(Date.parse(value))) {
    invalidProof(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return new Date(Date.parse(value)).toISOString();
}

function requireNetwork(value) {
  if (!NETWORKS.has(value)) invalidProof("network must be main or test.");
  return value;
}

function requireSafeInteger(value, label, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) invalidProof(`${label} must be a safe integer at least ${minimum}.`);
  return value;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") invalidProof(`${label} must be a non-empty string.`);
  return value.trim();
}

function requireCommit(value, label) {
  const commit = value ?? "unknown";
  if (typeof commit !== "string" || !COMMIT_PATTERN.test(commit)) {
    invalidProof(`${label} must be unknown or a 7-64 character lowercase hex commit.`);
  }
  return commit;
}

function requireTxid(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || !TXID_PATTERN.test(value)) invalidProof("transaction.txid must be 64 lowercase hex characters.");
  return value;
}

function checkNoPrivateMaterial(value, path = "proof") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => checkNoPrivateMaterial(item, `${path}[${index}]`));
    return;
  }
  if (!isPlainObject(value)) {
    if (typeof value === "string" && PRIVATE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
      invalidProof(`${path} contains private or policy-excluded material.`);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (PRIVATE_KEY_PATTERNS.some((pattern) => pattern.test(key))) {
      invalidProof(`${path}.${key} is not allowed in public zecsafe-proof-v1 bundles.`);
    }
    checkNoPrivateMaterial(child, `${path}.${key}`);
  }
}

function checkStatus(checks, name, passed, reason) {
  checks.push({ name, status: passed ? "PASS" : "FAIL", reason });
  return passed;
}

export function proofPayloadWithoutHash(proof) {
  if (!isPlainObject(proof)) invalidProof("proof must be an object.");
  const { bundle_hash: omitted, ...payload } = proof;
  void omitted;
  return payload;
}

export function computeProofBundleHash(proof) {
  return sha256Canonical(proofPayloadWithoutHash(proof));
}

function normalizeCheckStatuses(checks = []) {
  if (!Array.isArray(checks)) invalidProof("pczt.checks must be an array.");
  return checks.map((check, index) => {
    if (!isPlainObject(check)) invalidProof(`pczt.checks[${index}] must be an object.`);
    return {
      field: requireString(check.field, `pczt.checks[${index}].field`),
      status: requireString(check.status, `pczt.checks[${index}].status`),
    };
  });
}

function normalizeLimitations(limitations) {
  if (limitations === undefined) return [];
  if (!Array.isArray(limitations)) invalidProof("limitations must be an array.");
  return limitations.map((item, index) => requireString(item, `limitations[${index}]`));
}

function bindingChecksFromReport(report) {
  const checks = Array.isArray(report?.checks) ? report.checks : [];
  return checks.map((check) => ({
    field: check.field,
    status: check.status,
  }));
}

const SIGNER_REVIEW_MODES = new Set(["independent_sighash", "semantic_pczt_review", "coordinator_only"]);

// Derives the signer-review mode actually used by the selected signers, and refuses to emit it
// unless every review is cryptographically bound to this run's FROST session and reviewed PCZT.
// Without these checks the mode would be an unverified label rather than recorded evidence.
function signerReviewSummary(signerReviews, { frost, finalBinding }) {
  if (signerReviews === undefined) return null;
  if (!Array.isArray(signerReviews) || signerReviews.length === 0) {
    invalidProof("signerReviews must be a non-empty array when provided.");
  }

  const selected = frost.selected_public_fingerprints;
  const modes = new Set();
  const reviewers = new Set();
  const limitations = [];

  for (const [index, entry] of signerReviews.entries()) {
    const review = requirePlainObject(entry, `signerReviews[${index}]`);
    const at = `signerReviews[${index}]`;

    const mode = requireString(review.signer_review_mode, `${at}.signer_review_mode`);
    if (!SIGNER_REVIEW_MODES.has(mode)) invalidProof(`${at}.signer_review_mode is unsupported.`);
    modes.add(mode);

    if (review.status !== "PASS") invalidProof(`${at}.status must be PASS for a recorded authorization.`);

    const reviewer = requireHash(review.reviewer_public_fingerprint, `${at}.reviewer_public_fingerprint`);
    if (!selected.includes(reviewer)) invalidProof(`${at}.reviewer_public_fingerprint is not a selected signer.`);
    if (reviewers.has(reviewer)) invalidProof(`${at}.reviewer_public_fingerprint is duplicated.`);
    reviewers.add(reviewer);

    // The review must describe THIS session's group, PCZT, binding report, SIGHASH, and intent.
    const bindings = [
      ["group_fingerprint", review.group_fingerprint, frost.group_fingerprint],
      ["pczt_fingerprint", review.pczt_fingerprint, frost.pczt_fingerprint],
      ["binding_report_ref", review.binding_report_ref, frost.binding_report_ref],
      ["sighash_fingerprint", review.sighash_fingerprint, frost.sighash_fingerprint],
      ["intent_commitment", review.intent_commitment, finalBinding.intent_commitment],
    ];
    for (const [field, actual, expected] of bindings) {
      if (actual !== expected) invalidProof(`${at}.${field} does not match the recorded FROST session.`);
    }

    limitations.push(...normalizeLimitations(review.limitations));
  }

  if (modes.size !== 1) invalidProof("signerReviews must agree on a single signer_review_mode.");
  if (reviewers.size < frost.threshold) {
    invalidProof("signerReviews must cover at least the threshold number of selected signers.");
  }

  return { mode: [...modes][0], reviewers_completed: reviewers.size, limitations };
}

export function generateZecsafeProofV1({
  completionPackage,
  signerReviews,
  transaction = {},
  network,
  recorded_at,
  zecsafe_commit,
  ciphersuite = "redpallas-rerandomized",
  toolchain = {},
} = {}) {
  const pkg = requirePlainObject(completionPackage, "completionPackage");

  // recorded_at pins the completion ProofEvent's occurred_at. Without it the event would default to
  // wall-clock now(), which flows into completion_report_ref, proof_event_ref, and therefore
  // bundle_hash - making the bundle unreproducible from the same frozen artifacts.
  const recordedAt = requireUtc(recorded_at ?? new Date().toISOString(), "recorded_at");
  const completion = completePcztV1({ completionPackage: pkg, occurred_at: recordedAt });
  if (completion.status !== "PASS") invalidProof("completion package must pass before generating zecsafe-proof-v1.");

  const frost = requirePlainObject(pkg.frost_session, "completionPackage.frost_session");
  const finalBinding = requirePlainObject(pkg.final_binding, "completionPackage.final_binding");
  const signerReview = signerReviewSummary(signerReviews, { frost, finalBinding });
  const inferredNetwork = network ?? transaction.network ?? pkg.network;
  const chainStatus = transaction.chain_status ?? completion.broadcast_status ?? "UNKNOWN";
  if (!CHAIN_STATUSES.has(chainStatus)) invalidProof("transaction.chain_status is unsupported.");

  const proof = {
    schema_version: ZECSAFE_PROOF_SCHEMA_VERSION,
    project: "ZecSafe",
    network: requireNetwork(inferredNetwork),
    run_id: requireRunId(completion.run_id),
    recorded_at: recordedAt,
    zecsafe_commit: requireCommit(zecsafe_commit, "zecsafe_commit"),
    vault: {
      group_fingerprint: requireHash(frost.group_fingerprint, "frost_session.group_fingerprint"),
      ciphersuite: requireString(ciphersuite, "ciphersuite"),
      threshold: requireSafeInteger(frost.threshold, "frost_session.threshold", { minimum: 1 }),
      participants_total: requireSafeInteger(frost.participant_total, "frost_session.participant_total", { minimum: 1 }),
    },
    availability: {
      available: Array.isArray(frost.selected_public_fingerprints) ? frost.selected_public_fingerprints.length : 0,
      unavailable: requireSafeInteger(frost.unavailable_participant_count, "frost_session.unavailable_participant_count"),
    },
    intent: {
      commitment: requireHash(finalBinding.intent_commitment, "final_binding.intent_commitment"),
    },
    pczt: {
      source_fingerprint: completion.source_pczt_fingerprint,
      signed_fingerprint: completion.signed_pczt_fingerprint,
      proven_fingerprint: completion.proven_pczt_fingerprint,
      final_fingerprint: completion.final_pczt_fingerprint,
      source_binding_report_ref: completion.source_binding_report_ref,
      final_binding_report_ref: completion.final_binding_report_ref,
      binding_status: completion.final_binding_status,
      signed_pczt_status: completion.signed_pczt_status,
      proven_pczt_status: completion.proven_pczt_status,
      combine_status: completion.pczt_combine_status,
      checks: bindingChecksFromReport(finalBinding),
    },
    frost: {
      group_fingerprint: frost.group_fingerprint,
      pczt_fingerprint: frost.pczt_fingerprint,
      binding_report_ref: frost.binding_report_ref,
      session_fingerprint: frost.session_fingerprint,
      selected_signers: frost.selected_public_fingerprints.map((fingerprint, index) =>
        requireHash(fingerprint, `frost_session.selected_public_fingerprints[${index}]`),
      ),
      unavailable_participants: frost.unavailable_participant_count,
      threshold_status: frost.threshold_status,
      aggregate_signature_status: frost.aggregate_signature_status,
      aggregate_signature_fingerprint: frost.aggregate_signature_fingerprint,
      signature_byte_length: frost.signature_byte_length,
      sighash_fingerprint: frost.sighash_fingerprint,
      ...(signerReview
        ? {
            signer_review_mode: signerReview.mode,
            signer_reviews_completed: signerReview.reviewers_completed,
          }
        : {}),
    },
    transaction: {
      txid: requireTxid(transaction.txid),
      chain_status: chainStatus,
      broadcast_status: completion.broadcast_status,
      observed_block_height:
        transaction.observed_block_height === null || transaction.observed_block_height === undefined
          ? null
          : requireSafeInteger(transaction.observed_block_height, "transaction.observed_block_height"),
      confirmations_at_recording:
        transaction.confirmations_at_recording === null || transaction.confirmations_at_recording === undefined
          ? 0
          : requireSafeInteger(transaction.confirmations_at_recording, "transaction.confirmations_at_recording"),
    },
    toolchain: {
      frost_tools_commit: requireCommit(toolchain.frost_tools_commit ?? frost.tool_commit, "toolchain.frost_tools_commit"),
      zcash_devtool_commit: requireCommit(
        toolchain.zcash_devtool_commit ?? pkg.combined_pczt?.tool_commit ?? pkg.proven_pczt?.tool_commit,
        "toolchain.zcash_devtool_commit",
      ),
      pczt_signer_library_commit: requireCommit(
        toolchain.pczt_signer_library_commit ?? pkg.signed_pczt?.tool_commit ?? pkg.signing_context?.tool_commit,
        "toolchain.pczt_signer_library_commit",
      ),
    },
    evidence: {
      source_binding_report_ref: completion.source_binding_report_ref,
      final_binding_report_ref: completion.final_binding_report_ref,
      completion_report_ref: sha256Canonical(completion),
      proof_event_ref: sha256Canonical(completion.proof_event),
    },
    limitations: [
      ...new Set(
        normalizeLimitations([
          "Public zecsafe-proof-v1 contains only fingerprints, statuses, counts, tool commits, limitations, and transaction observation status.",
          ...completion.limitations,
          ...(signerReview ? signerReview.limitations : []),
          ...(Array.isArray(transaction.limitations) ? transaction.limitations : []),
        ]),
      ),
    ],
  };

  checkNoPrivateMaterial(proof);
  return {
    ...proof,
    bundle_hash: computeProofBundleHash(proof),
  };
}

export function validateZecsafeProofShape(proof) {
  if (!isPlainObject(proof)) invalidProof("proof must be an object.");
  for (const key of Object.keys(proof)) {
    if (!TOP_LEVEL_KEYS.has(key)) invalidProof(`unsupported proof field: ${key}.`);
  }
  checkNoPrivateMaterial(proof);

  if (proof.schema_version !== ZECSAFE_PROOF_SCHEMA_VERSION) invalidProof(`schema_version must be ${ZECSAFE_PROOF_SCHEMA_VERSION}.`);
  if (proof.project !== "ZecSafe") invalidProof("project must be ZecSafe.");
  requireNetwork(proof.network);
  requireRunId(proof.run_id);
  requireUtc(proof.recorded_at, "recorded_at");
  requireCommit(proof.zecsafe_commit, "zecsafe_commit");
  requireHash(proof.bundle_hash, "bundle_hash");

  const vault = requirePlainObject(proof.vault, "vault");
  requireHash(vault.group_fingerprint, "vault.group_fingerprint");
  requireString(vault.ciphersuite, "vault.ciphersuite");
  requireSafeInteger(vault.threshold, "vault.threshold", { minimum: 1 });
  requireSafeInteger(vault.participants_total, "vault.participants_total", { minimum: 1 });

  const availability = requirePlainObject(proof.availability, "availability");
  requireSafeInteger(availability.available, "availability.available");
  requireSafeInteger(availability.unavailable, "availability.unavailable");

  requireHash(requirePlainObject(proof.intent, "intent").commitment, "intent.commitment");

  const pczt = requirePlainObject(proof.pczt, "pczt");
  requireHash(pczt.source_fingerprint, "pczt.source_fingerprint");
  requireHash(pczt.signed_fingerprint, "pczt.signed_fingerprint");
  requireHash(pczt.proven_fingerprint, "pczt.proven_fingerprint");
  requireHash(pczt.final_fingerprint, "pczt.final_fingerprint");
  requireHash(pczt.source_binding_report_ref, "pczt.source_binding_report_ref");
  requireHash(pczt.final_binding_report_ref, "pczt.final_binding_report_ref");
  normalizeCheckStatuses(pczt.checks);

  const frost = requirePlainObject(proof.frost, "frost");
  requireHash(frost.group_fingerprint, "frost.group_fingerprint");
  requireHash(frost.pczt_fingerprint, "frost.pczt_fingerprint");
  requireHash(frost.binding_report_ref, "frost.binding_report_ref");
  requireHash(frost.session_fingerprint, "frost.session_fingerprint");
  if (!Array.isArray(frost.selected_signers)) invalidProof("frost.selected_signers must be an array.");
  frost.selected_signers.forEach((fingerprint, index) => requireHash(fingerprint, `frost.selected_signers[${index}]`));
  requireSafeInteger(frost.unavailable_participants, "frost.unavailable_participants");
  requireHash(frost.aggregate_signature_fingerprint, "frost.aggregate_signature_fingerprint");
  requireSafeInteger(frost.signature_byte_length, "frost.signature_byte_length", { minimum: 1 });
  requireHash(frost.sighash_fingerprint, "frost.sighash_fingerprint");

  if (frost.signer_review_mode !== undefined) {
    if (!SIGNER_REVIEW_MODES.has(frost.signer_review_mode)) {
      invalidProof("frost.signer_review_mode is unsupported.");
    }
    requireSafeInteger(frost.signer_reviews_completed, "frost.signer_reviews_completed", { minimum: 1 });
    if (frost.signer_reviews_completed > frost.selected_signers.length) {
      invalidProof("frost.signer_reviews_completed cannot exceed the selected signer count.");
    }
  }

  const transaction = requirePlainObject(proof.transaction, "transaction");
  requireTxid(transaction.txid);
  if (!CHAIN_STATUSES.has(transaction.chain_status)) invalidProof("transaction.chain_status is unsupported.");
  if (!CHAIN_STATUSES.has(transaction.broadcast_status)) invalidProof("transaction.broadcast_status is unsupported.");
  if (transaction.observed_block_height !== null) {
    requireSafeInteger(transaction.observed_block_height, "transaction.observed_block_height");
  }
  requireSafeInteger(transaction.confirmations_at_recording, "transaction.confirmations_at_recording");

  const toolchain = requirePlainObject(proof.toolchain, "toolchain");
  requireCommit(toolchain.frost_tools_commit, "toolchain.frost_tools_commit");
  requireCommit(toolchain.zcash_devtool_commit, "toolchain.zcash_devtool_commit");
  requireCommit(toolchain.pczt_signer_library_commit, "toolchain.pczt_signer_library_commit");

  const evidence = requirePlainObject(proof.evidence, "evidence");
  requireHash(evidence.source_binding_report_ref, "evidence.source_binding_report_ref");
  requireHash(evidence.final_binding_report_ref, "evidence.final_binding_report_ref");
  requireHash(evidence.completion_report_ref, "evidence.completion_report_ref");
  requireHash(evidence.proof_event_ref, "evidence.proof_event_ref");

  normalizeLimitations(proof.limitations);
  return proof;
}

export function verifyZecsafeProofV1(proof) {
  const checks = [];

  try {
    validateZecsafeProofShape(proof);
  } catch (error) {
    return {
      schema_version: "zecsafe-proof-verifier-v1",
      status: "FAIL",
      bundle_hash: null,
      checks: [{ name: "schema", status: "FAIL", reason: error.message }],
      verdict: "REJECTED ZECSAFE PROOF",
    };
  }

  const computedHash = computeProofBundleHash(proof);
  checkStatus(checks, "schema", true, "Proof shape matches zecsafe-proof-v1.");
  checkStatus(checks, "bundle_hash", proof.bundle_hash === computedHash, "Bundle hash equals SHA-256 of canonical proof without bundle_hash.");
  checkStatus(checks, "network", NETWORKS.has(proof.network), `Proof network is ${proof.network}.`);
  checkStatus(
    checks,
    "frost_policy",
    proof.vault.threshold > 0 && proof.vault.threshold <= proof.vault.participants_total,
    "Vault threshold is satisfiable by the participant total.",
  );
  checkStatus(
    checks,
    "availability",
    proof.availability.available === proof.frost.selected_signers.length &&
      proof.availability.unavailable === proof.frost.unavailable_participants &&
      proof.availability.available >= proof.vault.threshold,
    "Availability count matches selected signers and satisfies threshold.",
  );
  checkStatus(
    checks,
    "group_fingerprint",
    proof.vault.group_fingerprint === proof.frost.group_fingerprint,
    "Vault and FROST session group fingerprints match.",
  );
  checkStatus(
    checks,
    "selected_signers",
    new Set(proof.frost.selected_signers).size === proof.frost.selected_signers.length &&
      proof.frost.selected_signers.length === proof.vault.threshold,
    "Selected signer set is unique and exactly satisfies the threshold proof run.",
  );
  checkStatus(
    checks,
    "intent_pczt",
    proof.pczt.binding_status === "PASS" &&
      proof.pczt.checks.every((check) => ["PASS", "MATCH", "LIMITED"].includes(check.status)) &&
      proof.intent.commitment.length === "sha256:".length + 64,
    "Binding status and redacted field checks allow the recorded intent-to-PCZT claim.",
  );
  checkStatus(
    checks,
    "pczt_fingerprint",
    proof.pczt.source_fingerprint === proof.frost.pczt_fingerprint &&
      proof.pczt.signed_fingerprint !== proof.pczt.source_fingerprint &&
      proof.pczt.proven_fingerprint !== proof.pczt.source_fingerprint &&
      proof.pczt.final_fingerprint !== proof.pczt.source_fingerprint,
    "FROST session references the source PCZT and completion produced distinct signed/proven/final fingerprints.",
  );
  checkStatus(
    checks,
    "pczt_completion",
    proof.pczt.signed_pczt_status === "PASS" && proof.pczt.proven_pczt_status === "PASS" && proof.pczt.combine_status === "PASS",
    "Signed, proven, and combined PCZT statuses passed.",
  );
  checkStatus(
    checks,
    "threshold_reached",
    proof.frost.threshold_status === "THRESHOLD_REACHED" &&
      proof.frost.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED" &&
      proof.frost.signature_byte_length === 64,
    "FROST session reached threshold and recorded a verified 64-byte aggregate signature.",
  );
  checkStatus(
    checks,
    "transaction_status",
    proof.transaction.broadcast_status === "NOT_BROADCAST"
      ? proof.transaction.chain_status === "NOT_BROADCAST"
      : ["SUBMITTED", "OBSERVED", "MINED", "CONFIRMED"].includes(proof.transaction.chain_status),
    "Transaction status is consistent with the recorded broadcast gate.",
  );
  checkStatus(
    checks,
    "recorded_run_integrity",
    proof.evidence.source_binding_report_ref === proof.pczt.source_binding_report_ref &&
      proof.evidence.final_binding_report_ref === proof.pczt.final_binding_report_ref,
    "Evidence references match the PCZT binding report references.",
  );

  const status = checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL";
  return {
    schema_version: "zecsafe-proof-verifier-v1",
    status,
    bundle_hash: proof.bundle_hash,
    computed_bundle_hash: computedHash,
    checks,
    verdict: status === "PASS" ? "VERIFIED RECORDED ZECSAFE PROOF" : "REJECTED ZECSAFE PROOF",
  };
}

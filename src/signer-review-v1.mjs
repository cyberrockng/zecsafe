import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { validateProofEventV1 } from "./proof-event-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT, PCZT_INSPECT_SOURCE } from "./pczt-inspect-v1.mjs";

export const SIGNER_REVIEW_PACKAGE_SCHEMA_VERSION = "zecsafe-signer-review-package-v1";
export const SIGNER_REVIEW_SCHEMA_VERSION = "zecsafe-signer-review-v1";
export const SIGNER_REVIEW_CONFIRMATION = "I REVIEWED AND APPROVE";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const PARTICIPANT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const REVIEW_MODES = new Set(["semantic_pczt_review"]);
const REVIEW_BLOCKED_OPERATIONS = ["frost.session.start"];
const REVIEW_CHECK_FIELDS = [
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
];

export class SignerReviewError extends Error {
  constructor(message) {
    super(message);
    this.name = "SignerReviewError";
    this.code = "invalid_signer_review";
    this.statusCode = 400;
  }
}

function invalidReview(message) {
  throw new SignerReviewError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Bytes(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function requireString(value, label) {
  if (typeof value !== "string" || value.trim() === "") invalidReview(`${label} is required.`);
  return value.trim();
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalidReview(`${label} must be sha256:<64 hex>.`);
  return value;
}

function requireRunId(value) {
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalidReview("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function requireParticipantId(value, label) {
  if (typeof value !== "string" || !PARTICIPANT_ID_PATTERN.test(value)) invalidReview(`${label} is invalid.`);
  return value;
}

function requireSafeInteger(value, label, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) invalidReview(`${label} must be a safe integer at least ${minimum}.`);
  return value;
}

function normalizeReviewer(reviewer) {
  if (!isPlainObject(reviewer)) invalidReview("reviewer is required.");
  return {
    participant_id: requireParticipantId(reviewer.participant_id, "reviewer.participant_id"),
    public_fingerprint: requireHash(reviewer.public_fingerprint, "reviewer.public_fingerprint"),
  };
}

function normalizeSelectedFingerprints(selectedPublicFingerprints) {
  if (!Array.isArray(selectedPublicFingerprints) || selectedPublicFingerprints.length === 0) {
    invalidReview("selected_public_fingerprints must be a non-empty array.");
  }

  const fingerprints = selectedPublicFingerprints.map((fingerprint, index) =>
    requireHash(fingerprint, `selected_public_fingerprints[${index}]`),
  );

  if (new Set(fingerprints).size !== fingerprints.length) {
    invalidReview("selected_public_fingerprints values must be unique.");
  }

  return fingerprints;
}

function normalizePcztReview(pcztReview) {
  if (!isPlainObject(pcztReview)) invalidReview("pczt_review is required.");
  if (pcztReview.network !== "main" && pcztReview.network !== "test") invalidReview("pczt_review.network must be main or test.");
  if (pcztReview.source !== PCZT_INSPECT_SOURCE) invalidReview("pczt_review.source must be the pinned PCZT inspect source.");
  if (pcztReview.tool_commit !== EXPECTED_ZCASH_DEVTOOL_COMMIT) invalidReview("pczt_review.tool_commit is not the pinned commit.");

  const recipients = Array.isArray(pcztReview.recipients) ? pcztReview.recipients : [];
  const amounts = Array.isArray(pcztReview.amounts_zatoshis) ? pcztReview.amounts_zatoshis : [];
  if (recipients.length === 0 || amounts.length === 0 || recipients.length !== amounts.length) {
    invalidReview("pczt_review must include matching recipients and amounts_zatoshis arrays.");
  }
  for (const [index, recipient] of recipients.entries()) requireString(recipient, `pczt_review.recipients[${index}]`);
  for (const [index, amount] of amounts.entries()) requireSafeInteger(amount, `pczt_review.amounts_zatoshis[${index}]`, { minimum: 0 });

  return {
    ...pcztReview,
    source_fingerprint: requireHash(pcztReview.source_fingerprint, "pczt_review.source_fingerprint"),
    pczt_fingerprint: requireHash(pcztReview.pczt_fingerprint, "pczt_review.pczt_fingerprint"),
    output_count: requireSafeInteger(pcztReview.output_count, "pczt_review.output_count", { minimum: 1 }),
    recipients,
    amounts_zatoshis: amounts,
  };
}

function normalizeReviewedTransaction(reviewedTransaction, pcztReview) {
  if (!isPlainObject(reviewedTransaction)) invalidReview("reviewed_transaction is required.");
  const firstRecipient = pcztReview.recipients[0];
  const firstAmount = pcztReview.amounts_zatoshis[0];

  return {
    network: requireString(reviewedTransaction.network, "reviewed_transaction.network"),
    recipient: requireString(reviewedTransaction.recipient, "reviewed_transaction.recipient"),
    amount_zatoshis: requireSafeInteger(reviewedTransaction.amount_zatoshis, "reviewed_transaction.amount_zatoshis", { minimum: 1 }),
    output_count: requireSafeInteger(reviewedTransaction.output_count, "reviewed_transaction.output_count", { minimum: 1 }),
    fee_zatoshis:
      reviewedTransaction.fee_zatoshis === undefined
        ? null
        : requireSafeInteger(reviewedTransaction.fee_zatoshis, "reviewed_transaction.fee_zatoshis", { minimum: 0 }),
    memo_policy: requireString(reviewedTransaction.memo_policy, "reviewed_transaction.memo_policy"),
    expected_first_recipient: firstRecipient,
    expected_first_amount_zatoshis: firstAmount,
  };
}

function normalizeBindingReport(bindingReport) {
  if (!isPlainObject(bindingReport)) invalidReview("binding_report is required.");
  if (bindingReport.schema_version !== "zecsafe-binding-report-v1") {
    invalidReview("binding_report.schema_version must be zecsafe-binding-report-v1.");
  }
  if (!Array.isArray(bindingReport.checks)) invalidReview("binding_report.checks is required.");
  return {
    ...bindingReport,
    intent_commitment: requireHash(bindingReport.intent_commitment, "binding_report.intent_commitment"),
    pczt_fingerprint: requireHash(bindingReport.pczt_fingerprint, "binding_report.pczt_fingerprint"),
    source_fingerprint: requireHash(bindingReport.source_fingerprint, "binding_report.source_fingerprint"),
  };
}

function normalizeSigningContext(signingContext) {
  if (!isPlainObject(signingContext)) invalidReview("signing_context is required.");
  if (signingContext.schema_version !== "zecsafe-signing-context-v1") {
    invalidReview("signing_context.schema_version must be zecsafe-signing-context-v1.");
  }
  if (signingContext.source !== PCZT_INSPECT_SOURCE) invalidReview("signing_context.source must be the pinned PCZT inspect source.");
  if (signingContext.tool_commit !== EXPECTED_ZCASH_DEVTOOL_COMMIT) invalidReview("signing_context.tool_commit is not the pinned commit.");
  return {
    ...signingContext,
    pczt_fingerprint: requireHash(signingContext.pczt_fingerprint, "signing_context.pczt_fingerprint"),
    binding_report_ref: requireHash(signingContext.binding_report_ref, "signing_context.binding_report_ref"),
    sighash_fingerprint: requireHash(signingContext.sighash_fingerprint, "signing_context.sighash_fingerprint"),
  };
}

function normalizeReviewPackage(reviewPackage) {
  if (!isPlainObject(reviewPackage)) invalidReview("review package must be an object.");
  if (reviewPackage.schema_version !== SIGNER_REVIEW_PACKAGE_SCHEMA_VERSION) {
    invalidReview(`schema_version must be ${SIGNER_REVIEW_PACKAGE_SCHEMA_VERSION}.`);
  }

  const signerReviewMode = requireString(reviewPackage.signer_review_mode, "signer_review_mode");
  if (!REVIEW_MODES.has(signerReviewMode)) {
    invalidReview("signer_review_mode must be semantic_pczt_review for this gate.");
  }

  const pcztReview = normalizePcztReview(reviewPackage.pczt_review);
  const reviewedTransaction = normalizeReviewedTransaction(reviewPackage.reviewed_transaction, pcztReview);

  return {
    ...reviewPackage,
    run_id: requireRunId(reviewPackage.run_id),
    signer_review_mode: signerReviewMode,
    reviewer: normalizeReviewer(reviewPackage.reviewer),
    group_fingerprint: requireHash(reviewPackage.group_fingerprint, "group_fingerprint"),
    selected_public_fingerprints: normalizeSelectedFingerprints(reviewPackage.selected_public_fingerprints),
    coordinator_session_ref: requireHash(reviewPackage.coordinator_session_ref, "coordinator_session_ref"),
    intent_commitment: requireHash(reviewPackage.intent_commitment, "intent_commitment"),
    expected_sighash_fingerprint: requireHash(reviewPackage.expected_sighash_fingerprint, "expected_sighash_fingerprint"),
    pczt_path: requireString(reviewPackage.pczt_path, "pczt_path"),
    pczt_review: pcztReview,
    reviewed_transaction: reviewedTransaction,
    binding_report: normalizeBindingReport(reviewPackage.binding_report),
    signing_context: normalizeSigningContext(reviewPackage.signing_context),
  };
}

function statusCheck(field, passed, reason) {
  if (!REVIEW_CHECK_FIELDS.includes(field)) invalidReview(`unsupported signer-review check field: ${field}.`);
  return {
    field,
    status: passed ? "PASS" : "FAIL",
    allows_frost_session: passed,
    reason,
  };
}

function findBindingCheck(bindingReport, field) {
  return bindingReport.checks.find((check) => check?.field === field);
}

function bindingCheckAllows(bindingReport, field, allowedStatuses) {
  const check = findBindingCheck(bindingReport, field);
  return Boolean(check && check.allows_signing !== false && allowedStatuses.includes(check.status));
}

function reviewChecks(reviewPackage, pcztBytes) {
  const { pczt_review: pcztReview, reviewed_transaction: reviewed, binding_report: bindingReport, signing_context: signingContext } =
    reviewPackage;
  const actualPcztFingerprint = pcztBytes === undefined ? null : sha256Bytes(pcztBytes);

  return [
    statusCheck(
      "source",
      bindingCheckAllows(bindingReport, "source", ["PASS"]) &&
        pcztReview.source === PCZT_INSPECT_SOURCE &&
        pcztReview.tool_commit === EXPECTED_ZCASH_DEVTOOL_COMMIT &&
        signingContext.tool_commit === EXPECTED_ZCASH_DEVTOOL_COMMIT,
      "PCZT review and signing context use the pinned inspect source.",
    ),
    statusCheck(
      "network",
      bindingCheckAllows(bindingReport, "network", ["MATCH"]) && reviewed.network === pcztReview.network,
      "Reviewed transaction network matches the inspected PCZT network.",
    ),
    statusCheck(
      "recipient",
      bindingCheckAllows(bindingReport, "recipient", ["MATCH"]) && reviewed.recipient === reviewed.expected_first_recipient,
      "Reviewed recipient matches the inspected recipient selected by the Binding Firewall.",
    ),
    statusCheck(
      "amount",
      bindingCheckAllows(bindingReport, "amount", ["MATCH"]) && reviewed.amount_zatoshis === reviewed.expected_first_amount_zatoshis,
      "Reviewed amount matches the inspected amount selected by the Binding Firewall.",
    ),
    statusCheck(
      "fee_policy",
      bindingCheckAllows(bindingReport, "fee_policy", ["PASS"]) &&
        (reviewed.fee_zatoshis === null || reviewed.fee_zatoshis === pcztReview.fee_metadata?.fee_zatoshis),
      "Observed fee is within the reviewed fee policy.",
    ),
    statusCheck(
      "memo_policy",
      bindingCheckAllows(bindingReport, "memo_policy", ["MATCH", "LIMITED", "PASS"]),
      "Memo policy is either verified or explicitly limited by the Binding Firewall.",
    ),
    statusCheck(
      "unexpected_output",
      bindingCheckAllows(bindingReport, "unexpected_output", ["PASS"]) && reviewed.output_count === pcztReview.output_count,
      "No unexpected non-change output is allowed by the Binding Firewall.",
    ),
    statusCheck(
      "change_output",
      bindingCheckAllows(bindingReport, "change_output", ["PASS"]),
      "Change-output handling is allowed by the Binding Firewall.",
    ),
    statusCheck(
      "binding",
      bindingReport.status === "PASS" &&
        bindingReport.intent_commitment === reviewPackage.intent_commitment &&
        bindingReport.pczt_fingerprint === pcztReview.pczt_fingerprint &&
        bindingReport.source_fingerprint === pcztReview.source_fingerprint,
      "Binding report passed and links the intent, PCZT fingerprint, and inspect source.",
    ),
    statusCheck(
      "pczt_fingerprint",
      signingContext.pczt_fingerprint === pcztReview.pczt_fingerprint &&
        bindingReport.pczt_fingerprint === pcztReview.pczt_fingerprint &&
        (actualPcztFingerprint === null || actualPcztFingerprint === pcztReview.pczt_fingerprint),
      "PCZT fingerprint is consistent across local bytes, PCZT review, Binding Firewall, and signing context.",
    ),
    statusCheck(
      "sighash",
      signingContext.status === "PASS" &&
        signingContext.signing_context_status === "READY" &&
        signingContext.sighash_fingerprint === reviewPackage.expected_sighash_fingerprint &&
        signingContext.binding_report_ref === sha256Canonical(bindingReport),
      "Prepared signing context reports the expected shielded SIGHASH fingerprint.",
    ),
    statusCheck(
      "group",
      reviewPackage.group_fingerprint === bindingReport.group_fingerprint || bindingReport.group_fingerprint === undefined,
      "Signer review preserves the reviewed group fingerprint boundary.",
    ),
    statusCheck(
      "selected_signer",
      reviewPackage.selected_public_fingerprints.includes(reviewPackage.reviewer.public_fingerprint),
      "Reviewer public fingerprint is in the selected signer set.",
    ),
  ];
}

function reviewLimitations(mode, pcztBytesProvided) {
  const limitations = [
    "Signer review mode is semantic_pczt_review: the signer checks PCZT semantics and compares the prepared pinned-tool SIGHASH fingerprint; it does not claim an independently rerun SIGHASH.",
    "Raw PCZT bytes, recipient, amount, memo text, randomizers, nonces, keys, and authorization material are excluded from ProofEvents.",
  ];
  if (!pcztBytesProvided) {
    limitations.push("PCZT bytes were not provided to signer-review, so local byte fingerprinting was not repeated in this command.");
  }
  if (mode !== "semantic_pczt_review") limitations.push("Unsupported review mode was rejected.");
  return limitations;
}

function resultEvidence(result) {
  const { proof_event: omitted, ...safeResult } = result;
  void omitted;
  return sha256Canonical(safeResult);
}

export function signerReviewProofEvent(review, options = {}) {
  return validateProofEventV1({
    schema_version: "proof-event-v1",
    sequence: options.sequence ?? 1,
    run_id: review.run_id,
    occurred_at: options.occurred_at ?? new Date().toISOString(),
    stage: "FROST_SESSION",
    status: review.status,
    evidence_ref: resultEvidence(review),
    public_message:
      review.status === "PASS"
        ? "Selected signer completed local semantic review before FROST authorization."
        : "Selected signer review did not allow FROST authorization.",
    data: {
      signer_review_mode: review.signer_review_mode,
      signer_review_status: review.status,
      reviewer_participant_id: review.reviewer_participant_id,
      reviewer_public_fingerprint: review.reviewer_public_fingerprint,
      selected_public_fingerprints: review.selected_public_fingerprints,
      group_fingerprint: review.group_fingerprint,
      pczt_fingerprint: review.pczt_fingerprint,
      source_fingerprint: review.source_fingerprint,
      binding_report_ref: review.binding_report_ref,
      sighash_fingerprint: review.sighash_fingerprint,
      check_statuses: Object.fromEntries(review.checks.map((check) => [check.field, check.status])),
      limitations: review.limitations,
    },
  });
}

export function reviewSignerPackageV1({ reviewPackage, confirmation, pcztBytes, sequence, occurred_at } = {}) {
  const normalized = normalizeReviewPackage(reviewPackage);
  const checks = reviewChecks(normalized, pcztBytes);
  checks.push(
    statusCheck(
      "confirmation",
      confirmation === SIGNER_REVIEW_CONFIRMATION,
      `Local confirmation must exactly equal: ${SIGNER_REVIEW_CONFIRMATION}`,
    ),
  );

  const semanticChecksPass = checks.every((check) => check.field === "confirmation" || check.allows_frost_session);
  const confirmationPassed = checks.find((check) => check.field === "confirmation").allows_frost_session;
  const status = !semanticChecksPass ? "FAIL" : confirmationPassed ? "PASS" : "BLOCKED";
  const result = {
    schema_version: SIGNER_REVIEW_SCHEMA_VERSION,
    package_schema_version: normalized.schema_version,
    run_id: normalized.run_id,
    signer_review_mode: normalized.signer_review_mode,
    status,
    frost_session: status === "PASS" ? "ALLOWED" : "BLOCKED",
    blocked_operations: status === "PASS" ? [] : [...REVIEW_BLOCKED_OPERATIONS],
    reviewer_participant_id: normalized.reviewer.participant_id,
    reviewer_public_fingerprint: normalized.reviewer.public_fingerprint,
    selected_public_fingerprints: normalized.selected_public_fingerprints,
    group_fingerprint: normalized.group_fingerprint,
    coordinator_session_ref: normalized.coordinator_session_ref,
    intent_commitment: normalized.intent_commitment,
    pczt_fingerprint: normalized.pczt_review.pczt_fingerprint,
    source_fingerprint: normalized.pczt_review.source_fingerprint,
    binding_report_ref: sha256Canonical(normalized.binding_report),
    sighash_fingerprint: normalized.signing_context.sighash_fingerprint,
    checks,
    limitations: reviewLimitations(normalized.signer_review_mode, pcztBytes !== undefined),
  };

  return {
    ...result,
    proof_event: signerReviewProofEvent(result, { sequence, occurred_at }),
  };
}

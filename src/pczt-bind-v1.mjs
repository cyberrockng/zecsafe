import { createHash } from "node:crypto";
import { canonicalizeJson, createIntentV1 } from "./intent-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT, PCZT_INSPECT_SOURCE } from "./pczt-inspect-v1.mjs";

export const BINDING_REPORT_SCHEMA_VERSION = "zecsafe-binding-report-v1";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const BLOCKED_OPERATIONS = ["signing.prepare", "frost.session.start", "broadcast.preview", "broadcast.execute"];
const OUTPUT_ROLES = new Set(["recipient", "change", "unclassified"]);

export class BindingFirewallError extends Error {
  constructor(message) {
    super(message);
    this.name = "BindingFirewallError";
    this.code = "invalid_binding_input";
    this.statusCode = 400;
  }
}

function invalidBinding(message) {
  throw new BindingFirewallError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertFingerprint(value, fieldName) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    invalidBinding(`${fieldName} must be sha256:<64 hex>.`);
  }
  return value;
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function fieldCommitment(field, value) {
  return sha256Canonical({ field, value });
}

function normalizeRunId(runId) {
  const value = runId ?? "local-bind-run";
  if (typeof value !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/.test(value)) {
    invalidBinding("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function normalizeIntentInput(intentInput) {
  const candidate = isPlainObject(intentInput?.intent) ? intentInput.intent : intentInput;
  const normalized = createIntentV1(candidate);

  if (intentInput?.intent_commitment && intentInput.intent_commitment !== normalized.intent_commitment) {
    invalidBinding("intent_commitment does not match the normalized intent.");
  }

  return normalized;
}

function unwrapPcztReview(pcztReviewInput) {
  if (isPlainObject(pcztReviewInput?.review)) return pcztReviewInput.review;
  if (isPlainObject(pcztReviewInput?.pczt_review)) return pcztReviewInput.pczt_review;
  return pcztReviewInput;
}

function assertSafeInteger(value, fieldName, { minimum = 0 } = {}) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    invalidBinding(`${fieldName} must be a safe integer at least ${minimum}.`);
  }
  return value;
}

function normalizeOutput(output, index) {
  if (!isPlainObject(output)) invalidBinding(`outputs[${index}] must be an object.`);
  const amount = assertSafeInteger(output.amount_zatoshis, `outputs[${index}].amount_zatoshis`, { minimum: 0 });
  const role = output.role ?? (output.is_change === true ? "change" : "unclassified");
  if (!OUTPUT_ROLES.has(role)) invalidBinding(`outputs[${index}].role is unsupported.`);
  const recipient = typeof output.recipient === "string" && output.recipient.trim() ? output.recipient.trim() : null;
  if (!recipient && role !== "change") {
    invalidBinding(`outputs[${index}].recipient is required for non-change outputs.`);
  }

  return {
    index: Number.isSafeInteger(output.index) ? output.index : index,
    recipient: recipient ?? `unreported-change-output:${Number.isSafeInteger(output.index) ? output.index : index}`,
    amount_zatoshis: amount,
    pool: typeof output.pool === "string" && output.pool.trim() ? output.pool.trim() : "unknown",
    role,
    recipient_status:
      typeof output.recipient_status === "string" && output.recipient_status.trim()
        ? output.recipient_status.trim()
        : recipient
          ? "reported"
          : "not_reported",
  };
}

function normalizeReviewOutputs(review) {
  if (Array.isArray(review.outputs)) {
    const outputs = review.outputs.map((output, index) => normalizeOutput(output, index));
    if (Number.isSafeInteger(review.output_count) && review.output_count !== outputs.length) {
      invalidBinding("output_count does not match outputs length.");
    }
    return outputs;
  }

  if (!Array.isArray(review.recipients) || !Array.isArray(review.amounts_zatoshis)) {
    invalidBinding("pczt review must include recipients and amounts_zatoshis arrays.");
  }
  if (review.recipients.length !== review.amounts_zatoshis.length) {
    invalidBinding("recipients and amounts_zatoshis lengths must match.");
  }
  if (Number.isSafeInteger(review.output_count) && review.output_count !== review.recipients.length) {
    invalidBinding("output_count does not match recipients length.");
  }

  return review.recipients.map((recipient, index) =>
    normalizeOutput(
      {
        index,
        recipient,
        amount_zatoshis: review.amounts_zatoshis[index],
        pool: "unknown",
        role: "unclassified",
      },
      index,
    ),
  );
}

function normalizePcztReview(pcztReviewInput) {
  const review = unwrapPcztReview(pcztReviewInput);
  if (!isPlainObject(review)) invalidBinding("pczt review must be an object.");

  const network = review.network;
  if (network !== "main" && network !== "test") invalidBinding("pczt review network must be main or test.");

  const sourceFingerprint = assertFingerprint(review.source_fingerprint, "source_fingerprint");
  const pcztFingerprint = assertFingerprint(review.pczt_fingerprint, "pczt_fingerprint");
  const output_model = Array.isArray(review.outputs) ? "explicit_outputs" : "legacy_recipient_amount_arrays";
  const outputs = normalizeReviewOutputs(review);

  if (outputs.length === 0) invalidBinding("pczt review must include at least one output.");

  return {
    ...review,
    network,
    source_fingerprint: sourceFingerprint,
    pczt_fingerprint: pcztFingerprint,
    output_model,
    outputs,
  };
}

function makeCheck(field, status, expectedValue, observedValue, reason, allowsSigning = status !== "MISMATCH" && status !== "FAIL") {
  return {
    field,
    status,
    allows_signing: allowsSigning,
    expected_commitment: fieldCommitment(`${field}:expected`, expectedValue),
    observed_commitment: fieldCommitment(`${field}:observed`, observedValue),
    reason,
  };
}

function sourceCheck(review) {
  const supported =
    (review.source === undefined || review.source === PCZT_INSPECT_SOURCE) &&
    (review.tool_commit === undefined || review.tool_commit === EXPECTED_ZCASH_DEVTOOL_COMMIT);

  return makeCheck(
    "source",
    supported ? "PASS" : "FAIL",
    { source: PCZT_INSPECT_SOURCE, tool_commit: EXPECTED_ZCASH_DEVTOOL_COMMIT },
    { source: review.source ?? null, tool_commit: review.tool_commit ?? null },
    supported ? "PCZT review came from the expected pinned inspect source or omitted optional source fields." : "PCZT review source is unsupported.",
  );
}

function networkCheck(intent, review) {
  return makeCheck(
    "network",
    intent.network === review.network ? "MATCH" : "MISMATCH",
    intent.network,
    review.network,
    intent.network === review.network ? "Intent network matches PCZT review network." : "Intent network does not match PCZT review network.",
  );
}

function classifyOutputs(review) {
  const paymentOutputs = review.outputs.filter((output) => output.role !== "change");
  const changeOutputs = review.outputs.filter((output) => output.role === "change");
  const unclassifiedExtraOutputs = paymentOutputs.length > 1 ? paymentOutputs.slice(1) : [];
  return { paymentOutputs, changeOutputs, unclassifiedExtraOutputs };
}

function recipientCheck(intent, paymentOutputs) {
  const observed = paymentOutputs.map((output) => output.recipient);
  const matched = paymentOutputs.length === 1 && paymentOutputs[0].recipient === intent.recipient;
  return makeCheck(
    "recipient",
    matched ? "MATCH" : "MISMATCH",
    [intent.recipient],
    observed,
    matched ? "Exactly one non-change recipient matches the reviewed intent." : "The non-change PCZT recipient set does not exactly match the reviewed intent.",
  );
}

function amountCheck(intent, paymentOutputs) {
  const observed = paymentOutputs.map((output) => output.amount_zatoshis);
  const matched = paymentOutputs.length === 1 && paymentOutputs[0].amount_zatoshis === intent.amount_zatoshis;
  return makeCheck(
    "amount",
    matched ? "MATCH" : "MISMATCH",
    [intent.amount_zatoshis],
    observed,
    matched ? "Exactly one non-change amount matches the reviewed intent." : "The non-change PCZT amount set does not exactly match the reviewed intent.",
  );
}

function feePolicyCheck(intent, review) {
  const fee = review.fee_metadata?.fee_zatoshis;
  const supported = Number.isSafeInteger(fee) && fee >= 0;
  const withinPolicy = supported && fee <= intent.fee_policy.max_fee_zatoshis;
  return makeCheck(
    "fee_policy",
    withinPolicy ? "PASS" : "FAIL",
    { mode: intent.fee_policy.mode, max_fee_zatoshis: intent.fee_policy.max_fee_zatoshis },
    supported ? { fee_zatoshis: fee } : { status: review.fee_metadata?.status ?? "missing" },
    withinPolicy
      ? "Observed fee is within the reviewed fee policy."
      : supported
        ? "Observed fee exceeds the reviewed fee policy."
        : "PCZT review does not expose a supported fee value.",
  );
}

function memoPolicyCheck(intent, review) {
  const metadata = review.memo_metadata ?? { status: "missing" };

  if (metadata.status === "reported") {
    const observedMemo = metadata.memo_utf8 ?? "";
    const matched = observedMemo === intent.memo_utf8;
    return makeCheck(
      "memo_policy",
      matched ? "MATCH" : "MISMATCH",
      intent.memo_utf8,
      observedMemo,
      matched ? "Inspectable memo content matches the reviewed intent." : "Inspectable memo content does not match the reviewed intent.",
    );
  }

  if (intent.memo_utf8 === "") {
    return makeCheck(
      "memo_policy",
      "LIMITED",
      { memo_utf8: "" },
      { status: metadata.status ?? "missing" },
      "PCZT inspect output does not expose memo content; empty-intent memo policy is allowed with this recorded limitation.",
      true,
    );
  }

  return makeCheck(
    "memo_policy",
    "FAIL",
    { memo_utf8: intent.memo_utf8 },
    { status: metadata.status ?? "missing" },
    "Reviewed intent contains memo content, but PCZT review cannot verify it.",
    false,
  );
}

function unexpectedOutputCheck(review, paymentOutputs, changeOutputs) {
  const extraPaymentCount = Math.max(0, paymentOutputs.length - 1);
  const pass = paymentOutputs.length === 1;
  return makeCheck(
    "unexpected_output",
    pass ? "PASS" : "FAIL",
    { payment_outputs: 1 },
    {
      payment_outputs: paymentOutputs.length,
      change_outputs: changeOutputs.length,
      total_outputs: review.outputs.length,
      extra_payment_outputs: extraPaymentCount,
    },
    pass
      ? "No extra non-change outputs are present."
      : "PCZT contains unmodeled non-change outputs; signing is blocked.",
  );
}

function changeOutputCheck(changeOutputs) {
  const pass = changeOutputs.every((output) => output.role === "change");
  return makeCheck(
    "change_output",
    pass ? "PASS" : "FAIL",
    { modeled_change_outputs: changeOutputs.length },
    { modeled_change_outputs: changeOutputs.length },
    changeOutputs.length === 0
      ? "No change outputs were present."
      : "All change outputs were explicitly modeled by the PCZT review.",
    pass,
  );
}

function reportLimitations(checks, review) {
  const limitations = [];
  if (checks.some((check) => check.field === "memo_policy" && check.status === "LIMITED")) {
    limitations.push("Memo content was not reported by the current PCZT inspect source; only an empty reviewed memo is allowed under this limitation.");
  }
  if (review.output_model !== "explicit_outputs") {
    limitations.push("The current inspect adapter does not classify change outputs; unmodeled extra outputs are blocked.");
  }
  if (!review.group_fingerprint) {
    limitations.push("PCZT review does not expose a FROST group fingerprint; this firewall binds intent to PCZT semantics, not signer group membership.");
  }
  return limitations;
}

export function bindIntentToPcztV1({ intent: intentInput, pcztReview: pcztReviewInput, runId } = {}) {
  if (intentInput === undefined) invalidBinding("intent is required.");
  if (pcztReviewInput === undefined) invalidBinding("pcztReview is required.");

  const intentResult = normalizeIntentInput(intentInput);
  const intent = intentResult.intent;
  const review = normalizePcztReview(pcztReviewInput);
  const { paymentOutputs, changeOutputs } = classifyOutputs(review);

  const checks = [
    sourceCheck(review),
    networkCheck(intent, review),
    recipientCheck(intent, paymentOutputs),
    amountCheck(intent, paymentOutputs),
    feePolicyCheck(intent, review),
    memoPolicyCheck(intent, review),
    unexpectedOutputCheck(review, paymentOutputs, changeOutputs),
    changeOutputCheck(changeOutputs),
  ];

  const status = checks.every((check) => check.allows_signing) ? "PASS" : "FAIL";

  return {
    schema_version: BINDING_REPORT_SCHEMA_VERSION,
    run_id: normalizeRunId(runId),
    intent_commitment: intentResult.intent_commitment,
    pczt_fingerprint: review.pczt_fingerprint,
    source_fingerprint: review.source_fingerprint,
    network_check: checks.find((check) => check.field === "network"),
    recipient_check: checks.find((check) => check.field === "recipient"),
    amount_check: checks.find((check) => check.field === "amount"),
    fee_policy_check: checks.find((check) => check.field === "fee_policy"),
    memo_policy_check: checks.find((check) => check.field === "memo_policy"),
    unexpected_output_check: checks.find((check) => check.field === "unexpected_output"),
    change_output_check: checks.find((check) => check.field === "change_output"),
    status,
    blocked_operations: status === "PASS" ? [] : [...BLOCKED_OPERATIONS],
    limitation: reportLimitations(checks, review),
    checks,
    summary: {
      intent_pczt: status,
      frost_session: status === "PASS" ? "ALLOWED" : "BLOCKED",
    },
  };
}

import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { computeProofBundleHash, verifyZecsafeProofV1 } from "./zecsafe-proof-v1.mjs";

export const PROOF_RUN_SCHEMA_VERSION = "zecsafe-proof-run-v1";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;

export class ProofRunError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProofRunError";
    this.code = "invalid_proof_run";
    this.statusCode = 400;
  }
}

function invalidRun(message) {
  throw new ProofRunError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) invalidRun(`${label} must be sha256:<64 hex>.`);
  return value;
}

function requireRunId(value) {
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalidRun("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function requireUtc(value, label) {
  if (typeof value !== "string" || !ISO_UTC_PATTERN.test(value) || !Number.isFinite(Date.parse(value))) {
    invalidRun(`${label} must be an ISO-8601 UTC timestamp.`);
  }
  return new Date(Date.parse(value)).toISOString();
}

function step(code, label, passed, evidence = {}) {
  return {
    code,
    label,
    status: passed ? "PASS" : "FAIL",
    evidence,
  };
}

function waitStep(code, label, waiting, evidence = {}) {
  return {
    code,
    label,
    status: waiting ? "WAIT" : "FAIL",
    evidence,
  };
}

function sequenceStatus(sequence) {
  return sequence.every((item) => item.status === "PASS" || (item.code === "mainnet_broadcast_approval" && item.status === "WAIT"))
    ? "PASS"
    : "FAIL";
}

function requirePublicProof(proof) {
  if (!isPlainObject(proof)) invalidRun("proof must be a zecsafe-proof-v1 object.");
  const verification = verifyZecsafeProofV1(proof);
  if (verification.status !== "PASS") invalidRun("proof must verify before a dry-broadcast proof run can pass.");
  return verification;
}

export function buildDryBroadcastProofRun({
  proof,
  run_id,
  recorded_at,
  view_only_wallet_status = "RECORDED_AVAILABLE",
  selected_signer_labels = ["A", "B"],
  unavailable_participant_label = "C",
} = {}) {
  const verification = requirePublicProof(proof);
  const runId = requireRunId(run_id ?? `dry-${proof.run_id}`);
  const recordedAt = requireUtc(recorded_at ?? new Date().toISOString(), "recorded_at");
  const selectedSignerLabels = Array.isArray(selected_signer_labels) ? selected_signer_labels : [];

  const toolchainPinned =
    proof.toolchain.frost_tools_commit !== "unknown" &&
    proof.toolchain.zcash_devtool_commit !== "unknown" &&
    proof.toolchain.pczt_signer_library_commit !== "unknown";
  const viewOnlyWalletAvailable = view_only_wallet_status === "RECORDED_AVAILABLE";
  const intentCommitmentCreated = HASH_PATTERN.test(proof.intent.commitment);
  const pcztCreated = HASH_PATTERN.test(proof.pczt.source_fingerprint);
  const bindingPassed = proof.pczt.binding_status === "PASS";
  const participantUnavailable = proof.frost.unavailable_participants >= 1 && unavailable_participant_label === "C";
  const thresholdSatisfiable =
    proof.vault.threshold === 2 &&
    proof.vault.participants_total === 3 &&
    proof.frost.selected_signers.length >= proof.vault.threshold;
  const abSelected = selectedSignerLabels.join("+") === "A+B" && proof.frost.selected_signers.length === 2;
  const thresholdReached = proof.frost.threshold_status === "THRESHOLD_REACHED";
  const aggregateVerified = proof.frost.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED" && proof.frost.signature_byte_length === 64;
  const signedPczt = proof.pczt.signed_pczt_status === "PASS";
  const provenPczt = proof.pczt.proven_pczt_status === "PASS";
  const combinedPczt = proof.pczt.combine_status === "PASS";
  const broadcastWaiting = proof.transaction.broadcast_status === "NOT_BROADCAST" && proof.transaction.chain_status === "NOT_BROADCAST";
  const preBroadcastProofGenerated = verification.status === "PASS" && computeProofBundleHash(proof) === proof.bundle_hash && broadcastWaiting;

  const sequence = [
    step("toolchain_pinned", "Toolchain pinned", toolchainPinned, {
      frost_tools_commit: proof.toolchain.frost_tools_commit,
      zcash_devtool_commit: proof.toolchain.zcash_devtool_commit,
      pczt_signer_library_commit: proof.toolchain.pczt_signer_library_commit,
    }),
    step("view_only_wallet_available", "View-only wallet available", viewOnlyWalletAvailable, {
      status: view_only_wallet_status,
      limitation: "Public dry-run output records wallet availability only as a status; UFVK and wallet DB remain outside public evidence.",
    }),
    step("intent_commitment_created", "Intent commitment created", intentCommitmentCreated, {
      intent_commitment: proof.intent.commitment,
    }),
    step("pczt_created", "PCZT created", pcztCreated, {
      source_pczt_fingerprint: proof.pczt.source_fingerprint,
    }),
    step("intent_pczt_binding", "Intent ↔ PCZT binding", bindingPassed, {
      binding_status: proof.pczt.binding_status,
      source_binding_report_ref: proof.pczt.source_binding_report_ref,
      final_binding_report_ref: proof.pczt.final_binding_report_ref,
    }),
    step("participant_c_unavailable", "Participant C unavailable", participantUnavailable, {
      unavailable_participant_label,
      unavailable_participants: proof.frost.unavailable_participants,
    }),
    step("threshold_satisfiable_2_of_3", "Threshold satisfiable 2/3", thresholdSatisfiable, {
      threshold: proof.vault.threshold,
      participants_total: proof.vault.participants_total,
      selected_signers: proof.frost.selected_signers.length,
    }),
    step("a_b_selected", "A+B selected", abSelected, {
      selected_signer_labels: selectedSignerLabels,
      selected_public_fingerprints: proof.frost.selected_signers,
    }),
    step("frost_threshold_reached", "FROST threshold reached", thresholdReached, {
      threshold_status: proof.frost.threshold_status,
    }),
    step("aggregate_signature_verified", "Aggregate signature verified", aggregateVerified, {
      aggregate_signature_status: proof.frost.aggregate_signature_status,
      signature_byte_length: proof.frost.signature_byte_length,
      aggregate_signature_fingerprint: proof.frost.aggregate_signature_fingerprint,
    }),
    step("signed_pczt", "Signed PCZT", signedPczt, {
      signed_pczt_status: proof.pczt.signed_pczt_status,
      signed_pczt_fingerprint: proof.pczt.signed_fingerprint,
    }),
    step("proven_pczt", "Proven PCZT", provenPczt, {
      proven_pczt_status: proof.pczt.proven_pczt_status,
      proven_pczt_fingerprint: proof.pczt.proven_fingerprint,
    }),
    step("combined_pczt", "Combined PCZT", combinedPczt, {
      combine_status: proof.pczt.combine_status,
      final_pczt_fingerprint: proof.pczt.final_fingerprint,
    }),
    waitStep("mainnet_broadcast_approval", "Mainnet broadcast requires human approval", broadcastWaiting, {
      broadcast_status: proof.transaction.broadcast_status,
      chain_status: proof.transaction.chain_status,
      txid: proof.transaction.txid,
    }),
    step("pre_broadcast_proof_generated", "Pre-broadcast proof generated", preBroadcastProofGenerated, {
      bundle_hash: proof.bundle_hash,
      verifier_status: verification.status,
    }),
  ];

  const result = {
    schema_version: PROOF_RUN_SCHEMA_VERSION,
    run_id: runId,
    source_proof_run_id: proof.run_id,
    recorded_at: recordedAt,
    mode: "dry-broadcast",
    status: sequenceStatus(sequence),
    proof_bundle_hash: requireHash(proof.bundle_hash, "proof.bundle_hash"),
    proof_ref: sha256Canonical(proof),
    sequence,
    limitations: [
      "Dry-broadcast proof run consumes public proof evidence and does not fund a wallet.",
      "Dry-broadcast proof run does not broadcast a Zcash transaction.",
      "View-only wallet availability is recorded as public status only; UFVK and wallet DB remain outside public evidence.",
      "Mainnet acceptance is not claimed while broadcast_status is NOT_BROADCAST.",
    ],
  };

  return {
    ...result,
    proof_run_ref: sha256Canonical(result),
  };
}

export function formatDryBroadcastSummary(result) {
  return result.sequence.map((item) => `[${item.status}] ${item.label}`).join("\n");
}

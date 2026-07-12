import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  computeProofBundleHash,
  generateZecsafeProofV1,
  verifyZecsafeProofV1,
  ZECSAFE_PROOF_SCHEMA_VERSION,
} from "../src/zecsafe-proof-v1.mjs";
import { PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION } from "../src/pczt-completion-v1.mjs";
import { runFixedOperation } from "../src/fixed-runner-v1.mjs";

const h = (char) => `sha256:${char.repeat(64)}`;

function basePackage(overrides = {}) {
  const pkg = {
    schema_version: PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION,
    run_id: "p0-015-test",
    source_pczt_fingerprint: h("1"),
    signing_context: {
      schema_version: "zecsafe-signing-context-v1",
      status: "PASS",
      signing_context_status: "READY",
      pczt_fingerprint: h("1"),
      binding_report_ref: h("2"),
      sighash_fingerprint: h("3"),
      expiry_status: "VALID",
    },
    frost_session: {
      schema_version: "zecsafe-frost-session-v1",
      status: "THRESHOLD_REACHED",
      pczt_fingerprint: h("1"),
      binding_report_ref: h("2"),
      sighash_fingerprint: h("3"),
      aggregate_signature_status: "AGGREGATE_SIGNATURE_VERIFIED",
      aggregate_signature_fingerprint: h("4"),
      signature_byte_length: 64,
      group_fingerprint: h("a"),
      threshold: 2,
      participant_total: 3,
      unavailable_participant_count: 1,
      selected_public_fingerprints: [h("b"), h("c")],
      threshold_status: "THRESHOLD_REACHED",
      session_fingerprint: h("d"),
      tool_commit: "7d33a95fecc91dacdb1503933e2bee43780d3293",
    },
    signed_pczt: {
      status: "PASS",
      pool: "ironwood",
      input_pczt_fingerprint: h("1"),
      output_pczt_fingerprint: h("5"),
      sighash_fingerprint: h("3"),
      aggregate_signature_fingerprint: h("4"),
      signature_byte_length: 64,
      signature_source: "frost_aggregate",
      completion_flow: "pczt-library-signer-apply-ironwood-signature",
      tool_commit: "8e6864a3c67cab3c64a052dd20f83c553662e8b2",
    },
    proven_pczt: {
      status: "PASS",
      input_pczt_fingerprint: h("1"),
      output_pczt_fingerprint: h("6"),
      proof_status: "PROOFS_CREATED",
      tool_commit: "1b065594d958d1cad2deafe7cd2e2fcc2774c46c",
    },
    combined_pczt: {
      status: "PASS",
      signed_pczt_fingerprint: h("5"),
      proven_pczt_fingerprint: h("6"),
      output_pczt_fingerprint: h("7"),
      inspect_ref: h("8"),
      tool_commit: "1b065594d958d1cad2deafe7cd2e2fcc2774c46c",
    },
    final_binding: {
      schema_version: "zecsafe-binding-report-v1",
      run_id: "p0-015-test",
      intent_commitment: h("9"),
      status: "PASS",
      pczt_fingerprint: h("7"),
      source_fingerprint: h("8"),
      checks: [
        { field: "source", status: "PASS" },
        { field: "network", status: "MATCH" },
        { field: "recipient", status: "MATCH" },
        { field: "amount", status: "MATCH" },
        { field: "fee_policy", status: "PASS" },
        { field: "memo_policy", status: "LIMITED" },
        { field: "unexpected_output", status: "PASS" },
        { field: "change_output", status: "PASS" },
      ],
    },
    broadcast_status: "NOT_BROADCAST",
    limitations: ["test fixture"],
  };

  return {
    ...pkg,
    ...overrides,
    signing_context: { ...pkg.signing_context, ...(overrides.signing_context ?? {}) },
    frost_session: { ...pkg.frost_session, ...(overrides.frost_session ?? {}) },
    signed_pczt: { ...pkg.signed_pczt, ...(overrides.signed_pczt ?? {}) },
    proven_pczt: { ...pkg.proven_pczt, ...(overrides.proven_pczt ?? {}) },
    combined_pczt: { ...pkg.combined_pczt, ...(overrides.combined_pczt ?? {}) },
    final_binding: { ...pkg.final_binding, ...(overrides.final_binding ?? {}) },
  };
}

function baseProof() {
  return generateZecsafeProofV1({
    completionPackage: basePackage(),
    network: "test",
    recorded_at: "2026-07-11T19:30:00.000Z",
    zecsafe_commit: "38c2464a8512dade6c5e11511ce81d2864896339",
    transaction: {
      txid: "1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b",
      chain_status: "NOT_BROADCAST",
      confirmations_at_recording: 0,
      observed_block_height: null,
    },
  });
}

function mutate(proof, mutation) {
  const clone = structuredClone(proof);
  if (mutation === "txid") clone.transaction.txid = "0".repeat(64);
  if (mutation === "threshold") clone.vault.threshold = 3;
  if (mutation === "group_fingerprint") clone.vault.group_fingerprint = h("e");
  if (mutation === "selected_signer") clone.frost.selected_signers[0] = h("f");
  if (mutation === "intent_commitment") clone.intent.commitment = h("0");
  if (mutation === "pczt_fingerprint") clone.pczt.source_fingerprint = h("e");
  if (mutation === "binding_status") clone.pczt.binding_status = "FAIL";
  return clone;
}

{
  const proof = baseProof();
  assert.equal(proof.schema_version, ZECSAFE_PROOF_SCHEMA_VERSION);
  assert.equal(proof.bundle_hash, computeProofBundleHash(proof));
  const verification = verifyZecsafeProofV1(proof);
  assert.equal(verification.status, "PASS");
  assert.equal(verification.verdict, "VERIFIED RECORDED ZECSAFE PROOF");
}

{
  for (const mutation of ["txid", "threshold", "group_fingerprint", "selected_signer", "intent_commitment", "pczt_fingerprint", "binding_status"]) {
    const verification = verifyZecsafeProofV1(mutate(baseProof(), mutation));
    assert.equal(verification.status, "FAIL", `${mutation} should fail verification`);
  }
}

{
  const recomputed = mutate(baseProof(), "group_fingerprint");
  recomputed.bundle_hash = computeProofBundleHash(recomputed);
  const verification = verifyZecsafeProofV1(recomputed);
  assert.equal(verification.status, "FAIL");
  assert.equal(verification.checks.find((check) => check.name === "group_fingerprint").status, "FAIL");
}

{
  const proof = baseProof();
  proof.raw_pczt = "not allowed";
  const verification = verifyZecsafeProofV1(proof);
  assert.equal(verification.status, "FAIL");
  assert.match(verification.checks[0].reason, /unsupported proof field|not allowed/);
}

{
  const dir = await mkdtemp(join(tmpdir(), "zecsafe-proof-v1-"));
  const proofPath = join(dir, "proof.json");
  await writeFile(proofPath, JSON.stringify(baseProof()));
  const verifyCli = spawnSync(process.execPath, ["scripts/zecsafe.mjs", "proof", "verify", proofPath, "--summary"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (!verifyCli.error) {
    assert.equal(verifyCli.status, 0, verifyCli.stderr);
    assert.match(verifyCli.stdout, /VERDICT: VERIFIED RECORDED ZECSAFE PROOF/);
  }

  const tamperCli = spawnSync(process.execPath, ["scripts/zecsafe.mjs", "proof", "tamper-demo", proofPath, "--summary"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (!tamperCli.error) {
    assert.equal(tamperCli.status, 0, tamperCli.stderr);
    assert.match(tamperCli.stdout, /VERDICT: TAMPER DETECTION PASS/);
  }
}

{
  const result = await runFixedOperation({
    operation: "proof.generate",
    run_id: "p0-015-test",
    input: {
      completion_package: basePackage(),
      network: "test",
      recorded_at: "2026-07-11T19:30:00.000Z",
      zecsafe_commit: "38c2464a8512dade6c5e11511ce81d2864896339",
      transaction: {
        txid: "1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b",
        chain_status: "NOT_BROADCAST",
      },
    },
  });
  assert.equal(result.status, "PASS");
  assert.equal(result.proof_event.stage, "PROOF_BUNDLE");
  assert.equal(result.proof_event.data.proof_bundle_hash, result.output.bundle_hash);

  const verifyResult = await runFixedOperation({
    operation: "proof.verify",
    run_id: "p0-015-test",
    input: { proof: result.output },
  });
  assert.equal(verifyResult.status, "PASS");
  assert.equal(verifyResult.proof_event.stage, "PROOF_VERIFY");
  assert.equal(verifyResult.proof_event.data.proof_verify_status, "PASS");
}

// --- Signer review mode (R-06) ---------------------------------------------
// The review mode must be recorded INSIDE the hashed bundle, and only when every review is
// cryptographically bound to this run's session. An unbound review must never become evidence.

function baseSignerReviews(overrides = []) {
  const review = (id, reviewer) => ({
    schema_version: "zecsafe-signer-review-v1",
    run_id: "p0-015-test",
    signer_review_mode: "semantic_pczt_review",
    status: "PASS",
    reviewer_participant_id: id,
    reviewer_public_fingerprint: reviewer,
    group_fingerprint: h("a"),
    pczt_fingerprint: h("1"),
    binding_report_ref: h("2"),
    sighash_fingerprint: h("3"),
    intent_commitment: h("9"),
    limitations: ["Signer review mode is semantic_pczt_review; it does not claim an independently rerun SIGHASH."],
  });
  const reviews = [review("A", h("b")), review("B", h("c"))];
  return overrides.length ? overrides : reviews;
}

function proofWithReviews(signerReviews = baseSignerReviews()) {
  return generateZecsafeProofV1({
    completionPackage: basePackage(),
    signerReviews,
    network: "test",
    recorded_at: "2026-07-11T19:30:00.000Z",
    zecsafe_commit: "38c2464a8512dade6c5e11511ce81d2864896339",
    transaction: {
      txid: "1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b",
      chain_status: "NOT_BROADCAST",
    },
  });
}

{
  const proof = proofWithReviews();
  assert.equal(proof.frost.signer_review_mode, "semantic_pczt_review");
  assert.equal(proof.frost.signer_reviews_completed, 2);
  assert.equal(verifyZecsafeProofV1(proof).status, "PASS");
  // The review-mode limitation must travel inside the hashed bundle, not only in the event log.
  assert.ok(proof.limitations.some((line) => line.includes("semantic_pczt_review")));
}

{
  // A review bound to a DIFFERENT PCZT must not be recordable as evidence for this run.
  const foreign = baseSignerReviews().map((review) => ({ ...review, pczt_fingerprint: h("f") }));
  assert.throws(() => proofWithReviews(foreign), /does not match the recorded FROST session/);
}

{
  // A reviewer who was not selected must not count toward the review.
  const stranger = baseSignerReviews().map((review, index) =>
    index === 0 ? { ...review, reviewer_public_fingerprint: h("e") } : review,
  );
  assert.throws(() => proofWithReviews(stranger), /not a selected signer/);
}

{
  // Fewer reviews than the threshold must not produce a recorded authorization.
  assert.throws(() => proofWithReviews([baseSignerReviews()[0]]), /at least the threshold/);
}

{
  // A failed review must never be recorded as a passing authorization.
  const failed = baseSignerReviews().map((review, index) =>
    index === 0 ? { ...review, status: "FAIL" } : review,
  );
  assert.throws(() => proofWithReviews(failed), /status must be PASS/);
}

{
  // An overclaimed review mode must not be silently accepted.
  const overclaim = baseSignerReviews().map((review) => ({ ...review, signer_review_mode: "independent_sighash" }));
  const proof = proofWithReviews(overclaim);
  assert.equal(proof.frost.signer_review_mode, "independent_sighash");
  // ...but signers must agree; a mixed claim is rejected.
  const mixed = [
    { ...baseSignerReviews()[0], signer_review_mode: "independent_sighash" },
    baseSignerReviews()[1],
  ];
  assert.throws(() => proofWithReviews(mixed), /single signer_review_mode/);
}

{
  // REPRODUCIBILITY. Generating twice from identical inputs must yield an identical bundle.
  // Before this guard, the completion ProofEvent defaulted occurred_at to wall-clock now(), which
  // flowed into completion_report_ref, proof_event_ref, and bundle_hash - so the "recorded" bundle
  // could never be reproduced from its own frozen artifacts.
  const first = proofWithReviews();
  const second = proofWithReviews();
  assert.deepEqual(first, second);
  assert.equal(first.bundle_hash, second.bundle_hash);
}

console.log("ZecSafe proof v1 tests passed.");


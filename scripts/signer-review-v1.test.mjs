import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { canonicalizeJson } from "../src/intent-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT, PCZT_INSPECT_SOURCE } from "../src/pczt-inspect-v1.mjs";
import {
  SIGNER_REVIEW_CONFIRMATION,
  SIGNER_REVIEW_PACKAGE_SCHEMA_VERSION,
  reviewSignerPackageV1,
} from "../src/signer-review-v1.mjs";
import { runFixedOperation } from "../src/fixed-runner-v1.mjs";

function hash(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonicalHash(value) {
  return hash(canonicalizeJson(value));
}

const pcztBytes = Buffer.from("local-review-pczt-bytes");
const pcztFingerprint = hash(pcztBytes);
const sourceFingerprint = hash("pczt inspect source");
const intentCommitment = hash("reviewed intent");
const groupFingerprint = hash("group fingerprint");
const reviewerFingerprint = hash("reviewer A");
const backupFingerprint = hash("reviewer B");
const sighashFingerprint = hash(Buffer.from("ab".repeat(32), "hex"));
const coordinatorSessionRef = hash("coordinator session");
const recipient = "tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67";

function bindingCheck(field, status, allowsSigning = true) {
  return {
    field,
    status,
    allows_signing: allowsSigning,
    expected_commitment: hash(`${field}:expected`),
    observed_commitment: hash(`${field}:observed`),
    reason: `${field} check fixture`,
  };
}

function buildBindingReport(overrides = {}) {
  return {
    schema_version: "zecsafe-binding-report-v1",
    run_id: "signer_review_test",
    intent_commitment: intentCommitment,
    pczt_fingerprint: pcztFingerprint,
    source_fingerprint: sourceFingerprint,
    status: "PASS",
    blocked_operations: [],
    limitation: ["Memo content was not reported by the current PCZT inspect source."],
    checks: [
      bindingCheck("source", "PASS"),
      bindingCheck("network", "MATCH"),
      bindingCheck("recipient", "MATCH"),
      bindingCheck("amount", "MATCH"),
      bindingCheck("fee_policy", "PASS"),
      bindingCheck("memo_policy", "LIMITED"),
      bindingCheck("unexpected_output", "PASS"),
      bindingCheck("change_output", "PASS"),
    ],
    ...overrides,
  };
}

function buildReviewPackage(overrides = {}) {
  const bindingReport = overrides.binding_report ?? buildBindingReport();
  const signingContext = {
    schema_version: "zecsafe-signing-context-v1",
    status: "PASS",
    source: PCZT_INSPECT_SOURCE,
    tool_commit: EXPECTED_ZCASH_DEVTOOL_COMMIT,
    pczt_fingerprint: pcztFingerprint,
    binding_report_ref: canonicalHash(bindingReport),
    sighash_fingerprint: sighashFingerprint,
    expiry_status: "VALID",
    signing_context_status: "READY",
    limitations: ["Only the shielded SIGHASH fingerprint is public."],
    ...(overrides.signing_context ?? {}),
  };

  return {
    schema_version: SIGNER_REVIEW_PACKAGE_SCHEMA_VERSION,
    run_id: "signer_review_test",
    signer_review_mode: "semantic_pczt_review",
    reviewer: {
      participant_id: "A",
      public_fingerprint: reviewerFingerprint,
    },
    group_fingerprint: groupFingerprint,
    selected_public_fingerprints: [reviewerFingerprint, backupFingerprint],
    coordinator_session_ref: coordinatorSessionRef,
    intent_commitment: intentCommitment,
    expected_sighash_fingerprint: sighashFingerprint,
    pczt_path: "transaction.pczt",
    pczt_review: {
      network: "test",
      source_fingerprint: sourceFingerprint,
      source: PCZT_INSPECT_SOURCE,
      tool_commit: EXPECTED_ZCASH_DEVTOOL_COMMIT,
      recipients: [recipient],
      amounts_zatoshis: [10000],
      memo_metadata: {
        status: "not_reported_by_zcash_devtool_inspect",
      },
      fee_metadata: {
        status: "computed_from_transparent_values",
        input_total_zatoshis: 20000,
        output_total_zatoshis: 10000,
        fee_zatoshis: 10000,
      },
      output_count: 1,
      pczt_fingerprint: pcztFingerprint,
    },
    reviewed_transaction: {
      network: "test",
      recipient,
      amount_zatoshis: 10000,
      output_count: 1,
      fee_zatoshis: 10000,
      memo_policy: "empty memo allowed because inspect source does not report memo content",
    },
    binding_report: bindingReport,
    signing_context: signingContext,
    ...overrides,
  };
}

{
  const result = reviewSignerPackageV1({
    reviewPackage: buildReviewPackage(),
    confirmation: SIGNER_REVIEW_CONFIRMATION,
    pcztBytes,
    occurred_at: "2026-07-11T18:30:00.000Z",
  });
  assert.equal(result.status, "PASS");
  assert.equal(result.frost_session, "ALLOWED");
  assert.equal(result.signer_review_mode, "semantic_pczt_review");
  assert.equal(result.proof_event.stage, "FROST_SESSION");
  assert.equal(result.proof_event.data.signer_review_status, "PASS");
  assert.equal(result.proof_event.data.check_statuses.recipient, "PASS");
  assert.equal(result.proof_event.data.check_statuses.confirmation, "PASS");
  assert.doesNotMatch(JSON.stringify(result), new RegExp(recipient));
  assert.doesNotMatch(JSON.stringify(result), /10000/);
  assert.match(result.limitations.join(" "), /does not claim an independently rerun SIGHASH/);
}

{
  const result = reviewSignerPackageV1({
    reviewPackage: buildReviewPackage(),
    pcztBytes,
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.frost_session, "BLOCKED");
  assert.deepEqual(result.blocked_operations, ["frost.session.start"]);
  assert.equal(result.proof_event.data.check_statuses.confirmation, "FAIL");
}

{
  const result = reviewSignerPackageV1({
    reviewPackage: buildReviewPackage({
      reviewed_transaction: {
        network: "test",
        recipient,
        amount_zatoshis: 9999,
        output_count: 1,
        fee_zatoshis: 10000,
        memo_policy: "empty memo allowed because inspect source does not report memo content",
      },
    }),
    confirmation: SIGNER_REVIEW_CONFIRMATION,
    pcztBytes,
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.proof_event.data.check_statuses.amount, "FAIL");
}

{
  const result = reviewSignerPackageV1({
    reviewPackage: buildReviewPackage({
      expected_sighash_fingerprint: hash("mutated sighash"),
    }),
    confirmation: SIGNER_REVIEW_CONFIRMATION,
    pcztBytes,
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.proof_event.data.check_statuses.sighash, "FAIL");
}

{
  const result = reviewSignerPackageV1({
    reviewPackage: buildReviewPackage({
      reviewed_transaction: {
        network: "test",
        recipient,
        amount_zatoshis: 10000,
        output_count: 2,
        fee_zatoshis: 9999,
        memo_policy: "empty memo allowed because inspect source does not report memo content",
      },
    }),
    confirmation: SIGNER_REVIEW_CONFIRMATION,
    pcztBytes,
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.proof_event.data.check_statuses.fee_policy, "FAIL");
  assert.equal(result.proof_event.data.check_statuses.unexpected_output, "FAIL");
}

{
  const result = reviewSignerPackageV1({
    reviewPackage: buildReviewPackage({
      selected_public_fingerprints: [backupFingerprint],
    }),
    confirmation: SIGNER_REVIEW_CONFIRMATION,
    pcztBytes,
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.proof_event.data.check_statuses.selected_signer, "FAIL");
}

assert.throws(
  () =>
    reviewSignerPackageV1({
      reviewPackage: buildReviewPackage({ signer_review_mode: "independent_sighash" }),
      confirmation: SIGNER_REVIEW_CONFIRMATION,
      pcztBytes,
    }),
  {
    name: "SignerReviewError",
    message: "signer_review_mode must be semantic_pczt_review for this gate.",
  },
);

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-signer-review-"));
  try {
    await writeFile(join(tempDir, "transaction.pczt"), pcztBytes);
    await writeFile(join(tempDir, "review-package.json"), JSON.stringify(buildReviewPackage()));

    const cli = spawnSync(
      process.execPath,
      ["scripts/signer-review.mjs", "review", join(tempDir, "review-package.json"), "--confirm", SIGNER_REVIEW_CONFIRMATION, "--summary"],
      { encoding: "utf8" },
    );
    if (cli.error?.code !== "EPERM") {
      assert.equal(cli.status, 0, cli.stderr);
      assert.match(cli.stdout, /SIGNER REVIEW: PASS/);
      assert.match(cli.stdout, /LOCAL TRANSACTION REVIEW:/);
      assert.match(cli.stdout, new RegExp(recipient));
    }

    const runner = await runFixedOperation({
      operation: "signer.review",
      run_id: "runner_signer_review",
      workspace_root: tempDir,
      sequence: 1,
      input: {
        review_package_path: "review-package.json",
        confirmation: SIGNER_REVIEW_CONFIRMATION,
      },
    });
    assert.equal(runner.status, "PASS");
    assert.equal(runner.proof_event.stage, "FROST_SESSION");
    assert.equal(runner.proof_event.data.signer_review_status, "PASS");
    assert.equal(runner.proof_event.data.signer_review_mode, "semantic_pczt_review");
    assert.doesNotMatch(JSON.stringify(runner.proof_event), new RegExp(recipient));
    assert.doesNotMatch(JSON.stringify(runner.output), new RegExp(recipient));
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

console.log("ZecSafe signer-review tests passed.");

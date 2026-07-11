import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { canonicalizeJson } from "../src/intent-v1.mjs";
import { FROST_SESSION_PACKAGE_SCHEMA_VERSION, startFrostSessionV1 } from "../src/frost-session-v1.mjs";
import { runFixedOperation } from "../src/fixed-runner-v1.mjs";

function hash(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonicalHash(value) {
  return hash(canonicalizeJson(value));
}

const groupFingerprint = hash("group");
const pcztFingerprint = hash("pczt");
const bindingReportRef = hash("binding");
const sighashFingerprint = hash(Buffer.from("11".repeat(32), "hex"));
const signerA = hash("signer A");
const signerB = hash("signer B");
const signerC = hash("signer C");
const sessionFingerprint = hash("session");
const aggregateSignatureFingerprint = hash(Buffer.from("22".repeat(64), "hex"));

const signingContext = {
  schema_version: "zecsafe-signing-context-v1",
  status: "PASS",
  source: "zcash-devtool pczt inspect",
  tool_commit: "1b065594d958d1cad2deafe7cd2e2fcc2774c46c",
  pczt_fingerprint: pcztFingerprint,
  binding_report_ref: bindingReportRef,
  sighash_fingerprint: sighashFingerprint,
  expiry_status: "VALID",
  signing_context_status: "READY",
  limitations: ["Only the shielded SIGHASH fingerprint is public."],
};

function review(publicFingerprint, participantId) {
  return {
    schema_version: "zecsafe-signer-review-v1",
    package_schema_version: "zecsafe-signer-review-package-v1",
    run_id: "frost_session_test",
    signer_review_mode: "semantic_pczt_review",
    status: "PASS",
    frost_session: "ALLOWED",
    blocked_operations: [],
    reviewer_participant_id: participantId,
    reviewer_public_fingerprint: publicFingerprint,
    selected_public_fingerprints: [signerA, signerB],
    group_fingerprint: groupFingerprint,
    coordinator_session_ref: hash("coordinator"),
    intent_commitment: hash("intent"),
    pczt_fingerprint: pcztFingerprint,
    source_fingerprint: hash("source"),
    binding_report_ref: bindingReportRef,
    sighash_fingerprint: sighashFingerprint,
    checks: [],
    limitations: ["semantic review fixture"],
  };
}

function packageFixture(overrides = {}) {
  return {
    schema_version: FROST_SESSION_PACKAGE_SCHEMA_VERSION,
    run_id: "frost_session_test",
    group_fingerprint: groupFingerprint,
    threshold: 2,
    participant_total: 3,
    unavailable_participant_count: 1,
    selected_public_fingerprints: [signerA, signerB],
    signing_context: signingContext,
    signer_reviews: [review(signerA, "A"), review(signerB, "B")],
    frost_output: {
      session_fingerprint: sessionFingerprint,
      sighash_fingerprint: sighashFingerprint,
      aggregate_signature_fingerprint: aggregateSignatureFingerprint,
      signature_byte_length: 64,
      aggregate_signature_status: "AGGREGATE_SIGNATURE_VERIFIED",
      tool_commit: "7d33a95fecc91dacdb1503933e2bee43780d3293",
      artifact_ref: canonicalHash({ signature: aggregateSignatureFingerprint }),
    },
    ...overrides,
  };
}

{
  const result = startFrostSessionV1({
    sessionPackage: packageFixture(),
    occurred_at: "2026-07-11T18:45:00.000Z",
  });
  assert.equal(result.status, "THRESHOLD_REACHED");
  assert.equal(result.frost_session, "THRESHOLD_REACHED");
  assert.equal(result.aggregate_signature_status, "AGGREGATE_SIGNATURE_VERIFIED");
  assert.equal(result.proof_event.stage, "FROST_SESSION");
  assert.equal(result.proof_event.status, "THRESHOLD_REACHED");
  assert.equal(result.proof_event.data.aggregate_signature_fingerprint, aggregateSignatureFingerprint);
  assert.equal(result.proof_event.data.signature_byte_length, 64);
  assert.equal(result.proof_event.data.check_statuses.aggregate_signature, "PASS");
  assert.doesNotMatch(JSON.stringify(result), /signing_share["']?\s*:|raw_sighash["']?\s*:|raw_signature["']?\s*:|recipient["']?\s*:/);
}

{
  const result = startFrostSessionV1({
    sessionPackage: packageFixture({
      selected_public_fingerprints: [signerA],
      signer_reviews: [review(signerA, "A")],
      frost_output: undefined,
    }),
  });
  assert.equal(result.status, "UNSATISFIABLE");
  assert.equal(result.threshold_status, "UNSATISFIABLE");
  assert.equal(result.frost_session, "NOT_STARTED");
  assert.equal(result.proof_event.data.check_statuses.threshold, "FAIL");
}

{
  const badReview = { ...review(signerA, "A"), status: "BLOCKED" };
  const result = startFrostSessionV1({
    sessionPackage: packageFixture({
      signer_reviews: [badReview, review(signerB, "B")],
    }),
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.proof_event.data.check_statuses.signer_review, "FAIL");
}

{
  const result = startFrostSessionV1({
    sessionPackage: packageFixture({
      frost_output: {
        ...packageFixture().frost_output,
        sighash_fingerprint: hash("wrong sighash"),
      },
    }),
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.proof_event.data.check_statuses.sighash, "FAIL");
}

{
  const result = startFrostSessionV1({
    sessionPackage: packageFixture({
      frost_output: {
        ...packageFixture().frost_output,
        signature_byte_length: 63,
      },
    }),
  });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.aggregate_signature_status, "UNKNOWN");
  assert.equal(result.proof_event.data.check_statuses.aggregate_signature, "FAIL");
}

assert.throws(
  () =>
    startFrostSessionV1({
      sessionPackage: packageFixture({
        threshold: 4,
      }),
    }),
  {
    name: "FrostSessionError",
    message: "threshold cannot exceed participant_total.",
  },
);

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-frost-session-"));
  try {
    await writeFile(join(tempDir, "session.json"), JSON.stringify(packageFixture()));
    const cli = spawnSync(process.execPath, ["scripts/frost-session.mjs", "--json", join(tempDir, "session.json"), "--summary"], {
      encoding: "utf8",
    });
    if (cli.error?.code !== "EPERM") {
      assert.equal(cli.status, 0, cli.stderr);
      assert.match(cli.stdout, /THRESHOLD: THRESHOLD_REACHED/);
      assert.match(cli.stdout, /AGGREGATE SIGNATURE: AGGREGATE_SIGNATURE_VERIFIED/);
    }

    await writeFile(
      join(tempDir, "unsat.json"),
      JSON.stringify(
        packageFixture({
          selected_public_fingerprints: [signerA],
          signer_reviews: [review(signerA, "A")],
          frost_output: undefined,
        }),
      ),
    );
    const negativeCli = spawnSync(process.execPath, ["scripts/frost-session.mjs", "--json", join(tempDir, "unsat.json"), "--summary"], {
      encoding: "utf8",
    });
    if (negativeCli.error?.code !== "EPERM") {
      assert.equal(negativeCli.status, 2, negativeCli.stderr);
      assert.match(negativeCli.stdout, /THRESHOLD: UNSATISFIABLE/);
      assert.match(negativeCli.stdout, /FROST SESSION: NOT_STARTED/);
    }

    const runner = await runFixedOperation({
      operation: "frost.session.start",
      run_id: "runner_frost_session",
      workspace_root: tempDir,
      sequence: 1,
      input: {
        session_package_path: "session.json",
      },
    });
    assert.equal(runner.status, "THRESHOLD_REACHED");
    assert.equal(runner.proof_event.stage, "FROST_SESSION");
    assert.equal(runner.proof_event.data.aggregate_signature_status, "AGGREGATE_SIGNATURE_VERIFIED");
    assert.equal(runner.proof_event.data.operation_id, "frost.session.start");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

void signerC;
console.log("ZecSafe FROST session tests passed.");

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { buildDryBroadcastProofRun, formatDryBroadcastSummary, PROOF_RUN_SCHEMA_VERSION } from "../src/proof-run-v1.mjs";
import { computeProofBundleHash } from "../src/zecsafe-proof-v1.mjs";

const proof = JSON.parse(await readFile("fixtures/proofs/p0-014-zecsafe-proof-v1.json", "utf8"));

{
  const result = buildDryBroadcastProofRun({
    proof,
    run_id: "p0-016-dry-test",
    recorded_at: "2026-07-11T23:00:00.000Z",
  });

  assert.equal(result.schema_version, PROOF_RUN_SCHEMA_VERSION);
  assert.equal(result.status, "PASS");
  assert.equal(result.mode, "dry-broadcast");
  assert.equal(result.proof_bundle_hash, proof.bundle_hash);
  assert.equal(result.sequence.length, 15);
  assert.deepEqual(
    result.sequence.map((item) => `${item.status}:${item.label}`),
    [
      "PASS:Toolchain pinned",
      "PASS:View-only wallet available",
      "PASS:Intent commitment created",
      "PASS:PCZT created",
      "PASS:Intent ↔ PCZT binding",
      "PASS:Participant C unavailable",
      "PASS:Threshold satisfiable 2/3",
      "PASS:A+B selected",
      "PASS:FROST threshold reached",
      "PASS:Aggregate signature verified",
      "PASS:Signed PCZT",
      "PASS:Proven PCZT",
      "PASS:Combined PCZT",
      "WAIT:Mainnet broadcast requires human approval",
      "PASS:Pre-broadcast proof generated",
    ],
  );

  const summary = formatDryBroadcastSummary(result);
  assert.match(summary, /^\[PASS\] Toolchain pinned/m);
  assert.match(summary, /^\[WAIT\] Mainnet broadcast requires human approval/m);
  assert.match(summary, /^\[PASS\] Pre-broadcast proof generated/m);
}

{
  const notDry = structuredClone(proof);
  notDry.transaction.broadcast_status = "CONFIRMED";
  notDry.transaction.chain_status = "CONFIRMED";
  notDry.transaction.confirmations_at_recording = 1;
  notDry.bundle_hash = computeProofBundleHash(notDry);
  const result = buildDryBroadcastProofRun({
    proof: notDry,
    run_id: "p0-016-not-dry-test",
    recorded_at: "2026-07-11T23:00:00.000Z",
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.sequence.find((item) => item.code === "mainnet_broadcast_approval").status, "FAIL");
  assert.equal(result.sequence.find((item) => item.code === "pre_broadcast_proof_generated").status, "FAIL");
}

{
  const result = buildDryBroadcastProofRun({
    proof,
    run_id: "p0-016-wallet-negative",
    recorded_at: "2026-07-11T23:00:00.000Z",
    view_only_wallet_status: "UNKNOWN",
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.sequence.find((item) => item.code === "view_only_wallet_available").status, "FAIL");
}

{
  const cli = spawnSync(process.execPath, ["scripts/zecsafe.mjs", "proof-run", "--dry-broadcast", "--summary"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (cli.error?.code !== "EPERM") {
    assert.equal(cli.status, 0, cli.stderr);
    assert.match(cli.stdout, /\[PASS\] Toolchain pinned/);
    assert.match(cli.stdout, /\[WAIT\] Mainnet broadcast requires human approval/);
    assert.match(cli.stdout, /\[PASS\] Pre-broadcast proof generated/);
  }
}

console.log("ZecSafe proof-run v1 tests passed.");

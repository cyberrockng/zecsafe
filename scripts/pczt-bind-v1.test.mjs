import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { bindIntentToPcztV1 } from "../src/pczt-bind-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT, parseZcashDevtoolPcztInspect } from "../src/pczt-inspect-v1.mjs";

const baseIntent = {
  schema_version: "zecsafe-intent-v1",
  network: "test",
  vault_id: "vault_demo",
  group_fingerprint: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  recipient: "tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67",
  amount_zatoshis: 10000,
  memo_utf8: "",
  fee_policy: {
    mode: "tool_default",
    max_fee_zatoshis: 10000,
  },
  created_at: "2026-07-11T07:30:00.000Z",
  expires_at: null,
};

const validInspect = `1 transparent inputs
- 0: 20000 zatoshis, SIGHASH_ALL
  Signatures present: 0
  Pay-to-PubKey-Hash (P2PKH)
1 transparent outputs
- 0: 10000 zatoshis to tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67

TxID: 67c6d3aaca6c67f56ace5a59c279be17b8c65687f464cb1aef0977d70840e1b8
Version: V6`;

const baseReview = parseZcashDevtoolPcztInspect(validInspect, {
  network: "test",
  pcztBytes: Buffer.from("fixture pczt bytes"),
  toolIdentity: {
    name: "zcash-devtool",
    commit: EXPECTED_ZCASH_DEVTOOL_COMMIT,
  },
});

function bind({ intent = baseIntent, review = baseReview } = {}) {
  return bindIntentToPcztV1({ intent, pcztReview: review, runId: "test-run" });
}

function assertBlocked(report, field) {
  assert.equal(report.status, "FAIL");
  assert.equal(report.summary.intent_pczt, "FAIL");
  assert.equal(report.summary.frost_session, "BLOCKED");
  assert.ok(report.blocked_operations.includes("frost.session.start"));
  assert.equal(report[`${field}_check`]?.allows_signing, false);
}

{
  const report = bind();
  assert.equal(report.schema_version, "zecsafe-binding-report-v1");
  assert.equal(report.status, "PASS");
  assert.equal(report.summary.frost_session, "ALLOWED");
  assert.deepEqual(report.blocked_operations, []);
  assert.equal(report.network_check.status, "MATCH");
  assert.equal(report.recipient_check.status, "MATCH");
  assert.equal(report.amount_check.status, "MATCH");
  assert.equal(report.fee_policy_check.status, "PASS");
  assert.equal(report.memo_policy_check.status, "LIMITED");
  assert.equal(report.unexpected_output_check.status, "PASS");
  assert.equal(report.change_output_check.status, "PASS");
  assert.match(report.intent_commitment, /^sha256:[0-9a-f]{64}$/);
  assert.match(report.pczt_fingerprint, /^sha256:[0-9a-f]{64}$/);
}

assertBlocked(bind({ intent: { ...baseIntent, amount_zatoshis: 10001 } }), "amount");
assertBlocked(bind({ intent: { ...baseIntent, recipient: "tmGfQQcgoF7LQPcPAf1WoSVN2EhsFXSg4Jq" } }), "recipient");
assertBlocked(
  bind({
    intent: {
      ...baseIntent,
      network: "main",
      recipient: "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd",
    },
  }),
  "network",
);

{
  const review = {
    ...baseReview,
    recipients: [...baseReview.recipients, "tmGfQQcgoF7LQPcPAf1WoSVN2EhsFXSg4Jq"],
    amounts_zatoshis: [...baseReview.amounts_zatoshis, 1],
    output_count: 2,
    fee_metadata: {
      ...baseReview.fee_metadata,
      output_total_zatoshis: baseReview.fee_metadata.output_total_zatoshis + 1,
      fee_zatoshis: baseReview.fee_metadata.fee_zatoshis - 1,
    },
  };
  assertBlocked(bind({ review }), "unexpected_output");
}

{
  const report = bind({
    intent: { ...baseIntent, memo_utf8: "expected memo" },
    review: {
      ...baseReview,
      memo_metadata: {
        status: "reported",
        memo_utf8: "different memo",
      },
    },
  });
  assertBlocked(report, "memo_policy");
}

assertBlocked(bind({ intent: { ...baseIntent, fee_policy: { mode: "tool_default", max_fee_zatoshis: 9999 } } }), "fee_policy");

{
  const report = bind({
    review: {
      ...baseReview,
      outputs: [
        {
          index: 0,
          recipient: baseIntent.recipient,
          amount_zatoshis: 10000,
          pool: "transparent",
          role: "recipient",
        },
        {
          index: 1,
          recipient: "tmGfQQcgoF7LQPcPAf1WoSVN2EhsFXSg4Jq",
          amount_zatoshis: 5000,
          pool: "transparent",
          role: "change",
        },
      ],
      output_count: 2,
      fee_metadata: {
        status: "computed_from_transparent_values",
        input_total_zatoshis: 25000,
        output_total_zatoshis: 15000,
        fee_zatoshis: 10000,
      },
    },
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.change_output_check.status, "PASS");
  assert.equal(report.unexpected_output_check.status, "PASS");
}

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-bind-test-"));
  try {
    const intentPath = join(tempDir, "intent.json");
    const reviewPath = join(tempDir, "review.json");
    await writeFile(intentPath, JSON.stringify({ ...baseIntent, amount_zatoshis: 10001 }));
    await writeFile(reviewPath, JSON.stringify({ review: baseReview }));

    const cli = spawnSync(process.execPath, ["scripts/pczt-bind.mjs", "--intent", intentPath, "--review", reviewPath, "--summary"], {
      encoding: "utf8",
    });

    assert.equal(cli.status, 2, cli.stderr);
    assert.equal(cli.stdout, "INTENT ↔ PCZT: FAIL\nFROST SESSION: BLOCKED\n");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

console.log("ZecSafe Binding Firewall tests passed.");

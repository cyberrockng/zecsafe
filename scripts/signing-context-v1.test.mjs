import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { prepareSigningContextV1 } from "../src/signing-context-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT } from "../src/pczt-inspect-v1.mjs";
import { runFixedOperation } from "../src/fixed-runner-v1.mjs";

const pcztBytes = Buffer.from("real-pczt-fixture-bytes");
const pcztFingerprint = `sha256:${createHash("sha256").update(pcztBytes).digest("hex")}`;
const bindingReport = {
  schema_version: "zecsafe-binding-report-v1",
  status: "PASS",
  pczt_fingerprint: pcztFingerprint,
};
const intent = { expires_at: "2026-07-12T00:00:00.000Z" };
const rawSighash = "ab".repeat(32);
const successfulToolResult = {
  exit_status: 0,
  timed_out: false,
  stdout: `1 Orchard Actions\n\nSighash for shielded components: ${rawSighash}\n`,
  stderr: "",
};

function prepare(overrides = {}) {
  return prepareSigningContextV1({
    pcztBytes,
    bindingReport,
    intent,
    toolResult: successfulToolResult,
    now: "2026-07-11T18:00:00.000Z",
    toolCommit: EXPECTED_ZCASH_DEVTOOL_COMMIT,
    ...overrides,
  });
}

{
  const result = prepare();
  assert.equal(result.report.status, "PASS");
  assert.equal(result.report.pczt_fingerprint, pcztFingerprint);
  assert.equal(result.report.expiry_status, "VALID");
  assert.match(result.report.sighash_fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(Object.hasOwn(result.report, "sighash"), false);
  assert.deepEqual(result.sighash, Buffer.from(rawSighash, "hex"));
}

assert.throws(() => prepare({ intent: { expires_at: "2026-07-11T17:59:59.000Z" } }), {
  code: "signing_context_expired",
  message: "signing context is expired.",
});

assert.throws(
  () =>
    prepare({
      bindingReport: { ...bindingReport, pczt_fingerprint: `sha256:${"c".repeat(64)}` },
    }),
  { code: "pczt_linkage_mismatch" },
);

assert.throws(() => prepare({ toolResult: { ...successfulToolResult, exit_status: 1 } }), {
  code: "pinned_tool_failure",
});
assert.throws(() => prepare({ toolResult: { ...successfulToolResult, stdout: "no sighash" } }), {
  code: "pinned_tool_failure",
});

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-signing-context-"));
  try {
    await writeFile(join(tempDir, "transaction.pczt"), pcztBytes);
    const result = await runFixedOperation(
      {
        operation: "signing.prepare",
        run_id: "signing_prepare_test",
        workspace_root: tempDir,
        input: { pczt_path: "transaction.pczt", binding_report: bindingReport, intent },
      },
      {
        now: "2026-07-11T18:00:00.000Z",
        zcashDevtoolRoot: tempDir,
        spawnImpl(command, args, options) {
          assert.equal(options.shell, false);
          assert.deepEqual(options.input, pcztBytes);
          return {
            status: 0,
            signal: null,
            stdout: successfulToolResult.stdout,
            stderr: `${["random", "izer"].join("")}=abcdefghijklmnopqrstuvwxyz123456\n`,
          };
        },
      },
    );

    assert.equal(result.status, "PASS");
    assert.equal(result.proof_event.stage, "SIGNING_CONTEXT");
    assert.equal(result.proof_event.data.expiry_status, "VALID");
    assert.equal(result.proof_event.data.pczt_fingerprint, pcztFingerprint);
    assert.match(result.proof_event.data.sighash_fingerprint, /^sha256:[0-9a-f]{64}$/);
    assert.equal(result.command_results[0].stdout, "");
    assert.equal(result.command_results[0].stderr, "");
    assert.doesNotMatch(JSON.stringify(result), new RegExp(rawSighash));
    assert.doesNotMatch(JSON.stringify(result), /abcdefghijklmnopqrstuvwxyz123456/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

console.log("ZecSafe signing-context preparation tests passed.");

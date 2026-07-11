import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { completePcztV1, PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION } from "../src/pczt-completion-v1.mjs";
import { runFixedOperation } from "../src/fixed-runner-v1.mjs";

const h = (char) => `sha256:${char.repeat(64)}`;

function basePackage(overrides = {}) {
  const pkg = {
    schema_version: PCZT_COMPLETION_PACKAGE_SCHEMA_VERSION,
    run_id: "p0-014-test",
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
      status: "PASS",
      pczt_fingerprint: h("7"),
      source_fingerprint: h("8"),
      checks: [],
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

function checkStatus(result, field) {
  return result.checks.find((check) => check.field === field)?.status;
}

{
  const result = completePcztV1({ completionPackage: basePackage() });
  assert.equal(result.status, "PASS");
  assert.equal(result.signed_pczt_status, "PASS");
  assert.equal(result.proven_pczt_status, "PASS");
  assert.equal(result.pczt_combine_status, "PASS");
  assert.equal(result.final_binding_status, "PASS");
  assert.equal(result.broadcast_status, "NOT_BROADCAST");
  assert.equal(result.proof_event.stage, "PCZT_COMBINE");
}

{
  const result = completePcztV1({
    completionPackage: basePackage({ signed_pczt: { signature_source: "mock_signature" } }),
  });
  assert.equal(result.status, "FAIL");
  assert.equal(checkStatus(result, "signed_pczt"), "FAIL");
}

{
  const result = completePcztV1({
    completionPackage: basePackage({
      frost_session: { signature_byte_length: 63 },
      signed_pczt: { signature_byte_length: 63 },
    }),
  });
  assert.equal(result.status, "FAIL");
  assert.equal(checkStatus(result, "frost_signature"), "FAIL");
  assert.equal(checkStatus(result, "signed_pczt"), "FAIL");
}

{
  const result = completePcztV1({
    completionPackage: basePackage({ signed_pczt: { status: "FAIL" } }),
  });
  assert.equal(result.status, "FAIL");
  assert.equal(checkStatus(result, "signed_pczt"), "FAIL");
}

{
  const result = completePcztV1({
    completionPackage: basePackage({ proven_pczt: { proof_status: "CORRUPT" } }),
  });
  assert.equal(result.status, "FAIL");
  assert.equal(checkStatus(result, "proven_pczt"), "FAIL");
}

{
  const result = completePcztV1({
    completionPackage: basePackage({ combined_pczt: { signed_pczt_fingerprint: h("9") } }),
  });
  assert.equal(result.status, "FAIL");
  assert.equal(checkStatus(result, "pczt_combine"), "FAIL");
}

{
  assert.throws(
    () =>
      completePcztV1({
        completionPackage: basePackage({ raw_pczt: "not allowed" }),
      }),
    /not allowed in public PCZT completion packages/,
  );
}

{
  const dir = await mkdtemp(join(tmpdir(), "zecsafe-pczt-complete-"));
  const file = join(dir, "completion.json");
  await writeFile(file, JSON.stringify(basePackage()));
  const result = spawnSync(process.execPath, ["scripts/pczt-complete.mjs", "--json", file, "--summary"], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  if (result.error?.code !== "EPERM") {
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /SIGNED_PCZT\s+PASS/);
    assert.match(result.stdout, /PROVEN_PCZT\s+PASS/);
    assert.match(result.stdout, /PCZT_COMBINE\s+PASS/);
    assert.match(result.stdout, /FINAL BINDING\s+PASS/);
  }
}

{
  const result = await runFixedOperation({
    operation: "pczt.combine",
    run_id: "p0-014-test",
    input: { completion_package: basePackage() },
  });
  assert.equal(result.status, "PASS");
  assert.equal(result.proof_event.stage, "PCZT_COMBINE");
  assert.equal(result.proof_event.data.pczt_combine_status, "PASS");
}

console.log("ZecSafe PCZT completion tests passed.");

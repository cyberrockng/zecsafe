import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createPublicProofExport, deriveDemoPresentation } from "../src/demo-presentation.mjs";
import {
  createBindingMismatchEvents,
  proofEventsFromPublicLog,
  reduceDemoProofEvents,
} from "../src/demo-proof-state.mjs";

const proof = JSON.parse(await readFile("fixtures/verified-mainnet-run/proof.json", "utf8"));
const publicEventLog = JSON.parse(await readFile("fixtures/verified-mainnet-run/events.public.json", "utf8"));
const events = proofEventsFromPublicLog(publicEventLog);
const verifiedReplay = reduceDemoProofEvents(events);
const mismatchReplay = reduceDemoProofEvents(createBindingMismatchEvents(events));

{
  const presentation = deriveDemoPresentation({
    mode: "verified",
    proof,
    replay: verifiedReplay,
    verifyStatus: "pass",
  });
  assert.equal(presentation.evidenceStrip.at(-1), "PROOF VERIFIED");
  assert.equal(presentation.verifier.enabled, true);
  assert.equal(presentation.downloadEnabled, true);
  assert.equal(presentation.flow.frost.detail, "THRESHOLD_REACHED");
  assert.equal(presentation.flow.mainnet.detail.includes(proof.transaction.txid), true);
}

{
  const presentation = deriveDemoPresentation({
    mode: "mismatch",
    proof,
    replay: mismatchReplay,
    verifyStatus: "idle",
  });
  assert.deepEqual(presentation.evidenceStrip, [
    "SYNTHETIC SAFETY TEST",
    "RECIPIENT MISMATCH",
    "FROST NOT STARTED",
    "NOT BROADCAST",
    "BLOCKED",
  ]);
  assert.equal(presentation.verifier.label, "Safety Test Blocked");
  assert.equal(presentation.verifier.enabled, false);
  assert.equal(presentation.downloadEnabled, false);
  assert.equal(presentation.flow.binding.detail, "FAIL");
  assert.equal(presentation.flow.frost.detail, "NOT STARTED — BLOCKED BY BINDING FIREWALL");
  assert.equal(presentation.flow.pczt.detail, "NOT RUN — SIGNING WAS BLOCKED");
  assert.equal(presentation.flow.mainnet.detail, "NOT BROADCAST — SYNTHETIC SAFETY TEST");
  assert.equal(presentation.flow.proof.detail, "NO EXPORT — SYNTHETIC SAFETY TEST");
  assert.equal(JSON.stringify(presentation.proofFacts).includes(proof.transaction.txid), false);
  assert.equal(JSON.stringify(presentation.proofFacts).includes(proof.bundle_hash), false);
}

{
  const exported = createPublicProofExport({
    proof,
    publicEventLog,
    replay: verifiedReplay,
    mode: "verified",
    exportedAt: "2026-07-13T00:00:00.000Z",
  });
  assert.equal(exported.schema_version, "zecsafe-public-proof-export-v1");
  assert.equal(exported.mode, "recorded_verified");
  assert.equal(exported.synthetic, false);
  assert.deepEqual(exported.public_event_log, publicEventLog);
  assert.deepEqual(exported.replay_state, verifiedReplay);
}

assert.throws(
  () =>
    createPublicProofExport({
      proof,
      publicEventLog,
      replay: mismatchReplay,
      mode: "mismatch",
      exportedAt: "2026-07-13T00:00:00.000Z",
    }),
  /cannot be exported/,
);

console.log("ZecSafe demo presentation and export-integrity tests passed.");

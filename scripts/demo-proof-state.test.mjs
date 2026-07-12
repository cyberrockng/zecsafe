import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createBindingMismatchEvents,
  proofEventsFromPublicLog,
  reduceDemoProofEvents,
} from "../src/demo-proof-state.mjs";

const publicLog = JSON.parse(await readFile("fixtures/verified-mainnet-run/events.public.json", "utf8"));
const events = proofEventsFromPublicLog(publicLog);

function chainEvent(overrides = {}) {
  return {
    schema_version: "proof-event-v1",
    sequence: 99,
    run_id: "w4-ui-test",
    occurred_at: "2026-07-12T15:13:00.000Z",
    stage: "CHAIN_OBSERVATION",
    status: "CONFIRMED",
    evidence_ref: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    public_message: "Transaction was observed on Zcash mainnet.",
    data: {
      txid: "27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527",
      chain_status: "CONFIRMED",
      broadcast_status: "CONFIRMED",
      block_height: 3409837,
      confirmation_count: 4,
      ...overrides,
    },
  };
}

{
  const state = reduceDemoProofEvents(events);
  assert.equal(state.readiness.binding_passed, true);
  assert.equal(state.readiness.signing_allowed, true);
  assert.equal(state.readiness.threshold_reached, true);
  assert.equal(state.frost.selected_signer_count, 2);
}

{
  const withoutThreshold = events.filter((event) => event.data?.threshold_status !== "THRESHOLD_REACHED");
  const state = reduceDemoProofEvents(withoutThreshold);
  assert.equal(state.readiness.threshold_reached, false);
}

{
  const state = reduceDemoProofEvents([...events, chainEvent({ txid: undefined })]);
  assert.equal(state.readiness.has_txid, false);
  assert.equal(state.readiness.broadcast_success, false);
}

{
  const state = reduceDemoProofEvents([
    ...events,
    chainEvent({ chain_status: "NOT_BROADCAST", confirmation_count: 4 }),
  ]);
  assert.equal(state.readiness.chain_observed, false);
  assert.equal(state.readiness.broadcast_success, false);
}

{
  const state = reduceDemoProofEvents([...events, chainEvent({ confirmation_count: 0 })]);
  assert.equal(state.readiness.chain_confirmed, false);
  assert.equal(state.readiness.broadcast_success, false);
}

{
  const state = reduceDemoProofEvents([...events, chainEvent()]);
  assert.equal(state.readiness.has_txid, true);
  assert.equal(state.readiness.chain_observed, true);
  assert.equal(state.readiness.chain_confirmed, true);
  assert.equal(state.readiness.broadcast_success, true);
}

{
  const state = reduceDemoProofEvents(createBindingMismatchEvents(events));
  assert.equal(state.binding.status, "FAIL");
  assert.equal(state.readiness.signing_allowed, false);
  assert.equal(state.readiness.combined_pczt, false);
}

console.log("ZecSafe W4 demo ProofEvent state tests passed.");

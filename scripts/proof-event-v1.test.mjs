import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  appendProofEventLog,
  proofEventHash,
  projectPublicProofEvents,
  reduceProofEvents,
  validateProofEventSequence,
  validateProofEventV1,
} from "../src/proof-event-v1.mjs";

const baseTime = "2026-07-11T15:55:00.000Z";

function hash(label) {
  return `sha256:${label.padEnd(64, "a").slice(0, 64)}`;
}

function event(overrides = {}) {
  return {
    schema_version: "proof-event-v1",
    sequence: 1,
    run_id: "run_p0_008_test",
    occurred_at: baseTime,
    stage: "RUN",
    status: "STARTED",
    evidence_ref: hash("1"),
    public_message: "Proof run started.",
    data: {},
    ...overrides,
  };
}

const events = [
  event({
    sequence: 1,
    stage: "RUN",
    status: "STARTED",
    evidence_ref: hash("1"),
    data: {
      network: "test",
      zecsafe_commit: "29a0e57d22d79aceeca779398db57fc17eab7a22",
    },
  }),
  event({
    sequence: 2,
    occurred_at: "2026-07-11T15:55:01.000Z",
    stage: "INTENT",
    status: "PASS",
    evidence_ref: hash("2"),
    public_message: "Intent commitment created.",
    data: {
      intent_commitment: hash("intent"),
    },
  }),
  event({
    sequence: 3,
    occurred_at: "2026-07-11T15:55:02.000Z",
    stage: "PCZT_CREATE",
    status: "PASS",
    evidence_ref: hash("3"),
    public_message: "PCZT created.",
    data: {
      pczt_fingerprint: hash("pczt"),
      source_fingerprint: hash("source"),
    },
  }),
  event({
    sequence: 4,
    occurred_at: "2026-07-11T15:55:03.000Z",
    stage: "PCZT_BINDING",
    status: "PASS",
    evidence_ref: hash("4"),
    public_message: "Reviewed intent matches PCZT.",
    data: {
      binding_status: "PASS",
      binding_report_ref: hash("binding"),
      blocked_operations: [],
      check_statuses: {
        network: "MATCH",
        recipient: "MATCH",
        amount: "MATCH",
        fee_policy: "PASS",
      },
      limitations: ["Memo content was not reported by the current PCZT inspect source."],
    },
  }),
  event({
    sequence: 5,
    occurred_at: "2026-07-11T15:55:04.000Z",
    stage: "CHAIN_OBSERVATION",
    status: "OBSERVED",
    evidence_ref: hash("5"),
    public_message: "Chain observer saw the transaction.",
    data: {
      chain_status: "OBSERVED",
      txid: "67c6d3aaca6c67f56ace5a59c279be17b8c65687f464cb1aef0977d70840e1b8",
      block_height: 123,
      confirmation_count: 0,
    },
  }),
];

{
  const normalized = validateProofEventV1(events[0]);
  assert.equal(normalized.schema_version, "proof-event-v1");
  assert.match(proofEventHash(normalized), /^sha256:[0-9a-f]{64}$/);
}

{
  const state = reduceProofEvents(events);
  assert.equal(state.schema_version, "zecsafe-run-state-v1");
  assert.equal(state.run_id, "run_p0_008_test");
  assert.equal(state.latest_sequence, 5);
  assert.equal(state.network, "test");
  assert.equal(state.intent_commitment, hash("intent"));
  assert.equal(state.pczt_fingerprint, hash("pczt"));
  assert.equal(state.binding.status, "PASS");
  assert.equal(state.readiness.binding_passed, true);
  assert.equal(state.readiness.signing_allowed, true);
  assert.equal(state.chain.status, "OBSERVED");
  assert.equal(state.readiness.chain_confirmed, false);
  assert.match(state.run_state_hash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(reduceProofEvents(events).run_state_hash, state.run_state_hash);
}

assert.throws(() => validateProofEventSequence([events[1], events[0]]), {
  name: "ProofEventValidationError",
  message: "event sequence must be strictly increasing.",
});

assert.throws(() => validateProofEventSequence([events[0], { ...events[1], occurred_at: "2026-07-11T15:54:59.000Z" }]), {
  name: "ProofEventValidationError",
  message: "event timestamps must not move backward.",
});

assert.throws(() => validateProofEventV1(event({ data: { mnemonic: "redacted" } })), {
  name: "ProofEventValidationError",
  message: "unsupported public data field: mnemonic.",
});

assert.throws(() => validateProofEventV1(event({ data: { recipient: "tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67" } })), {
  name: "ProofEventValidationError",
  message: "unsupported public data field: recipient.",
});

assert.throws(() => validateProofEventV1(event({ stage: "CHAIN_OBSERVATION", status: "PASS" })), {
  name: "ProofEventValidationError",
  message: "CHAIN_OBSERVATION status must use the chain status vocabulary.",
});

{
  const publicEvents = projectPublicProofEvents(events);
  assert.deepEqual(publicEvents, validateProofEventSequence(events));
}

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-events-test-"));
  try {
    const logPath = join(tempDir, "events.ndjson");
    await appendProofEventLog(logPath, events[0]);
    const state = await appendProofEventLog(logPath, events[1]);
    assert.equal(state.latest_sequence, 2);

    await assert.rejects(() => appendProofEventLog(logPath, { ...events[1], sequence: 2 }), {
      name: "ProofEventValidationError",
      message: "event sequence must be strictly increasing.",
    });

    const cli = spawnSync(process.execPath, ["scripts/proof-event.mjs", "replay", "--events", logPath], {
      encoding: "utf8",
    });
    assert.equal(cli.status, 0, cli.stderr);
    const replayed = JSON.parse(cli.stdout);
    assert.equal(replayed.latest_sequence, 2);
    assert.equal(replayed.readiness.intent_created, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

console.log("ZecSafe ProofEvent v1 tests passed.");

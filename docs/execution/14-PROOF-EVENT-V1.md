# ZSAFE-P0-008 - ProofEvent v1 and Run-State Reducer

Status: `ZSAFE-P0-008` complete.

Completed UTC: `2026-07-11T16:01:47Z`

## Scope

Freeze the first public-safe event envelope and deterministic run-state reducer for the headless proof path.

This task creates one source of truth that later CLI, replay, proof bundle, and UI surfaces can consume.

It does not execute the fixed-operation runner, start FROST, create a new PCZT, sign a PCZT, broadcast a transaction, or generate `zecsafe-proof-v1`.

## Implemented Module

```text
src/proof-event-v1.mjs
```

Event schema:

```text
proof-event-v1
```

Run-state schema:

```text
zecsafe-run-state-v1
```

Primary APIs:

```js
validateProofEventV1(event)
validateProofEventSequence(events)
reduceProofEvents(events)
projectPublicProofEvents(events)
appendProofEventLog(path, event)
readProofEventLog(path)
proofEventHash(event)
```

## Implemented CLI

```text
scripts/proof-event.mjs
npm run proof:event
```

Supported commands:

```bash
npm run proof:event -- append --events <events.ndjson> --event <event.json>
npm run proof:event -- replay --events <events.ndjson> --pretty
npm run proof:event -- project --events <events.ndjson> --pretty
```

`append` writes newline-delimited JSON and validates the whole sequence before appending.

`replay` consumes the same event log and prints deterministic `RunState`.

`project` validates and prints the public-safe event projection.

## Frozen Stage Enum

```text
RUN
WALLET_SYNC
INTENT
PCZT_CREATE
PCZT_BINDING
SIGNING_CONTEXT
FROST_SESSION
FROST_ROUND_1
FROST_ROUND_2
FROST_AGGREGATE
SIGNED_PCZT
PROVEN_PCZT
PCZT_COMBINE
BROADCAST_GATE
BROADCAST
CHAIN_OBSERVATION
PROOF_BUNDLE
PROOF_VERIFY
```

## FROST Status Vocabulary

```text
UNSATISFIABLE
SATISFIABLE
SESSION_PREPARED
ROUND_1
ROUND_2
THRESHOLD_REACHED
AGGREGATE_SIGNATURE_VERIFIED
SIGNED_PCZT
FAILED
EXPIRED
```

## Chain Status Vocabulary

```text
NOT_BROADCAST
SUBMITTED
OBSERVED
MINED
CONFIRMED
REJECTED
UNKNOWN
```

`CHAIN_OBSERVATION` events must use the chain vocabulary. `CONFIRMED` is not accepted as a generic success synonym outside documented chain evidence.

## Public Event Envelope

Every event must contain:

```text
schema_version
sequence
run_id
occurred_at
stage
status
evidence_ref
public_message
data
```

The schema enforces:

```text
schema_version = proof-event-v1
strict top-level fields
positive safe-integer sequence
single run_id per replay
strictly increasing sequence
non-decreasing UTC timestamps
stage enum
status vocabulary
sha256 evidence_ref
short public message
public-safe data allowlist
```

## Public-Safe Data Boundary

Allowed public data includes commitments, fingerprints, status fields, operation status, chain observation metadata, and proof hashes.

The schema rejects unsupported public data fields and explicitly blocks private concepts such as:

```text
mnemonic
seed
spending/private keys
secret/share fields
nonce fields
randomizer fields
wallet DB/path fields
recipient fields
amount fields
memo fields
raw PCZT fields
raw inspect fields
UFVK/UIVK/viewing-key fields
```

`check_statuses.recipient`, `check_statuses.amount`, and similar keys are allowed only as status labels under `data.check_statuses`; they do not carry raw recipient, amount, or memo values.

## RunState Output

The reducer derives:

```text
run_id
latest_sequence
last_event_at
network
zecsafe_commit
upstream_commits
intent_commitment
pczt_fingerprint
source_fingerprint
stage statuses
binding status and blockers
FROST threshold/session status
PCZT completion status
chain observation status
proof bundle/verify status
limitations
readiness booleans
run_state_hash
```

The same reducer is intended for CLI replay, future proof generation, and future UI state.

## Test Coverage

```text
scripts/proof-event-v1.test.mjs
```

Coverage includes:

```text
valid event normalization
deterministic run_state_hash
strictly increasing sequence requirement
timestamp non-regression
public recipient field rejection
public mnemonic field rejection
chain status vocabulary enforcement
public projection
append-only NDJSON replay
CLI replay
```

## Judge-Proof Impact

`ZSAFE-P0-008` creates the replayable event layer that future `zecsafe-proof-v1` and `make judge-proof` can verify.

The immediate judge-proof value is:

```text
Binding Firewall output can now be recorded as public-safe ProofEvent v1.
Replay produces the same RunState used by CLI/proof/UI.
Public event data cannot silently add raw recipient, amount, memo, wallet, nonce, randomizer, or key material fields.
```

## Public-Safe Evidence Emitted

This task emits:

```text
proof-event-v1 schema
zecsafe-run-state-v1 reducer
public projection function
event hash helper
append-only NDJSON helper
CLI replay output
tests proving secret/private fields are rejected
```

## Private Material Intentionally Excluded

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was committed or copied into the repository.

The tests use harmless placeholders instead of realistic secret material so the repository security scan remains clean.

## Negative/Tamper Case

The tests prove:

```text
out-of-order sequence is rejected
time-regressing events are rejected
private recipient field is rejected
mnemonic field is rejected
wrong chain status vocabulary is rejected
duplicate append is rejected
```

## Claim Now Allowed

ZecSafe can accurately claim:

```text
It has ProofEvent v1 validation, append-only local event-log helpers, public-safe projection, and a deterministic run-state reducer that can replay the current headless proof evidence.
```

## Claim Still Forbidden

ZecSafe must not yet claim:

```text
The fixed-operation runner exists.
ProofEvent v1 is fully wired into every existing runtime path.
The UI consumes ProofEvent v1 only.
zecsafe-proof-v1 exists.
make judge-proof exists.
A real FROST signature is bound to a Zcash PCZT/SIGHASH.
A signed/proven/combined funded PCZT exists.
Mainnet proof exists.
```

## Acceptance

- [x] Stage enum implemented.
- [x] FROST status vocabulary implemented.
- [x] Chain status vocabulary implemented.
- [x] Schema validation implemented.
- [x] Monotonic sequence validation implemented.
- [x] Reducer implemented: `events[] -> RunState`.
- [x] Local append-only NDJSON helper implemented.
- [x] Public-safe event projection implemented.
- [x] CLI consumes and prints RunState.
- [x] Replay consumes same events.
- [x] Secret/private public data fields rejected by tests.
- [x] `npm run check` passed.

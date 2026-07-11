# ZSAFE-P0-010 - Participant Availability and Signer Selection

Status: `ZSAFE-P0-010` complete.

Completed UTC: `2026-07-11T16:22:16Z`

## Scope

Build a deterministic participant availability and signer selection gate for the proof run.

This task makes one-participant unavailability a real input to the headless proof path and prevents ZecSafe from starting a FROST session when the selected signer set cannot satisfy threshold.

It does not create the real signing context, start a real FROST session, produce signing shares, sign a PCZT, prove a PCZT, combine a PCZT, broadcast, or create `zecsafe-proof-v1`.

## Implemented Module

```text
src/signer-selection-v1.mjs
```

Schema:

```text
zecsafe-signer-selection-v1
```

Primary APIs:

```js
selectSignersV1(input)
signerSelectionProofEvent(selection, options)
```

Input state:

```text
participant_id
public_fingerprint
availability: AVAILABLE | UNAVAILABLE | UNKNOWN
selected: boolean
```

The module also accepts `selected_participant_ids` for explicit headless selection.

## Implemented CLI

```text
scripts/signer-selection.mjs
npm run signers:select
```

Usage:

```bash
npm run signers:select -- --json selection.json --summary
```

The CLI exits:

```text
0 = SATISFIABLE
1 = invalid or malformed input
2 = UNSATISFIABLE or BLOCKED
```

## Fixed Runner Integration

`frost.session.status` is now implemented in:

```text
src/fixed-runner-v1.mjs
```

The operation calls `selectSignersV1()` and emits a `proof-event-v1` at stage:

```text
FROST_SESSION
```

Allowed public ProofEvent fields include:

```text
threshold
participant_total
unavailable_participant_count
selected_public_fingerprints
threshold_status
frost_status
group_fingerprint
limitations
```

## Proof Run Rule

For the current proof run:

```text
total participants: 3
threshold: 2
C availability: UNAVAILABLE
selected participants: A+B only
```

Critical rule enforced:

```text
An unavailable selected participant blocks the FROST session.
```

The selector never treats an unavailable selected participant as optional. If a participant is selected, that participant must be available for this gate to allow the session.

## Selection Behavior

The selector returns:

```text
SATISFIABLE
UNSATISFIABLE
BLOCKED
```

`SATISFIABLE` means:

```text
available_count >= threshold
selected_count >= threshold
no selected participant is UNAVAILABLE
no selected participant is UNKNOWN
```

`UNSATISFIABLE` means:

```text
available_count < threshold
or selected_count < threshold
```

`BLOCKED` means:

```text
the selected set includes an UNAVAILABLE or UNKNOWN participant
```

An explicitly empty selected set remains empty and fails threshold. Auto-selection only happens when no selected set is provided.

## Test Coverage

```text
scripts/signer-selection-v1.test.mjs
scripts/fixed-runner-v1.test.mjs
```

Coverage includes:

```text
0 available -> UNSATISFIABLE
1 available -> UNSATISFIABLE
2 available -> SATISFIABLE
3 available -> SATISFIABLE
selected set below threshold -> UNSATISFIABLE
explicit empty selected set -> UNSATISFIABLE
unavailable selected -> BLOCKED with warning
unknown selected -> BLOCKED with warning
A+B selected with C unavailable -> SATISFIABLE
auto-select A+B when no selection is provided
threshold greater than participant count rejected
duplicate participant IDs rejected
duplicate selected IDs rejected
CLI blocked summary
fixed-runner `frost.session.status` SATISFIABLE path
fixed-runner `frost.session.status` BLOCKED path
```

## Judge-Proof Impact

`ZSAFE-P0-010` creates the first public-safe FROST-session readiness event.

The immediate judge-proof value is:

```text
threshold status
participant total
unavailable participant count
selected public fingerprints
group fingerprint linkage
FROST session allowed/blocked status
```

This proves that the demo's unavailable third participant was not quietly included in the selected signing set.

## Public-Safe Evidence Emitted

The selector and fixed runner emit:

```text
schema version
run ID
group fingerprint
threshold
participant total
availability counts
selected public fingerprints
selection reference
FROST_SESSION ProofEvent v1
```

## Private Material Intentionally Excluded

This task does not commit, print, or publicly emit:

```text
participant secret configs
contact tokens
private share paths
wallet database
mnemonic
spending key
viewing key
raw PCZT body
raw signing context
nonces
signing randomizers
mainnet funding or broadcast material
```

## Negative/Tamper Case

The tests prove ZecSafe blocks or rejects:

```text
zero available participants
one available participant
explicit selected set below threshold
selected unavailable participant
selected unknown participant
threshold greater than participant count
duplicate participant IDs
duplicate selected IDs
```

## Claim Now Allowed

ZecSafe can accurately claim:

```text
It has a deterministic signer-selection gate that proves a 2-of-3 signer set is satisfiable with participant C unavailable, selects A+B only for the proof run, and blocks FROST session start when the selected set is below threshold or includes unavailable/unknown participants.
```

## Claim Still Forbidden

ZecSafe must not yet claim:

```text
The selected A+B participants completed a real FROST signing session.
The selected A+B participants reviewed the real signing context.
ZecSafe extracted a real PCZT SIGHASH.
ZecSafe used real signing randomizers safely.
ZecSafe signed, proved, combined, or broadcast a funded PCZT.
zecsafe-proof-v1 exists.
make judge-proof exists.
Mainnet proof exists.
```

## Acceptance

- [x] Participant availability state implemented.
- [x] `AVAILABLE`, `UNAVAILABLE`, and `UNKNOWN` states validated.
- [x] 3-participant, 2-threshold A+B selection supported.
- [x] C unavailable scenario passes with A+B selected.
- [x] Unavailable selected participant blocks session start.
- [x] Unknown selected participant blocks session start.
- [x] Selected set below threshold fails closed.
- [x] Explicit empty selected set fails closed.
- [x] Public selected fingerprints emitted.
- [x] ProofEvent v1 emitted at `FROST_SESSION`.
- [x] Fixed runner implements `frost.session.status`.
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

Focused result:

```text
ZecSafe signer selection tests passed.
ZecSafe fixed-operation runner tests passed.
```

Full command:

```bash
npm run check
```

Full result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe ProofEvent v1 tests passed.
ZecSafe fixed-operation runner tests passed.
ZecSafe signer selection tests passed.
ZecSafe security scan passed.
```

Exit code: `0`

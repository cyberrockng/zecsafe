> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-013 - A+B FROST Session

Status: `ZSAFE-P0-013` complete with PCZT input boundary.

Completed UTC: `2026-07-11T17:51:40Z`.

## Outcome

ZecSafe now has a headless FROST-session gate for the selected A+B signer set. It validates that threshold is satisfiable, selected signer reviews passed, the signing-context SIGHASH fingerprint matches the FROST session input fingerprint, and the aggregate signature evidence reports a 64-byte verified signature.

The fixed runner now implements:

```text
frost.session.start
```

The gate records:

```text
THRESHOLD_REACHED
AGGREGATE_SIGNATURE_VERIFIED
```

only when all public-safe prerequisites match.

## PCZT Input Boundary

The available external PCZT artifacts from `ZSAFE-P0-003` are transparent/unfunded boundary artifacts and produce zero shielded SIGHASH lines through the pinned `zcash-devtool pczt inspect` path.

Therefore the live FROST smoke in this task proves A+B can complete the FROST execution path with C offline, but it does not yet prove a transaction-completion-ready PCZT-bound signature. No funding, shielded PCZT creation, or broadcast was attempted.

## Files

```text
src/frost-session-v1.mjs
scripts/frost-session.mjs
scripts/frost-session-v1.test.mjs
src/fixed-runner-v1.mjs
src/proof-event-v1.mjs
scripts/verify.mjs
package.json
```

## CLI

```bash
npm run frost:session -- --json session-package.json --summary
```

Exit behavior:

```text
0 = threshold reached and aggregate signature verified
1 = invalid package or malformed JSON
2 = threshold unsatisfiable, blocked, or failed
```

## ProofEvent Evidence

`frost.session.start` emits a `FROST_SESSION` ProofEvent v1 with public-safe fields:

```text
threshold
participant_total
unavailable_participant_count
selected_public_fingerprints
group_fingerprint
session_fingerprint
pczt_fingerprint
binding_report_ref
sighash_fingerprint
threshold_status
frost_status
aggregate_signature_status
aggregate_signature_fingerprint
signature_byte_length
check_statuses
limitations
```

Raw shares, nonces, randomizers, raw SIGHASH, raw aggregate signature bytes, configs, keys, and logs are excluded.

## Live External Smoke

External run:

```text
$HOME/.zecsafe/runs/p0-013-20260711T174838Z
```

Pinned tool:

```text
frost-tools commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
```

Existing DKG group:

```text
public group key: 943022b2c25fe277b6f150c36b88af0e6dcc95e67422fc66fd561327083cb324
group fingerprint: sha256:74d814d1ee5114db18439b44bb3ccde50e6dd64952eda3675ac3797a117fefc3
threshold: 2
participant total: 3
unavailable participant: Eve
```

Selected public fingerprints:

```text
Alice: sha256:5acbfa31627023e0919067f6e7708f5d3b21a9be357dad615851830b89ed04db
Bob:   sha256:296bba404832fa3d613340d85813cd4cab99202524813335b1f298a41b42047a
```

Live smoke result:

```text
coordinator status: 0
alice status: 0
bob status: 0
eve started: false
private signing input bytes: 32
private signing input sha256: 014d8d2c20e1e41e1e012d562f3c0f70c773d559e491e9b57ee20075cb739e4a
aggregate signature bytes: 64
aggregate signature sha256: ba54761340ff4fe7a163cf4f1df6c015533a7e5a85044058cdb0d6e94c2f912d
```

The private signing input and raw aggregate signature remain outside the repository.

## Negative Coverage

```text
only A selected -> THRESHOLD: UNSATISFIABLE, FROST SESSION: NOT_STARTED
review blocked -> session BLOCKED
SIGHASH fingerprint mismatch -> session BLOCKED
aggregate signature byte-length mismatch -> aggregate signature FAIL
threshold greater than participant count -> rejected
raw signature/message fields excluded from public output
fixed-runner frost.session.start emits public-safe ProofEvent v1
```

## Judge-Proof Impact

This task adds a replayable public-safe FROST-session record to the proof path. It links signer selection, signer review, signing context fingerprint, selected public fingerprints, session fingerprint, and aggregate verification status.

## Public-Safe Evidence Emitted

```text
group fingerprint
threshold
participant total
selected public fingerprints
unavailable participant count
session fingerprint
SIGHASH fingerprint
aggregate signature fingerprint
signature byte length
threshold status
aggregate verification status
checked field statuses
FROST_SESSION ProofEvent v1
```

## Private Material Intentionally Excluded

```text
FROST participant configs
contact tokens
TLS private keys
signing shares
nonces
randomizers
raw SIGHASH
raw aggregate signature
raw PCZT
wallet database
spending keys
viewing keys
logs with protocol transcript material
```

## Claim Boundary

Allowed: ZecSafe has a fixed-runner FROST-session gate that can record public-safe threshold and aggregate-signature verification evidence, and the pinned DKG group completed a live A+B signing run with Eve offline.

Forbidden: ZecSafe has not yet produced a live aggregate signature over a real shielded PCZT SIGHASH, used that signature to complete a PCZT, proven/combined a funded PCZT, broadcast a transaction, created `zecsafe-proof-v1`, or implemented `make judge-proof`.

## Verification

Full verification passed:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe ProofEvent v1 tests passed.
ZecSafe fixed-operation runner tests passed.
ZecSafe signer selection tests passed.
ZecSafe signing-context preparation tests passed.
ZecSafe signer-review tests passed.
ZecSafe FROST session tests passed.
ZecSafe security scan passed.
```

## Acceptance Criteria

- [x] C unavailable is represented by selected A+B public fingerprints and unavailable count.
- [x] Threshold satisfiability is enforced.
- [x] Signer review PASS records are required.
- [x] Signing-context SIGHASH fingerprint is linked to FROST session evidence.
- [x] Session fingerprint emitted.
- [x] Aggregate signature status and 64-byte length are enforced.
- [x] One-signer negative proof emits `THRESHOLD: UNSATISFIABLE` and `FROST SESSION: NOT_STARTED`.
- [x] Live A+B FROST smoke produced a 64-byte aggregate signature with Eve offline.
- [x] Raw shares, nonces, randomizers, raw SIGHASH, and raw signature are excluded from public evidence.
- [x] `npm run check` passes.

Boundary not satisfied:

```text
The live signature is not yet over a real shielded PCZT SIGHASH because no such funded/shielded PCZT artifact exists in the current workspace.
```

> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-007 - Intent-to-PCZT Binding Firewall

Status: `ZSAFE-P0-007` complete.

Completed UTC: `2026-07-11T15:50:59Z`

## Scope

Build the first deterministic Binding Firewall between a reviewed `zecsafe-intent-v1` object and a structured PCZT review from the pinned inspect adapter.

This task makes signing eligibility depend on semantic agreement between:

- the human-reviewed intent;
- the PCZT fingerprint and inspect source;
- the PCZT network;
- the non-change recipient;
- the non-change amount;
- the fee policy;
- the memo policy where inspectable;
- unexpected output detection;
- explicitly modeled change output handling.

It does not create a PCZT, sign a PCZT, start FROST, broadcast a transaction, or build the final proof bundle.

## Implemented Module

```text
src/pczt-bind-v1.mjs
```

Report schema:

```text
zecsafe-binding-report-v1
```

Primary API:

```js
bindIntentToPcztV1({ intent, pcztReview, runId })
```

The result always includes:

```text
schema_version
run_id
intent_commitment
pczt_fingerprint
source_fingerprint
network_check
recipient_check
amount_check
fee_policy_check
memo_policy_check
unexpected_output_check
change_output_check
status
blocked_operations
limitation
checks
summary
```

## Implemented CLI

```text
scripts/pczt-bind.mjs
npm run pczt:bind
```

JSON mode:

```bash
npm run pczt:bind -- --intent <intent.json> --review <pczt-review.json> --run-id <run-id> --pretty
```

Summary mode:

```bash
npm run pczt:bind -- --intent <intent.json> --review <pczt-review.json> --run-id <run-id> --summary
```

Expected safety summary on mismatch:

```text
INTENT <-> PCZT: FAIL
FROST SESSION: BLOCKED
```

The actual CLI prints `INTENT ↔ PCZT` in the first line. The ASCII form above is only for this repo note.

Exit behavior:

```text
0 = binding PASS
1 = invalid input or malformed JSON
2 = binding FAIL and signing blocked
```

## Checks

The firewall currently checks:

```text
source                pinned inspect source/tool identity where present
network               exact match
recipient             exact single non-change recipient
amount                exact single non-change amount
fee_policy            observed fee <= reviewed maximum fee
memo_policy           exact when reported; empty-intent limited pass when not reported
unexpected_output     blocks unmodeled non-change outputs
change_output         permits only explicitly modeled change outputs
```

## Change Output Boundary

Current `zcash-devtool pczt inspect` output does not classify change outputs.

Therefore:

- a single unclassified output can match the reviewed recipient/amount;
- extra unclassified outputs are blocked;
- explicitly modeled `role: "change"` outputs can pass in synthetic/future review shapes;
- the report records a limitation when the adapter cannot classify change.

This avoids treating legitimate change as a public recipient while also refusing to silently accept unreviewed extra outputs.

## Memo Boundary

Current transparent inspect output does not report memo content.

Therefore:

- an empty reviewed memo can pass with a recorded limitation;
- a non-empty reviewed memo fails unless the PCZT review reports matching memo content;
- synthetic reported memo tests prove mismatch blocking where memo content is inspectable.

## Test Coverage

```text
scripts/pczt-bind-v1.test.mjs
```

Coverage includes:

```text
PASS report shape
amount mutation
recipient mutation
network mutation
extra recipient / unexpected output
memo mismatch where reported
fee-policy violation
explicitly modeled change output
CLI blocked summary
```

## Real Fixture Smoke

Ran the firewall against the external P0-003 manual transparent PCZT fixture and external inspect output.

External inputs stayed outside the repository:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
$HOME/.zecsafe/pczt-inspect/inspect-20260711T073416Z.txt
```

Matching reviewed intent result:

```text
PASS ALLOWED sha256:98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
```

The same smoke path first blocked when the reviewed recipient did not match, confirming the firewall does not pass by fingerprint alone.

## Judge-Proof Impact

`ZSAFE-P0-007` creates the first report object that can later become a `ProofEvent v1` event and a `zecsafe-proof-v1` field.

The key future judge-proof facts are:

```text
intent_commitment
pczt_fingerprint
source_fingerprint
field-level binding checks
overall PASS/FAIL
blocked operations
recorded limitations
```

## Public-Safe Evidence Emitted

The report emits only commitments, fingerprints, field-level statuses, blocker names, and limitation text.

Recipient values, memo values, raw PCZT bodies, raw inspect output, wallet paths, and private participant material are not needed in the public report.

## Private Material Intentionally Excluded

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was committed or copied into the repository.

The real fixture remains outside the repo.

## Negative/Tamper Case

The test suite blocks:

```text
amount mutation
recipient mutation
network mutation
extra recipient
memo mismatch where supported
fee-policy violation
```

On failure, the report includes:

```text
INTENT <-> PCZT: FAIL
FROST SESSION: BLOCKED
```

## Claim Now Allowed

ZecSafe can accurately claim:

```text
It has a deterministic headless Binding Firewall that compares zecsafe-intent-v1 against a structured PCZT review, emits a redacted report, and blocks signing/FROST/broadcast operations on mismatch.
```

## Claim Still Forbidden

ZecSafe must not yet claim:

```text
ProofEvent v1 exists.
The Binding Firewall is persisted in an append-only run log.
The Binding Firewall supports every PCZT shape.
The firewall independently verifies shielded memo content when the inspect source does not report it.
The firewall proves signer group membership.
A real FROST signature is bound to a Zcash PCZT/SIGHASH.
A signed/proven/combined funded PCZT exists.
make judge-proof exists.
Mainnet proof exists.
```

## Acceptance

- [x] Deterministic report shape implemented.
- [x] Redacted field-level checks implemented.
- [x] Signing/FROST/broadcast blockers emitted on FAIL.
- [x] Amount mutation blocked.
- [x] Recipient mutation blocked.
- [x] Network mutation blocked.
- [x] Extra recipient/unexpected output blocked.
- [x] Memo mismatch blocked where memo content is reported.
- [x] Fee-policy violation blocked.
- [x] Explicit modeled change output handled without being treated as an unreviewed recipient.
- [x] CLI summary emits the required FAIL/BLOCKED shape.
- [x] Real external fixture smoke produced PASS/ALLOWED for matching intent.
- [x] `npm run check` passed.

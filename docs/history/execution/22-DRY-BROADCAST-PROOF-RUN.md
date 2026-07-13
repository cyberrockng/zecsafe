> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-016 - Dry-Broadcast Proof Run

Status: `ZSAFE-P0-016` complete.

Completed UTC: `2026-07-11T22:54:50Z`.

## Outcome

ZecSafe now has a headless dry-broadcast proof-run command that exercises the public proof kernel without touching mainnet funds.

The command consumes the already-recorded P0-014 `zecsafe-proof-v1` fixture, verifies it first, emits the required PASS/WAIT sequence, and writes a public-safe dry-run fixture. It does not fund a wallet, does not use a wallet database or UFVK, and does not broadcast a Zcash transaction.

## Files

```text
src/proof-run-v1.mjs
scripts/proof-run-v1.test.mjs
scripts/zecsafe.mjs
scripts/verify.mjs
package.json
Makefile
fixtures/proof-runs/p0-016-dry-broadcast-proof-run.json
```

## Command

```bash
npm run proof:run -- --dry-broadcast --summary
make proof-run-dry
```

Exit behavior:

```text
0 = dry-broadcast proof run PASS with broadcast approval WAIT
1 = invalid CLI input or malformed proof-run request
2 = valid input but proof-run checks failed
```

## Dry-Run Fixture

```text
fixture: fixtures/proof-runs/p0-016-dry-broadcast-proof-run.json
schema: zecsafe-proof-run-v1
mode: dry-broadcast
status: PASS
recorded_at: 2026-07-11T22:52:30.000Z
proof_bundle_hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
proof_run_ref: sha256:dcfa154cd662bb4e23a85f8e5977caae82f394f695b169d65466e12fea6a8048
```

## Required Output

```text
[PASS] Toolchain pinned
[PASS] View-only wallet available
[PASS] Intent commitment created
[PASS] PCZT created
[PASS] Intent ↔ PCZT binding
[PASS] Participant C unavailable
[PASS] Threshold satisfiable 2/3
[PASS] A+B selected
[PASS] FROST threshold reached
[PASS] Aggregate signature verified
[PASS] Signed PCZT
[PASS] Proven PCZT
[PASS] Combined PCZT
[WAIT] Mainnet broadcast requires human approval
[PASS] Pre-broadcast proof generated
```

`View-only wallet available` means the public proof records that the prior P0-014 view-only wallet evidence existed. It is not a claim that P0-016 opened, funded, or exported a wallet.

## Judge-Proof Impact

This task proves the whole headless proof kernel reaches the plan-required pre-broadcast state before any mainnet funding. The dry-run output is deterministic, public-safe, and tied to the verified `zecsafe-proof-v1` bundle hash.

## Public-Safe Evidence Emitted

```text
dry-run schema version
dry-run mode
dry-run status
source proof run id
proof bundle hash
proof reference hash
toolchain commit fingerprints
intent commitment
PCZT fingerprints
binding report references
participant availability summary
selected signer labels and public fingerprints
FROST threshold status
aggregate signature fingerprint and byte length
signed/proven/combined PCZT statuses and fingerprints
offline extracted txid
explicit broadcast approval WAIT
proof-run reference hash
known limitations
```

## Private Material Intentionally Excluded

```text
mainnet wallet seed
spending key
UFVK or viewing keys
wallet database
recipient address
payment amount
memo text
raw PCZT bodies
raw SIGHASH
raw aggregate signature
FROST participant configs
FROST shares
nonces
randomizers
contact tokens
TLS private keys
protocol transcript logs
```

## Negative/Tamper Case

```text
source proof must verify before dry-run PASS
broadcasted transaction status -> rejected for dry-broadcast
unknown view-only wallet status -> rejected
wrong step sequence -> rejected by tests
missing mainnet approval WAIT -> rejected by tests
```

## Claim Now Allowed

```text
ZecSafe can run the complete headless dry-broadcast proof sequence through pre-broadcast proof generation, with mainnet broadcast held at explicit human approval WAIT.
```

## Claim Still Forbidden

```text
ZecSafe has not funded a dedicated mainnet demo wallet, has not broadcast a Zcash transaction, has not produced mainnet chain acceptance evidence, and has not produced the final mainnet judge fixture.
```

## Verification

```bash
npm run test:proof-run
npm run proof:run -- --dry-broadcast --summary
make proof-run-dry
npm run check
```

Result:

```text
ZecSafe proof-run v1 tests passed.
[PASS] Toolchain pinned
[PASS] View-only wallet available
[PASS] Intent commitment created
[PASS] PCZT created
[PASS] Intent ↔ PCZT binding
[PASS] Participant C unavailable
[PASS] Threshold satisfiable 2/3
[PASS] A+B selected
[PASS] FROST threshold reached
[PASS] Aggregate signature verified
[PASS] Signed PCZT
[PASS] Proven PCZT
[PASS] Combined PCZT
[WAIT] Mainnet broadcast requires human approval
[PASS] Pre-broadcast proof generated
ZecSafe security scan passed.
```

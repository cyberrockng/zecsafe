> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-015 - zecsafe-proof-v1

Status: `ZSAFE-P0-015` complete.

Completed UTC: `2026-07-11T22:35:59Z`.

## Outcome

ZecSafe now has a public `zecsafe-proof-v1` bundle format, deterministic bundle hash, verifier, tamper demo, JSON Schema documentation, trust model, and fixed-runner proof operations.

The P0-014 pre-broadcast proof fixture is:

```text
fixtures/proofs/p0-014-zecsafe-proof-v1.json
```

It verifies:

```text
bundle hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
network: test
FROST policy: 2 of 3
unavailable participants: 1
selected signers: 2
intent to PCZT: PASS
threshold reached: PASS
transaction txid: PRESENT
broadcast status: NOT_BROADCAST
```

## Files

```text
src/zecsafe-proof-v1.mjs
scripts/zecsafe.mjs
scripts/zecsafe-proof-v1.test.mjs
docs/proof/zecsafe-proof-v1.schema.json
docs/proof/TRUST_MODEL.md
PROOF_SPEC.md
Makefile
fixtures/proofs/p0-014-zecsafe-proof-v1.json
```

The fixed runner now implements:

```text
proof.generate
proof.verify
```

## Commands

```bash
npm run proof:generate -- p0-014-20260711T183213Z --txid 1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b --recorded-at 2026-07-11T19:30:00.000Z --zecsafe-commit 38c2464a8512dade6c5e11511ce81d2864896339 --out fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary
npm run proof:verify -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary
npm run proof:tamper -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary
make judge-proof
make judge-proof-tamper
```

## Verification Output

`make judge-proof`:

```text
Schema                       PASS
Bundle hash                  PASS
Network                      test
FROST policy                 2 of 3
Unavailable participants     1
Selected signers             2
Intent to PCZT               PASS
Threshold reached            PASS
Transaction txid             PRESENT
Recorded run integrity       PASS

VERDICT: VERIFIED RECORDED ZECSAFE PROOF
```

`make judge-proof-tamper`:

```text
txid                     REJECTED
threshold                REJECTED
group_fingerprint        REJECTED
selected_signer          REJECTED
intent_commitment        REJECTED
pczt_fingerprint         REJECTED
binding_status           REJECTED

VERDICT: TAMPER DETECTION PASS
```

## Judge-Proof Impact

This task creates the public artifact that the judge verifier consumes. A judge can now verify a recorded pre-broadcast proof without a wallet, without raw private run artifacts, without trusting the UI, and without rerunning the FROST ceremony.

## Public-Safe Evidence Emitted

```text
canonical proof hash
schema version
network
run id
ZecSafe commit
vault group fingerprint
threshold and participant count
available and unavailable counts
intent commitment
source/signed/proven/final PCZT fingerprints
binding report references
redacted binding check statuses
FROST session fingerprint
selected public signer fingerprints
aggregate signature fingerprint
signature byte length
offline extracted txid
broadcast status
toolchain commits
known limitations
verifier result
tamper rejection result
```

## Private Material Intentionally Excluded

```text
recipient address
payment amount
memo text
raw PCZT bodies
raw SIGHASH
raw aggregate signature
FROST participant configs
FROST shares
contact tokens
TLS private keys
wallet database
UFVK or viewing keys
spending keys
logs with protocol transcript material
```

## Negative/Tamper Case

Required semantic mutations reject:

```text
txid -> FAIL
threshold -> FAIL
group fingerprint -> FAIL
selected signer -> FAIL
intent commitment -> FAIL
PCZT fingerprint -> FAIL
binding status -> FAIL
```

The proof module also rejects unsupported top-level fields and public bundles that include private or policy-excluded material.

## Claim Now Allowed

```text
ZecSafe can generate and verify a public, tamper-evident zecsafe-proof-v1 bundle for the recorded P0-014 pre-broadcast proof, including canonical hash verification and semantic tamper rejection.
```

## Claim Still Forbidden

```text
ZecSafe has not broadcast this transaction, has not produced a mainnet spend, has not replaced the app UI/server proof-bundle route with zecsafe-proof-v1, and has not produced the final mainnet judge fixture.
```

## Verification

```bash
make judge-proof
make judge-proof-tamper
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
ZecSafe PCZT completion tests passed.
ZecSafe proof v1 tests passed.
ZecSafe security scan passed.
```

# ZecSafe Proof v1

`zecsafe-proof-v1` is the public proof artifact consumed by the judge verifier.

It records only public-safe commitments, fingerprints, status words, counts,
toolchain commits, transaction observation status, and explicit limitations.
It does not contain raw PCZT bodies, wallet data, participant configs, keys,
authorization bytes, recipient addresses, payment amounts, or memo text.

## Bundle Hash

The bundle hash is computed as:

```text
bundle_hash = SHA-256(canonical_json(proof_without_bundle_hash))
```

The canonical JSON implementation is the repository-local deterministic encoder
in `src/intent-v1.mjs`. It is deliberately constrained to ordinary JSON values
and safe integers. Object keys are sorted lexicographically, strings use JSON
escaping, arrays preserve order, and unsupported JavaScript values are rejected.

## Verifier Claim

When `zecsafe proof verify` returns `PASS`, ZecSafe may claim that:

```text
the recorded public bundle has not been semantically edited without changing
its canonical bundle hash, and its public fields consistently link the reviewed
intent commitment, PCZT fingerprints, FROST threshold status, completion status,
and transaction observation status.
```

## Non-Claims

The proof bundle does not prove:

```text
Zcash consensus exposes FROST provenance
production custody safety
network anonymity
independent signer geography
mainnet confirmation when the recorded status is NOT_BROADCAST
anything hidden in raw private run artifacts
```

## Commands

```bash
npm run proof:generate -- p0-014-20260711T183213Z --txid <64-hex-txid> --summary
npm run proof:verify -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary
make judge-proof
make judge-proof-tamper
```

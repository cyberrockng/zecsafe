# ZecSafe Proof v1

`zecsafe-proof-v1` is the public proof artifact consumed by the judge verifier.

It records only public-safe commitments, fingerprints, status words, counts,
toolchain commits, transaction observation status, and explicit limitations.
It does not contain raw PCZT bodies, wallet data, participant configs, keys,
authorization bytes, recipient addresses, payment amounts, or memo text.

`pczt.checks[].field` may contain status labels such as `recipient`, `amount`,
and `memo_policy`. Those labels are allowed only as Binding Firewall check
names; they are not recipient values, zatoshi amounts, or memo contents.

**ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling. The referenced NCC audit of the ZF FROST repository did not include rerandomized FROST. ZecSafe is not presented as audited production custody software.**

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
privacy-blind coordination
production custody safety
```

## ZIP 312 Privacy Boundary

ZecSafe does not claim that the coordinator is privacy-blind. In the ZIP 312
threat model, the coordinator is trusted with transaction privacy/unlinkability,
key-share holders are also trusted with privacy/unlinkability, share holders can
link a signing operation to a transaction, and network privacy is outside ZIP
312. ZecSafe does not remove those risks.

## Chain-State Truth

Proof status words use this mapping:

```text
broadcast command accepted/txid returned -> SUBMITTED
network observer sees transaction        -> OBSERVED
block inclusion recorded                 -> MINED
confirmation rule satisfied              -> CONFIRMED
broadcast/network rejection              -> REJECTED
observer unavailable                     -> UNKNOWN
```

UI timers are not proof of chain state.

## Commands

```bash
npm run proof:generate -- p0-014-20260711T183213Z --txid <64-hex-txid> --summary
npm run proof:verify -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary
make judge-proof
make judge-proof-tamper
make judge-proof-mainnet
make judge-proof-mainnet-tamper
npm run test:proof-data
```

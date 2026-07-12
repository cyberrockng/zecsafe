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

## Signer review mode

`frost.signer_review_mode` records the review the selected signers actually performed. It is a required field, so it sits **inside** the canonical bundle hash and cannot be altered without detection.

ZecSafe's recorded mainnet run used:

```text
signer_review_mode: semantic_pczt_review
```

This means each selected signer checked the PCZT's semantics and compared the prepared, pinned-tool SIGHASH fingerprint. **It does not mean the signer independently recomputed the SIGHASH from the PCZT bytes.** ZecSafe does not claim `independent_sighash`.

A bundle only records the mode when every review is bound to that run's group fingerprint, PCZT fingerprint, binding report, SIGHASH fingerprint, and intent commitment; when each reviewer is one of the selected signers; and when the number of passing reviews meets the threshold. An unbound or failed review cannot become recorded evidence.

## Binding Firewall and the FROST-key linkage

These are two different guarantees and must not be conflated.

The **Binding Firewall** is a *semantic* check: it compares the reviewed intent to the PCZT's contents (network, recipient, exact zatoshi amount, fee policy, memo policy, unexpected outputs, change output). A `binding_status: PASS` means the PCZT spends what the human reviewed.

The Binding Firewall does **not** prove that the FROST group key is the PCZT action's spend-authorization key. The pinned PCZT inspect path does not expose a FROST group fingerprint, so that linkage cannot be read from the binding report.

That linkage is established elsewhere, and it is real:

1. The pinned signer library verifies the aggregate signature against the PCZT action's **rerandomized verification key** when applying it. A signature from the wrong group fails at apply time.
2. Zcash consensus validates the shielded spend authorization normally. A transaction whose spend authorization did not correspond to the note's authorization key would be rejected by the network.

The recorded run's transaction was accepted and mined, so both hold. But a judge should understand that **a semantic Binding Firewall PASS is not, by itself, the cryptographic linkage** — the signer library and consensus are.

## Bundle reproducibility

Generation is deterministic. Given the same run artifacts and the same `--recorded-at`, `zecsafe proof generate` produces a byte-identical bundle, including `bundle_hash`. A regression test enforces this.

`--recorded-at` pins the completion ProofEvent's `occurred_at`. Without it the event would default to wall-clock `now()`, which flows into `completion_report_ref`, `proof_event_ref`, and therefore `bundle_hash` — and the bundle could not be reproduced from its own artifacts.

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
that signers independently recomputed the SIGHASH (the mode is semantic_pczt_review)
that the Binding Firewall alone proves the FROST-key to PCZT-authorization-key linkage
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

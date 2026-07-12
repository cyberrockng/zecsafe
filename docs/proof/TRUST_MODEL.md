# ZecSafe Proof Trust Model

`zecsafe-proof-v1` is tamper-evident, not tamper-proof.

ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling. The
referenced NCC audit of the ZF FROST repository did not include rerandomized
FROST. ZecSafe is not presented as audited production custody software.

The verifier trusts:

```text
the public proof JSON supplied to it
the repository verifier code
the documented canonicalization rule
the recorded toolchain commit fields as public claims
```

The verifier does not need:

```text
a wallet
a seed phrase
participant configs
FROST shares
raw PCZT bodies
raw signing material
UI state
network access for the pre-broadcast proof
```

## Coordinator and signer privacy

ZecSafe does not claim that the coordinator is blind to transaction details or linkage.

In the ZIP 312 threat model:

- the coordinator is trusted with transaction privacy and unlinkability;
- key-share holders are also trusted with transaction privacy and unlinkability;
- share holders can link a signing operation to a transaction;
- network privacy is outside ZIP 312;
- ZecSafe does not claim to remove these risks.

The public proof therefore records fingerprints, counts, status words, hashes,
and explicit limitations. It does not publish raw PCZT bodies, raw SIGHASH
bytes, signatures, randomizers, nonces, participant configs, wallet data, or
viewing keys.

For pre-broadcast P0 proof runs, `transaction.chain_status` may be
`NOT_BROADCAST`. Later mainnet tasks must replace that with a chain observation
record before claiming accepted mainnet execution.

Public bundles must not include raw private run logs. If private material is
needed for local reproduction, it stays under the external operator workspace
and is represented in the proof only by fingerprints or explicit limitations.

## What the signer review actually is

The recorded run's `signer_review_mode` is `semantic_pczt_review`, and this is
recorded inside the hash-covered proof bundle (`frost.signer_review_mode`).

Each selected signer checked the PCZT's semantics and compared the prepared,
pinned-tool SIGHASH fingerprint before authorizing. **A signer did not
independently recompute the SIGHASH from the PCZT bytes.** ZecSafe does not
claim `independent_sighash`.

The trust consequence: a signer who is shown a correct-looking semantic review
is trusting the pinned tool's SIGHASH derivation. A malicious coordinator
combined with a compromised pinned tool is therefore inside the trust boundary
for SIGHASH derivation, and the semantic review alone would not catch it. This
is a real limitation of the recorded run and is why the mode is published rather
than glossed.

## Binding Firewall vs the FROST-key linkage

The Binding Firewall proves that the PCZT spends **what the human reviewed**
(network, recipient, exact zatoshi amount, fee/memo policy, no unexpected
outputs). It is a semantic check.

It does **not** prove that the FROST group key is the PCZT action's
spend-authorization key. The pinned PCZT inspect path does not expose a FROST
group fingerprint, so that fact is not readable from the binding report.

That linkage is established by two other mechanisms:

1. the pinned signer library verifies the aggregate signature against the PCZT
   action's rerandomized verification key at apply time; and
2. Zcash consensus validates the shielded spend authorization normally, so an
   authorization that did not correspond to the note's key would be rejected.

Both held for the recorded run: the transaction was accepted and mined at height
3409837. A judge should nonetheless treat "Binding Firewall PASS" and "the FROST
group authorized this specific note" as two separate claims with two separate
sources of evidence.

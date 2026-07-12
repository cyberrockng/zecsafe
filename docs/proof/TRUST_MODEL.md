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

# ZecSafe Proof Trust Model

`zecsafe-proof-v1` is tamper-evident, not tamper-proof.

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

For pre-broadcast P0 proof runs, `transaction.chain_status` may be
`NOT_BROADCAST`. Later mainnet tasks must replace that with a chain observation
record before claiming accepted mainnet execution.

Public bundles must not include raw private run logs. If private material is
needed for local reproduction, it stays under the external operator workspace
and is represented in the proof only by fingerprints or explicit limitations.

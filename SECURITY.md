# Security

ZecSafe is a hackathon proof-of-concept. It is not audited production custody software and must not be used to secure real funds.

## Audit-scope caveat

**ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling. The referenced NCC audit of the ZF FROST repository did not include rerandomized FROST. ZecSafe is not presented as audited production custody software.**

## Secret boundary

Public repository files may contain:

- public proof fingerprints;
- public transaction id;
- public status words;
- public tool commit references;
- public-safe ProofEvent projections;
- documentation and screenshots.

Public repository files must not contain:

- seed phrases or spending keys;
- UFVK/FVK values;
- FROST signing shares;
- participant private configs;
- contact tokens or TLS private keys;
- raw PCZT bodies;
- raw SIGHASH bytes;
- raw aggregate signatures;
- Orchard action randomizers;
- nonces;
- wallet databases or private run logs.

The local security scan is:

```bash
npm run security:scan
```

The public proof data-classification test is:

```bash
npm run test:proof-data
```

## Coordinator privacy and ZIP 312 trust boundary

ZecSafe does not describe the coordinator as privacy-blind.

In the ZIP 312 threat model:

- the coordinator is trusted with transaction privacy and unlinkability;
- key-share holders are also trusted with transaction privacy and unlinkability;
- share holders can link a signing operation to a transaction;
- network privacy is outside ZIP 312;
- ZecSafe does not claim to remove these risks.

The public proof route therefore shows fingerprints and status labels only. Raw PCZT, raw signing material, shares, nonces, randomizers, viewing keys, and wallet data stay outside the public proof.

## FROST and chain provenance

Zcash validates the resulting spend authorization normally. FROST provenance is evidenced by the recorded ZecSafe/FROST signing session; the chain does not expose a special FROST marker.

## Runner boundary

The fixed runner is local-only and uses an operation allowlist. It rejects arbitrary binaries, path traversal, shell metacharacters, oversized or invalid run IDs, and non-local host execution. It redacts signing-secret-shaped output.

Coverage is in:

```bash
npm run test:runner
```

Covered classes include command injection, path traversal, arbitrary binary rejection, run-ID validation, local-only host enforcement, output redaction, and no-spawn behavior for rejected path payloads.

## Replay and substitution boundary

The proof verifier binds the public proof to:

- run ID;
- group fingerprint;
- PCZT fingerprints;
- selected signer set;
- intent commitment;
- txid;
- binding status.

Coverage is in:

```bash
npm run test:proof
make judge-proof-mainnet-tamper
```

Semantic mutations of txid, threshold, group fingerprint, selected signer, intent commitment, PCZT fingerprint, and binding status must fail.

## Mainnet chain-state truth

ZecSafe uses these status meanings:

```text
broadcast command accepted/txid returned -> SUBMITTED
network observer sees transaction        -> OBSERVED
block inclusion recorded                 -> MINED
confirmation rule satisfied              -> CONFIRMED
broadcast/network rejection              -> REJECTED
observer unavailable                     -> UNKNOWN
```

UI timers must not create mainnet truth. The W4 proof replay reducer tests assert that no txid, no chain observation, or no confirmation prevents broadcast success.

```bash
npm run test:demo-proof-state
```

## Vulnerability reporting

Open a private issue or contact the project maintainer before publishing details if a bug could expose keys, shares, private run material, or incorrect proof verification.

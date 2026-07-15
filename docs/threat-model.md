# Threat Model

ZecSafe is a hackathon proof-of-concept for threshold authorization of shielded Zcash.
Its current security goal is narrow: demonstrate and verify that a 2-of-3 FROST group
can authorize a reviewed shielded transaction while one participant is unavailable, and
that mismatched transaction semantics are blocked before signing.

## Assets

- Recorded public proof bundle: `fixtures/verified-mainnet-run/proof.json`.
- Public ProofEvent log: `fixtures/verified-mainnet-run/events.public.json`.
- Recorded FROST session evidence and artifact fingerprints.
- Intent commitment, PCZT fingerprints, signing-context fingerprint, and bundle hash.
- Private run artifacts outside Git, including wallet material, PCZT internals, signing
  shares, randomizers, and local operator configuration.

## What ZecSafe Demonstrates

- A real 2-of-3 FROST signing session completed with participant C unavailable.
- The selected signers were A and B, exactly meeting the threshold.
- The aggregate signature was applied through the pinned Zcash PCZT workflow.
- The resulting shielded transaction was human-approved once and confirmed on Zcash mainnet.
- A Binding Firewall checks reviewed intent against PCZT semantics before signing.
- A synthetic mismatch blocks signing before FROST starts.
- The public proof bundle is tamper-evident for the covered semantic fields.

## What ZecSafe Does Not Demonstrate

- Production custody readiness.
- Share repair, share refresh, recovery, group migration, or replacement of lost participants.
- Independent organizational/geographic signer distribution.
- A privacy-blind coordinator.
- A zero-knowledge proof.
- Chain-visible FROST provenance.
- A hosted wallet that can spend funds.

## Primary Threats

### Intent Substitution

An attacker may try to change recipient, amount, memo policy, network, or output structure
after review but before signing.

Mitigation: the Binding Firewall compares the reviewed intent commitment with PCZT semantics
and fails closed for covered mismatches. The demo includes a synthetic mismatch state that
blocks signing before any FROST round begins.

### Proof Tampering

An attacker may edit the public proof bundle, replace a txid, change threshold metadata,
swap signer fingerprints, or alter binding status.

Mitigation: `make judge-proof-mainnet` verifies the canonical bundle hash against an anchored
expected hash, and `make judge-proof-mainnet-tamper` demonstrates rejection of the covered
semantic mutations.

### False Mainnet Provenance

An attacker may paste in an unrelated transaction or claim a normal transaction proves FROST.

Mitigation: the proof records artifact fingerprints from intent through PCZT, FROST session,
aggregate signature, completed PCZT, extracted txid, and chain observation. The chain confirms
transaction existence; FROST provenance comes from the recorded session evidence, not from a
special chain marker.

### Secret Exposure

An attacker may look for wallet keys, spending keys, shares, randomizers, UFVK material, or
private PCZT internals in the public repository or proof bundle.

Mitigation: private run artifacts are excluded from Git. Public fixtures are tested by
`npm run test:proof-data` and scanned by `npm run security:scan`.

### Website Trust

The hosted site may be stale, compromised, unavailable, or different from the repository.

Mitigation: the repository remains the source of truth. Judges can clone the repo and run:

```bash
make judge-proof-mainnet
make judge-proof-mainnet-tamper
```

The browser verifier is useful evidence, but the CLI verifier and anchored bundle hash are
the submission-grade verification path.

## Privacy Boundaries

- The coordinator can see transaction details needed to construct and coordinate the signing
  workflow.
- Key-share holders can link a signing operation to a transaction.
- Network privacy is outside the scope of FROST and this prototype.
- The public proof is redacted and public-safe, but it is not zero-knowledge.
- Recipient, amount, memo, keys, shares, UFVK material, randomizers, and private PCZT internals
  are excluded from the public proof.

## Sensitive Data Rules

Never put these values in Git, the public proof bundle, screenshots, issue text, PR text, or
the hosted site:

- seed phrases;
- spending keys;
- FROST signing shares;
- rerandomizers or signing randomizers;
- UFVK/viewing-key material;
- private PCZT files or private PCZT internals;
- local wallet databases;
- RPC passwords or bearer tokens.

The public proof may include public fingerprints, public status labels, public commit refs,
and the confirmed txid. It must not include the underlying recipient, amount, memo, wallet
keys, shares, randomizers, or local operator secrets.

## Trust Boundaries

Browser:

- Renders the recorded proof and runs a client-side verifier.
- Must not be treated as a wallet or custody surface.

Local server:

- Serves the app, public fixtures, and read-only helper APIs.
- Must not store spending keys or signing shares.
- Must remain loopback-only for local use unless deliberately deployed as a static proof site.

Pinned upstream tooling:

- Performs FROST, RedPallas, Orchard PCZT signing, proving, combining, and extraction.
- ZecSafe does not implement custom cryptography.

Human operator:

- Approved the one recorded mainnet broadcast.
- Must approve any future broadcast separately; no automatic broadcast path is part of the
  hosted demo.

## Residual Risks

- Re-randomized FROST was not covered by the cited NCC audit of the ZF FROST repository.
- The pinned `frost-tools` and `zcash-devtool` are work-in-progress tools.
- Signer review mode is `semantic_pczt_review`; signers do not independently recompute the
  SIGHASH.
- The proof verifier checks integrity and internal consistency; it does not re-execute the
  historical FROST ceremony, regenerate the PCZT, or query the chain.
- A compromised threshold of future real signers could authorize spending.
- A malicious UI could misrepresent details unless signers review independently on trusted
  devices.

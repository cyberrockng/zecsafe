# FROST Integration

FROST is a threshold Schnorr signing protocol. ZecSafe uses the FROST model because a future Zcash vault should not depend on one device or one private key.

## Why ZecSafe Uses FROST

ZecSafe is designed around a 2-of-3 guardian policy:

- Alice Laptop
- Alice Phone
- Recovery Contact

In production, each guardian would hold a local encrypted key share. A payment or recovery proposal would become spendable only after enough guardians generate valid partial signatures.

## Current Prototype

The app currently implements:

- Real read-only Zcash mainnet checks.
- Real transaction proof lookup.
- Simulated guardian approval state.
- Simulated broadcast and recovery migration.
- A local FROST tooling adapter route that can run official demo binaries.

## Local FROST Adapter

The adapter script is:

```text
scripts/frost-demo.mjs
```

The backend route is:

```text
GET /api/frost-demo
```

The route runs the script as a child process and caches the JSON response in memory.

When `trusted-dealer`, `participant`, and `coordinator` from `frost-zcash-demo` are installed, `scripts/frost-demo.mjs` runs:

```text
scripts/frost-local-wrapper.mjs
```

The wrapper creates a fresh 2-of-3 FROST demo locally:

- `trusted-dealer` generates three key packages and the group public key package.
- Two `participant` processes generate round-1 commitments.
- `coordinator` creates the signing package.
- The two participants return round-2 signature shares.
- `coordinator` aggregates the final signature.

The wrapper returns only share fingerprints to the UI, not full secret shares.

You can override the built-in wrapper with:

```powershell
$env:FROST_DEMO_COMMAND="your-local-frost-demo-command"
```

The configured command should return JSON shaped like:

```json
{
  "groupPublicKey": "<hex>",
  "keyShares": ["<share1_hex>", "<share2_hex>", "<share3_hex>"],
  "signingRound1": { "commitment1": "<hex>", "commitment2": "<hex>" },
  "signingRound2": { "partialSig1": "<hex>", "partialSig2": "<hex>" },
  "aggregatedSignature": "<hex>",
  "verified": true
}
```

If the local tooling is missing, ZecSafe returns a safe unavailable state. It does not fake FROST cryptography.

## Production Integration Path

A production ZecSafe FROST layer would add:

- Distributed key generation or trusted-dealer setup.
- Local encrypted guardian share storage.
- Network communication between guardian devices.
- Proposal payload hashing and review on each guardian device.
- Real FROST partial signatures.
- Aggregated Zcash transaction signature.
- Mainnet broadcast only after full transaction construction and verification.

## References

- [Zcash Foundation FROST tooling](https://github.com/ZcashFoundation/frost-tools)
- [Zcash FROST demo CLIs](https://github.com/ZcashFoundation/frost-zcash-demo)
- [Zcash Foundation FROST book](https://frost.zfnd.org/)
- [ZecHub developer docs](https://zechub.wiki/developers)
- [Windows setup](frost-windows-setup.md)

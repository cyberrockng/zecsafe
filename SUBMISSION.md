# ZecSafe - ZecHub Hackathon 2026 Submission

Track: FROST
Team: [Your name / handle]
Date: July 2026

## What Was Built

ZecSafe is a Zcash mainnet safety vault proof-of-concept for reducing single-key failure. It combines live Zcash mainnet evidence, controlled transaction proof attachment, browser-side guardian signature acknowledgements, recovery hardening, and a documented path toward real Zcash FROST threshold signing.

The interface is organized around a Security Command Center, Evidence Center, Proposal Center, Guardian Center, Vault Policy, and Recovery Center so judges can quickly see what is live, what is simulated, and what production work remains.

## Mainnet Interactions

- `getblockchaininfo`
- `getblockcount`
- `getmempoolinfo`
- `getpeerinfo`
- `getaddressbalance`
- `getrawtransaction`
- `getblock`
- `z_getbalanceforviewingkey` when local zcashd wallet RPC is configured

## Real vs Simulated

| Feature | Status |
|---|---|
| Mainnet RPC reads | Real |
| Transparent address balance | Real |
| Transaction proof lookup | Real |
| Controlled mainnet proof attachment | Real, using externally broadcast txid |
| Proposal payload hash | Real |
| FROST local demo | Real local demo using `frost-zcash-demo` binaries against the active proposal payload hash |
| Guardian approval acknowledgement | Real local browser signatures over the proposal payload hash |
| Proof bundle | Real combined evidence bundle including guardian signatures |
| Transaction broadcast | External/manual in current build |
| Recovery migration | Simulated |
| Viewing-key balance | Real when local zcashd is configured; otherwise safe fallback |

## Production Boundary

Not live yet:

- In-app Zcash transaction construction and signing.
- Separate guardian devices producing FROST signatures from distributed shares.
- FROST signatures bound to a real Zcash spend transaction payload.
- Live recovery migration of real funds.
- Shielded viewing-key scanning without local wallet infrastructure.

These boundaries are also shown inside the app so the prototype does not overclaim.

## Recommended Demo Path

1. Evidence Center: show live mainnet status.
2. Address Balance: click `Check Mainnet`.
3. Proposal Center: sign with guardians and show verified approval signatures.
4. Transaction Proof: paste or check an externally broadcast mainnet txid.
5. FROST Live Demo: run local threshold-signing proof and show `Signature Verified`.
6. Proof Bundle: generate the combined evidence package with proposal hash, txid, confirmations, and guardian signatures.
7. Guardian Center: run a health check.
8. Recovery Center: show the protected 7-step recovery flow.
9. Production Boundary: explain what remains for production.

## Video Demo

[Link to video in Discord #zechub]

## Setup

See [README.md](README.md).

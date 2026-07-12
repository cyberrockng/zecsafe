# ZecSafe Demo

Hosted demo: <https://zecsafe.vercel.app/demo>

## Fast path

Open the proof-first route:

```text
http://127.0.0.1:4173/demo
```

The first screen should let a reviewer say the product in 30 seconds:

```text
ZECSAFE
Lose one key, not your ZEC.
A 2-of-3 FROST authorization control plane for shielded Zcash.
```

Use these controls:

1. `Replay Verified Mainnet Run`
2. `Verify Proof`
3. `Download Public Proof`
4. Binding Firewall mode: `PASS`
5. Binding Firewall mode: `Mismatch`

The mismatch mode must show:

```text
SAFETY TEST - NOT A BROADCAST TRANSACTION
```

and the signing control must be disabled.

## Local run

```bash
npm start
```

Then open:

```text
http://127.0.0.1:4173/demo
```

The server also serves the same app at:

```text
http://127.0.0.1:4173
```

## Judge proof commands

```bash
make judge-proof-mainnet
make judge-proof-mainnet-tamper
npm run test:demo-proof-state
npm run test:proof-data
npm run security:scan
```

Expected high-level result:

- `make judge-proof-mainnet` prints `VERDICT: VERIFIED RECORDED ZECSAFE PROOF`.
- `make judge-proof-mainnet-tamper` prints `VERDICT: TAMPER DETECTION PASS`.
- `npm run test:proof-data` confirms the public proof/event fixtures do not include policy-excluded secret or transaction-detail fields except documented status labels.

## What to show

1. Hero: `Lose one key, not your ZEC.`
2. Evidence strip: `ZCASH MAINNET`, `2 OF 3`, `FROST`, `1 UNAVAILABLE`, `PROOF VERIFIED`.
3. Participant panel: signer C unavailable, signers A+B selected.
4. Binding Firewall: field-level PASS checks.
5. Mismatch fixture: safety label and disabled signing control.
6. Proof route: run ID, timestamp, txid, chain status, threshold, signer fingerprints, commit refs, bundle hash.
7. Provenance note: Zcash validates the spend normally; FROST provenance is evidenced by recorded ZecSafe/FROST session data, not by a special chain marker.

## Recorded mainnet facts

```text
Run ID: p0-023-20260712T145358Z
Network: main
Txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Recorded status: CONFIRMED
Recorded height: 3409837
Confirmations at recording: 4
Bundle hash: sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
```

## Do not claim

- Do not claim Zcash consensus exposes a special FROST marker.
- Do not claim the hosted app can spend funds.
- Do not claim production custody readiness.
- Do not claim the coordinator is privacy-blind.
- Do not claim browser guardian acknowledgements are FROST spend signatures.

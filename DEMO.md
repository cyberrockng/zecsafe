# ZecSafe Demo

Deploy the current commit before recording from the hosted URLs. The local app now has a
product landing page and a dedicated proof page.

Hosted routes after deployment:

```text
https://zecsafe.vercel.app/        # product landing page
https://zecsafe.vercel.app/proof   # proof verifier and demo workflow
https://zecsafe.vercel.app/demo    # compatibility route; opens the proof page
```

Local routes:

```bash
npm start
```

```text
http://127.0.0.1:4173/
http://127.0.0.1:4173/proof
http://127.0.0.1:4173/demo
```

## Fast Path

Open `/proof` for recording the proof workflow. The page should show four proof steps:

1. **Review** — recorded intent commitment, PCZT fingerprint, network, and redaction boundary.
2. **Verify** — Binding Firewall checks in PASS mode, plus Mismatch mode.
3. **Authorize** — signer C unavailable; signers A and B satisfy the 2-of-3 threshold.
4. **Prove** — mainnet txid, recorded proof facts, proof verifier, public-proof download,
   and Tamper Lab.

Use these controls:

1. `PASS` mode in the Binding Firewall.
2. `Mismatch` mode in the Binding Firewall.
3. `Verify Proof`.
4. `Download Public Proof`.
5. Tamper Lab: `Verify recorded proof`, each attack preset, and `Edit the JSON yourself`.

The mismatch mode must show:

```text
SAFETY TEST - NOT A BROADCAST TRANSACTION
```

and the signing/proof export controls must be blocked.

## Judge Proof Commands

```bash
make proof-run-dry
make judge-proof-mainnet
make judge-proof-mainnet-tamper
npm run test:demo-proof-state
npm run test:proof-data
npm run security:scan
```

Expected high-level result:

- `make proof-run-dry` re-verifies the recorded gates and stops at the human broadcast gate.
- `make judge-proof-mainnet` prints `VERDICT: VERIFIED RECORDED ZECSAFE PROOF`.
- `make judge-proof-mainnet-tamper` prints `VERDICT: TAMPER DETECTION PASS`.
- `npm run test:proof-data` confirms the public proof/event fixtures do not include
  policy-excluded secret or transaction-detail fields except documented status labels.

## What To Show

1. Landing page: `Lose one key, not your ZEC.`
2. Product overview: 2-of-3 FROST authorization for shielded Zcash.
3. Proof page receipt: run ID, timestamp, txid, chain status, threshold, signer fingerprints,
   commit refs, and bundle hash.
4. Participant panel: signer C unavailable, signers A+B selected.
5. Binding Firewall: field-level PASS checks.
6. Mismatch fixture: safety label, blocked signing, no proof export.
7. Tamper Lab: recorded proof verifies; altered proof is rejected.
8. Provenance note: Zcash validates the spend normally; FROST provenance is evidenced by
   recorded ZecSafe/FROST session data, not by a special chain marker.

## Recorded Mainnet Facts

```text
Run ID: p0-023-20260712T145358Z
Network: main
Txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Recorded status: CONFIRMED
Recorded height: 3409837
Confirmations at recording: 4
Bundle hash: sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
```

## Do Not Claim

- Do not claim Zcash consensus exposes a special FROST marker.
- Do not claim the hosted app can spend funds.
- Do not claim production custody readiness.
- Do not claim the coordinator is privacy-blind.
- Do not claim browser acknowledgements are FROST spend signatures.
- Do not claim recovery, share repair, refresh, or group migration was demonstrated.

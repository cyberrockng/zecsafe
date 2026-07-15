# Submission Gate

Updated for the route-aware submission build on 2026-07-15.

## Current Verdict

```text
ENGINEERING / PROOF: PASS
LOCAL ROUTE BUILD:   PASS
HOSTED DEPLOYMENT:   PENDING APPROVAL
EXTERNAL SUBMISSION: PENDING HUMAN ACTION
```

The recorded FROST/PCZT/mainnet proof is verified. The remaining gates are not
cryptographic blockers; they are deployment, video, ZecHub PR, and Discord submission
actions.

## Rule Compliance

- [x] Zcash mainnet interaction proven
- [x] one final project
- [x] public repo package prepared
- [x] open-source license
- [x] setup docs
- [x] usage docs
- [x] mainnet explanation
- [x] working prototype
- [x] current screenshots regenerated
- [ ] current commit deployed to production
- [ ] short demo video recorded against the deployed current commit
- [ ] ZecHub PR prepared/created
- [ ] Discord package prepared/posted

## Differentiator 1 — Unavailable Signer

- [x] threshold 2-of-3
- [x] three distinct participant profiles
- [x] one participant unavailable
- [x] unavailable participant not selected
- [x] exactly two selected
- [x] real FROST rounds
- [x] threshold reached
- [x] aggregate signature verified
- [x] signature used in transaction completion

## Differentiator 2 — Binding Firewall

- [x] canonical reviewed intent
- [x] intent commitment
- [x] PCZT fingerprint
- [x] network check
- [x] recipient check
- [x] exact zatoshi amount check
- [x] unexpected-output check
- [x] memo/fee checks according to actual support
- [x] mismatch blocks signing
- [x] signer review mode truthfully recorded

## Differentiator 3 — Public Proof

- [x] `zecsafe-proof-v1`
- [x] JSON Schema
- [x] canonical bundle hash
- [x] public/private/secret classification
- [x] no secret in public fixture
- [x] verifier
- [x] `make judge-proof-mainnet`
- [x] tamper demo
- [x] verified recorded mainnet fixture
- [x] replay labeled recorded, not live

## Route Gate

Local source routes:

- [x] `/` product landing page
- [x] `/proof` proof workflow
- [x] `/how-it-works` architecture explanation
- [x] `/security` trust and limitation summary
- [x] `/docs` documentation hub
- [x] `/demo` compatibility route for the proof workflow

Hosted route gate:

- [ ] deploy current commit
- [ ] verify `https://zecsafe.vercel.app/`
- [ ] verify `https://zecsafe.vercel.app/proof`
- [ ] verify `https://zecsafe.vercel.app/demo`

Do not record the hosted multi-page flow until those hosted checks pass.

## Verification Results

Run before deployment and again before recording:

```bash
npm run check
make proof-run-dry
make judge-proof-mainnet
make judge-proof-mainnet-tamper
npm run screenshots
```

Expected proof verdicts:

```text
VERDICT: VERIFIED RECORDED ZECSAFE PROOF
VERDICT: TAMPER DETECTION PASS
```

## Manual Mainnet Proof

```text
Run ID: p0-023-20260712T145358Z
Network: main
Txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Recorded status: CONFIRMED
Recorded height: 3409837
Confirmations at recording: 4
Proof bundle: fixtures/verified-mainnet-run/proof.json
Bundle hash: sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
```

## Final Approval Gate

Ask for approval before moving to:

1. committing and pushing the route-aware submission build;
2. deploying the current commit to production;
3. recording the demo video from production;
4. opening the ZecHub PR;
5. posting the Discord submission.

# Submission Gate

Updated for the route-aware submission build on 2026-07-15.

## Current Verdict

```text
ENGINEERING / PROOF: PASS
LOCAL ROUTE BUILD:   PASS
HOSTED DEPLOYMENT:   PASS
EXTERNAL SUBMISSION: DISCORD POST PENDING
```

The recorded FROST/PCZT/mainnet proof is verified. The route-aware production
deployment has been verified. The demo video has been published, the ZecHub PR
has been opened, and the Discord post text has been prepared. The only remaining
gate is posting it in Discord.

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
- [x] current commit deployed to production
- [x] short demo video recorded and uploaded to YouTube
- [x] ZecHub PR prepared/created
- [x] Discord package prepared
- [ ] Discord post submitted

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

- [x] deploy current commit
- [x] verify `https://zecsafe.vercel.app/`
- [x] verify `https://zecsafe.vercel.app/proof`
- [x] verify `https://zecsafe.vercel.app/demo`
- [x] verify `https://zecsafe.vercel.app/how-it-works`
- [x] verify `https://zecsafe.vercel.app/security`
- [x] verify `https://zecsafe.vercel.app/docs`

The hosted multi-page flow has been recorded for submission.

## External Submission Links

- Demo video:
  `https://youtu.be/B16fPtEGfnY`
- YouTube title:
  `ZecSafe - Zcash Threshold Authorization Proof Demo`
- YouTube audience:
  `No, it's not made for kids`
- ZecHub PR: `https://github.com/ZecHub/zechub/pull/1843`
- ZecHub submission path: `Hackathon/2026/ZecSafe/README.md`
- Discord post text: `docs/discord-submission.md`

## Verification Results

Run before deployment and again before recording or final posting:

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

Video recording and ZecHub PR submission are complete. Ask for approval before
the remaining human-facing external step:

1. posting the Discord submission.

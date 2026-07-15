# ZecSafe Submission Plan

Use this as the live submission plan. The superseded prototype flow is no longer the product
narrative.

## One-line pitch

ZecSafe is a 2-of-3 FROST authorization control plane for shielded Zcash: one signer can be
unavailable, the transaction is checked before signing, and the recorded mainnet proof can be
verified by anyone.

## Submission story

1. **Availability:** signer C was unavailable, but signers A and B satisfied the 2-of-3 FROST
   threshold.
2. **Safety:** the Binding Firewall compared reviewed intent to PCZT semantics before FROST
   signing. A mismatch blocks signing before any FROST round begins.
3. **Mainnet evidence:** the recorded run produced a real shielded Zcash mainnet transaction:
   `27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527`.
4. **Public verification:** the proof bundle is hash-bound, browser-verifiable, and rejected by
   the tamper demo when covered semantic fields are changed.

## Demo flow

Record against the current commit and the current hosted app. Use `DEMO.md` and
`docs/demo-script.md` as the exact narration source.

1. Open the hosted app and lead with the product thesis: "Lose one key, not your ZEC."
2. Show the recorded mainnet receipt: run ID, txid, `CONFIRMED`, threshold, unavailable signer.
3. Run `make proof-run-dry` to re-verify every recorded gate up to the human broadcast gate.
4. On the proof page, show Review -> Verify -> Authorize -> Prove.
5. Toggle the Binding Firewall mismatch state and show that signing is blocked before FROST.
6. Run the browser verifier or Tamper Lab, then alter a covered field and show rejection.
7. Run `make judge-proof-mainnet` and `make judge-proof-mainnet-tamper` in the terminal.
8. Close with the limitations: hackathon proof-of-concept, not audited production custody
   software, no recovery/share-repair demo, and no chain-visible FROST marker.

## Required verification before recording

```bash
npm run check
make proof-run-dry
make judge-proof-mainnet
make judge-proof-mainnet-tamper
```

Expected verdicts:

```text
VERDICT: VERIFIED RECORDED ZECSAFE PROOF
VERDICT: TAMPER DETECTION PASS
```

## Submission package

- Public repository: `https://github.com/cyberrockng/zecsafe`
- Hosted landing page: `https://zecsafe.vercel.app/`
- Hosted proof page: `https://zecsafe.vercel.app/proof`
- Explorer link:
  `https://mainnet.zcashexplorer.app/transactions/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527`
- Proof bundle: `fixtures/verified-mainnet-run/proof.json`
- Public event log: `fixtures/verified-mainnet-run/events.public.json`
- Core submission text: `SUBMISSION.md`
- Demo script: `DEMO.md` and `docs/demo-script.md`
- PR checklist: `docs/pr-checklist.md`

## Final checklist

- [ ] Current working tree reviewed and intentional changes committed.
- [ ] `npm run check` passes.
- [ ] `make judge-proof-mainnet` passes with the anchored bundle hash.
- [ ] `make judge-proof-mainnet-tamper` rejects all covered semantic mutations.
- [ ] Screenshots are current after UI changes (`npm run screenshots`).
- [ ] Short demo video recorded against the current commit.
- [ ] Video link added to the ZecHub PR and Discord post.
- [ ] ZecHub PR opened for `Hackathon/2026/ZecSafe/`.
- [ ] Discord post includes repo, hosted demo, explorer, PR, and video links.

## Do not claim

- Do not claim the hosted app performs live signing or can spend funds.
- Do not claim Zcash consensus exposes a FROST marker.
- Do not claim the proof command re-executes the FROST ceremony or rebroadcasts.
- Do not claim production custody readiness.
- Do not claim recovery, share repair, refresh, or group migration was demonstrated.
- Do not claim the public proof is zero-knowledge; it is a redacted, tamper-evident evidence
  bundle.

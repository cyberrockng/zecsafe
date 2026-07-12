# ZecSafe Submission

## 1. Project

ZecSafe

## 2. Track

ZecHub / Zcash FROST and mainnet safety tooling.

## 3. One-line thesis

Lose one key, not your ZEC: a 2-of-3 FROST authorization control plane for shielded Zcash.

## 4. What it does

ZecSafe demonstrates a threshold-controlled Zcash safety workflow:

- one participant can be unavailable while a 2-of-3 FROST threshold remains satisfiable;
- a Binding Firewall compares reviewed intent to PCZT semantics before signing;
- a public proof route replays the recorded verified mainnet run;
- a verifier and tamper demo prove the public bundle has not been semantically edited.

## 5. How it uses Zcash mainnet

The recorded run used Zcash mainnet and produced a confirmed transaction:

```text
Run ID: p0-023-20260712T145358Z
Network: main
Txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Recorded status: CONFIRMED
Recorded height: 3409837
Confirmations at recording: 4
```

The app and proof commands distinguish recorded proof, current chain observation, and live/local execution.

## 6. The three differentiators

1. **Unavailable signer, threshold still works.** The recorded run selected exactly two available signers from a 2-of-3 group while one participant was unavailable.
2. **Binding Firewall.** Intent commitment, PCZT fingerprints, recipient/amount/network/memo/fee policy checks, and mismatch blocking are recorded.
3. **Public proof.** `zecsafe-proof-v1` includes a canonical bundle hash, JSON schema, verifier, tamper demo, public/private/secret classification, and a recorded mainnet fixture.

## 7. Verified mainnet proof

```text
Proof bundle: fixtures/verified-mainnet-run/proof.json
Public events: fixtures/verified-mainnet-run/events.public.json
Bundle hash: sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
```

The chain does not expose a special FROST marker. Zcash validates the resulting spend authorization normally. FROST provenance is evidenced by the recorded ZecSafe/FROST signing session.

## 8. Judge proof command

```bash
make judge-proof-mainnet
make judge-proof-mainnet-tamper
npm run test:proof-data
```

Expected verdicts:

```text
VERDICT: VERIFIED RECORDED ZECSAFE PROOF
VERDICT: TAMPER DETECTION PASS
ZecSafe public proof data-classification tests passed.
```

## 9. Demo

```bash
npm start        # http://127.0.0.1:4173/
```

The proof-first route is the default route. Four steps: Review, Verify, Authorize, Prove.

Demo script: `DEMO.md`

## 10. Source

```text
https://github.com/cyberrockng/zecsafe
```

## 11. License

MIT. See `LICENSE`.

## 12. Known limitations

ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling. The referenced NCC audit of the ZF FROST repository did not include rerandomized FROST. ZecSafe is not presented as audited production custody software.

Coordinator privacy/unlinkability, key-share-holder privacy/unlinkability, signer linkability, and network privacy limits are disclosed in `SECURITY.md`, `PRIVACY.md`, `PROOF_SPEC.md`, and `docs/proof/TRUST_MODEL.md`.

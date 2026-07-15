# Demo Script

Target length: ~3 minutes.
Record against the final committed and deployed submission commit. Two windows on
screen: a terminal in the repo root and the browser at the deployed proof page:
<https://zecsafe.vercel.app/proof>.

Do not record the hosted site until the current commit has been deployed. Every
claim in this script is backed by the recorded proof bundle. Do not improvise
claims — see "Do not claim" in `DEMO.md`.

The spine of the demo: **re-verify every gate of the process live, then show the
one time the final gate was opened on mainnet.**

## Scene 1 — Product Hook (0:00–0:20)

Browser: the landing page at `https://zecsafe.vercel.app/`.

Say:

> "ZecSafe: lose one key, not your ZEC. A 2-of-3 FROST authorization control
> plane for shielded Zcash. One signer can be unavailable, the transaction is
> checked before signing, and the public proof can be verified by anyone."

Click `Verify the mainnet proof` to open `/proof`.

## Scene 2 — Every gate of the process, re-verified live (0:20–1:10)

Switch to the terminal. Run, live on camera:

```bash
make proof-run-dry
```

Narrate the gates as they print (it takes seconds):

> "This re-executes every gate of the pipeline against the recorded run's
> evidence, recomputing the hashes right now. The transaction intent, the
> PCZT, the Binding Firewall — a field-level check that the transaction
> matches what was reviewed. One of the three signers was unavailable; the
> threshold was still satisfiable, so signers A and B were selected. The
> FROST 2-of-3 threshold and aggregate signature checks pass, and the PCZT
> was signed, proven, and combined — ready to broadcast. If any byte of this
> evidence had been altered, a gate would fail on screen right now."

Point at the last two lines:

> "And the final gate: **mainnet broadcast requires human approval.** That
> gate is deliberate — it *is* the product. Software prepares and proves;
> a human releases funds."

## Scene 3 — The one time the gate was opened (1:10–1:40)

Switch to the browser. Point at the receipt panel: run ID, UTC timestamp,
txid, `CONFIRMED`.

Open the txid on a public explorer in a new tab, live on camera:

```text
https://mainnet.zcashexplorer.app/transactions/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
```

(Blockchair works as an alternate but sometimes shows a bot-check
interstitial; zcashexplorer loads clean and shows the live confirmation count
and the shielded pools.)

Say:

> "We approved that final gate exactly once. This is the result: a real
> shielded transaction, confirmed on Zcash mainnet at block 3,409,837,
> authorized by the same 2-of-3 FROST process whose gates you just saw
> re-verified — with one
> signer unavailable. The chain is the witness."

## Scene 4 — What happens to a tampered transaction (1:40–2:10)

Scroll to Step 2 — Verify on the page. Show the field-level PASS grid, then
click the `Mismatch` toggle. Show:

- the `SAFETY TEST — NOT A BROADCAST TRANSACTION` banner,
- `Binding Firewall: FAIL — signing blocked before FROST`,
- the disabled signing control and "not contacted" signer pills.

Say:

> "What if someone swaps the recipient after review? The Binding Firewall
> catches the mismatch and blocks signing before any FROST round begins.
> No signer even gets contacted."

Click `PASS` to return.

## Scene 4b — Optional: let the judge attack the proof (adds ~20s)

Scroll to the Tamper Lab in Step 4 — Prove. Click `Verify recorded proof`
(shows `VERIFIED RECORDED ZECSAFE PROOF`, hash recomputed in the browser),
then click `Alter the txid`.

Say:

> "This page also lets *you* attack the proof. The verifier reruns in your
> browser — WebCrypto, client-side — over a local copy. One flipped character
> in the txid and the bundle hash gate fails. Try it yourself on the live
> page; you can even edit the JSON by hand."

## Scene 5 — Verify it yourself (2:10–2:40)

Terminal. Run, live on camera:

```bash
make judge-proof-mainnet
```

Show `VERDICT: VERIFIED RECORDED ZECSAFE PROOF`. Then:

```bash
make judge-proof-mainnet-tamper
```

Show `VERDICT: TAMPER DETECTION PASS`.

Say:

> "The public proof bundle is hash-bound. Clone the repo and run these two
> commands yourself: the first verifies the recorded mainnet run end to end;
> the second shows a single edited byte being detected. Don't trust — verify."

## Scene 6 — Honest close (2:40–3:00)

Browser, scrolled to the footer.

Say:

> "ZecSafe is a hackathon proof-of-concept built on re-randomized FROST
> tooling — not audited production custody software, and it says so on the
> page. What you saw is the FROST-track claim: threshold authorization
> of shielded ZEC, a safety gate in front of signing, a human gate in front
> of broadcast, and a mainnet proof anyone can check. Repo and demo links
> below."

## Recording notes

- 1080p or higher; record scene by scene — cuts between scenes are fine.
- On WSL2, record with OBS (or any screen recorder) on the Windows host,
  capturing the browser and the terminal window.
- Dry-run `make proof-run-dry`, the Mismatch toggle, and the two judge
  commands once off camera so everything is warm.
- Upload unlisted to YouTube (or Loom), then link it in the Discord post and
  the ZecHub PR.

## Recorded mainnet facts (for reference on camera)

```text
Run ID: p0-023-20260712T145358Z
Network: main
Txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Recorded status: CONFIRMED
Recorded height: 3409837
Bundle hash: sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
```

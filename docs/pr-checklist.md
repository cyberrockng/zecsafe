# Pull Request Checklist

Use this before submitting to the ZecHub repository.

## Repository

- [ ] README explains the problem, solution, verification commands, limitations, and mainnet usage.
- [ ] MIT license file is present.
- [ ] The verified mainnet txid and explorer link are stated.
- [ ] Proof-of-concept limitations are clearly stated (rerandomized-FROST audit scope, recovery
      not demonstrated, self-send disclosure).
- [ ] Threat model and trust model are linked.
- [ ] Architecture document and diagram match the current product.
- [ ] Demo script matches the current app (no removed surfaces).
- [ ] Screenshots are current (`npm run screenshots`).

## Verification (run all; all must pass)

- [ ] `npm run check`
- [ ] `make judge-proof-mainnet` → `VERDICT: VERIFIED RECORDED ZECSAFE PROOF` (anchored hash PASS)
- [ ] `make judge-proof-mainnet-tamper` → `VERDICT: TAMPER DETECTION PASS`
- [ ] `make proof-run-dry` → all gates PASS, broadcast gate WAIT

## Live page

- [ ] Current commit has been deployed before recording.
- [ ] `https://zecsafe.vercel.app/` loads the product landing page.
- [ ] `https://zecsafe.vercel.app/proof` loads the proof workflow.
- [ ] `https://zecsafe.vercel.app/demo` remains a compatibility route for the proof workflow.

- [ ] Landing page explains the product without showing the full proof console first.
- [ ] Mismatch toggle shows the SAFETY TEST banner and disables the signing control.
- [ ] Tamper Lab: `Verify recorded proof` passes; every attack preset is rejected with the
      failing gate shown.
- [ ] Explorer and GitHub links work.
- [ ] No surface claims live signing or spendable funds.

## Submission

- [x] Short video demo recorded against the current commit:
      `https://github.com/cyberrockng/zecsafe/releases/download/zecsafe-demo-2026-07-15/zecsafe-demo-2026-07-15.webm`
- [x] Video link added to the ZecHub PR description.
- [x] Pull request opened against the ZecHub repository (`Hackathon/2026/ZecSafe/`):
      `https://github.com/ZecHub/zechub/pull/1843`
- [x] Discord `#zechub` message prepared with repo, live demo, explorer, PR, and video links:
      `docs/discord-submission.md`
- [ ] Discord `#zechub` message posted —
      before July 15, 2026 (UTC).

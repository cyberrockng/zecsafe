> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 02 — Hackathon Compliance

Official rules re-read at audit time: `https://zechub.wiki/hackathon` (retrieved 2026-07-12 UTC).

Confirmed requirements: Zcash mainnet interaction; one final project per team; clear setup and usage documentation; open-source licensing; respect for privacy/security/community guidelines; working prototype; video demonstration; posted to Zcash Global Discord with repo and demo links. **Deadline: July 15, 2026 UTC.** Track: FROST (threshold signing) — one of five tracks. Prize: 25 ZEC pool, public ZecHub DAO vote.

## ZAUD-100 — Mainnet rule: **PASS**

Not a generic status card and not an unrelated txid lookup. The transaction was created through the claimed ZecSafe/FROST path:

```text
Network:            main
Txid:               27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Broadcast response: send.out echoed the txid, exit 0 (p0-023, 2026-07-12T14:54:20Z)
Independent check:  Blockchair, retrieved 2026-07-12T20:5x UTC
                    → EXISTS, block height 3,409,837, 287 confirmations, shielded (no transparent in/out)
Proof-run linkage:  txid was extracted from the combined PCZT in p0-022 BEFORE broadcast (see 11-MAINNET-EVIDENCE-AUDIT.md)
```

## ZAUD-101 — Working prototype: **PASS**

Headless proof kernel runs without the UI (`make proof-run-dry` → 15 gates, all PASS/WAIT). Judge proof works from a fresh public clone. Replay route `/demo` serves and loads the tracked fixtures. See 17-TEST-AND-FAILURE-AUDIT.md.

## ZAUD-102 — Documentation: **PARTIAL → P0**

Setup, usage, architecture, proof specification, security, privacy, and limitations documents all exist and are substantive. **However, `README.md` — the primary documentation surface — describes the superseded prototype and directly contradicts the verified mainnet run.** See 06-STALE-SURFACE-DEMOLITION.md. Documentation exists but is not truthful about the current product.

## ZAUD-103 — Open-source licensing: **PASS**

`LICENSE` = MIT, "Copyright (c) 2026 ZecSafe contributors". Upstream pins (`docs/execution/05-TOOLCHAIN-PINS.md`) record licenses for every external source: ZF FROST (MIT OR Apache-2.0), frost-tools (MIT OR Apache-2.0), zcash-devtool (MIT OR Apache-2.0), ZIPs (MIT). The `patches/zcash-devtool` compatibility patch is recorded with its librustzcash rev.

## ZAUD-104 — Submission package: **FAIL (incomplete)**

| Item | Status |
|---|---|
| Public repository | PASS — `https://github.com/cyberrockng/zecsafe` is public and clonable |
| Demo video | **FAIL — does not exist.** `docs/execution/12-SUBMISSION-GATE.md` line 15 confirms it is outstanding. Mandatory rule. |
| ZecHub submission/PR | **FAIL — not created.** Outstanding per submission gate. |
| Discord post | **FAIL — not posted.** Outstanding per submission gate. |
| One final project | PASS |
| `SUBMISSION.md` repo link | **FAIL** — §10 still reads "Public repository URL to be added during the final human submission step" while the repository is already public. |

## Compliance matrix

| Requirement | Evidence | Status | Blocker |
|---|---|---|---|
| Mainnet interaction | txid 27d0e850…8527 @ height 3409837, independently confirmed | **PASS** | — |
| Working prototype | `make proof-run-dry`, `make judge-proof-mainnet` exit 0 from fresh clone | **PASS** | — |
| Setup docs | README/DEMO/PROOF_SPEC exist and commands execute | **PASS** | — |
| Usage docs | README present but describes superseded prototype | **FAIL** | **P0-01** |
| Open-source license | `LICENSE` MIT | **PASS** | — |
| Privacy/security guidelines | SECURITY.md, PRIVACY.md, TRUST_MODEL.md; no secrets leaked | **PASS** | — |
| Demo video | Does not exist | **FAIL** | **P0-05** |
| ZecHub submission | Not created | **FAIL** | **P0-06** |
| Discord post | Not posted | **FAIL** | **P0-06** |

Four mandatory rules unmet. Three of them (video, PR, Discord) require human/external action and cannot be performed by the auditor. One (usage docs truth) is a code/docs remediation.

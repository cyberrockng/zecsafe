# 11 — Mainnet Evidence Chain

## ZAUD-1200 — Transaction lineage: **COMPLETE — every arrow carries an artifact hash**

This is the strongest part of the project. The auditor independently recomputed each hash from the Level B artifacts and compared it against the **public** `proof.json`. All match.

```text
intent
  │  commitment sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
  ▼
PCZT (source)                          p0-020/artifacts/source-mainnet.pczt
  │  sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931   ✅ VERIFIED
  ▼
binding report (Firewall PASS)         p0-020/artifacts/binding-report.json
  │  sha256:0bd48dfdf1debdbe495f153341e24598bbbd09b79b490a586c218a0eb05cbcb4   ✅ VERIFIED (canonical)
  ▼
signing context / shielded SIGHASH     p0-021/artifacts/source.sighash.bin
  │  sha256:cd551487fcc14602d52789ccd77bc3443ec16665ec5792ffa50a943051c99928   ✅ VERIFIED
  ▼
FROST session (A+B, C unavailable)     p0-021/artifacts/frost-session-report.json
  │  session sha256:cd6d729fcccc48458027b584cbc32363b65c83a9c29e7d2c91e5f1211605d9f8
  │  status THRESHOLD_REACHED / AGGREGATE_SIGNATURE_VERIFIED
  ▼
aggregate signature (64 bytes)         p0-021/artifacts/aggregate-signature.raw
  │  sha256:c9b7508cd554dfa8de311cdaabd4518c19093c95da5761474808cf2c277f12ac   ✅ VERIFIED
  │  stat -c%s → 64 bytes                                                       ✅ VERIFIED
  ▼
signed PCZT                            p0-022/artifacts/signed.pczt
  │  sha256:df8cf3ad2fa7cfaa09def2756ba1995959fe9b70c0d5d98a9934cfd3e071b162   ✅ VERIFIED
  ▼
proven PCZT                            p0-022/artifacts/proven.pczt
  │  sha256:6b32eaa4f0fbd8abf862943cbabd77a46d2b3ab561038f4a8a617fb908235869   ✅ VERIFIED
  ▼
combined PCZT                          p0-022/artifacts/combined.pczt
  │  sha256:945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184   ✅ VERIFIED
  │  final binding report sha256:d309efc2…1145c2                               ✅ VERIFIED (canonical)
  ▼
extracted transaction                  p0-022/artifacts/extracted-tx.raw
  │  → 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
  │  *** EXTRACTED BEFORE BROADCAST — see below ***
  ▼
broadcast (human-approved)             p0-023/logs/send.out
  │  "Sending transaction..." → 27d0e850…8527      send exit: 0
  │  attempt 2026-07-12T14:53:58.727Z → 14:54:20.033Z
  ▼
txid  27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
  ▼
chain observation                      CONFIRMED, height 3,409,837
```

**No arrow is missing. There is no evidence gap.**

### The decisive link

`p0-022/artifacts/extracted-tx.raw` contains the txid `27d0e850…8527`, and p0-022 (completion) ran **before** p0-023 (broadcast). The transaction identity was therefore derived from the combined PCZT — the one containing the FROST aggregate signature — *prior to* any network interaction, and it matches the txid the network later accepted.

This closes the exact hole V3 §7 warns about:

> *"A transaction sent by an external wallet and pasted into ZecSafe does not satisfy the FROST proof."*

The txid was not pasted in. It was **computed out of the signed artifact**, then broadcast, then observed. A pasted-in txid cannot exhibit this property.

## ZAUD-1201 — Mainnet truth: **PASS**

| Check | Result |
|---|---|
| Network = main | **PASS** — `proof.json.network: "main"` |
| Txid format | **PASS** — 64 hex chars |
| Txid returned by actual broadcast | **PASS** — `send.out` echoed it, exit 0 |
| Observed by an independent supported observer | **PASS** — see ZAUD-1204 |
| Block inclusion | **PASS** — height 3,409,837 |
| Confirmations calculated correctly | **PASS** — see ZAUD-1202 |
| Timestamps UTC | **PASS** — all artifacts use UTC ISO-8601 |

## ZAUD-1202 — Chain status semantics: **PASS — exemplary**

The project defines its status vocabulary **in writing, before recording**, and refuses to record a status before its evidence exists. `p0-023/artifacts/confirmation-rule.txt`:

```text
SUBMITTED  = pinned `zcash-devtool pczt send` exited 0 and echoed the txid.
OBSERVED   = the transaction is visible to the supported mainnet observer
             (wallet light-client sync via zec.rocks lists the txid in `wallet list-tx`).
MINED      = `wallet list-tx` reports a mined height for the txid.
CONFIRMED  = observed chain tip height >= mined height + 2.
No status may be recorded before its evidence exists. A rejection is recorded as
CHAIN STATUS: REJECTED / PROOF RUN: FAILED AT BROADCAST.
```

Recorded result: `CONFIRMED at observed tip 3409840, mined height 3409837` → 3409840 ≥ 3409837 + 2. **The arithmetic is correct** and the recorded `confirmations_at_recording: 4` is consistent (tip − height + 1 = 4).

- txid returned ≠ automatically confirmed — **enforced by the rule above**.
- Observer offline → unknown — **enforced**; `UNKNOWN` is in the vocabulary.
- Rejected broadcast → rejected — **enforced**; the failure path is pre-specified.
- UI timers do not advance state — **PASS**; `/demo` state is reduced from the event log (`src/demo-proof-state.mjs`), not from a clock. Removing the confirmation event removes the confirmed state (`scripts/demo-proof-state.test.mjs`, green).

## ZAUD-1203 — FROST-provenance honesty: **PASS**

Required statement is present. `SUBMISSION.md:53`:

> *"The chain does not expose a special FROST marker. Zcash validates the resulting spend authorization normally. FROST provenance is evidenced by the recorded ZecSafe/FROST signing session."*

**No claim of chain-visible FROST provenance was found anywhere in the repository.** This is a trap many FROST submissions fall into; ZecSafe does not.

## ZAUD-1204 — Independent lookup: **PASS — CONFIRMED**

Performed by the auditor against a third-party explorer with no relationship to the project.

```text
Method:     Blockchair Zcash API (independent of ZecSafe, its RPC endpoint, and its wallet)
Retrieved:  2026-07-12, ~20:55 UTC
Txid:       27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527

Result:     EXISTS
Block height:   3,409,837          ← matches proof.json.observed_block_height EXACTLY
Confirmations:  287 (tip 3,410,124 at retrieval)
Time:           2026-07-12 14:54:27 UTC   ← consistent with send.out at 14:54:20Z
Size:           9,165 bytes
Structure:      shielded — no standard (transparent) inputs or outputs recorded
```

Three independent corroborations in one lookup:

1. **The transaction is real and mined at exactly the height the proof claims.**
2. **The timestamp is consistent** with the recorded broadcast (mined ~7 s after `send` returned).
3. **It is genuinely shielded** — zero transparent inputs/outputs. This independently corroborates the Orchard/shielded claim. A transparent transaction dressed up as a shielded one would be immediately visible here. It is not.

## Verdict

**REAL_MAINNET. Confirmed at Level A (public chain) and Level B (private artifact lineage).**

ZecSafe's central technical claim — *two FROST participants authorized the exact reviewed shielded Zcash transaction while a third was unavailable, and it reached mainnet* — is **TRUE, and independently verifiable**.

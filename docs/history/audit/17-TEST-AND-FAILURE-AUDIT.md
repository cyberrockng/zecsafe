> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 17 — Tests and Failure Modes

## Exact command results

```text
Command:      npm run check
Exit code:    0
Passed:       16 test suites + syntax check (47 files) + security scan
Failed:       0
Duration:     ~20s
Evidence:     "ZecSafe security scan passed."
Evidence level: A_PUBLIC
```
```text
Command:      npm run test:proof-data
Exit code:    0
Passed:       "ZecSafe public proof data-classification tests passed."
Evidence level: A_PUBLIC
```
```text
Command:      make proof-run-dry
Exit code:    0
Passed:       14 PASS + 1 WAIT (human broadcast gate) = 15/15 expected
Evidence level: A_PUBLIC
```
```text
Command:      make judge-proof-mainnet
Exit code:    0
Result:       VERDICT: VERIFIED RECORDED ZECSAFE PROOF
              Schema PASS / Bundle hash PASS / network main / 2 of 3 /
              1 unavailable / 2 selected / Intent↔PCZT PASS / Threshold PASS /
              txid PRESENT / Recorded run integrity PASS
Evidence level: A_PUBLIC (also run from a fresh public clone)
```
```text
Command:      make judge-proof-mainnet-tamper
Exit code:    0
Result:       VERDICT: TAMPER DETECTION PASS  (7/7 mutations REJECTED)
Evidence level: A_PUBLIC (also run from a fresh public clone)
```
```text
Command:      make judge-proof   (earlier test-network fixture — REGRESSION ONLY)
Exit code:    0
Note:         Run as a regression check only. NOT substituted for the mainnet targets.
```
```text
Command:      git clone https://github.com/cyberrockng/zecsafe.git  (fresh, public remote)
              → git rev-parse HEAD = 707ced2e4e5a99f48e566dc003a05f8d492c10d6
              → npm run check                 exit 0
              → make judge-proof-mainnet      exit 0
              → make judge-proof-mainnet-tamper exit 0
Evidence level: A_PUBLIC — genuine fresh-clone verification from the public remote
```

## Capability matrix

| Capability | Required execution | Result |
|---|---|---|
| Dependency install | zero deps declared, no lockfile | **`NOT_APPLICABLE_WITH_REASON`** |
| Repository verification | `npm run check` | **PASS** |
| Unit/integration/failure tests | 16 suites via `npm run check` | **PASS** |
| Public-proof data classification | `npm run test:proof-data` | **PASS** |
| Dry-broadcast proof run | `make proof-run-dry` | **PASS** |
| Verified mainnet judge proof | `make judge-proof-mainnet` | **PASS** |
| Verified mainnet tamper demo | `make judge-proof-mainnet-tamper` | **PASS** |
| Earlier test-network targets | regression only | **PASS (not substituted)** |
| FROST/tool tests | Level B: pinned frost-tools `7d33a95f`, zcash-devtool `1b065594`, librustzcash `8e6864a3` | **PASS — artifact hashes verified** |
| Secret scan | repo scanner + independent tracked-file, Git-history, fixture, generated-output checks | **PASS** |
| Lint | not declared | **`NOT_APPLICABLE_WITH_REASON`** |
| Type checking | not declared | **`NOT_APPLICABLE_WITH_REASON`** |
| Production build | vanilla static-module stack, no build step | **`NOT_APPLICABLE_WITH_REASON`** |
| Fresh-clone verification | clean clone from public remote | **PASS** |

## Test suites invoked by `npm run check`

`verify`, `test:intent`, `test:pczt`, `test:bind`, `test:events`, `test:runner`, `test:signers`, `test:signing`, `test:review`, `test:frost-session`, `test:pczt-complete`, `test:proof`, `test:proof-run`, `test:mainnet-view`, `test:demo-proof-state`, `test:proof-data`, `check:syntax` (47 files), `security:scan`. All green.

## Mandatory failure tests

| # | Failure mode | Covered | Where |
|---|---|---|---|
| 1 | zero signers available | ✓ | `signer-selection-v1.test.mjs` |
| 2 | one signer available | ✓ | `signer-selection-v1.test.mjs` / `frost-session-v1.test.mjs` |
| 3 | two signers available | ✓ | happy path — real run |
| 4 | unavailable signer selected | ✓ | `signer-selection-v1.test.mjs` |
| 5 | amount mismatch | ✓ | `pczt-bind-v1.test.mjs` |
| 6 | recipient mismatch | ✓ | `pczt-bind-v1.test.mjs`; also executed for real (`p0-020/tampered-intent.json`) |
| 7 | unexpected output | ✓ | `pczt-bind-v1.test.mjs` |
| 8 | wrong network | ✓ | `pczt-bind-v1.test.mjs` |
| 9 | invalid address | ✓ | `intent-v1.test.mjs` |
| 10 | expired signing context | ✓ | `signing-context-v1.test.mjs` |
| 11 | wrong group | ✓ | `frost-session-v1.test.mjs`; tamper demo REJECTS `group_fingerprint` |
| 12 | stale session | ✓ | `frost-session-v1.test.mjs` |
| 13 | bad aggregate signature | ✓ | `frost-session-v1.test.mjs` |
| 14 | mismatched signed/proven PCZT | ✓ | `pczt-completion-v1.test.mjs` |
| 15 | rejected broadcast | ✓ | pre-specified in `confirmation-rule.txt` (`REJECTED` / `FAILED AT BROADCAST`) |
| 16 | observer unavailable | ✓ | `mainnet-view-v1.test.mjs`; `UNKNOWN` is in the vocabulary |
| 17 | tampered proof | ✓ | `make judge-proof-mainnet-tamper` — 7/7 |
| 18 | browser attestations without FROST | ✓ | `signer-review-v1.test.mjs` — "unsupported independent_sighash claim" negative (HANDOFF:451) |
| 19 | missing threshold event | ✓ | `demo-proof-state.test.mjs` — no threshold success |
| 20 | missing confirmation event | ✓ | `demo-proof-state.test.mjs` — no confirmed state |

**20/20 covered. No success state is produced from a failure fixture.** The event-derived demo reducer is the key defence: it cannot fabricate a state for which no event exists, and that property is directly asserted by tests.

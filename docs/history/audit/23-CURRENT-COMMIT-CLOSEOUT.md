> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 23 — Current-Commit Closeout Audit

## Verdict

```text
RECORDED MAINNET FROST/PCZT PROOF: VERIFIED
CURRENT APPLICATION:               NO-GO PENDING REMEDIATION
HACKATHON SUBMISSION:              NO-GO — R-05 EXTERNAL EVIDENCE REQUIRED
AUDIT EXECUTION:                   COMPLETE FOR COMMIT c5d1750
```

The core result is genuine: two selected participants in a 2-of-3 rerandomized RedPallas FROST group authorized a real shielded Zcash transaction while one participant was unavailable. The proof bundle is tamper-evident, regenerates byte-for-byte from the frozen Level B artifacts, passes the public verifier and all seven tamper cases, and its txid is independently visible at block 3,409,837.

This is not yet a clean submission. The current mismatch demonstration mixes a synthetic failed replay with historical PASS/CONFIRMED evidence and initially continues to say `PROOF VERIFIED`; its download path can package the original proof and event log with the synthetic failed replay without labeling that replay as synthetic. That is a P1 product-truth defect and must be corrected before recording the video. Separately, the mandatory video, ZecHub PR, and Discord-post evidence remain R-05.

This report supersedes the *verdict* in `21-FINAL-AUDIT-REPORT.md` and the current-status summary in `22-STAGE-2-RETEST.md`; it does not rewrite their historical observations.

## 1. Immutable audit baseline

| Item | Value |
|---|---|
| Repository | `https://github.com/cyberrockng/zecsafe` |
| Branch | `main` |
| Audit target | `c5d1750941e89a146941a9a55455e736a69c35b2` |
| `origin/main` | same commit |
| Initial target worktree | clean |
| Fresh public clone | `/tmp/zecsafe-closeout-c5d1750-fresh`, clean, same commit |
| Audit UTC | 2026-07-12T22:53:38Z |
| Environment | WSL2 Linux 6.18.33.2 x86_64; Node 24.16.0; npm 11.13.0; rustc/cargo 1.96.0 |
| Browser | Chrome 149.0.7827.55, clean temporary profile, loopback only |
| V3 audit-plan SHA-256 | `6aae8c432326fad9282541e1d5b41d6eb4d0f59cbebd5506aae40f1fec1f8ddc` |
| Current CI | success at target commit; [run 29210798385](https://github.com/cyberrockng/zecsafe/actions/runs/29210798385) |

The only repository writes made by this closeout are this report and the new public-safe files under `docs/audit/evidence/closeout-c5d1750/`. No application, fixture, transaction, wallet, or pre-existing audit file was modified.

## 2. Evaluation of the prior audit execution

Claude's audit was substantive and found real defects. It correctly established the mainnet proof lineage, removed the misleading prototype, closed R-01 through R-04 and R-06 through R-10, hardened the server, disclosed the signer-review boundary, and found and fixed proof non-determinism. It was not a final audit of the current submission for four reasons:

1. `21-FINAL-AUDIT-REPORT.md` targeted dirty commit `707ced2`; `22-STAGE-2-RETEST.md` ended its engineering retest at `0af650f`. Neither was a full closeout of current commit `c5d1750`.
2. The upstream toolchain entries were hash checks plus narrow tests, not complete `--workspace` runs at all pinned checkouts.
3. The required official-source baseline, systematic accessibility checks, screenshot metadata check, and current server edge-case review were incomplete.
4. R-10's mismatch fix was unit-tested at reducer level but not reconciled across the fully rendered page and its exported artifact. The rendered contradiction recorded as CLOSE-001 remained.

Therefore the prior work was useful evidence, not a sufficient current-commit sign-off.

## 3. Evidence boundary

### Level A — public fresh-clone evidence: complete

A clean clone at the target commit passed all declared judge and repository commands. The public proof requires no wallet, funds, private PCZT, signing share, randomizer, mnemonic, UFVK, or RPC credential.

### Level B — privileged provenance evidence: complete

The redacted manifest at `$HOME/.zecsafe/audit/manifest-2026-07-12.json` hashes to:

```text
sha256:002000ab7c0c246b1d3c47bba27054088c3afb560def235d07609b546c417df5
```

Only public-safe classifications and hashes were inspected. No secret configuration, TLS material, wallet key, share, mnemonic, or rerandomizer value was read.

| Artifact | Recomputed SHA-256 |
|---|---|
| Source PCZT | `3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931` |
| SIGHASH | `cd551487fcc14602d52789ccd77bc3443ec16665ec5792ffa50a943051c99928` |
| 64-byte aggregate signature | `c9b7508cd554dfa8de311cdaabd4518c19093c95da5761474808cf2c277f12ac` |
| Signed PCZT | `df8cf3ad2fa7cfaa09def2756ba1995959fe9b70c0d5d98a9934cfd3e071b162` |
| Proven PCZT | `6b32eaa4f0fbd8abf862943cbabd77a46d2b3ab561038f4a8a617fb908235869` |
| Combined PCZT | `945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184` |

## 4. Official-source baseline

Sources were retrieved on 2026-07-12 UTC. Mutable repositories are identified by the HEAD observed during the audit.

| # | Official source | Audit use |
|---|---|---|
| 1 | [ZecHub Hackathon 3.0 rules](https://zechub.wiki/hackathon) | Mainnet, working prototype, documentation, video, GitHub/Discord submission, July 15, 2026 UTC deadline |
| 2 | [ZecHub 2026 submission directory](https://github.com/ZecHub/zechub/tree/main/Hackathon/2026) at `76d2655` | Current public submission index; only the placeholder was present |
| 3 | [ZecHub Developer Resources](https://github.com/ZecHub/zechub/blob/main/Hackathon/Developer%20Resources.md) | Official resource routing; it explicitly cautions that resource links can become stale |
| 4 | [ZIP 312](https://zips.z.cash/zip-0312) | Draft FROST/PCZT integration requirements and signer/coordinator privacy boundaries |
| 5 | [ZF FROST Book](https://frost.zfnd.org/) | Implementation status and audit-scope caveat; rerandomized FROST is outside the cited NCC scope |
| 6 | [FROST zcash-devtool tutorial](https://frost.zfnd.org/zcash/devtool-demo.html) | DKG/dealer, PCZT, signing, proving, combining, and broadcast workflow reference |
| 7 | [ZcashFoundation/frost](https://github.com/ZcashFoundation/frost) at `2016e44` | Pinned FROST implementation source |
| 8 | [ZcashFoundation/frost-tools](https://github.com/ZcashFoundation/frost-tools) at `7d33a95` | Pinned coordinator/participant and Zcash signing tools |
| 9 | [RFC 9591](https://www.rfc-editor.org/rfc/rfc9591.html) | Informational two-round FROST protocol and security considerations |
| 10 | [zcash/zcash-devtool](https://github.com/zcash/zcash-devtool), upstream `c8322f7`; project pin `1b06559` | PCZT prototyping tool and explicit pin drift |
| 11 | [ZIP 374](https://zips.z.cash/zip-0374) | Draft PCZT format, deterministic-conflict behavior, and privacy implications |
| 12 | [Zcash protocol specification](https://zips.z.cash/protocol/protocol.pdf), `v2026.7.0-33-gc55edc` | Current NU6.2 protocol baseline |

ZIP 312 and ZIP 374 are Drafts, and RFC 9591 is Informational rather than an Internet Standards Track specification. The report does not upgrade those statuses.

## 5. Exact verification results

### Current repository and fresh clone

| Command | Result |
|---|---|
| `npm run check` | exit 0 — 16 suites, syntax checks, security scan |
| `make judge-proof-mainnet` | exit 0 — `VERDICT: VERIFIED RECORDED ZECSAFE PROOF` |
| `make judge-proof-mainnet-tamper` | exit 0 — 7/7 mutations rejected |
| `make proof-run-dry` | exit 0 — 14 PASS; expected human broadcast gate WAIT |
| `make judge-proof` | exit 0 — regression fixture verified |

These commands also passed in the fresh clone at `c5d1750`.

### Pinned upstream toolchains

| Checkout | Pin | Command | Result |
|---|---|---|---|
| `ZcashFoundation/frost` | `2016e44ba4a4757a996300350063b937a2ad33e8` | `cargo test --locked --workspace` | exit 0; all unit, integration, interoperability, serialization, rerandomized, property, and doc-test binaries passed |
| `ZcashFoundation/frost-tools` | `7d33a95fecc91dacdb1503933e2bee43780d3293` | `cargo test --locked --workspace` | exit 0; 14 client unit, 5 frostd integration, 1 trusted-dealer journey, and 1 doctest passed; zero-test binaries compiled |
| `zcash/zcash-devtool` | `1b065594d958d1cad2deafe7cd2e2fcc2774c46c` | `cargo test --locked` | exit 0; this pinned workspace declares zero tests, so this is compile coverage only |
| `frost-rerandomized` | within `2016e44` | `cargo test --locked -p frost-rerandomized` | exit 0; crate declares zero direct tests, while workspace ciphersuite rerandomization tests passed |

The compatibility checkout was at the pinned devtool base with exactly the expected patch. Patch SHA-256 is `4a44cfc533dec72fb4e93bcbf81406260d4b3f6e77344b53035426ab297c7d8e`; reverse-apply validation passed. Compilation is real evidence, but the absence of devtool and direct rerandomized-crate tests remains an upstream coverage limitation.

## 6. Proof reproducibility and mainnet lineage

The deterministic regeneration command documented by the repository was run from the fresh clone against the redacted Level B inputs, writing only to `/tmp`. The result was byte-identical to the tracked proof:

```text
tracked proof file sha256:     3317b4cecf0cad0b7271a41feb457f4200e65dbc8b240c46d7e1def812033075
regenerated proof file sha256: 3317b4cecf0cad0b7271a41feb457f4200e65dbc8b240c46d7e1def812033075
cmp:                           identical
canonical bundle hash:         sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
```

The proof intentionally identifies recorded-run code commit `ad83269298b73396ac0f4b743c59301de77fe937`; the audit target is the later presentation/remediation commit `c5d1750`. This is recorded lineage, not a mismatch.

```text
intent 2bc6da15… → source PCZT 3823d5eb… → SIGHASH cd551487…
→ 2-of-3 FROST (A+B selected; C unavailable) → aggregate c9b7508c…
→ signed df8cf3ad… → proven 6b32eaa4… → combined 945ffd06…
→ txid 27d0e850…8527 → mainnet block 3,409,837
```

The txid is independently present on [Blockchair](https://blockchair.com/zcash/transaction/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527), timestamped 2026-07-12 14:54:27 UTC, 9,165 bytes, with zero transparent inputs and outputs. This corroborates existence, block height, and shielded transaction structure. It does not independently prove FROST provenance; that comes from the hashed run artifacts and pinned signer workflow.

## 7. Browser, accessibility, and responsive audit

Evidence: `evidence/closeout-c5d1750/ui-audit.json` and the five `ui-*.png` captures in the same directory.

### Passed

- Exact viewport captures at 1440×900, 1280×800, and 390×844 have zero horizontal overflow.
- The document has one H1 and one each of `header`, `nav`, `main`, and `footer`; headings and the four-step flow are understandable.
- All ten interactive elements have accessible names. Accessibility-tree inspection found no unnamed actionable nodes.
- Keyboard order reaches all four navigation links, replay, verifier, both mode buttons, and download. The browser focus outline is visible.
- Reduced-motion media query matches and no visible animated element remained in that mode.
- Missing and malformed fixtures fail closed into an error panel and do not display a confirmed state.
- Screenshots were manually inspected; only public proof material appears. All 12 current PNGs contain only `IHDR`, `IDAT`, and `IEND`, with no text, EXIF, or other metadata chunks. No stale screenshot filename remains.

### CLOSE-001 — mismatch mode is not a coherent proof state (P1, open)

Immediately after selecting `Mismatch`, the page simultaneously renders:

```text
recipient: FAIL
Signing Control Disabled
Binding Firewall: FAIL
PCZT completion: FAIL
Binding status: FAIL

but also:

PROOF VERIFIED
binding: PASS
final_binding: PASS
pczt_combine: PASS
broadcast_gate: PASS
FROST authorization: THRESHOLD_REACHED
Mainnet: CONFIRMED
```

The historical FROST/mainnet facts are valid for the recorded successful run, but the page places them in the same unqualified state model as the synthetic mismatch. Only after the user presses `Verify Proof` does the strip change to `PROOF BLOCKED`; the contradictory PASS rows remain. On 390px, the field list is long enough that the aggregate disabled result is separated from the first failing field.

The export path compounds the issue: `downloadPublicProof()` combines the original proof and original public event log with the synthetic failed `replay_state`, but exports no `mode`, `synthetic`, or `safety_test` field. The replay is therefore not derivable from the included event log and is not self-labeling outside the page.

Required resolution before video/submission:

1. On mode change, derive one explicit view model and make the aggregate verdict immediately `SAFETY TEST — BLOCKED`, never `PROOF VERIFIED`.
2. Separate immutable historical-run facts from synthetic counterfactual results; do not display historical PASS fields as if they describe the failed replay.
3. Disable download in mismatch mode, or export the mutated events plus explicit synthetic/test labeling and make the replay deterministically derivable from what is exported.
4. Add a rendered-DOM/export integration test, not only reducer assertions.

### CLOSE-004 — small accessibility gaps (P3, open)

The PASS/Mismatch toggle communicates selection only through a CSS class; both buttons lack `aria-pressed`. Hash navigation scrolls correctly (`#verify` top at 88px) but leaves focus on `BODY`, so screen-reader and keyboard focus does not follow the visual section. Use an actual radio/tab pattern or `aria-pressed`, and move focus to a focusable section heading after navigation.

## 8. Server and application security

Evidence: `evidence/closeout-c5d1750/server-audit.json`.

### Passed

- Listener is truly loopback-only at `127.0.0.1`.
- Static serving is allowlisted. `/.git/*`, `/server.mjs`, `/package.json`, historical internal docs, raw/encoded traversal, and NUL paths return 404.
- CSP, `nosniff`, `no-referrer`, and frame denial headers are present.
- API responses use `Cache-Control: no-store`.
- Malformed JSON and oversized request bodies return 400; wrong methods return 404.
- Current tree has no symlinks in served paths.
- No arbitrary shell-command endpoint or product-side transaction signing/broadcast was exercised.

### CLOSE-002 — outbound network calls have no effective abort deadline (P2, open)

The server configures inbound request/header timers, but its outbound RPC/explorer `fetch()` calls have no `AbortSignal`. A stalled upstream can therefore keep a handler alive beyond the intended 15-second request policy. Add a bounded abort controller to every outbound request and map timeout failures to an explicit 504/503 response.

### CLOSE-005 — intent endpoint does not enforce Origin or JSON content type (P3, open)

`POST /api/intent/create` accepts `text/plain` and a hostile `Origin` as readily as the normal JSON case. There is no permissive CORS response, and the endpoint is currently stateless and non-privileged, so this is not a demonstrated cross-origin data leak or transaction risk. Enforce `application/json` and a same-origin policy before adding any persistent or privileged operation.

### CLOSE-006 — allowlist is lexical, not realpath-contained (P3, open)

Static paths are allowlisted but not checked with `realpath()` containment. There are no current symlinks, so no file is exposed now; a future symlink placed under an allowed prefix could escape the intended root. Resolve both root and candidate and reject candidates outside the real root.

## 9. Architecture decision

```text
INCREMENTAL_EXTRACTION — no rewrite
```

Current sizes are `src/app.js` 447 lines, `src/styles.css` 3,802 lines, and `server.mjs` 553 lines. The JavaScript is much smaller than the removed prototype, but `renderApp()` still constructs the entire application in one template and current CSS retains a large legacy proposal/guardian/recovery selector inventory. CLOSE-001 demonstrates the practical consequence: reducer tests passed while cross-section rendered semantics and export behavior contradicted each other.

This is CLOSE-003 (P2, open): extract a proof/run view model, split four sections into pure render functions, add DOM-state/export integration tests for PASS/mismatch/error modes, then mechanically delete selectors with no current DOM consumer. A framework rewrite would add risk without addressing the missing state invariant.

## 10. Remediation reconciliation

| Finding | Current status | Closeout evidence |
|---|---|---|
| R-01 unrelated legacy proof endpoint/txid | RESOLVED | removed; endpoint 404; stale identifiers absent |
| R-02 contradictory prototype shell | RESOLVED | four-step proof-first default UI; no legacy browser-signature claim |
| R-03 README under/overclaims | RESOLVED | mainnet result, DKG, limits, and judge commands stated |
| R-04 dirty/undeclared submission commit | RESOLVED | target and `origin/main` are identical; fresh clone clean |
| R-05 video, ZecHub PR, Discord post | OPEN / EXTERNAL EVIDENCE REQUIRED | no ZecSafe PR found in ZecHub search; repository checklist remains unchecked for all three |
| R-06 signer review outside hash boundary | RESOLVED | required `frost.signer_review_mode` and review count in regenerated bundle |
| Reproducibility defect found during R-06 | RESOLVED | fresh regeneration byte-identical to tracked proof |
| R-07 key-linkage disclosure gap | RESOLVED | semantic Binding Firewall vs signer-library/consensus boundary documented |
| R-08 server exposure | RESOLVED | loopback, static allowlist, headers, traversal checks pass |
| R-09 internal context/local paths | RESOLVED | historical docs archived; product defaults portable |
| R-10 screenshots and CI Node matrix | RESOLVED as scoped | current screenshots replace stale set; Node 20/24 and judge targets in CI |
| CLOSE-001 mismatch page/export truth | OPEN P1 | newly discovered by current rendered-page closeout |

R-10's reducer bug fix is real: `recipient` now visibly becomes the only failed field-level intent check. CLOSE-001 is a separate integration defect in how that synthetic result is combined with historical proof state and export behavior.

## 11. Submission compliance

| Requirement | Status |
|---|---|
| Public open-source repository and license | PASS |
| Mainnet interaction | PASS |
| Working prototype and documentation | PASS, subject to CLOSE-001 remediation |
| Verifiable recorded proof | PASS |
| Current CI | PASS |
| Demo video | EXTERNAL EVIDENCE REQUIRED; repository gate unchecked |
| ZecHub PR/submission entry | FAIL at audit time; GitHub PR search returned no ZecSafe result |
| Discord post | EXTERNAL EVIDENCE REQUIRED; repository gate unchecked |

The official deadline is July 15, 2026 UTC. Absence of a public PR is directly observable. A private/unindexed video or Discord post cannot be disproved from the repository, so they are classified as external evidence required rather than asserted nonexistent.

## 12. Findings register and final gates

| ID | Severity | Status | Gate |
|---|---:|---|---|
| CLOSE-001 | P1 | OPEN | Fix before recording/submission |
| CLOSE-002 | P2 | OPEN | Fix before exposing beyond loopback; advisable before submission |
| CLOSE-003 | P2 | OPEN | Maintainability/test-coverage follow-up |
| CLOSE-004 | P3 | OPEN | Accessibility follow-up; advisable before submission |
| CLOSE-005 | P3 | OPEN | Hardening before privileged endpoint growth |
| CLOSE-006 | P3 | OPEN | Defense-in-depth follow-up |
| R-05 | P0 submission | OPEN | Video + ZecHub PR + Discord proof required |

### Technical answer

The recorded FROST/PCZT/mainnet claim is verified with both public and privileged provenance evidence. No evidence found suggests a fabricated transaction, substituted txid, custom cryptography, secret exposure, or fail-open signing path in the underlying proof kernel.

### Release answer

Do not record or submit the current page until CLOSE-001 is fixed and retested. After that, R-05 still requires human/external completion. CLOSE-002 through CLOSE-006 are real but do not invalidate the recorded cryptographic proof.

### Required retest after CLOSE-001

Run, from a clean clone of the remediation commit:

```text
npm run check
make judge-proof-mainnet
make judge-proof-mainnet-tamper
make proof-run-dry
```

Then repeat the 1440, 1280, and 390 browser states; assert mismatch mode is immediately and consistently BLOCKED; inspect the downloaded JSON for explicit synthetic labeling and event/replay consistency; rerun screenshot metadata/safety checks; and record the video only from that retested commit.

Machine-readable closeout facts are in `evidence/closeout-c5d1750/verification-evidence.json`. Browser, server, screenshot, and audit-harness evidence are adjacent and public-safe.

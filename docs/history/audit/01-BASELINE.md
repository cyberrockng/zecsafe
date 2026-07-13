> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 01 — Baseline

```text
Repository:                    ZecSafe
Remote:                        https://github.com/cyberrockng/zecsafe.git
Branch:                        main
Commit (audit target):         707ced2e4e5a99f48e566dc003a05f8d492c10d6
Working tree:                  DIRTY — 10 modified, 15 untracked (W4/W5 changes)
Audit started UTC:             2026-07-12T20:47:57Z
Auditor environment:           Linux 6.18.33.2-microsoft-standard-WSL2 (WSL2), x86_64
Node:                          v24.16.0
npm:                           11.13.0
rustc:                         1.96.0 (ac68faa20 2026-05-25)
cargo:                         1.96.0 (30a34c682 2026-05-25)
Live deployment:               NOT_DEPLOYED (local prototype; permitted by rules)
```

## Plan and contract hashes

```text
V3 execution plan:  %USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
V3 execution SHA-256: 9cb90348e16a94f6eb0a3c470033b824f77a957d17e9d3fd8f41054b55b232bc

V2 historical plan: %USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
V2 historical SHA-256: 535e0dab46f1a6f69b8ed3d5c0a869dc2acdb7589cde68d95db79ab6d24a1a1e

V3 audit contract:  %USERPROFILE%/Downloads/ZECSAFE_REPO_GROUNDED_FINAL_AUDIT_PLAN_V3.md
V3 audit SHA-256:   6aae8c432326fad9282541e1d5b41d6eb4d0f59cbebd5506aae40f1fec1f8ddc
```

## Commit lineage — VERIFIED

```text
Recorded-run commit:      ad83269298b73396ac0f4b743c59301de77fe937  ("Complete P0 proof kernel and mainnet funding gate")
Evidence-freeze commit:   0cd8aeb                                    ("Complete verified mainnet FROST run: P0-018 through P0-024")
Current HEAD:             707ced2e4e5a99f48e566dc003a05f8d492c10d6   ("Update HANDOFF baseline to the P0-018..024 freeze commit")
Declared submission commit: NOT YET DECLARED — working tree is dirty
```

`ad83269` is a direct ancestor of HEAD. `git log --oneline -- fixtures/verified-mainnet-run/` shows the fixture was introduced by `0cd8aeb` and has not been altered since. Lineage `recorded-run → freeze → HEAD` is **CONFIRMED** by Git history, not by explanation alone.

`proof.json` names `zecsafe_commit: ad83269…`, which is the commit the proof kernel executed from. The fixture was frozen one commit later. This is the expected and correct relationship.

## Working-tree state — BLOCKING FOR FINAL VERDICT

The audit target is a **dirty working tree**, not a commit:

```text
 M PROOF_SPEC.md          M README.md              M SUBMISSION.md
 M docs/proof/TRUST_MODEL.md  M docs/threat-model.md  M package.json
 M scripts/verify.mjs     M server.mjs             M src/app.js
 M src/styles.css
?? DEMO.md  ?? PRIVACY.md  ?? SECURITY.md  ?? docs/audit/
?? docs/execution/03-CLAIM-TO-CODE-MATRIX.md  ?? docs/execution/12-SUBMISSION-GATE.md
?? scripts/demo-proof-state.test.mjs  ?? scripts/proof-data-classification.test.mjs
?? src/demo-proof-state.mjs
```

Per V3 §6: *"The final audit target must be a commit, not an unnamed dirty working tree. A preliminary diagnostic audit may inspect a dirty tree, but it cannot issue `GO — SUBMISSION LOCK`."*

This audit therefore evaluates HEAD (`707ced2`) for fresh-clone/public evidence, and the dirty tree for implementation truth, and **cannot issue GO** until W4/W5 changes are committed and a submission commit is declared. This is a process gate, not a defect finding.

`git diff --check` returns clean (no whitespace errors). `NOT_DEPLOYED` is not a failure: the rules do not require hosting.

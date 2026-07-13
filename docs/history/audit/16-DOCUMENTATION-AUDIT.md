> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 16 — Documentation and Reproducibility Audit

## Document-by-document

| Document | Verdict | Note |
|---|---|---|
| `README.md` (372 lines) | **FAIL — P0** | Describes the superseded prototype. See below. |
| `SUBMISSION.md` (91) | **PASS, one defect** | Accurate, judge-first, correct differentiators, correct FROST-provenance honesty. §10 still says "Public repository URL to be added" while the repo is public. |
| `DEMO.md` (97) | **PASS** | Proof-first demo script. |
| `PROOF_SPEC.md` | **PASS, one gap** | Missing `signer_review_mode` disclosure (BIND-02). |
| `SECURITY.md` | **PASS, one gap** | Missing signer-review-mode and Binding-Firewall-linkage limits (BIND-01/02). |
| `PRIVACY.md` | **PASS** | Classification is correct and enforced by tests. |
| `docs/proof/TRUST_MODEL.md` | **PASS, one gap** | Same two gaps as above. |
| `docs/proof/zecsafe-proof-v1.schema.json` | **PASS** | Machine-readable, enforced. |
| `docs/execution/*` (31 files) | **PASS as historical evidence** | Substantive, dated, reproducible. Needs an index and a "historical" label. |
| `HANDOFF.md` (947) | **MOVE — P1** | Internal operating context at the public top level; contains local absolute paths. No secrets. |
| `docs/operator-notepad.md` | **REWRITE/DELETE — P1** | Stale "Winning Claim" for the prototype; instructs a demo path that contradicts `DEMO.md`. Publicly served. |
| `docs/roadmap.md` | **MOVE** | Not proof; dilutes first glance. |
| `LICENSE` | **PASS** | MIT. |

## README — required first-screen content

| Required | Present? |
|---|---|
| One-line thesis | ✗ — "safety vault… guardian cryptographic acknowledgements… recovery protection" |
| "Lose one key. Not your ZEC." | ✗ (appears only at line 84, inside the demo script) |
| 2-of-3 | ~ (buried in a feature list) |
| One unavailable participant | ✗ |
| Verified mainnet run + txid | ✗ — **the txid `27d0e850…8527` appears nowhere in README** |
| 60-second demo | ~ (Judge Demo Path at line 79 — good, but below a 78-line stale preamble) |
| One-command verifier | ~ (line 92, same problem) |
| Precise limitations | ✓ (line 7 — the NCC/rerandomized-FROST disclaimer is correct and prominent) |
| Must NOT lead with the old feature inventory | ✗ — **lines 23-45 are a 22-item legacy feature inventory** |

The README's "Real vs Simulated" table (lines 49-61) is now the most dangerous document in the repository. It states:

```text
| Transaction broadcast | External/manual in current build | ZecSafe verifies the txid but
                                                             does not broadcast or custody funds |
| Guardian approval acknowledgement | Real local browser crypto | ... ECDSA keys |
| Recovery migration | Simulated | No real fund movement |
```

Row 1 is **false** as of the verified run. The table was honest for the prototype and is now the project's own strongest argument against itself.

## Setup audit: **PASS**

A fresh reviewer can, from a clean public clone and with no secrets and no funds:

```bash
git clone https://github.com/cyberrockng/zecsafe.git && cd zecsafe
node --version          # v24.16.0 (CI pins 20; both work)
npm run check           # exit 0 — 16 test suites + syntax + security scan
npm run test:proof-data # exit 0
make proof-run-dry      # exit 0 — 15 gates, halts at human broadcast approval
make judge-proof-mainnet        # exit 0 — VERIFIED RECORDED ZECSAFE PROOF
make judge-proof-mainnet-tamper # exit 0 — TAMPER DETECTION PASS
```

**Every documented command in the V3 public audit command set was executed and passed.** No stale commands were found in the Makefile or `package.json`. No `npm install` is needed — and correctly so.

- Dependencies exist and install reproducibly → **`NOT_APPLICABLE_WITH_REASON`**: `package.json` declares zero `dependencies` and zero `devDependencies`; there is no lockfile because there is nothing to lock. Verified at the audit commit. This is a strength, not a gap: the runtime attack surface is the Node standard library.
- Verify proof → **PASS**
- Run tests → **PASS**
- Understand local FROST requirements → **PASS** (`docs/frost-integration.md`, `docs/execution/05-TOOLCHAIN-PINS.md`)
- Understand which steps require secrets/funds → **PASS**
- Avoid accidental mainnet broadcast → **PASS** — the kernel halts at `[WAIT] Mainnet broadcast requires human approval`; there is no auto-broadcast path.

## Required documentation hierarchy vs actual

```text
README.md              ✓ exists — CONTENT IS STALE (P0)
PROOF_SPEC.md          ✓
SECURITY.md            ✓
docs/proof/            ✓
docs/verify/           ✗ absent — verification is documented in README/SUBMISSION/Makefile instead.
                         NOT_APPLICABLE_WITH_REASON: the one-command verifier is discoverable and
                         works; a dedicated directory adds nothing before the deadline.
docs/history/          ✗ absent — execution docs live in docs/execution/ (acceptable; needs index + label)
SUBMISSION.md          ✓
```

## Screenshots

`docs/screenshots/` contains stale dashboard captures of the prototype. Per V3 they must be deleted and replaced with: first-glance homepage, four-step authorization, unavailable participant, Binding Firewall result, FROST completion, proof detail, and 390px mobile — **after** the stale-surface removal, since capturing them now would only immortalize the prototype. Fresh audit-time captures are at `docs/audit/evidence/ui-*.png`.

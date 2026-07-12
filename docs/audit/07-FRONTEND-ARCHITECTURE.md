# 07 — Frontend Architecture Audit (Monolith Risk)

```text
src/app.js      5,023 lines   (single module, mounted by index.html)
src/styles.css  3,912 lines
```

Recount confirmed against the audit tree; matches the V3 preliminary observation.

## Risk assessment

| Risk | Present? | Evidence |
|---|---|---|
| Mixed legacy and current product logic | **YES** | Legacy guardian/ECDSA/recovery/telemetry code sits in the same module as the proof-first `/demo` renderer |
| Accidental stale rendering | **YES** | 12 hash routes all live; legacy routes render from the same global state object |
| Difficult route removal | **YES** | `navGroups` (`:102-140`), `updateActiveNav` (`:3794`), the hash router (`:509`, `:3371`, `:5015`) and per-route renderers are interleaved across 5,000 lines |
| Duplicated copy | **YES** | Prototype boundary warnings repeat across routes |
| UI-only truth | **NO** | The proof path is event-derived — `src/demo-proof-state.mjs` reduces `ProofEvent v1`; state is not invented by the renderer |
| Regression risk | **YES** | Removing legacy routes touches shared state and shared render helpers |
| Poor testability | **PARTIAL** | `app.js` itself has no unit tests. But the proof-critical logic was **extracted** into `src/demo-proof-state.mjs`, which *is* tested (`scripts/demo-proof-state.test.mjs`, green) |
| Excessive global state | **YES** | Single mutable state object across all 12 routes |
| localStorage treated as authoritative proof | **NO** | `PROPOSALS_STORAGE_KEY` persists *proposals* (prototype workflow), not proof. Proof state derives from the tracked fixtures. |

## The one thing that saves this

V3 §"FRONTEND ARCHITECTURE AUDIT" states the hard requirement:

> *"the final implementation must not leave the proof-critical UI dependent on one untestable monolithic render function."*

**It does not.** The W4/W5 work already extracted `src/demo-proof-state.mjs` — a pure, dependency-free reducer over `ProofEvent v1` — with its own passing test suite that asserts state cannot be fabricated (remove the threshold event → no threshold success; remove txid → no broadcast success; remove confirmation → no confirmed state).

The proof is therefore **not** hostage to the monolith. `app.js` is a large legacy shell that *also* renders a correctly-architected proof view.

## Required decision

```text
INCREMENTAL_EXTRACTION
```

Not `REWRITE_FRONTEND_SHELL` — that is schedule suicide three days before a deadline, and it would risk the one part of the frontend that is already correct.
Not `NO_CHANGE_WITH_JUSTIFICATION` — the legacy routes are a P0 truth problem (see `06-STALE-SURFACE-DEMOLITION.md`), and deleting them *is* the remediation.

The extraction that matters is **subtractive**: removing the eight legacy routes removes the majority of `app.js` and the monolith risk with it. No framework migration is warranted or recommended.

## Minimum separation after remediation

Already separate (keep):
- proof fixture loader — `src/app.js:153-154, 3514-3515` (fetches tracked fixtures)
- demo state reducer — `src/demo-proof-state.mjs` ✅ tested

Should be separated during legacy removal:
- route definitions (currently `navGroups` inline at `:102-140`)
- copy/constants (currently interleaved; includes the stale `DEFAULT_PROOF_TXID` / `DEFAULT_TRANSPARENT_ADDRESS` that must be deleted outright)
- four-step authorization components (Review → Verify → Authorize → Prove)
- proof page
- semantic status components

## Note on CSS

`src/styles.css` at 3,912 lines is large but is not a correctness risk. **Do not hide stale content with CSS** (V3 §C) — the legacy routes must be removed from source, not display:none'd. No evidence of CSS-hiding was found; the stale routes are genuinely live.

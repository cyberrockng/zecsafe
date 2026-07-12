# 03 — V3 Execution-Plan Conformance

V3 is the declared execution contract. Files existing is not compliance; each item was audited independently.

## ZAUD-200 — The three protected differentiators

### Differentiator 1 — Failure-on-screen continuity proof: **PASS**

| Required | Result | Evidence |
|---|---|---|
| threshold = 2 | PASS | `proof.json.vault.threshold` |
| participants = 3 | PASS | `proof.json.vault.participants_total` |
| one participant genuinely unavailable | PASS | C = `UNAVAILABLE` in `selection-result.json`; Eve offline for the ceremony (HANDOFF:763) |
| unavailable participant not selected | PASS | C `selected: false`; C's fingerprint absent from `proof.json.frost.selected_signers` |
| two available participants selected | PASS | A + B, fingerprints match public bundle |
| real FROST rounds | PASS | `frost-session-report.json`, frost-tools `7d33a95f` |
| aggregate signature | PASS | 64 bytes, `AGGREGATE_SIGNATURE_VERIFIED` |
| aggregate used in transaction completion | PASS | applied via signer library → `signed.pczt` (`df8cf3ad…`) |
| mainnet transaction linked | PASS | txid extracted from combined PCZT pre-broadcast; confirmed at height 3,409,837 |

### Differentiator 2 — Intent-to-PCZT Binding Firewall: **PASS with disclosure gaps**

Deterministic intent, canonical commitment, PCZT fingerprint, network/recipient/exact-zatoshi checks, unexpected-output check, and mismatch-blocks-signing all PASS. `memo_policy: LIMITED` and `source: PASS` are honestly reported at actual support level rather than inflated.

Two gaps, both disclosure rather than implementation (see `10-PCZT-AND-BINDING-AUDIT.md`):
- **BIND-01 (P1):** FROST-group-to-PCZT-authorization-key linkage is real (signer library verifies against the action's rerandomized verification key at apply time; mainnet acceptance corroborates) but is *not* established by the Binding Firewall, and this distinction is buried in `limitations[4]`.
- **BIND-02 (P1):** signer-review mode is disclosed in `events.public.json` but is **absent from `proof.json`** and from `PROOF_SPEC.md` / `TRUST_MODEL.md` / `SECURITY.md` — i.e. outside the hash-covered boundary.

### Differentiator 3 — Privacy-preserving proof bundle + verifier: **PASS**

Formal schema, canonical bundle hash, public/private/secret classification (with a dedicated passing test suite), no secret in the public fixture, one-command verifier, tamper test, fixture generated from the real run, replay labelled recorded. All confirmed. See `12-PROOF-BUNDLE-AUDIT.md`.

## ZAUD-201 — Headless-before-UI compliance: **PASS**

`make proof-run-dry` (exit 0) reproduces the kernel with no UI:

```text
[PASS] Toolchain pinned              [PASS] FROST threshold reached
[PASS] View-only wallet available    [PASS] Aggregate signature verified
[PASS] Intent commitment created     [PASS] Signed PCZT
[PASS] PCZT created                  [PASS] Proven PCZT
[PASS] Intent ↔ PCZT binding         [PASS] Combined PCZT
[PASS] Participant C unavailable     [WAIT] Mainnet broadcast requires human approval
[PASS] Threshold satisfiable 2/3     [PASS] Pre-broadcast proof generated
[PASS] A+B selected
```

Every required headless state is reached. **The core proof does not exist only as UI animation.** The human broadcast gate is enforced in the kernel, not in the UI.

## ZAUD-202 — Scope discipline: **FAIL → P0**

This is where V3 conformance breaks down. The proof kernel obeys the contract; the product wrapped around it does not.

| Required | Result |
|---|---|
| generic telemetry is demoted | **FAIL** — persistent Security Command Center (mainnet/peers/mempool/balance) is the first thing on screen |
| simulated recovery is not primary | **FAIL** — Recovery Center is a primary nav item under GUARDIANS |
| legacy browser approvals are not called FROST | **FAIL** — 314 `guardian` references; browser ECDSA signatures gate a "readiness" score |
| primary navigation centers the proof | **FAIL** — the proof is 1 of 12 nav items; "FROST Live Demo" (a proposal-hash signature, not spend authorization) competes with it |
| no late speculative feature weakens reliability | PASS |

See `06-STALE-SURFACE-DEMOLITION.md`. This failure is what drives the overall NO-GO.

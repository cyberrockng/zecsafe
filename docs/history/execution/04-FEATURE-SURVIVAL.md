> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZecSafe Feature Survival Decision

Status: `ZSAFE-W0-005` complete.

Updated UTC: `2026-07-11T03:54:31Z`

## Objective

Prevent legacy dashboard breadth from diluting the FROST proof.

This file freezes what survives into the proof-first build. A feature survives only if it strengthens one of the three protected differentiators, satisfies a hackathon rule, or removes a blocker.

Protected differentiators:

1. failure-on-screen continuity;
2. intent-to-PCZT authorization binding;
3. privacy-preserving proof verification.

## Decision Vocabulary

`CORE`: Required for the winning proof path.

`SUPPORTING_PROOF`: Supports judge verification or required operational evidence, but is not itself the differentiator.

`EXPERIMENTAL`: May return after the core proof path works; not allowed to block W1/W2/W3.

`REFRAME`: Concept survives, but current UI/copy/implementation is the wrong abstraction.

`DEMOTE`: Keep only as hidden/supporting utility or internal operator aid.

`REMOVE`: Remove from the primary path and public claim surface.

## Target Primary Navigation Contract

The final primary navigation must not be a generic wallet dashboard. It should contain only proof-run surfaces:

```text
Run Dashboard          CORE / REFRAME from Vault Overview and Mainnet Proof Run
Intent Builder         CORE / REWRITE from Proposal Center
Signer Availability   REFRAME from Guardian Center
Proof Timeline         CORE / REWRITE from Audit Log
Evidence / Judge Proof SUPPORTING_PROOF / REWRITE from Evidence Center and proof bundle
FROST/PCZT Runner      CORE BLOCKER / REPLACE FROST Live Demo
Proof Docs             SUPPORTING / REWRITE How It Works and Threat Model
```

The following current routes must not remain in primary navigation for the final proof story:

```text
Recovery Center
Hidden Mainnet monitor
Hidden Shielded Sync
Standalone transparent balance lookup
Generic transaction lookup not linked to the recorded proof run
Static vault-balance dashboard cards
Old FROST roadmap pages/copy
```

W0-005 does not redesign the UI source. Source navigation should be changed when the ProofEvent v1 reducer and proof-run state exist, so the UI renders real proof state instead of renaming prototype screens.

## Survival Matrix - Frontend Routes

| Surface | Current entry | Decision | Primary final nav | Required action | Reason |
|---|---|---:|---:|---|---|
| Vault Overview | `#vault` | `REFRAME` | Yes, as Run Dashboard | Replace static vault balance and simulated readiness with ProofEvent-derived run state. | The dashboard concept survives only if it shows proof-run continuity, unavailable signer state, binding result, threshold status, and tx observation. |
| Vault Policy | `#vault-policy` | `SUPPORTING_PROOF` | No standalone route | Integrate policy into intent validation and Binding Firewall evidence. | Policy matters only when it gates deterministic intent and PCZT semantics. |
| Proposal Center | `#proposals` | `CORE` | Yes, as Intent Builder | Rewrite as `zecsafe-intent-v1` with integer zatoshis, strict schema, canonical hash, network, recipient, memo policy, expiry, and operation id. | Intent is the user-reviewed object that must bind to PCZT. |
| Audit Log | `#audit-log` | `CORE` | Yes, as Proof Timeline | Replace mutable in-memory events with ProofEvent v1 and a deterministic reducer. | The proof bundle must be derived from recorded events, not UI state. |
| Guardian Center | `#guardians` | `REFRAME` | Yes, as Signer Availability | Stop presenting browser ECDSA as share readiness. Reframe as participant availability and signer-side review attestation. | It supports failure-on-screen continuity only after backed by real FROST participant state. |
| Recovery Center | `#recovery` | `EXPERIMENTAL` / `DEMOTE` | No | Remove from primary path until real participant replacement/share refresh/vault migration exists. | Simulated recovery can distract from the main proof and is not required for FROST/mainnet proof. |
| Mainnet Proof Run | `#mainnet-proof-run` | `SUPPORTING_PROOF` / `REFRAME` | Yes, merged into Run Dashboard | Replace old readiness checklist with ProofEvent-derived run-state checks. | It should make the final proof easy to follow, not validate unrelated prototype evidence. |
| Evidence Center | `#evidence-center` | `SUPPORTING_PROOF` / `REFRAME` | Yes, as Evidence / Judge Proof | Render proof bundle hash, verifier result, tamper test, and redacted public evidence. | It is the judge-facing verification surface. |
| FROST Live Demo | `#frost-integration` | `CORE` / `REPLACE` | Yes, after replacement | Replace arbitrary-message demo with pinned official FROST/PCZT flow and public-safe event projection. | Real threshold authorization is a central blocker and differentiator. |
| How It Works | `#how-it-works` | `SUPPORTING_PROOF` / `REWRITE` | Yes, under Proof Docs | Rewrite around intent -> PCZT -> FROST -> mainnet -> verifier. | It helps judges retell the proof only if it matches the real architecture. |
| Threat Model | `#threat-model` | `SUPPORTING_PROOF` / `REWRITE` | Yes, under Proof Docs | Update after toolchain pins with PCZT, FROST, ZIP 312, privacy, redaction, and coordinator trust boundaries. | Honest limitations are part of the proof. |
| Mainnet monitor | `#mainnet` hidden route | `DEMOTE` | No | Keep as operator/debug chain observer only. | Chain status alone is generic telemetry and does not prove FROST provenance. |
| Transaction proof checker | `#transaction-proof` hidden route | `SUPPORTING_PROOF` / `DEMOTE` | No standalone route | Keep only when linked to the recorded proof run. | A supplied txid proves chain existence, not ZecSafe authorization. |
| Shielded Sync | `#shielded-sync` hidden route | `EXPERIMENTAL` / `DEMOTE` | No | Keep out of primary path unless W3 needs a local view-only proof with strict data classification. | Full viewing keys are sensitive wallet metadata. |

## Survival Matrix - Backend APIs

| Surface | Current route | Decision | Required action | Reason |
|---|---|---:|---|---|
| Health report | `GET /api/health` | `SUPPORTING_PROOF` | Keep, but report precise tool/run capability instead of route existence only. | Useful for judge and operator preflight. |
| Mainnet status | `GET /api/mainnet-status`, `GET /api/mainnet/status` | `SUPPORTING_PROOF` | Keep as chain observer. Demote mempool/peer counts from primary proof. | Needed to observe network and confirmations, not a differentiator. |
| Transparent address balance | `POST /api/mainnet/address-balance` | `DEMOTE` | Keep only as optional debug/supporting utility or remove from final primary flow. | Generic balance lookup is not FROST proof. |
| Transaction proof | `POST /api/transaction-proof` | `SUPPORTING_PROOF` | Keep for the recorded proof-run txid and disclose explorer/RPC trust. | Supports mainnet observation after real signing. |
| Viewing-key balance | `POST /api/viewing-key-balance` | `EXPERIMENTAL` / `DEMOTE` | Exclude from primary proof unless a strict local view-only wallet path is required. | Sensitive input boundary is not yet mature. |
| FROST demo adapter | `GET/POST /api/frost-demo` | `CORE` / `REPLACE` | Replace with fixed-operation runner around pinned official flow and public-safe events. | Current route is unavailable here and not PCZT/SIGHASH signing. |
| Proof bundle | `GET /api/proof-bundle` | `CORE` / `REWRITE` | Replace with `zecsafe-proof-v1`, JSON Schema, canonical bundle hash, verifier, and tamper test. | The current bundle is an evidence summary, not judge-verifiable proof. |

## Survival Matrix - Scripts and Tooling

| Surface | Current file | Decision | Required action | Reason |
|---|---|---:|---|---|
| Static verifier | `scripts/verify.mjs` | `SUPPORTING_PROOF` | Keep temporarily; add proof-kernel tests later. | Useful guard, but not behavioral proof. |
| Security scan | `scripts/security-scan.mjs` | `SUPPORTING_PROOF` | Keep and continue expanding for fixtures/runs. | Prevents leaking wallet and participant material. |
| FROST tool launcher | `scripts/frost-demo.mjs` | `CORE` / `REPLACE` | Replace with pinned W1/W2 commands and exact run-state events. | Tool availability alone is not proof. |
| Trusted-dealer wrapper | `scripts/frost-local-wrapper.mjs` | `REMOVE` from proof path / `REWRITE` if reused | Do not use as public proof surface unless reviewed and redacted. | It signs arbitrary messages and can expose round data. |
| Screenshot capture | `scripts/capture-screenshots.mjs` | `SUPPORTING_PROOF` | Keep for final proof UI after proof kernel exists. | Screenshots are presentation, not proof. |
| WSL RPC helper | `scripts/start-zecsafe-local-rpc.ps1` | `SUPPORTING_PROOF` / `DEMOTE` | Keep as local operator helper only. | Useful for read-only node access, not core architecture. |
| CI workflow | `.github/workflows/verify.yml` | `SUPPORTING_PROOF` | Keep and expand once proof tests exist. | Basic regression guard. |

## Remove From Primary Path

The following must not appear as primary proof claims:

- simulated broadcast;
- simulated recovery migration;
- browser ECDSA guardian signatures as FROST shares;
- arbitrary-message FROST signatures as Zcash spend authorization;
- transparent balance lookup as proof of vault safety;
- generic transaction lookup as proof of ZecSafe provenance;
- localStorage/sessionStorage as proof source of truth;
- static vault balance;
- future FROST roadmap copy.

## Core Rewrite Queue

The next implementation waves should prioritize this order:

1. Pin official FROST/PCZT toolchain.
2. Reproduce official 2-of-3 FROST signing externally.
3. Reproduce official PCZT/view-only flow externally.
4. Implement deterministic `zecsafe-intent-v1`.
5. Implement PCZT fingerprint and inspect adapter.
6. Implement Intent-to-PCZT Binding Firewall.
7. Implement ProofEvent v1 reducer.
8. Implement fixed-operation local runner.
9. Implement `zecsafe-proof-v1` bundle, verifier, and tamper test.
10. Only then rebuild the UI around recorded proof state.

## Acceptance

- [x] Every existing primary frontend route classified.
- [x] Hidden frontend routes classified.
- [x] Backend APIs classified.
- [x] Scripts and tooling classified.
- [x] Target primary navigation excludes features retained only because they exist.
- [x] Simulated recovery and legacy guardian signatures removed from the primary proof path.
- [x] No UI redesign started before the headless proof kernel exists.

> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 04 — Product Truth Map

Classification per V3 §9. One label each.

## Proof kernel (headless)

| Capability | Entry point | Classification | Evidence | Survival |
|---|---|---|---|---|
| Intent + canonical commitment | `src/intent-v1.mjs` | `REAL_LOCAL` | commitment `2bc6da15…`; tests green | **CORE** |
| PCZT inspection | `src/pczt-inspect-v1.mjs` | `REAL_LOCAL` | pinned zcash-devtool `1b065594` | **CORE** |
| Binding Firewall | `src/pczt-bind-v1.mjs` | `REAL_LOCAL` | binding report `0bd48dfd…`; fail-closed | **CORE** |
| Signer selection | `src/signer-selection-v1.mjs` | `REAL_LOCAL` | C excluded, A+B selected | **CORE** |
| Signing context / SIGHASH | `src/signing-context-v1.mjs` | `REAL_LOCAL` | sighash `cd551487…` | **CORE** |
| Signer review | `src/signer-review-v1.mjs` | `REAL_LOCAL` | mode `semantic_pczt_review` | **CORE** |
| FROST session | `src/frost-session-v1.mjs` | `REAL_LOCAL` | frost-tools `7d33a95f`; 64-byte aggregate | **CORE** |
| PCZT completion | `src/pczt-completion-v1.mjs` | `REAL_LOCAL` | signed/proven/combined verified | **CORE** |
| Proof events | `src/proof-event-v1.mjs` | `REAL_LOCAL` | ProofEvent v1 | **CORE** |
| Proof generate/verify | `src/zecsafe-proof-v1.mjs` | `REAL_LOCAL` | bundle hash `e90c3c46…` | **CORE** |
| Proof run orchestration | `src/proof-run-v1.mjs` | `REAL_LOCAL` | `make proof-run-dry` 15/15 | **CORE** |
| Mainnet observation | `src/mainnet-view-v1.mjs` | `REAL_READ_ONLY` | light-client via zec.rocks | **SUPPORTING_PROOF** |
| Verified mainnet fixture | `fixtures/verified-mainnet-run/` | `RECORDED_REAL_RUN` | txid confirmed @ 3,409,837 | **CORE** |
| Judge verifier + tamper | `make judge-proof-mainnet[-tamper]` | `REAL_LOCAL` | both exit 0 from fresh clone | **CORE** |

## Application / server surface

| Capability | Entry point | Classification | Survival |
|---|---|---|---|
| Proof-first demo replay | `/demo` | `RECORDED_REAL_RUN` | **CORE** |
| Intent creation | `POST /api/intent/create` | `REAL_LOCAL` | **CORE** |
| Health | `GET /api/health` | `REAL_LOCAL` | **KEEP** |
| Mainnet status (×2 duplicate routes) | `/api/mainnet/status`, `/api/mainnet-status` | `REAL_READ_ONLY` | **DEMOTE + MERGE** |
| Transparent address balance | `POST /api/mainnet/address-balance` | `REAL_READ_ONLY` | **REMOVE** — off-thesis |
| Viewing-key balance | `POST /api/viewing-key-balance` | `DEAD` / `FALLBACK` | **DELETE** — needs absent zcashd; invites UFVK paste |
| Transaction proof lookup | `POST /api/transaction-proof` | `REAL_READ_ONLY` | **DEMOTE** — this is the *old* proof story |
| FROST demo (proposal hash) | `/api/frost-demo` | `REAL_LOCAL`, **wrong message** | **REMOVE** — not spend authorization |
| Legacy proof bundle | `GET /api/proof-bundle` | `SIMULATED` (self-declared) | **DELETE — P0** |
| Browser guardian ECDSA signatures | `src/app.js` | `SIMULATED` (not FROST) | **REMOVE/REFRAME** |
| Recovery Center | `#recovery` | `SIMULATED` | **REMOVE from primary** |
| Vault Policy table | `#vault-policy` | `STATIC` | **REMOVE** |
| Audit Log | `#audit-log` | `REAL_LOCAL` (browser state) | **REFRAME** → ProofEvent timeline |
| Generic telemetry (peers/mempool) | Security Command Center | `REAL_READ_ONLY` | **DEMOTE** |

## Mandatory truth questions

1. **Does real FROST code execute?** — **YES.** Pinned frost-tools `7d33a95f`, real rounds, 64-byte rerandomized RedPallas aggregate.
2. **Are three distinct participant profiles present?** — **YES.** alice/bob/eve configs + contacts; three distinct public fingerprints.
3. **Are shares stored independently?** — **YES.** Per-participant configs, outside the repository, gitignored.
4. **Is the coordinator view-only?** — **YES.** UFVK-initialized wallet; no spending key or share in the coordinator workspace.
5. **Is a real PCZT created?** — **YES.** `source-mainnet.pczt`, `3823d5eb…`.
6. **Is the signing context derived from that PCZT?** — **YES.** SIGHASH `cd551487…` derived from it via the pinned path.
7. **Is the FROST aggregate used in the signed PCZT?** — **YES.** Applied by the signer library; `signed.pczt` = `df8cf3ad…`.
8. **Is the signed PCZT combined with a proven PCZT?** — **YES.** `combined.pczt` = `945ffd06…`.
9. **Is the broadcast txid from that exact combined transaction?** — **YES.** Extracted from the combined PCZT *before* broadcast; identical to the txid the network accepted.
10. **Can the proof bundle link the run without exposing secrets?** — **YES.** Zero secret values; data-classification tests green.
11. **Is replay sourced from a real mainnet run?** — **YES.** Tracked fixture from `p0-023`; labelled recorded, never live.
12. **Is recovery real, experimental, or simulated?** — **SIMULATED.** Not demonstrated. Must not appear in the primary experience.

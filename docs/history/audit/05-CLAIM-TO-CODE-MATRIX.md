> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 05 — Claim-to-Code Matrix

Status: `PROVEN` / `PARTIAL` / `EXPERIMENTAL` / `FALSE` / `STALE` / `UNKNOWN`.

---
```text
Claim ID:   CLAIM-01
Claim:      "2-of-3 FROST threshold; one participant unavailable, two still authorize"
Where:      SUBMISSION.md:19,41; proof.json; /demo
Impl:       src/signer-selection-v1.mjs, src/frost-session-v1.mjs; frost-tools 7d33a95f
Evidence:   selection-result.json (C UNAVAILABLE/selected:false); THRESHOLD_REACHED;
            64-byte aggregate AGGREGATE_SIGNATURE_VERIFIED
Status:     PROVEN
Wording:    Allowed as stated.
```
---
```text
Claim ID:   CLAIM-02
Claim:      "Verified mainnet run / confirmed Zcash mainnet transaction"
Where:      SUBMISSION.md:26-35; proof.json.transaction
Evidence:   txid 27d0e850…8527; independently confirmed on Blockchair at height 3,409,837,
            shielded, 2026-07-12 14:54:27 UTC
Status:     PROVEN
Wording:    Allowed. "CONFIRMED" is backed by a written, pre-specified confirmation rule.
```
---
```text
Claim ID:   CLAIM-03
Claim:      "ZecSafe verifies the txid but does not broadcast or custody funds" /
            "Transaction broadcast — External/manual in current build"
Where:      README.md:59  (and README:21 "Prepare a production path for FROST signing")
Impl:       CONTRADICTED. p0-023 broadcast a real shielded mainnet transaction spending
            real shielded funds, after explicit human approval.
Status:     FALSE  (stale — true of the old prototype, false of the current product)
Correction: Rewrite. The product DOES sign and broadcast, gated by human approval. This
            under-claim is the single most damaging line in the repository: it tells a judge
            the project did not do the very thing that wins the FROST track.
```
---
```text
Claim ID:   CLAIM-04
Claim:      "FROST Live Demo"
Where:      src/app.js (10×), README.md (3×), /api/frost-demo
Impl:       Real FROST signature over a *proposal payload hash* — an application-invented
            message. Not a Zcash shielded SIGHASH. Not spend authorization.
Status:     STALE / misleading by name
Correction: Remove. V3 automatic-P0 overclaim: presenting a non-spend-authorizing signature
            under the name "FROST" beside a genuine mainnet FROST run.
```
---
```text
Claim ID:   CLAIM-05
Claim:      "Guardian cryptographic acknowledgements" / guardian signatures imply readiness
Where:      README.md:5,33,56; src/app.js (314 "guardian" hits)
Impl:       Browser-generated ECDSA P-256 signatures over a proposal hash.
Status:     FALSE as authorization (they cannot authorize a Zcash spend)
Correction: Remove, or rename "Intent Review Attestation". Must never count toward the
            2-of-3 FROST threshold.
```
---
```text
Claim ID:   CLAIM-06
Claim:      "Recovery Center" / "recovery protection" as a product feature
Where:      README.md:5,41; src/app.js #recovery
Impl:       Simulated. No share repair, refresh, or group migration executed.
            README.md:60 already concedes "Recovery migration | Simulated".
Status:     SIMULATED
Correction: Remove from primary experience. Only the continuity claim is allowed:
            "The 2-of-3 threshold remains usable with one participant unavailable." (PROVEN)
```
---
```text
Claim ID:   CLAIM-07
Claim:      Group setup mode
Where:      README.md:55,251 describe `trusted-dealer` (of the OLD frost-zcash-demo wrapper)
Impl:       The REAL mainnet group used **DKG** (HANDOFF.md:146,544;
            docs/execution/09-DKG-FEASIBILITY.md).
Status:     STALE — and an UNDER-claim
Correction: State DKG. The pinned frost-tools README itself warns trusted-dealer is
            "tests-only and does not preserve all share-validation information". The project
            did the stronger thing and is failing to say so.
```
---
```text
Claim ID:   CLAIM-08
Claim:      Signer review is independent SIGHASH verification
Where:      NOT CLAIMED — and correctly so.
Impl:       signer_review_mode = semantic_pczt_review
Evidence:   events.public.json:69 explicitly states it "does not claim an independently
            rerun SIGHASH"
Status:     PROVEN (as an honest limitation)
Gap:        Absent from proof.json and from PROOF_SPEC/TRUST_MODEL/SECURITY → BIND-02 (P1).
```
---
```text
Claim ID:   CLAIM-09
Claim:      "tamper-evident" proof bundle
Where:      SUBMISSION.md:22,43
Impl:       Canonical bundle hash; 7/7 mutations REJECTED.
Status:     PROVEN
Wording:    "tamper-evident" is correct and is NOT overstated to "tamper-proof". Verified:
            zero occurrences of "tamper-proof" in the repository.
```
---
```text
Claim ID:   CLAIM-10
Claim:      Chain exposes FROST provenance
Where:      NOT CLAIMED.
Evidence:   SUBMISSION.md:53 states the opposite, correctly: "The chain does not expose a
            special FROST marker."
Status:     PROVEN (correct disclosure)
```
---
```text
Claim ID:   CLAIM-11
Claim:      "audited" / "production-ready" custody
Where:      NOT CLAIMED. README:7 and SUBMISSION:89 explicitly disclaim it and state the NCC
            audit of ZF FROST did NOT cover rerandomized FROST.
Status:     PROVEN (correct disclosure)
```
---
```text
Claim ID:   CLAIM-12
Claim:      package.json — "FROST-style Zcash safety vault prototype with read-only mainnet
            evidence"
Impl:       Two falsehoods: it IS FROST (not "FROST-style"), and the mainnet evidence is NOT
            read-only (a real transaction was signed and broadcast).
Status:     STALE
Correction: Rewrite.
```

## Automatic P0 overclaim check

| V3 automatic P0 | Present? |
|---|---|
| browser signatures called FROST | **YES — CLAIM-05 / CLAIM-04.** The UI presents browser ECDSA guardian signatures and a "FROST Live Demo" over a proposal hash. Neither is spend authorization. **P0.** |
| unrelated txid presented as FROST transaction | **YES — `/api/proof-bundle` embeds DEFAULT_PROOF_TXID `b138c395…` inside a "proof bundle". P0.** |
| replay presented as live | No — zero "live run/signing/broadcast" hits |
| `CONFIRMED` without confirmation evidence | No — pre-specified rule, arithmetic verified, independently corroborated |
| social recovery claimed without real recovery | No — recovery is conceded as simulated (but must leave primary nav) |
| production custody claimed | No — explicitly disclaimed |
| re-randomized FROST called fully audited | No — explicitly disclaimed |
| chain said to expose FROST provenance | No — explicitly disclaimed |
| coordinator called privacy-blind | No — coordinator visibility is disclosed |
| tamper-evident called tamper-proof | No |

**Two automatic P0 overclaims are present.** Both live in the stale UI/server surface, not in the proof kernel. Both are removals, not rewrites of evidence.

# 06 — Stale-Surface Demolition Audit

**Stage 1 note:** every "remove" / "rewrite" / "delete" below is a *required remediation decision and acceptance criterion*. No product file was modified by this audit.

## Verdict on the P0 truth-reconciliation gate

> *Does every public-facing surface describe the current verified mainnet FROST product, or is the project still presenting the older browser-guardian/read-only-monitor prototype?*

```text
NO-GO — PUBLIC PRODUCT TRUTH IS STALE
```

The proof kernel, fixture, verifier, and mainnet run are excellent and truthful. **The public product wrapped around them is not.** A judge landing on the README or the app root sees the superseded prototype.

## A. Stale-vocabulary scan (case-insensitive, tracked files)

| Term | Files | Hot spots |
|---|---|---|
| `guardian` | 8 | `src/app.js` ×314, `README.md` ×22 |
| `prototype` | 22 | `src/app.js` ×39, `README.md` ×7 |
| `simulated` | 12 | `src/app.js` ×13, `server.mjs` ×4 |
| `FROST Live Demo` | 8 | `src/app.js` ×10, `README.md` ×3 |
| `ECDSA` | 7 | `src/app.js` ×5, `README.md` ×1 |
| `Recovery Center` | 8 | `src/app.js` ×3, `README.md` ×4 |
| `Evidence Center` | 7 | `src/app.js` ×3, `README.md` ×4 |
| `Proposal Center` | 8 | `src/app.js` ×4, `README.md` ×5 |
| `Vault Policy` | 5 | `src/app.js` ×3, `README.md` ×7 |
| `does not broadcast` | 9 | `README.md` ×2, `src/app.js` ×1 |
| `production will` | 1 | `src/app.js` ×1 |
| `getaddressbalance` / `getmempoolinfo` / `getpeerinfo` | 8/7/7 | `server.mjs`, `src/app.js` |
| `zcashd` | 16 | docs + server |
| `roadmap` | 8 | `docs/roadmap.md`, `README.md` |

`paste txid` and `judge mode`: 0 hits.

## B/C. Classified findings

---
```text
Item ID:            STALE-001
File/route:         README.md:3-5, :21, :59
Exact text:         "guardian cryptographic acknowledgements ... Prepare a production path for
                    Zcash FROST signing." / "Transaction broadcast | External/manual in current
                    build | ZecSafe verifies the txid but does not broadcast or custody funds"
Original purpose:   Honest boundary of the pre-FROST prototype.
Current truth:      FALSE. The recorded run signed AND broadcast a real shielded mainnet
                    transaction with a real 2-of-3 FROST aggregate signature.
Publicly visible:   YES — first screen of the repository.
Still executed:     N/A (documentation)
Evidence dependency: none
Decision:           REWRITE
Reason:             The single highest-value claim the project can make is contradicted by its
                    own front page. A skeptical judge stops reading here.
Replacement:        Judge-first README: thesis, "Lose one key. Not your ZEC.", 2-of-3, one
                    participant unavailable, verified mainnet run + txid, 60-second demo,
                    one-command verifier, precise limitations.
Deletion risk:      None. The old feature inventory has no dependency.
Verification:       README first screen contains txid 27d0e850…8527 and
                    `make judge-proof-mainnet`; contains zero occurrences of "does not
                    broadcast" and "Prepare a production path".
```
---
```text
Item ID:            STALE-002
File/route:         server.mjs:588-652  (GET /api/proof-bundle)  → consumed by src/app.js:1592
Exact behavior:     Builds a bundle from getblockchaininfo/getblockcount/getmempoolinfo/
                    getpeerinfo + getaddressbalance(defaultTransparentAddress) +
                    getTransactionProof(defaultProofTxid = b138c395dd721c9cee3d5676cfe41dd343
                    aec5e6d2514cbb03b018e1babcc368) + a local frost-demo run, then emits a
                    hardcoded realVsSimulated block:
                      guardianApprovals: "simulated"
                      transactionBroadcast: "simulated"
                      recoveryMigration: "simulated"
Original purpose:   Judge proof for the prototype.
Current truth:      This is NOT the judge proof. `defaultProofTxid` b138c395… is an UNRELATED
                    transaction with no link to the FROST run. The real proof is
                    fixtures/verified-mainnet-run/proof.json (txid 27d0e850…8527).
Publicly visible:   YES — reachable at /api/proof-bundle and fetched by the app.
Still executed:     YES.
Evidence dependency: NONE. The verified fixture does not use this endpoint.
Decision:           REMOVE_FROM_UI + DELETE (endpoint)
Reason:             V3 §"SERVER/API TRUTH AUDIT": "A default sample txid or address must never
                    be confused with the verified FROST run." This endpoint does exactly that,
                    and self-labels broadcast as "simulated" while a real broadcast exists.
Replacement:        The tracked zecsafe-proof-v1 fixture, already loaded by the /demo route
                    (src/app.js:153-154, 3514-3515).
Deletion risk:      Removing the endpoint breaks src/app.js:1592 (Evidence Center export),
                    which is itself slated for removal.
Verification:       grep -c "proof-bundle" server.mjs src/app.js == 0; /api/proof-bundle → 404;
                    grep -rn "b138c395" src/ server.mjs == 0; npm run check passes.
```
---
```text
Item ID:            STALE-003
File/route:         src/app.js:102-140 (navGroups) — 12 items across 5 groups
Exact behavior:     VAULT(Vault Overview, Vault Policy) / PROPOSALS(Proposal Center, Audit Log)
                    / GUARDIANS(Intent Review, Recovery Center) / EVIDENCE(Verified Demo,
                    Mainnet Proof Run, Evidence Center, FROST Live Demo) / DOCS(How It Works,
                    Threat Model)
Current truth:      V3 first-glance contract allows a maximum of 4 primary navigation items.
                    The proof — the only thing that wins this track — is one of twelve entries,
                    sitting beside a simulated Recovery Center and a "FROST Live Demo" that
                    does not perform FROST spend authorization.
Publicly visible:   YES.
Still executed:     YES.
Decision:           REMOVE_FROM_UI (reduce to ≤4)
Replacement:        Four-step human flow: Review → Verify → Authorize → Prove.
Deletion risk:      Medium — app.js is a 5,023-line monolith; see 07-FRONTEND-ARCHITECTURE.md.
Verification:       navItems.length <= 4; 15-second comprehension test passes.
```
---
```text
Item ID:            STALE-004
File/route:         src/app.js — "FROST Live Demo" (#frost-integration), 10 occurrences
Exact behavior:     Runs frost-demo over a *proposal payload hash*, not a PCZT shielded SIGHASH.
Current truth:      This is a FROST signature over an application-invented message. It is NOT
                    Zcash spend authorization. The real thing exists (rerandomized RedPallas
                    over the PCZT-derived shielded SIGHASH, sighash fingerprint
                    sha256:cd551487…c99928) and is far stronger.
Publicly visible:   YES, and it is named in a way that invites a judge to mistake it for the
                    real FROST proof.
Decision:           REMOVE_FROM_UI
Reason:             V3 automatic-P0 overclaim list. Keeping a weaker fake "FROST Live Demo"
                    next to a genuine mainnet FROST run actively damages credibility.
Replacement:        The recorded real authorization evidence on the proof route.
Deletion risk:      Low. scripts/frost-demo.mjs may be retained as a local diagnostic outside
                    the primary UI.
Verification:       grep -ci "FROST Live Demo" src/app.js == 0; route unreachable.
```
---
```text
Item ID:            STALE-005
File/route:         src/app.js — browser ECDSA P-256 guardian signatures (314 "guardian" hits)
Exact behavior:     Guardians sign a proposal payload hash with browser-generated ECDSA keys;
                    signature count gates "readiness".
Current truth:      Browser ECDSA acknowledgements are NOT FROST and are NOT Zcash spend
                    authorization. They cannot unlock a spend.
Publicly visible:   YES.
Decision:           REMOVE_FROM_UI  (or, if retained, RENAME to "Intent Review Attestation")
Reason:             V3 §24: it "must not unlock or count as FROST threshold authorization."
                    Currently it feeds a readiness score that looks like threshold readiness.
Verification:       No UI path presents a browser signature as satisfying the 2-of-3 threshold.
```
---
```text
Item ID:            STALE-006
File/route:         src/app.js #recovery — Recovery Center, 7-step flow, 10s demo timelock,
                    RECOVERY_NEW_VAULT_ADDRESS = "u1...newSafeAddress" (a placeholder string)
Current truth:      SIMULATED. No real share repair, refresh, or group migration was executed.
                    README:60 already concedes "Recovery migration | Simulated | No real fund
                    movement".
Publicly visible:   YES, as a primary navigation item under GUARDIANS.
Decision:           REMOVE_FROM_UI  (demote out of the primary experience)
Reason:             V3 §23: "Primary demo must not present simulated recovery." A simulated
                    feature sitting in primary nav next to a real mainnet proof is the single
                    most damaging credibility juxtaposition in the app.
Replacement:        If retained anywhere, label "Recovery Lab — Experimental / Recovery not
                    demonstrated". The allowed continuity claim is only: "The 2-of-3 threshold
                    remains usable with one participant unavailable" — which IS proven.
Verification:       "Recovery" absent from primary nav; no simulated recovery in the demo path.
```
---
```text
Item ID:            STALE-007
File/route:         src/app.js:143-146 constants + server.mjs mainnet telemetry endpoints
Exact text:         MAINNET_RPC_ENDPOINT = "https://docs-demo.zec-mainnet.quiknode.pro/"
                    DEFAULT_TRANSPARENT_ADDRESS = "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd"
                    DEFAULT_PROOF_TXID = "b138c395dd721c9cee3d5676cfe41dd343aec5e6d2514cbb03b018e1babcc368"
Current truth:      Generic read-only chain telemetry (peers, mempool, transparent balance) and
                    an unrelated default txid. This is the "Zcash security dashboard" identity
                    the V3 memory test explicitly warns against.
Publicly visible:   YES — Security Command Center is persistent across the app.
Decision:           DEMOTE (telemetry) / DELETE (default txid + default transparent address)
Reason:             Generic telemetry must not dominate first glance; a default sample txid must
                    never be confusable with the verified FROST run.
Verification:       No generic telemetry above the fold; grep for b138c395 and t3Vz22vK == 0.
```
---
```text
Item ID:            STALE-008
File/route:         package.json:4
Exact text:         "description": "FROST-style Zcash safety vault prototype with read-only
                    mainnet evidence."
Current truth:      Two falsehoods in one line: it is FROST, not "FROST-style"; and the mainnet
                    evidence is not "read-only" — a real transaction was signed and broadcast.
Decision:           REWRITE
Verification:       Description names FROST-native threshold authorization and the verified run.
```
---
```text
Item ID:            STALE-009
File/route:         docs/operator-notepad.md (served publicly at /docs/operator-notepad.md)
Exact text:         "## Winning Claim — ZecSafe is a Zcash mainnet safety vault proof-of-concept.
                    It links a payment proposal, guardian cryptographic acknowledgements, real
                    Zcash mainnet transaction proof, local FROST proof, and recovery controls…"
                    "## What To Show First — Start with Evidence Center, not the vault dashboard."
Current truth:      This is a stale demo runbook for the superseded prototype, and it is
                    publicly reachable over the static server.
Decision:           REWRITE or DELETE
Reason:             It instructs a demo path that contradicts DEMO.md and the proof-first route.
Verification:       Not served, or rewritten to the four-chapter proof-first demo.
```
---
```text
Item ID:            STALE-010
File/route:         HANDOFF.md (947 lines, tracked, served at /HANDOFF.md)
Exact content:      Local machine paths (/home/dell/zecsafe, C:\Users\DELL\Downloads\…),
                    external run directories, implementation chronology, superseded plan refs.
Current truth:      Internal operating context, not judge-facing evidence. Contains NO secret
                    values — verified. It *describes* which external directories hold secrets
                    (shares, TLS keys, randomizers) and correctly instructs keeping them out of
                    the repository. That disclosure is itself sound practice.
Publicly visible:   YES.
Decision:           MOVE_TO_ADVANCED_DOCS  (e.g. docs/history/) + strip local absolute paths
Reason:             V3 §"DOCUMENTATION CONSOLIDATION": move/shorten when it does not help a judge
                    reproduce the product. Do not delete — it is unique execution evidence.
Deletion risk:      HIGH if deleted outright. It is the authoritative run chronology.
Verification:       Not at public top level; no absolute local paths; still reproducible.
```
---
```text
Item ID:            STALE-011
File/route:         SUBMISSION.md:81
Exact text:         "Public repository URL to be added during the final human submission step."
Current truth:      The repository IS public: https://github.com/cyberrockng/zecsafe
Decision:           REWRITE  (trivial, but it is on the judge's critical path)
Verification:       SUBMISSION.md §10 contains the live URL.
```
---
```text
Item ID:            STALE-012
File/route:         docs/roadmap.md + README roadmap reference
Current truth:      Roadmap content is not proof and dilutes first glance.
Decision:           MOVE_TO_ADVANCED_DOCS
Deletion risk:      None.
```

## F. Mandatory contradiction matrix

| Current public statement | Current implementation truth | Decision |
|---|---|---|
| "Prepare a production path for Zcash FROST signing" (README:21) | Real 2-of-3 rerandomized FROST mainnet run exists (p0-021) | **rewrite** |
| "Transaction broadcast — External/manual in current build… does not broadcast" (README:59) | Verified run broadcast after human approval; `send exit: 0`, txid echoed | **rewrite with exact limitation** |
| "FROST Live Demo" signs proposal payload hash | Real PCZT shielded SIGHASH flow exists (sighash fp `cd551487…`) | **remove/replace** |
| Browser ECDSA guardian signatures imply threshold readiness | Browser acknowledgements are not FROST and cannot authorize a spend | **remove/reframe** |
| Recovery Center is a primary feature | Recovery is simulated; README:60 concedes it | **demote/remove** |
| Generic RPC telemetry (peers/mempool/balance) is core proof | Proof lineage is the core evidence | **demote** |
| `/api/proof-bundle` is the judge proof | `zecsafe-proof-v1` fixture + verifier is the judge proof | **replace** |
| "ZecSafe verifies the txid but does not… custody funds" | The recorded run *did* sign and spend real shielded funds | **rewrite precisely** |
| "no package/build step required" | CONFIRMED TRUE — zero dependencies, no lockfile, no build step | **keep** |
| Local `zcashd` is the product baseline | Actual observer is the light-client sync via zec.rocks (per p0-023 confirmation rule) | **update** |

## G. Deletion proof (acceptance criteria for Stage 2)

- Route/component no longer reachable (`#frost-integration`, `#recovery`, `#evidence-center`, `#proposals`, `#vault-policy`, `#audit-log`, `#mainnet-proof-run` consolidated).
- Stale-string scan returns zero outside the allowlist.
- Zero broken links.
- No missing proof dependency: `fixtures/verified-mainnet-run/*` still loads at `/demo`.
- `npm run check`, `make judge-proof-mainnet`, `make judge-proof-mainnet-tamper` still pass.
- Screenshots regenerated against the simplified product.
- README and SUBMISSION no longer reference removed surfaces.

## H. Allowlist (stale words that MUST remain)

| Word | Permitted context only |
|---|---|
| `simulated` | A clearly-labelled historical or limitation statement, e.g. "recovery is not demonstrated". |
| `prototype` | The proof-of-concept limitation: "ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling." |
| `external` | Describing an actual external dependency (pinned upstream tools, external run directories). |
| `guardian` | **Not allowlisted.** Every remaining use must be removed or renamed. |
| `confirmed` / `live` | Only where backed by the recorded chain-status vocabulary (`CONFIRMED` at height 3409837). Never for replay. |
| `randomizer`, `mnemonic`, `secret share` | Only in limitation/classification text stating they are **excluded** from public evidence — which is their current, correct usage in `proof.json`. |

No blanket text replacement. Every removal must be individually justified against this table.

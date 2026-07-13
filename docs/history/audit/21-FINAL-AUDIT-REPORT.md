> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 21 — Final Audit Report

## 1. Brutal verdict

**ZecSafe's cryptography is real, and its product is lying about it.**

Two FROST participants genuinely authorized a real shielded Zcash transaction while a third was genuinely unavailable. The rerandomized RedPallas aggregate signature was applied to a real Orchard PCZT, combined, extracted, human-approved, broadcast, and confirmed on Zcash mainnet at block 3,409,837. I verified every hash in that chain against the private run artifacts, and I confirmed the transaction on an independent block explorer that has never heard of this project. The txid was computed from the signed PCZT *before* broadcast — which is the one thing a project that merely pasted in someone else's transaction could never fake. This is a genuine, verifiable, mainnet FROST spend. It is better than most of what will be submitted to this track.

And the application, on the same screen where it displays that confirmed txid, tells the judge **"FROST Demo: Not Yet Run"** and **"Broadcast: 🔒 Disabled in Prototype."** The README says the project "does not broadcast." The default route's primary call-to-action is "Sign Next Guardian" — a browser ECDSA signature that cannot authorize a Zcash spend — under a gauge reading "GUARDIAN SIGNATURES 0/3." An endpoint named `/api/proof-bundle` still serves an unrelated default txid and declares broadcast "simulated."

The prototype ZecSafe replaced is still sitting on top of ZecSafe, arguing against it.

**Verdict: `NO-GO — P0 BLOCKERS REMAIN`.** Not one P0 is in the cryptography. Every P0 is deletion work, documentation work, or a submission artifact a human must produce. The fix is subtractive, and there are three days.

## 2. Audit baseline

```text
Repository:     https://github.com/cyberrockng/zecsafe   (public)
Branch:         main
Commit:         707ced2e4e5a99f48e566dc003a05f8d492c10d6
Working tree:   DIRTY — 25 entries (W4/W5)
Audit UTC:      2026-07-12T20:47:57Z
Environment:    WSL2 Linux 6.18, x86_64, Node v24.16.0, npm 11.13.0, rustc/cargo 1.96.0
Deployment:     NOT_DEPLOYED  (permitted — the rules do not require hosting)

V3 execution-plan SHA-256: 9cb90348e16a94f6eb0a3c470033b824f77a957d17e9d3fd8f41054b55b232bc
Historical V2   SHA-256:   535e0dab46f1a6f69b8ed3d5c0a869dc2acdb7589cde68d95db79ab6d24a1a1e
V3 audit-contract SHA-256: 6aae8c432326fad9282541e1d5b41d6eb4d0f59cbebd5506aae40f1fec1f8ddc

Level A public fresh-clone audit:            COMPLETE
Level B privileged local provenance audit:   COMPLETE
Private manifest hash: sha256:002000ab7c0c246b1d3c47bba27054088c3afb560def235d07609b546c417df5
                       ($HOME/.zecsafe/audit/ — outside Git; no secret values)
```

Both evidence levels are complete. This report therefore **may** answer the full technical question — and does, in §24.

## 3. Hackathon compliance

| Requirement | Status |
|---|---|
| Mainnet interaction | **PASS** — independently confirmed |
| Working prototype | **PASS** |
| Setup docs | **PASS** |
| Usage docs | **FAIL** — README describes the superseded prototype |
| Open-source license | **PASS** — MIT |
| Privacy/security guidelines | **PASS** |
| Demo video | **FAIL** — does not exist |
| ZecHub submission | **FAIL** — not created |
| Discord post | **FAIL** — not posted |

Four mandatory rules unmet; three require human action before July 15.

## 4. True product definition

> ZecSafe is a 2-of-3 FROST threshold authorization control plane for shielded Zcash that reviews a transaction against a signed intent before signing, authorizes it with two participants while one is unavailable, and publishes a tamper-evident proof bundle a judge can verify in one command without secrets.

That is what the code does. It is not what the product says.

## 5. Product truth map

| Class | Items |
|---|---|
| `REAL_MAINNET` | The verified run: intent → PCZT → SIGHASH → FROST session → aggregate → signed/proven/combined → txid → confirmed |
| `REAL_LOCAL` | Proof kernel (12 `src/*-v1.mjs` modules), verifier, tamper demo, fixed runner |
| `RECORDED_REAL_RUN` | `fixtures/verified-mainnet-run/` + the `/demo` replay |
| `REAL_READ_ONLY` | Mainnet observation (light-client via zec.rocks) |
| `SIMULATED` | Recovery Center; browser guardian ECDSA approvals; `/api/proof-bundle`'s self-declared `guardianApprovals`/`transactionBroadcast`/`recoveryMigration` |
| `DEAD` | `/api/viewing-key-balance` (requires an absent zcashd) |
| `STATIC` | Vault Policy table |

## 6. V3 differentiator results

| # | Differentiator | Verdict |
|---|---|---|
| 1 | Failure-on-screen continuity proof | **PASS** — C genuinely unavailable and not selected; A+B authorized; aggregate used in the transaction that reached mainnet |
| 2 | Intent-to-PCZT Binding Firewall | **PASS with 2 disclosure gaps** — fails closed; `memo_policy: LIMITED` honestly reported; but the FROST-key↔PCZT-authorization-key linkage (BIND-01) and the signer-review mode (BIND-02) are under-disclosed |
| 3 | Privacy-preserving proof bundle + verifier | **PASS** — schema, canonical hash, no secrets, one-command verifier, 7/7 tamper detection, recorded fixture from the real run |

## 7. FROST audit

```text
Implementation:  ZF frost-tools, pinned commit 7d33a95fecc91dacdb1503933e2bee43780d3293
Ciphersuite:     redpallas-rerandomized
Setup mode:      DKG        ← stronger than trusted-dealer; the README still says trusted-dealer
Threshold:       2 of 3
Participants:    3 distinct profiles (alice/bob/eve), distinct public fingerprints, separate
                 processes + configs, coordinated over frostd with per-run TLS
Availability:    C UNAVAILABLE (genuinely offline for the ceremony)
Selected:        A + B — fingerprints match the public bundle exactly
Rounds:          real; THRESHOLD_REACHED; blocked_operations: []
Aggregate:       64 bytes, AGGREGATE_SIGNATURE_VERIFIED, fingerprint c9b7508c… (hash-verified)
Custom crypto:   NONE. No re-implementation of nonces, secret sharing, aggregation, RedPallas,
                 PCZT, Orchard proving, or consensus. All delegated to pinned upstream.
Limitations:     rerandomized FROST was NOT covered by the NCC audit of ZF FROST (disclosed);
                 signer review is semantic_pczt_review, not independent_sighash (disclosed in
                 events, but not in proof.json or the docs).
```

## 8. View-only / key boundary

View-only UFVK wallet; can observe, cannot sign alone. No mnemonic, spending key, or share in the coordinator workspace or anywhere in Git or Git history. Shares live only in external, gitignored run directories and were **not read** by this audit. The coordinator has no spending authority — confirmed at Level B.

## 9. Intent / PCZT audit

Canonical intent commitment `2bc6da15…`; integer zatoshis with no float accounting; canonicalization independently reproduced by the auditor (it recomputed both binding-report refs and the bundle hash and matched exactly). Binding checks: `source PASS`, `network MATCH`, `recipient MATCH`, `amount MATCH`, `fee_policy PASS`, `memo_policy LIMITED`, `unexpected_output PASS`, `change_output PASS`. Every mutation (amount, recipient, memo, fee, network, group) changes the commitment. Mismatch produces `INTENT↔PCZT FAIL → SIGNING CONTEXT NOT PREPARED → FROST SESSION BLOCKED`. **No fail-open path exists.** A tampered-intent run was actually executed, not merely unit-tested.

## 10. Transaction artifact lineage — every arrow hash-verified

```text
intent 2bc6da15… → PCZT 3823d5eb… → binding 0bd48dfd… → SIGHASH cd551487…
  → FROST session cd6d729f… (A+B, C excluded) → aggregate c9b7508c… (64 B)
  → signed df8cf3ad… → proven 6b32eaa4… → combined 945ffd06…
  → extracted txid 27d0e850…8527   ← DERIVED FROM THE COMBINED PCZT, PRE-BROADCAST
  → broadcast (human-approved, exit 0, txid echoed)
  → CONFIRMED, height 3,409,837
```

Every fingerprint in the **public** bundle was recomputed from the **private** artifacts and matched byte-for-byte. There is no evidence gap.

## 11. Mainnet evidence

```text
Network:      main
Run ID:       p0-023-20260712T145358Z
Txid:         27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Submitted:    2026-07-12T14:54:20Z, send exit 0, txid echoed
Observed:     wallet light-client sync (zec.rocks)
Mined:        height 3,409,837
Confirmed:    per a pre-specified written rule (tip ≥ height + 2); arithmetic verified
Independent:  Blockchair, retrieved 2026-07-12 ~20:55 UTC — EXISTS at height 3,409,837,
              2026-07-12 14:54:27 UTC, 9,165 bytes, SHIELDED (no transparent inputs/outputs)
```

The independent lookup corroborates three things at once: the transaction is real, the height matches the proof exactly, and it is genuinely shielded — a transparent transaction dressed up as shielded would be immediately visible. It is not.

## 12. Proof bundle

Schema `zecsafe-proof-v1` with a machine-readable JSON Schema. Canonical bundle hash `e90c3c46…`, independently recomputed. Public/private/secret classification enforced by a passing test suite. Verifier and tamper demo both pass **from a fresh public clone** with no wallet, no funds, and no secrets. 7/7 mutations rejected. Forbidden-content scan: zero secret values — the only occurrences of `randomizer` are in `limitations[]`, declaring that it is excluded. **Missing:** `signer_review_mode`, which therefore sits outside the hash-covered boundary (BIND-02).

## 13. Security findings

| Sev | ID | Finding |
|---|---|---|
| P1 | SEC-001 | Server binds **all interfaces** (`ss` → `LISTEN *:4890`) while logging `http://127.0.0.1`. `server.mjs:853` omits the host argument. |
| P2→P1 | SEC-002 | Static document root **is the repository root**: `/.git/HEAD`, `/.git/config`, `/server.mjs`, `/HANDOFF.md` all return 200. (Path traversal itself is correctly blocked — verified.) |
| P2 | PRIV-01 | `/api/viewing-key-balance` invites pasting a **UFVK** into a server bound to the LAN. Dead endpoint; latent hazard, not a realized breach. |
| P3 | SEC-003 | No CSP / nosniff / referrer-policy / frame headers. |

No secrets in Git, history, fixtures, build output, or the proof bundle. No shell injection (argument arrays, fixed allowlist). No custom cryptography. Zero runtime dependencies — the supply chain is the Node standard library plus three pinned upstream Rust tools whose commits match `proof.json` exactly.

## 14. Privacy / trust findings

All required disclosures present: coordinator visibility, signer linkability, no network anonymity, UFVK sensitivity, redaction-not-zero-knowledge, chain-vs-session evidence distinction. **None of the forbidden claims is made.** The project does not claim the coordinator learns nothing, does not claim zero-knowledge, does not claim FROST provides network anonymity, and does not claim chain-visible FROST provenance. This area is exemplary.

## 15. Claim-to-code results

Two **automatic P0 overclaims** (V3 §10):

1. **Browser signatures presented as FROST** — "GUARDIAN SIGNATURES 0/3", "Sign Next Guardian", and a "FROST Live Demo" that signs a proposal payload hash rather than a shielded SIGHASH.
2. **An unrelated txid inside a "proof bundle"** — `/api/proof-bundle` embeds `DEFAULT_PROOF_TXID = b138c395…cc368`, which has no connection to the FROST run.

The most damaging *under*-claims: README:59 "does not broadcast or custody funds" (false — it did); README:21 "Prepare a production path for FROST signing" (it already walked it); README:55/251 "trusted-dealer" (the real run used DKG).

The project's honest disclosures — `memo_policy: LIMITED`, `semantic_pczt_review`, "the chain does not expose a FROST marker", "rerandomized FROST was not covered by the NCC audit" — are correct, unusual, and should be foregrounded rather than buried.

## 16. Feature survival and stale-removal matrix

| Decision | Items |
|---|---|
| **Core** | Proof kernel (12 modules); `fixtures/verified-mainnet-run/`; verifier + tamper; `/demo` replay; `POST /api/intent/create`; `PROOF_SPEC.md`; `TRUST_MODEL.md`; toolchain pins |
| **Supporting** | Mainnet observation; threat model; SECURITY/PRIVACY; execution history |
| **Reframe** | Vault Overview → run overview; Audit Log → ProofEvent timeline; Threat Model → short security page + full doc |
| **Demote** | Generic telemetry (peers/mempool/status); `/api/transaction-proof` → chain-observation helper only |
| **Remove** | Recovery Center (simulated); FROST Live Demo; Evidence Center; Proposal Center; Vault Policy table; browser guardian ECDSA; Security Command Center header; transparent-balance monitor |
| **Delete** | `GET /api/proof-bundle`; `POST /api/viewing-key-balance`; `DEFAULT_PROOF_TXID`; `DEFAULT_TRANSPARENT_ADDRESS`; stale `docs/screenshots/` |
| **Archive as historical** | `HANDOFF.md` → `docs/history/` (never delete — unique run chronology); `docs/execution/*`; `docs/roadmap.md` |
| **Rewrite** | `README.md`; `package.json` description; `SUBMISSION.md` §10; `docs/operator-notepad.md` |

## 17. UI / judge results

| Test | Result |
|---|---|
| 30-second understanding on `/` | **FAIL** — reads as a Zcash security dashboard |
| 30-second understanding on `/demo` content | **PASS** — thesis, 2-of-3, 1 unavailable, txid, CONFIRMED, PROOF VERIFIED |
| 30-second understanding on `/demo` **as rendered** | **FAIL** — the header contradicts the hero on the same screen |
| 60-second judge proof | **PASS** — `make judge-proof-mainnet` from a fresh clone |
| Desktop 1440/1280 | Mechanically clean; content stale |
| Mobile 390 | Mechanically clean (no overflow); **entire first screen is stale**, including the false "Broadcast stays locked until reviewed FROST signing is integrated" |
| Replay truth | **PASS** — labelled recorded; zero "live" claims; state derived from events, never invented |

Evidence: `docs/audit/evidence/ui-home-1440.png`, `ui-demo-1440.png`, `ui-demo-1280.png`, `ui-demo-390.png` (independently captured at audit time).

## 18. Documentation results

`SUBMISSION.md`, `DEMO.md`, `PRIVACY.md`, `PROOF_SPEC.md`, `TRUST_MODEL.md` and the 31 execution documents are substantive and largely truthful. **`README.md` is the failure** — it is the primary documentation surface and it describes the product ZecSafe stopped being. The verified txid appears nowhere in it.

## 19. Exact command results

```text
npm run check                     exit 0   16 suites + syntax(47) + security scan
npm run test:proof-data           exit 0   data-classification tests passed
make proof-run-dry                exit 0   14 PASS + 1 WAIT (human broadcast gate)
make judge-proof-mainnet          exit 0   VERDICT: VERIFIED RECORDED ZECSAFE PROOF
make judge-proof-mainnet-tamper   exit 0   VERDICT: TAMPER DETECTION PASS (7/7)
make judge-proof                  exit 0   regression only (test-network fixture)
fresh public clone @ 707ced2      exit 0   check + both mainnet judge targets pass
lint / typecheck / build          NOT_APPLICABLE_WITH_REASON (not declared)
npm install                       NOT_APPLICABLE_WITH_REASON (zero deps, no lockfile)
```

Every documented command was executed. **No stale command was found.**

## 20. Submission package results

Repository public ✓. License ✓. Judge commands ✓. Proof page ✓. Txid ✓.
**Demo video ✗. ZecHub PR ✗. Discord post ✗.** `SUBMISSION.md` §10 still lacks the repo URL.

## 21. Remaining limitations

- Rerandomized FROST is **not** covered by the NCC audit of ZF FROST.
- Pinned `frost-tools` and `zcash-devtool` both self-describe as WIP / not production-ready.
- Signer review is `semantic_pczt_review` — signers do **not** independently recompute the SIGHASH.
- The Binding Firewall is a **semantic** check; the FROST-key ↔ PCZT-authorization-key linkage is established by the signer library at apply time and corroborated by consensus acceptance, not by the Firewall.
- Three participants ran as separate processes/configs **on one machine** — not independent real-world custodians. The project correctly never claims otherwise.
- Recovery is **simulated** and not demonstrated.
- The verifier proves bundle integrity and internal consistency. It does not re-execute FROST or regenerate the PCZT.
- This audit is not a formal cryptographic audit, a custody certification, or a penetration test.

## 22. Remediation order

```text
P0:  R-01 delete /api/proof-bundle + default txid/address + dead endpoints
     R-02 delete the stale prototype shell; nav ≤ 4; four-step flow; proof-first default route
     R-03 rewrite README, package.json description, SUBMISSION.md §10
     R-04 commit W4/W5 + remediation; declare and push the submission commit
     R-05 demo video, ZecHub PR, Discord post          [human; do AFTER R-02]
P1:  R-06 signer_review_mode into the schema/bundle (regenerate — never hand-edit) + docs
     R-07 state the Binding Firewall / FROST-key linkage boundary plainly
     R-08 bind to 127.0.0.1; stop serving the repo root; add security headers
     R-09 relocate HANDOFF.md and the operator notepad out of the public judge path
P2:  R-10 merge duplicate status routes; regenerate screenshots; reconcile CI Node version
```

## 23. Final judge path (after remediation)

```text
1. git clone https://github.com/cyberrockng/zecsafe && cd zecsafe
2. make judge-proof-mainnet          → VERIFIED RECORDED ZECSAFE PROOF
3. make judge-proof-mainnet-tamper   → TAMPER DETECTION PASS
4. npm start → open http://127.0.0.1:4173/
5. See: 2 OF 3 · 1 UNAVAILABLE · Binding Firewall PASS · txid 27d0e850…8527 · CONFIRMED
6. Click "Verify Proof" and "Download Public Proof"
7. Independently look up the txid on any Zcash explorer → height 3,409,837, shielded
```

~60 seconds. No wallet. No funds. No secrets. No need to trust the UI.

## 24. Final verdict

> **Is ZecSafe genuinely FROST-backed, linked to the reviewed PCZT, proven against Zcash mainnet, privacy-conscious, independently verifiable, and ready for ZecHub Hackathon 3.0 submission?**

```text
YES, WITH SPECIFIC REMAINING RISKS
```

Both Level A and Level B are complete, so I can answer the technical question without hedging:

**Did two real FROST participants authorize the exact reviewed Zcash transaction while one participant was unavailable, did the resulting transaction reach Zcash mainnet, and can a judge verify the evidence without trusting the UI or receiving secret material?**

**Yes. All three. I verified each independently — the private artifact hashes against the public bundle, and the txid against a block explorer with no relationship to this project.**

But `ready for submission` is a separate question, and the honest answer to *that* is **no, not yet**:

```text
NO-GO — P0 BLOCKERS REMAIN
```

The blockers are: a legacy endpoint that presents an unrelated txid as a "proof bundle"; a prototype UI that tells judges FROST has not been run and broadcast is disabled, directly above the confirmed mainnet transaction; a README that says the project does not broadcast; no declared submission commit; and three missing mandatory submission artifacts (video, PR, Discord post).

I am not choosing `YES, WITH SPECIFIC REMAINING RISKS` to encourage the team. I am choosing it because the cryptographic work genuinely holds up under privileged, adversarial inspection — and I am withholding `GO` because a judge reading this repository today would never find that out.

**The engineering is done. The demolition is not.** Three days is enough — but only if the work is deletion, and only if the demo video is recorded *after* the prototype is gone.

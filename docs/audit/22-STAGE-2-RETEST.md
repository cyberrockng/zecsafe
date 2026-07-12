# 22 — Stage 3 Retest After Stage 2 Remediation (R-01…R-04)

**Retest date:** 2026-07-12 UTC
**Submission commit:** `2133493bb6a7d2221db45e0baa4c130ffdae7183` (pushed to `origin/main`)
**Previous audit target:** `707ced2` + dirty tree
**Method:** fresh clone from the public remote, plus independent UI capture.

Original findings are preserved in `06`, `08`, `15`, `20`, and `21`. This file records what changed. **No finding was erased to make it disappear.**

## Recorded evidence: untouched

```text
fixtures/verified-mainnet-run/proof.json          sha256 7800a74d…3595e2   UNCHANGED
fixtures/verified-mainnet-run/events.public.json  sha256 d2d8d674…a222b9   UNCHANGED
git diff --exit-code -- fixtures/                 → clean
```

The bundle hash, txid, and all proof fingerprints are byte-identical to the pre-remediation audit. The proof bundle was **not** regenerated or hand-edited.

## P0 status

| ID | P0 | Status |
|---|---|---|
| R-01 | Legacy `/api/proof-bundle` with unrelated default txid | **RESOLVED** |
| R-02 | Stale prototype shell contradicting the proof on-screen | **RESOLVED** |
| R-03 | README claims the project does not broadcast | **RESOLVED** |
| R-04 | No declared submission commit (dirty tree) | **RESOLVED** |
| R-05 | Demo video, ZecHub PR, Discord post | **OPEN — human/external action required** |

## R-01 verification

Routes confirmed removed on a running server:

```text
GET  /api/proof-bundle          → 404
GET  /api/frost-demo            → 404
POST /api/viewing-key-balance   → 404
POST /api/mainnet/address-balance → 404

GET  /                          → 200
GET  /demo                      → 200
GET  /api/health                → 200
GET  /fixtures/verified-mainnet-run/proof.json → 200
```

`grep` across `server.mjs` and `src/app.js` for `proof-bundle`, `b138c395`, `t3Vz22vK`, `viewing-key`, `frost-demo`: **0 hits.**
`server.mjs`: 855 → 515 lines.

## R-02 verification

`src/app.js`: 5,023 → **447 lines**. Primary navigation: **4 items** (Review, Verify, Authorize, Prove). The recorded verified mainnet run is the **default route**.

Stale-string scan across `src/app.js`, `server.mjs`, `README.md`, `package.json`, `SUBMISSION.md`:

```text
guardian                 0
FROST Live Demo          0
Recovery Center          0
does not broadcast       0
Not Yet Run              0
Disabled in Prototype    0
```

The two surviving `prototype` hits are the CSS class `prototype-note` — allowlist-compliant, not user-facing copy.

**The on-screen self-contradiction is gone.** Evidence: `docs/audit/evidence/ui-remediated-1440.png`, `ui-remediated-1280.png`, `ui-remediated-390.png` (independently captured at the submission commit).

| Test | Before | After |
|---|---|---|
| 15-second comprehension on the **default** route | **FAIL** — "Zcash security dashboard" | **PASS** — thesis, 2-of-3, 1 unavailable, txid, CONFIRMED, PROOF VERIFIED |
| Header contradicts the hero | **FAIL** — "FROST Demo: Not Yet Run" above `CONFIRMED` | **PASS** — header removed |
| Primary nav ≤ 4 | **FAIL** (12) | **PASS** (4) |
| Four-step human flow | **FAIL** | **PASS** — Review → Verify → Authorize → Prove |
| 390px: proof above the fold | **FAIL** — entire first screen stale | **PASS** — run ID, txid, and `CONFIRMED` all above the fold |
| Browser signatures presented as FROST | **FAIL** (automatic P0 overclaim) | **PASS** — removed entirely |
| Unrelated txid inside a "proof bundle" | **FAIL** (automatic P0 overclaim) | **PASS** — removed entirely |

**Both automatic P0 overclaims from V3 §10 are cleared.**

The event-derived reducer (`src/demo-proof-state.mjs`) and its test suite were deliberately **retained** — run state is still derived from recorded ProofEvents and still cannot be fabricated.

## R-03 verification

README now leads with the txid, `CONFIRMED` at height 3,409,837, the one-command verifier, and precise limitations. Removed: `does not broadcast`, `Prepare a production path`, the 22-item legacy feature inventory, and the stale Real-vs-Simulated table.

The previously **under-claimed** DKG group setup is now stated. `package.json` description and `SUBMISSION.md` §10 (public repo URL) corrected.

## Regression guard

`scripts/verify.mjs` was re-pointed at the current product. It now asserts both:

- the proof-first product exists (four steps, fixtures loaded, review mode disclosed, judge command present); **and**
- the deleted prototype surfaces **stay deleted** (negative assertions on guardian UI, FROST Live Demo, Recovery Center, `/api/proof-bundle`, `/api/frost-demo`, `/api/viewing-key-balance`, default txid/address).

A regression now fails `npm run check`.

## Command results — fresh public clone at `2133493`

```text
git clone https://github.com/cyberrockng/zecsafe.git    HEAD = 2133493
npm run check                     exit 0
npm run test:proof-data           exit 0
make proof-run-dry                exit 0
make judge-proof-mainnet          exit 0   VERDICT: VERIFIED RECORDED ZECSAFE PROOF
make judge-proof-mainnet-tamper   exit 0   VERDICT: TAMPER DETECTION PASS
make judge-proof (regression)     exit 0
```

## Remaining findings (not in the approved Stage 2 scope)

| ID | Sev | Finding | Status |
|---|---|---|---|
| R-05 | **P0** | Demo video, ZecHub PR, Discord post — mandatory hackathon rules | **OPEN — blocks submission.** Record the video against *this* commit. |
| R-06 | P1 | `signer_review_mode` absent from `proof.json` and the specs (outside the hash boundary) | OPEN — requires regenerating the bundle from Level B artifacts, never hand-editing |
| R-07 | P1 | Binding Firewall / FROST-key linkage boundary buried in `limitations[4]` | Partly mitigated: the app and README now state the semantic-review limit; the specs still need it |
| R-08 | P1 | Server binds all interfaces; static root is the repo root (`/.git/HEAD` → 200) | **OPEN** |
| R-09 | P1 | `HANDOFF.md` / `operator-notepad.md` at the public top level with local paths | OPEN |
| R-10 | P2 | Screenshots, CI Node version | Partly done (audit captures fresh); `docs/screenshots/` still stale |

## Verdict

```text
Product-truth P0s:        CLEARED
Submission-package P0s:   R-05 OPEN (video, ZecHub PR, Discord post)

NO-GO — P0 BLOCKERS REMAIN  (R-05 only; all remaining blockers are external human actions)
```

The repository is now internally truthful and independently verifiable from a fresh public clone. What stands between ZecSafe and `GO` is no longer engineering — it is a demo video, a ZecHub PR, and a Discord post, all of which must be produced by a human before **July 15, 2026 UTC**.

Record the video against commit `2133493` or later. A video of the pre-remediation UI would show a judge "FROST Demo: Not Yet Run" beside a confirmed mainnet transaction.

---

# Stage 2 remediation R-06…R-09 (commit `0af650f`)

Verified from a fresh public clone at `0af650f`: `npm run check`, `make proof-run-dry`, `make judge-proof-mainnet`, `make judge-proof-mainnet-tamper`, `make judge-proof` — all exit 0.

## R-06 — signer review mode is now inside the tamper-evident boundary: **RESOLVED**

`frost.signer_review_mode` and `frost.signer_reviews_completed` are **required** schema fields. A judge reading `proof.json` — the hash-covered artifact — now sees `semantic_pczt_review` directly.

The generator will not record a mode unless every review is bound to that run's group fingerprint, PCZT fingerprint, binding report, SIGHASH fingerprint, and intent commitment; every reviewer is one of the selected signers; every review passed; and the count meets the threshold. Tests assert that a foreign-PCZT review, an unselected reviewer, a failed review, a sub-threshold count, and a mixed-mode claim are each **rejected**.

**The bundle was regenerated from the frozen Level B artifacts, not hand-edited.** Every evidence-bearing field is byte-identical.

```text
old bundle_hash: sha256:e90c3c46ae1474d848d3cc20ef4157e52b151dddda2015c034f83ad31ee9cb64
new bundle_hash: sha256:e4684eb1df7bbf48fda46ce4353968640f664c306b097e868e3b2ba780351b8d
unchanged: network, txid, block height, confirmations, intent commitment, all four PCZT
           fingerprints, SIGHASH fingerprint, aggregate signature fingerprint + byte length,
           group fingerprint, both selected signer fingerprints, all binding checks,
           all three toolchain commits
```

## NEW FINDING — bundle reproducibility (found during R-06, now **RESOLVED**)

This was **missed by the original audit** and is worth recording plainly.

The original Level B pass verified that every *artifact* hash matched the public bundle. It did **not** attempt to regenerate the bundle end-to-end. When R-06 forced a regeneration, the recorded bundle turned out to be **irreproducible from its own frozen artifacts at any commit**:

| Attempt | Result |
|---|---|
| Regenerate at HEAD | different `completion_report_ref`, `proof_event_ref`, `bundle_hash` |
| Regenerate at the recorded-run commit `ad83269` | **fails outright** — the completion package does not parse (the run used a newer completion module that was uncommitted at the time) |
| Regenerate at the freeze commit `0cd8aeb` | still different refs |
| Regenerate twice at HEAD | **different from each other** |

**Root cause:** `pcztCompletionProofEvent` defaulted `occurred_at` to wall-clock `new Date()`. That event is hashed into `completion_report_ref` and `proof_event_ref`, which are hashed into `bundle_hash`. The bundle therefore captured *generation time*, so no two generations agreed.

**Fix:** `generateZecsafeProofV1` now pins the completion event's `occurred_at` to `recorded_at`. Generation is deterministic; a regression test asserts byte-identical regeneration from identical inputs.

**Honest framing of what this did and did not mean.** Tamper-evidence always held — any edit to the recorded file was still detected, and the verifier was never wrong. What did *not* hold was **reproducibility**: the project could not have re-derived its own published bundle. For a proof artifact whose whole value is independent verification, that is a material weakness, and it is exactly the kind of thing an audit that stops at "the hashes match" will miss. `PROOF_SPEC.md` and the fixture README now state the reproduction command and the hash history.

## R-07 — Binding Firewall vs FROST-key linkage: **RESOLVED**

`PROOF_SPEC.md`, `docs/proof/TRUST_MODEL.md`, and `SECURITY.md` each now state, in a titled section: the Binding Firewall is a **semantic** intent-to-PCZT check; it does **not** prove the FROST group key is the PCZT action's spend-authorization key; that linkage is established by the pinned signer library verifying the aggregate against the action's rerandomized verification key at apply time, and corroborated by Zcash consensus accepting the shielded spend. Previously this rested on one sentence inside `limitations[4]`.

## R-08 — server hardening: **RESOLVED**

| Check | Before | After |
|---|---|---|
| Bind address | `LISTEN *:4173` (all interfaces) while logging `127.0.0.1` | `LISTEN 127.0.0.1:4173`; log is now true |
| `/.git/HEAD`, `/.git/config` | **200** | **404** |
| `/server.mjs`, `/package.json`, `/HANDOFF.md`, `/Makefile` | **200** | **404** |
| `/src/*`, `/fixtures/verified-mainnet-run/*`, `/`, `/demo` | 200 | 200 (allowlisted) |
| Traversal, encoded traversal, `%00` | blocked | blocked |
| CSP / nosniff / Referrer-Policy / X-Frame-Options | absent | present |

The document root is now an explicit allowlist rather than the repository. The app renders correctly under the new CSP (no inline script or style).

## R-09 — internal context out of the judge path: **RESOLVED**

`HANDOFF.md`, `operator-notepad.md`, and `roadmap.md` moved to `docs/history/` with an index and explicit banners. `operator-notepad.md` is labelled **SUPERSEDED** — its demo path described the old prototype.

HANDOFF was **annotated, not rewritten**: it still records the original bundle hash, with a banner explaining the supersession. Historical records are not edited to match later corrections.

All absolute local machine paths are gone: from HANDOFF (placeholders `<runs>`, `<repo>`, `<plans>`) and, more importantly, from **tracked code** — `scripts/zecsafe.mjs`, `scripts/mainnet-view.mjs`, `scripts/pczt-inspect.mjs`, and `src/fixed-runner-v1.mjs` hardcoded `/home/dell/...` defaults and now resolve from `$HOME` or env vars. The repo no longer only works on the author's machine.

## Status

| ID | Sev | Status |
|---|---|---|
| R-01…R-04 | P0 | **RESOLVED** (`2133493`) |
| R-06…R-09 | P1 | **RESOLVED** (`0af650f`) |
| Reproducibility defect | P1 (new) | **RESOLVED** (`0af650f`) |
| R-10 | P2 | Partly done — `docs/screenshots/` still stale; CI Node version unreconciled |
| **R-05** | **P0** | **OPEN — demo video, ZecHub PR, Discord post** |

```text
NO-GO — P0 BLOCKERS REMAIN  (R-05 only)
```

Every engineering finding from the V3 audit is now closed. The sole remaining blocker is the submission package, which requires human action before **July 15, 2026 UTC**. Record the demo video against commit `0af650f` or later.

> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 15 — UI and Judge-Path Audit

**Method:** independent capture. Playwright Chromium 1228, headless, clean profile, local server at `127.0.0.1:4890`, audit tree (HEAD `707ced2` + W4/W5 working tree), 2026-07-12 UTC. Existing repository screenshots were treated as *inputs*, not as proof that this commit passed.

Evidence captured:

```text
docs/audit/evidence/ui-home-1440.png     route /       1440×900
docs/audit/evidence/ui-demo-1440.png     route /demo   1440×900
docs/audit/evidence/ui-demo-1280.png     route /demo   1280×800
docs/audit/evidence/ui-demo-390.png      route /demo    390×844
```

## The single most important finding: **the app contradicts itself on one screen**

The persistent "Security Command Center" header renders on **every** route, including `/demo`. At 1440×900 on `/demo`, a judge sees, simultaneously:

| Top of screen (persistent header) | ~300px below (demo hero) |
|---|---|
| `FROST Demo: Not Yet Run` | `RECORDED VERIFIED MAINNET RUN` |
| `Broadcast: 🔒 Disabled in Prototype` | `CHAIN STATUS: CONFIRMED` |
| `Recovery Risk: Low` | `TXID 27d0e850…5e8527` |

**The application tells the judge that FROST has not been run and that broadcast is disabled, directly above the confirmed mainnet transaction it produced with FROST.**

This is not a copy nit. It is the project actively arguing against its own strongest evidence, on the one screen the judge is directed to. It converts a genuine win into an apparent contradiction, and a skeptical judge resolves contradictions against the submitter.

## Fifteen-second test: **FAIL on `/`, PASS on `/demo` content, FAIL on `/demo` as rendered**

| Must understand | `/` (home) | `/demo` hero (content only) | `/demo` as actually rendered |
|---|---|---|---|
| ZecSafe protects shielded Zcash authorization | ✗ "safety vault… guardian-protected recovery" | ✓ "A 2-of-3 FROST authorization control plane for shielded Zcash" | ✓ |
| It is 2-of-3 | ~ ("Vault Policy: 2-of-3" chip) | ✓ `2 OF 3` badge | ✓ |
| One participant can be unavailable | ✗ | ✓ `1 UNAVAILABLE` badge | ✓ |
| Two participants still authorize | ✗ | ✓ | ✓ |
| The transaction is checked first | ✗ | ✓ Binding Firewall panel | ✓ |
| Verifiable mainnet evidence | ✗ "MAINNET PROOF: Not attached" | ✓ txid + `CONFIRMED` + `PROOF VERIFIED` | **✗ — contradicted by the header above it** |

The `/demo` route's *own content* is genuinely excellent and would pass the test cleanly. It is defeated by the shell it is rendered inside.

## Homepage (`/`) — the default judge landing page: **FAIL**

Verbatim from `ui-home-1440.png`:

- Headline: "Protect ZEC from single-key failure." — generic; not the FROST thesis.
- Subhead: "A Zcash FROST safety vault for threshold approval, mainnet evidence, and **guardian-protected recovery**." — recovery is **simulated**.
- Primary CTA: **"Sign Next Guardian"** — browser ECDSA, not FROST, presented as the main action.
- **"GUARDIAN SIGNATURES 0/3"** — presents browser acknowledgements as the threshold gauge. This is the V3 automatic-P0 overclaim: *browser signatures called FROST*.
- **"MAINNET PROOF: Not attached"** — the superseded paste-a-txid story, while a confirmed FROST mainnet txid exists in the repository.
- "VERIFY — Mainnet Transaction: Attach a real Zcash txid and confirmation proof."
- "RECOVER — Vault Access: Run a guarded lost-device recovery workflow." — simulated feature as one of three top cards.
- "20% COMPLETE" progress meter for a workflow that is not the proof.

A judge who opens the repository's default route sees the prototype and never learns the project signed a real shielded mainnet transaction.

## Complexity limits: **FAIL**

| V3 limit | Actual |
|---|---|
| ≤ 4 primary navigation items | **12** (Vault Overview, Vault Policy, Proposal Center, Audit Log, Intent Review, Recovery Center, Verified Demo, Mainnet Proof Run, Evidence Center, FROST Live Demo, How It Works, Threat Model) |
| ≤ 2 primary CTAs per screen | `/` shows ≥ 4 (Raise Proposal ×2, Sign Next Guardian, + 3 action cards) |
| Exactly 4 human steps (Review→Verify→Authorize→Prove) | Not implemented as the primary flow |
| ≤ 3 dashboard panels above fold | 5 telemetry chips + Secure Transfer Room + 4 stat tiles |

## 390 × 844 mobile: **FAIL (content), PASS (no overflow)**

From `ui-demo-390.png`, the **entire first screen** is stale. In order, before any proof content appears:

1. Five telemetry chips, including `FROST Demo: Not Yet Run` and `Broadcast: Disabled in Prototype`.
2. Horizontally-scrolling legacy nav (Vault Overview / Vault Policy / Pr…).
3. A status card reading, verbatim:
   > *"Mainnet safety vault — Live read-only Zcash evidence is connected. **Broadcast stays locked until reviewed FROST signing is integrated.**"*
   This sentence is **false**. FROST signing is integrated; broadcast happened; the transaction is confirmed at height 3,409,837.
4. "Protect ZEC from single-key failure" + "guardian-protected recovery" + "Raise Proposal".

`RECORDED VERIFIED MAINNET RUN` only begins to appear at the very bottom edge of the viewport.

**Mechanically, mobile is fine:** no hash overflow, no address overflow, no broken buttons, no nav breakage. Layout quality is good. The failure is entirely one of *truth and priority*, not of CSS.

## Copy audit

Forbidden-superlative scan (`unhackable`, `bank-grade`, `trustless`, `fully decentralized`, `tamper-proof`, `production-ready`, `audited`, `real-time`, `social recovery complete`, `live replay`): **zero hits.** The project does not use marketing inflation. Credit where due — the honesty problem is stale *understatement* and stale *feature framing*, not hype.

Required corrections are the stale strings already itemized in `06-STALE-SURFACE-DEMOLITION.md`, plus:

- `FROST Demo: Not Yet Run` → delete (the chip refers to the legacy `/api/frost-demo`).
- `Broadcast: Disabled in Prototype` → delete.
- `Broadcast stays locked until reviewed FROST signing is integrated.` → delete (false).
- `GUARDIAN SIGNATURES n/3` → delete (browser signatures are not the threshold).

## Required visibility

| Element | Visible? |
|---|---|
| `2 OF 3` | ✓ on `/demo` |
| `1 UNAVAILABLE` | ✓ on `/demo` |
| Unavailable signer / selected signers | ✓ below fold on `/demo` |
| Binding PASS/FAIL | ✓ Binding Firewall panel |
| Threshold state | ✓ |
| Mainnet txid | ✓ `27d0e850…5e8527` |
| Proof verification | ✓ `PROOF VERIFIED` badge; `Verify Proof` + `Download Public Proof` buttons |

**All required proof elements exist and render correctly.** They are simply not what the judge sees first, and they are contradicted by the surrounding shell.

## Accessibility and interaction

| Check | Result |
|---|---|
| Direct load + refresh of `/demo` | **PASS** — server maps `/demo` → `index.html` (`server.mjs:809`); route survives refresh |
| Status not conveyed by color alone | **PASS** — every status chip pairs a dot with a text label |
| Loading / error / fixture-missing states | **PASS** — demo state derives from fixtures; missing events yield absent states, not fabricated success (`scripts/demo-proof-state.test.mjs`) |
| Hash-route back/forward | **PASS** — `hashchange` listener at `src/app.js:5015` |
| Touch targets at 390px | **PASS** |
| Contrast of proof/warning/unavailable states | **PASS** on inspection |
| Keyboard-only nav, visible focus, heading order, landmarks | **UNVERIFIED** — not exhaustively driven in this pass. Not a submission blocker; recorded as P3. |

## Verdict

```text
Judge path (proof content):     STRONG
Judge path (as actually shipped): FAIL — the proof is buried below, and contradicted by, the stale shell
```

The work needed is **subtractive**. Every element required to pass this audit already exists and renders. Removing the legacy shell — header, nav, home hero — is what makes the project pass, and it removes code rather than adding it.

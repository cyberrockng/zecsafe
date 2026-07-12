# 19 — Remediation Task Cards

**Stage 2 work. Requires separate approval. Not implemented by this audit.**

Ordered P0 → P1 → P2. Tasks R-01…R-05 are the submission-blocking set.

---
```text
Task ID:          R-01
Priority:         P0
Finding IDs:      STALE-002, CLAIM-04 (automatic P0 overclaim), 08-SERVER-API-SURVIVAL
Objective:        Delete the legacy /api/proof-bundle endpoint and every default-txid /
                  default-address constant, so no unrelated transaction can be mistaken for
                  the verified FROST run.
Evidence:         server.mjs:588-652 (handleProofBundle) embeds
                  DEFAULT_PROOF_TXID = b138c395dd721c9cee3d5676cfe41dd343aec5e6d2514cbb03b018e1babcc368
                  (unrelated to the FROST run) and emits hardcoded
                  { guardianApprovals: "simulated", transactionBroadcast: "simulated",
                    recoveryMigration: "simulated" }
                  while a real, confirmed mainnet broadcast exists (27d0e850…8527).
                  src/app.js:1592 fetches it.
Files/systems:    server.mjs (handler + dispatch at :787), src/app.js (:1592, :144-146)
Dependencies:     none
Exact actions:
  1. Delete handleProofBundle() and its dispatch line in server.mjs.
  2. Delete the /api/proof-bundle fetch in src/app.js and the Evidence Center export that
     consumes it (that route is removed by R-02 in any case).
  3. Delete constants DEFAULT_PROOF_TXID and DEFAULT_TRANSPARENT_ADDRESS (src/app.js:145-146)
     and their server-side twins.
  4. Delete POST /api/viewing-key-balance and its UI form (dead; invites a UFVK paste — PRIV-01).
  5. Delete GET|POST /api/frost-demo from the product surface. Retain scripts/frost-demo.mjs as
     a local diagnostic only.
Acceptance criteria:
  - grep -rn "proof-bundle\|b138c395\|t3Vz22vK\|viewing-key-balance\|frost-demo" server.mjs src/ → 0 hits
  - GET /api/proof-bundle → 404
  - /demo still loads fixtures/verified-mainnet-run/{proof,events.public}.json
Verification:     npm run check; make judge-proof-mainnet; make judge-proof-mainnet-tamper; load /demo
Do not:           Do not modify fixtures/verified-mainnet-run/*. Do not regenerate the bundle hash here.
Completion evidence: command transcripts + a 404 on the removed route.
```
---
```text
Task ID:          R-02
Priority:         P0
Finding IDs:      STALE-003/004/005/006/007, CLAIM-05, ZAUD-202, 15-UI-AND-JUDGE-AUDIT
Objective:        Remove the stale prototype shell so the verified mainnet FROST product is the
                  product. Reduce primary navigation to ≤ 4 items and adopt the four-step flow.
Evidence:         docs/audit/evidence/ui-home-1440.png — the default route shows
                  "GUARDIAN SIGNATURES 0/3", "Sign Next Guardian", "MAINNET PROOF: Not attached",
                  and a "RECOVER — Vault Access" card for a SIMULATED feature.
                  docs/audit/evidence/ui-demo-1440.png — the persistent header shows
                  "FROST Demo: Not Yet Run" and "Broadcast: Disabled in Prototype" DIRECTLY ABOVE
                  "CHAIN STATUS: CONFIRMED" and the real txid, on the same screen.
                  docs/audit/evidence/ui-demo-390.png — the entire mobile first screen is stale and
                  contains the false sentence "Broadcast stays locked until reviewed FROST signing
                  is integrated."
Files/systems:    src/app.js (navGroups :102-140; routes; Security Command Center; home hero),
                  src/styles.css, index.html
Dependencies:     R-01 (removes the endpoints these routes consume)
Exact actions:
  1. Delete the persistent Security Command Center header entirely (it is the source of the
     on-screen self-contradiction).
  2. Delete routes: #vault-policy, #proposals, #audit-log, #recovery, #evidence-center,
     #frost-integration, #mainnet-proof-run. Delete their renderers, state, and copy.
  3. Delete all browser-ECDSA guardian signing (≈314 "guardian" references) — including the
     "GUARDIAN SIGNATURES n/3" gauge and the "Sign Next Guardian" CTA. If any attestation UI is
     retained, rename it "Intent Review Attestation" and ensure it can never count toward the
     2-of-3 FROST threshold.
  4. Reduce navGroups to ≤ 4 primary items built on the four human steps:
     Review → Verify → Authorize → Prove.
  5. Make the proof-first view (current /demo content) the default route at /.
  6. Delete the strings "FROST Demo: Not Yet Run", "Broadcast: Disabled in Prototype", and
     "Broadcast stays locked until reviewed FROST signing is integrated."
Acceptance criteria:
  - navItems.length <= 4
  - grep -ci "guardian\|FROST Live Demo\|Recovery Center" src/app.js → 0 (outside the allowlist)
  - No screen renders a prototype/broadcast-disabled claim anywhere on the page as the txid
  - 15-second comprehension test passes on the DEFAULT route
  - 390px: proof content is above the fold
Verification:     npm run check; re-capture ui-*.png at 1440×900, 1280×800, 390×844; re-run the
                  15-second test.
Do not:           Do not hide stale content with CSS. Do not delete src/demo-proof-state.mjs or its
                  tests — that reducer is the reason the proof UI is trustworthy.
Completion evidence: new screenshots + zero stale-string hits outside the allowlist.
```
---
```text
Task ID:          R-03
Priority:         P0
Finding IDs:      STALE-001, STALE-008, STALE-011, CLAIM-03, CLAIM-07, CLAIM-12, 16-DOCUMENTATION
Objective:        Rewrite README.md, package.json description, and SUBMISSION.md §10 so public
                  documentation states the truth: ZecSafe signed and broadcast a real shielded
                  Zcash mainnet transaction with 2-of-3 FROST and one participant unavailable.
Evidence:         README.md:21  "Prepare a production path for Zcash FROST signing."
                  README.md:59  "Transaction broadcast | External/manual in current build |
                                 ZecSafe verifies the txid but does not broadcast or custody funds"
                  README.md:23-45  22-item legacy feature inventory as the primary story
                  README: the verified txid 27d0e850…8527 appears NOWHERE
                  README.md:55,251  describes trusted-dealer; the real run used DKG (HANDOFF:146,544)
                  package.json:4  "FROST-style … prototype with read-only mainnet evidence"
                  SUBMISSION.md:81  "Public repository URL to be added"
Files/systems:    README.md, package.json, SUBMISSION.md
Dependencies:     none (can run in parallel with R-01/R-02)
Exact actions:
  1. Rewrite the README first screen to contain, in order: one-line thesis;
     "Lose one key. Not your ZEC."; 2-of-3 with one participant unavailable; the verified
     mainnet run with txid 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527 and
     height 3,409,837; the 60-second demo; `make judge-proof-mainnet`; precise limitations.
  2. Delete the 22-item legacy feature inventory (README:23-45).
  3. Rewrite the "Real vs Simulated" table. Broadcast is REAL and human-gated — not
     external/manual. Recovery remains SIMULATED and must say so.
  4. State the group setup mode as DKG (the project is currently UNDER-claiming this).
  5. Rewrite package.json description.
  6. Put the live repository URL in SUBMISSION.md §10.
Acceptance criteria:
  - grep -ci "does not broadcast\|Prepare a production path\|external/manual" README.md → 0
  - README first screen contains the txid and the judge command
  - package.json description contains neither "FROST-style" nor "read-only"
Verification:     Fresh reader test: can a judge, reading only the README first screen, state what
                  ZecSafe did on mainnet? Currently: no.
Do not:           Do not overstate. Broadcast is human-gated, recovery is not demonstrated,
                  rerandomized FROST is not covered by the NCC audit. Keep every existing
                  limitation disclosure.
Completion evidence: README diff + fresh-reader test result.
```
---
```text
Task ID:          R-04
Priority:         P0 (process gate)
Finding IDs:      01-BASELINE (dirty working tree)
Objective:        Commit the W4/W5 work and declare a submission commit, so the audit target is a
                  commit rather than an unnamed dirty tree.
Evidence:         git status --porcelain=v1 -uall → 25 entries (10 modified, 15 untracked)
                  V3 §6: "The final audit target must be a commit, not an unnamed dirty working
                  tree… cannot issue GO — SUBMISSION LOCK."
Files/systems:    git
Dependencies:     R-01, R-02, R-03 (commit the remediation together with W4/W5)
Exact actions:
  1. Commit the W4/W5 changes plus the R-01..R-03 remediation.
  2. Push to the public remote.
  3. Declare the submission commit in SUBMISSION.md.
Acceptance criteria:  git status clean; declared commit exists on origin/main.
Verification:     Fresh clone of the declared commit; npm run check; make judge-proof-mainnet;
                  make judge-proof-mainnet-tamper — all exit 0.
Do not:           Do not rewrite recorded evidence. fixtures/verified-mainnet-run/ must be
                  byte-identical (it is already committed at 0cd8aeb and must stay that way).
Completion evidence: commit SHA + fresh-clone transcript.
```
---
```text
Task ID:          R-05
Priority:         P0 (external — requires the human operator)
Finding IDs:      ZAUD-104, 02-HACKATHON-COMPLIANCE
Objective:        Complete the three mandatory submission artifacts the auditor cannot produce.
Evidence:         docs/execution/12-SUBMISSION-GATE.md:15-17 — demo video, ZecHub PR, and Discord
                  post are all unchecked. Official rules require a video demonstration and a
                  Discord post with repo + demo links. Deadline: July 15, 2026 UTC.
Files/systems:    external
Dependencies:     R-01..R-04 (record the video against the CORRECTED product, not the prototype)
Exact actions:
  1. Record a 45-75 second, four-chapter demo video against the remediated UI.
  2. Open the ZecHub submission PR (Hackathon/2026), FROST track.
  3. Post to the Zcash Global Discord with repository and demo links.
Acceptance criteria:  Video does not expose secrets, does not call the replay live, does not hide
                  the failure condition, does not claim confirmation early, does not overstate
                  recovery, does not overstate audit status.
Verification:     Watch the video end to end. Click every link.
Do not:           Do not record before R-02 lands — a video of the current UI would immortalize
                  "FROST Demo: Not Yet Run" next to a confirmed mainnet txid.
Completion evidence: video URL, PR URL, Discord permalink.
```
---
```text
Task ID:          R-06
Priority:         P1
Finding IDs:      BIND-02, CLAIM-08, ZAUD-904, ZAUD-1302
Objective:        Bring signer_review_mode inside the tamper-evident boundary and document it.
Evidence:         review-result-A/B.json → signer_review_mode: "semantic_pczt_review"
                  events.public.json:69,80,119,130 → discloses it honestly
                  proof.json → NO signer_review_mode field at all
                  PROOF_SPEC.md / TRUST_MODEL.md / SECURITY.md → zero occurrences
                  Consequence: the review mode is currently OUTSIDE the bundle hash.
Files/systems:    docs/proof/zecsafe-proof-v1.schema.json, src/zecsafe-proof-v1.mjs,
                  fixtures/verified-mainnet-run/proof.json, PROOF_SPEC.md,
                  docs/proof/TRUST_MODEL.md, SECURITY.md
Dependencies:     none
Exact actions:
  1. Add signer_review_mode to the zecsafe-proof-v1 schema and to the generator.
  2. REGENERATE the recorded bundle from the intact Level B source artifacts
     (/home/dell/.zecsafe/runs/p0-021..023). The bundle hash WILL change — that is correct.
  3. Document the mode and its limits in PROOF_SPEC.md and TRUST_MODEL.md:
     semantic_pczt_review checks PCZT semantics and compares the prepared pinned-tool SIGHASH
     fingerprint; it does NOT independently recompute the SIGHASH.
  4. Update the bundle hash wherever it is quoted (SUBMISSION.md:50).
Acceptance criteria:  proof.json contains signer_review_mode; make judge-proof-mainnet passes;
                  make judge-proof-mainnet-tamper passes; SUBMISSION.md quotes the new hash.
Verification:     Re-run both judge targets from a fresh clone.
Do not:           DO NOT hand-edit proof.json to insert the field. Regenerate it from the source
                  run artifacts. Never rewrite recorded evidence to make a finding disappear.
Completion evidence: regenerated bundle + passing verifier + updated docs.
```
---
```text
Task ID:          R-07
Priority:         P1
Finding IDs:      BIND-01, ZAUD-902
Objective:        State plainly that the Binding Firewall is a SEMANTIC check, and that the
                  FROST-group-to-PCZT-authorization-key linkage is established elsewhere.
Evidence:         The linkage IS real: the pinned signer library verified the aggregate signature
                  against the action's rerandomized verification key at apply time
                  (proof.json.limitations[4]; completion_flow:
                  "pczt-library-signer-apply-orchard-signature"), and mainnet acceptance at height
                  3,409,837 corroborates it. But the PCZT inspect path does not expose a FROST
                  group fingerprint, so the Binding Firewall does not prove it — and that
                  distinction currently rests on one easily-missed sentence in limitations[].
Files/systems:    PROOF_SPEC.md, docs/proof/TRUST_MODEL.md, SECURITY.md
Dependencies:     none
Exact actions:
  1. Add an explicit subsection stating: (a) the Binding Firewall is a semantic intent↔PCZT
     check; (b) it does NOT by itself prove the FROST group key is the PCZT action's
     spend-authorization key; (c) that linkage is established by the pinned signer library's
     verification at apply time and confirmed by Zcash consensus accepting the shielded spend.
Acceptance criteria:  A skeptical reader can locate this in under 30 seconds without parsing
                  the limitations array.
Do not:           Do not weaken the claim — the linkage is genuinely proven. Make it findable.
```
---
```text
Task ID:          R-08
Priority:         P1
Finding IDs:      SEC-001, SEC-002, PRIV-01
Objective:        Bind the local server to loopback and stop serving the repository root.
Evidence:         server.mjs:853  server.listen(port, cb)  ← no host arg
                  server.mjs:854  logs "listening on http://127.0.0.1:${port}"  ← untrue
                  $ ss -tlnp → LISTEN *:4890            (all interfaces)
                  $ curl /.git/HEAD → 200 ; /HANDOFF.md → 200 ; /server.mjs → 200
Files/systems:    server.mjs
Dependencies:     none
Exact actions:
  1. server.listen(port, "127.0.0.1", …)
  2. Replace the document root with an explicit allowlist: index.html, src/*, and
     fixtures/verified-mainnet-run/*. Deny dotfiles and repository metadata.
  3. Add CSP (default-src 'self'), X-Content-Type-Options: nosniff, Referrer-Policy: no-referrer,
     X-Frame-Options: DENY.
Acceptance criteria:  ss -tlnp shows 127.0.0.1 only; GET /.git/HEAD → 404; GET /HANDOFF.md → 404;
                  / and /demo and the proof fixtures still load.
Verification:     Restart the server and re-run the smoke tests.
Note:             Path traversal is ALREADY correctly defended (verified: /../../../etc/passwd and
                  encoded variants → 404). Do not "fix" the traversal guard; fix the document root.
```
---
```text
Task ID:          R-09
Priority:         P1
Finding IDs:      STALE-009, STALE-010, STALE-012, 16-DOCUMENTATION
Objective:        Separate internal operating context from the public judge path.
Evidence:         HANDOFF.md (947 lines) at the public top level, containing local absolute paths
                  (/home/dell/zecsafe, C:\Users\DELL\Downloads\...). Contains NO secrets — verified.
                  docs/operator-notepad.md is publicly served and still carries the prototype
                  "Winning Claim" and instructs "Start with Evidence Center, not the vault
                  dashboard" — contradicting DEMO.md.
Files/systems:    HANDOFF.md, docs/operator-notepad.md, docs/roadmap.md, docs/execution/
Exact actions:
  1. Move HANDOFF.md to docs/history/ and strip local absolute paths.
  2. Rewrite or delete docs/operator-notepad.md (its demo path is stale).
  3. Move docs/roadmap.md out of the judge path.
  4. Add an index to docs/execution/ labelling it completed/historical.
Acceptance criteria:  No internal operating doc at the public top level; zero absolute local paths;
                  README is the authoritative entry point.
Do not:           NEVER delete HANDOFF.md — it is the unique, authoritative run chronology.
                  Relocate before touching it.
```
---
```text
Task ID:          R-10
Priority:         P2
Finding IDs:      08-SERVER-API-SURVIVAL, 16-DOCUMENTATION (screenshots)
Objective:        Housekeeping.
Exact actions:
  1. Merge the duplicate /api/mainnet/status and /api/mainnet-status routes.
  2. Demote /api/transaction-proof to a clearly-labelled chain-observation helper on the proof
     page — never as "proof" of FROST provenance.
  3. Delete the stale docs/screenshots/ dashboard captures and regenerate AFTER R-02.
  4. Reconcile CI node-version (20) with the documented/tested runtime (24) — state a range.
  5. Consider pinning GitHub Actions by commit SHA rather than tag (P3, policy-dependent).
Acceptance criteria:  One mainnet-status route; screenshots show the remediated product.
```

## Ordering

```text
R-01 ─┐
R-02 ─┼─→ R-04 (commit + declare) ──→ R-05 (video, PR, Discord)  [external, deadline-critical]
R-03 ─┘
R-06, R-07, R-08, R-09  — parallel, land before R-04
R-10 — if time permits
```

R-05 depends on everything: **do not record the demo video until R-02 lands**, or the video will immortalize "FROST Demo: Not Yet Run" beside a confirmed mainnet txid.

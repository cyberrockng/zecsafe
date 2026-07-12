# 20 — Submission Gate

## Baseline and audit coverage

- [ ] Declared submission commit exists on the public remote — **NO.** Working tree is dirty (25 entries); no submission commit declared. → R-04
- [ ] Audit worktree is clean — **NO.**
- [x] V3 execution-plan hash recorded — `9cb90348…232bc`
- [x] V3 audit-contract hash recorded — `6aae8c43…f8ddc`
- [x] Recorded-run → freeze → submission lineage verified — `ad83269` → `0cd8aeb` → `707ced2`, proven by Git history
- [x] Level A public fresh-clone audit complete
- [x] Level B privileged provenance audit complete — manifest `sha256:002000ab…17df5`, outside Git

## Hackathon

- [x] Real Zcash mainnet interaction — txid `27d0e850…8527`, height 3,409,837, independently confirmed
- [x] Working prototype
- [x] One final project
- [x] Public repository
- [x] Open-source license (MIT)
- [x] Setup documentation
- [ ] Usage documentation — **README describes the superseded prototype** → R-03
- [ ] Demo video — **does not exist** → R-05
- [ ] ZecHub submission — **not created** → R-05
- [ ] Discord post — **not posted** → R-05

## Real FROST

- [x] Re-randomized FROST path (RedPallas)
- [x] Correct ciphersuite — `redpallas-rerandomized`
- [x] 2-of-3
- [x] Three participant profiles — alice/bob/eve, distinct fingerprints
- [x] One participant unavailable — C, genuinely offline
- [x] Unavailable participant not selected — `selected: false`
- [x] Two selected participants — A + B
- [x] Real rounds — frost-tools `7d33a95f`
- [x] Threshold reached — `THRESHOLD_REACHED`
- [x] Aggregate verified — `AGGREGATE_SIGNATURE_VERIFIED`, 64 bytes
- [x] Aggregate used in signed PCZT — `signed.pczt` = `df8cf3ad…`

## Binding Firewall

- [x] Intent schema
- [x] Integer zatoshis
- [x] Canonical commitment — `2bc6da15…`
- [x] PCZT fingerprint — `3823d5eb…`
- [x] Network check
- [x] Source/vault semantic check matches actual inspect support
- [ ] FROST group-to-PCZT authorization-key linkage independently verified — **linkage is REAL** (signer library verifies against the action's rerandomized verification key at apply time; mainnet acceptance corroborates) **but it is not established by the Binding Firewall and the distinction is buried in `limitations[4]`** → R-07
- [x] Recipient check
- [x] Amount check
- [x] Unexpected-output check
- [x] Memo/fee checks according to support — `memo_policy: LIMITED`, honestly reported
- [x] Mismatch blocks signing — fail-closed; no fail-open path found
- [ ] Signer-review mode disclosed — **in `events.public.json` yes; in `proof.json` and the docs, no** → R-06

## Transaction

- [x] Real PCZT / signing context / signed / proven / combined PCZT — all hashes verified at Level B
- [x] Human broadcast gate — `[WAIT] Mainnet broadcast requires human approval`
- [x] Real mainnet txid — extracted from the combined PCZT **before** broadcast
- [x] Chain observation
- [x] Accurate confirmation status — pre-specified rule; arithmetic verified

## Proof

- [x] `zecsafe-proof-v1` / JSON Schema / canonical bundle hash
- [x] Public/private/secret classification — enforced by a passing test
- [x] No secret in proof
- [x] One-command verifier / tamper detection (7/7)
- [x] Recorded fixture from the real run
- [x] Replay labelled recorded — zero "live run/signing/broadcast" hits
- [x] Verifier limitations stated

## Security / privacy

- [x] No secret in Git / build / fixtures — tracked files, full Git history, and public fixtures all clean
- [x] No arbitrary runner commands — fixed allowlist, argument arrays
- [x] No path traversal — verified blocked
- [x] Session substitution fails / broadcast replay controlled
- [x] Coordinator privacy trust disclosed
- [x] Signer linkability disclosed
- [x] Network privacy limit disclosed
- [x] Re-randomized FROST audit scope disclosed
- [x] Production custody not claimed
- [ ] Server bound to localhost — **NO. Binds all interfaces while logging 127.0.0.1** → R-08
- [ ] Web root is not the repository root — **NO. `/.git/HEAD` → 200** → R-08

## Judge experience

- [ ] Product understood in 30 seconds — **FAIL on the default route** → R-02
- [x] Judge proof works in 60 seconds — `make judge-proof-mainnet` from a fresh clone
- [x] Unavailable signer visible / Binding Firewall visible / mainnet evidence visible / tamper demo visible — **on `/demo`**
- [x] Desktop works / 390px works — mechanically clean, no overflow
- [ ] Proof not buried — **FAIL. The persistent header says "FROST Demo: Not Yet Run" and "Broadcast: Disabled in Prototype" directly above the confirmed txid** → R-02

## Quality

- [x] Dependency state verified — `NOT_APPLICABLE_WITH_REASON` (zero deps, no lockfile)
- [x] `npm run check` passes
- [x] Unit and integration coverage enumerated — 16 suites
- [x] Level B FROST/tool reproduction passes — every artifact hash matches the public bundle
- [x] `make proof-run-dry` passes
- [x] `make judge-proof-mainnet` passes
- [x] `make judge-proof-mainnet-tamper` passes
- [x] Lint / type-check / production-build — `NOT_APPLICABLE_WITH_REASON` (not declared; vanilla static-module stack)
- [x] Secret scans pass (workspace, Git history, fixtures, generated output)
- [x] Fresh-clone mainnet proof and tamper verification pass
- [ ] Screenshot secret scan — screenshots to be regenerated after R-02; current audit captures are clean

## Verdict

```text
NO-GO — P0 BLOCKERS REMAIN
```

Five P0s: R-01 (legacy proof-bundle with unrelated default txid), R-02 (stale prototype shell contradicting the proof on-screen), R-03 (README states the project does not broadcast), R-04 (no declared submission commit), R-05 (no demo video, no ZecHub PR, no Discord post — mandatory rules).

**No P0 is in the cryptography, the FROST implementation, the PCZT binding, the proof bundle, or the mainnet evidence.** Every P0 is in the product surface and the submission package. All are removals, rewrites, or external actions — none requires new cryptographic engineering.

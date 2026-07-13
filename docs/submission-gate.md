# Submission Gate

Generated for W5 on 2026-07-12.

## Rule Compliance

- [x] Zcash mainnet interaction proven
- [x] one final project
- [x] public repo package prepared
- [x] open-source license
- [x] setup docs
- [x] usage docs
- [x] mainnet explanation
- [x] working prototype
- [ ] short demo video
- [ ] ZecHub PR prepared/created
- [ ] Discord package prepared/posted

## Differentiator 1

- [x] threshold 2-of-3
- [x] three distinct participant profiles
- [x] one participant unavailable
- [x] unavailable participant not selected
- [x] exactly two selected
- [x] real FROST rounds
- [x] threshold reached
- [x] aggregate signature verified
- [x] signature used in transaction completion

## Differentiator 2

- [x] canonical reviewed intent
- [x] intent commitment
- [x] PCZT fingerprint
- [x] network check
- [x] recipient check
- [x] exact zatoshi amount check
- [x] unexpected-output check
- [x] memo/fee checks according to actual support
- [x] mismatch blocks signing
- [x] signer review mode truthfully recorded

## Differentiator 3

- [x] `zecsafe-proof-v1`
- [x] JSON Schema
- [x] canonical bundle hash
- [x] public/private/secret classification
- [x] no secret in public fixture
- [x] verifier
- [x] `make judge-proof-mainnet`
- [x] tamper demo
- [x] verified recorded mainnet fixture
- [x] replay labeled recorded, not live

## Mainnet

- [x] dedicated tiny-value proof wallet
- [x] network main
- [x] current toolchain compatible for recorded run
- [x] real mainnet txid
- [x] submitted state recorded
- [x] observed state recorded
- [x] mined state recorded when true
- [x] confirmed state recorded only when true
- [x] proof run linked to txid

## Truth / Security

- [x] browser attestations not called FROST
- [x] coordinator privacy trust disclosed
- [x] signer privacy/linkability limit disclosed
- [x] network privacy limit disclosed
- [x] rerandomized FROST audit-scope caveat disclosed
- [x] group setup method disclosed
- [x] recovery status truthful
- [x] chain does not claim FROST provenance
- [x] no production custody claim
- [x] no secret in Git/build/fixtures
- [x] no arbitrary-command runner
- [x] no path traversal found
- [x] session substitution tests pass

## Judge Experience

- [x] product understandable in 30 seconds
- [x] 60-second judge proof works
- [x] unavailable signer visible
- [x] Binding Firewall visible
- [x] mainnet tx visible
- [x] proof verifier visible
- [x] tamper climax visible
- [x] exact code paths listed in README/DEMO
- [ ] desktop visual recording pass
- [ ] 390px visual recording pass

## Quality Results

Command:
`npm run check`
Result:
PASS
Exit code:
0
Passed:
static verification, unit tests, proof tests, W4/W5 tests, syntax checks, security scan
Failed:
none
Warnings:
none
Evidence/log path:
terminal output in W5 execution session

Command:
`make judge-proof-mainnet`
Result:
`VERDICT: VERIFIED RECORDED ZECSAFE PROOF`
Exit code:
0
Passed:
schema, bundle hash, network main, 2-of-3 FROST policy, one unavailable participant, two selected signers, intent-PCZT binding, threshold reached, txid present, recorded run integrity
Failed:
none
Warnings:
none
Evidence/log path:
terminal output in W5 execution session

Command:
`make judge-proof-mainnet-tamper`
Result:
`VERDICT: TAMPER DETECTION PASS`
Exit code:
0
Passed:
txid, threshold, group_fingerprint, selected_signer, intent_commitment, pczt_fingerprint, and binding_status mutations rejected
Failed:
none
Warnings:
none
Evidence/log path:
terminal output in W5 execution session

## Manual Mainnet Proof

Run ID:
`p0-023-20260712T145358Z`
Network:
`main`
Result:
`CONFIRMED` at recording
Txid:
`27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527`
Submitted:
recorded in `fixtures/mainnet-demo/p0-023-mainnet-broadcast.json`
Observed:
recorded
Mined:
height `3409837`
Confirmed:
4 confirmations at recording
Proof bundle:
`fixtures/verified-mainnet-run/proof.json`
Bundle verify:
`make judge-proof-mainnet`
ZecSafe commit:
`ad83269298b73396ac0f4b743c59301de77fe937` in recorded proof

## Verdict

NO-GO - P0 BLOCKERS REMAIN

Remaining blockers are not code blockers: demo video, ZecHub PR, Discord posting, and final visual recording passes require human/external submission action.

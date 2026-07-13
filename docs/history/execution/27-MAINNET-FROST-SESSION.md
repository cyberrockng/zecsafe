> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-021 — Live A+B FROST Session over the Mainnet PCZT with C Unavailable

Task ID: `ZSAFE-P0-021`

Recorded UTC: `2026-07-12T14:40:42.000Z`

Status: `PASS`

External run: `$HOME/.zecsafe/runs/p0-021-20260712T142858Z`

## Required state — all reached

```text
C unavailable                 YES (Eve process never started; not in signer set)
A selected                    YES
B selected                    YES
C not selected                YES
A review                      PASS (semantic_pczt_review)
B review                      PASS (semantic_pczt_review)
threshold reached             THRESHOLD_REACHED (2 of 3)
aggregate signature verified  AGGREGATE_SIGNATURE_VERIFIED (64 bytes)
```

Actual signer-review mode recorded: `semantic_pczt_review` — each selected signer semantically reviewed the transaction context (network, recipient, amount, output count, fee, memo policy) against the real PCZT inspect review, binding report, and signing context, and issued the confirmation phrase. The review does not claim an independently rerun SIGHASH.

## What happened, in order

1. **Sighash + randomizer extraction.** The `zecsafe-pczt-helper` (pczt signer library at librustzcash rev `8e6864a3c67cab3c64a052dd20f83c553662e8b2`) was extended with Orchard support (`prepare-orchard`, `apply-orchard`, generalized from the existing Ironwood path) and run against the P0-020 PCZT (`sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931`). It produced a 32-byte shielded sighash and one Orchard spend randomizer (action index 0). Cross-check: the raw sighash bytes equal the `Sighash for shielded components` line reported by pinned `zcash-devtool pczt inspect` — two independent pinned tools agree.
2. **Signer selection.** `npm run signers:select` over the mainnet demo group: A and B `AVAILABLE` and selected, C `UNAVAILABLE` and not selected → `SATISFIABLE`, `ALLOWED`.
3. **Signing context.** `prepareSigningContextV1` bound the actual PCZT bytes, the PASS binding report (ref `sha256:0bd48dfdf1debdbe495f153341e24598bbbd09b79b490a586c218a0eb05cbcb4`), and the non-expiring P0-019 intent to the sighash fingerprint `sha256:cd551487fcc14602d52789ccd77bc3443ec16665ec5792ffa50a943051c99928` → `READY`. (Note: the P0-020 fixture separately records `sha256:aadf4d88…` which fingerprints the sighash *hex string* from the inspect text; the signing-context fingerprint hashes the raw 32 bytes. Both derive from the same sighash.)
4. **Signer reviews.** `npm run signer:review` for A and then B with confirmation `I REVIEWED AND APPROVE` → both `PASS`, `FROST SESSION: ALLOWED`.
5. **Live ceremony.** Four separate OS processes against `frostd` (frost-tools commit `7d33a95fecc91dacdb1503933e2bee43780d3293`) on `127.0.0.1:2757` with run-local TLS: coordinator created the session for signers A+B; Alice and Bob participant processes each received the signing package, displayed the hex-encoded message — exactly the mainnet PCZT sighash — and answered the signing prompt; the coordinator supplied the PCZT-bound Orchard randomizer for rerandomized RedPallas signing, aggregated the shares, and wrote the 64-byte signature. FROST aggregation verifies the group signature before output. Eve never ran.
6. **Session gate.** `npm run frost:session` over the live artifacts → `THRESHOLD_REACHED`, `AGGREGATE_SIGNATURE_VERIFIED`.

## Public identities

```text
group fingerprint:               sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
A public fingerprint:            sha256:a0c24753e044d224a7e5a9d7b572f6abb14375693b090e4c24b49cd856c52b0b
B public fingerprint:            sha256:533c516a94d7d1dec4192dd46afb1fe02620ce6bbd974736d0cfe7c36ec14cf5
C public fingerprint:            sha256:d6400dfe81d098e85cce57fe785b15c2ae5a3916e9b319022af6d14c2e31213c
pczt fingerprint:                sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931
sighash fingerprint:             sha256:cd551487fcc14602d52789ccd77bc3443ec16665ec5792ffa50a943051c99928
aggregate signature fingerprint: sha256:c9b7508cd554dfa8de311cdaabd4518c19093c95da5761474808cf2c277f12ac
session fingerprint:             sha256:cd6d729fcccc48458027b584cbc32363b65c83a9c29e7d2c91e5f1211605d9f8
intent commitment:               sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
```

## Hard-rule compliance

- Shares were never loaded into one custom ZecSafe process: signing ran in separate frost-client participant processes for A and B against frostd; ZecSafe only consumed public-safe reports.
- No legacy browser signatures were substituted; the signature came from the live frost-tools ceremony.
- No cached or unrelated aggregate signature was used: the signature was created in this session over this PCZT's sighash with this PCZT's randomizer; its fingerprint did not exist before this run.
- C was actually unavailable: no Eve process was started and Eve was not in the coordinator's `-S` signer set.

## Evidence

Public fixture:

```text
fixtures/mainnet-demo/p0-021-mainnet-frost-session.json
```

External artifacts (kept outside the repository): raw sighash bytes, Orchard randomizer, raw aggregate signature, selection/review/session inputs and reports, participant configs, contact tokens, TLS keys, and process logs under the external run directory.

## Judge-proof impact

- Public-safe evidence: selection result, signing-context report, both signer-review results, FROST session report, and ceremony/process attestations — all fingerprint-level.
- Private exclusions: shares, nonces, randomizer bytes, raw sighash, raw signature, configs, contact tokens, TLS keys.
- Negative/tamper case: the existing test suites cover blocked selection, failed reviews (amount/sighash mutation, missing confirmation), and failed session gates (byte-length and sighash mismatches); the Binding Firewall tamper probe from P0-020 remains the live negative for this PCZT.
- Allowed claim: "Two of three FROST participants, with the third genuinely unavailable, semantically reviewed the real mainnet PCZT context and produced a live, verified 64-byte rerandomized RedPallas aggregate signature over that PCZT's shielded sighash."
- Forbidden claim: any claim that the signature has been applied to the PCZT, that the PCZT is proven or combined, or that anything was broadcast.

## Boundary at task end

```text
signature applied to PCZT:  NO
PCZT proven/combined:       NO
broadcast status:           NOT_BROADCAST
budget consumed:            0 zatoshis
next gate:                  explicit human approval before ZSAFE-P0-022
```

# ZSAFE-P0-022 — Final Mainnet PCZT Completion and Broadcast Gate

Task ID: `ZSAFE-P0-022`

Recorded UTC: `2026-07-12T14:49:31.000Z`

Status: `PASS_AWAITING_BROADCAST_APPROVAL`

External run: `/home/dell/.zecsafe/runs/p0-022-20260712T144710Z`

## Pipeline (all real, all offline)

1. **Signed PCZT.** `zecsafe-pczt-helper apply-orchard` applied the P0-021 64-byte FROST aggregate signature to Orchard action 0 of the P0-020 source PCZT. The pinned signer library verifies the signature against the action's rerandomized verification key and the shielded sighash before accepting it — a cryptographic confirmation of the FROST signature, not just a byte-length check.
2. **Proven PCZT.** `zcash-devtool pczt prove` (clean pinned checkout `1b065594d958d1cad2deafe7cd2e2fcc2774c46c`) created the Halo2 Orchard proofs from the same source PCZT, offline.
3. **Combined PCZT.** `zcash-devtool pczt combine` merged the signed and proven PCZTs.
4. **Final binding.** The combined PCZT was re-inspected and re-bound to the P0-019 intent: `INTENT ↔ PCZT: PASS`, and the combined inspect text is byte-identical to the P0-020 source inspect text (fingerprint `sha256:84837faef5268e0347ee41267584e98b7b2876c137c507a2380a6e32e979dd14`), so recipient, amounts, and fee are unchanged through completion.
5. **Offline extract.** `zcash-devtool pczt extract` produced the fully authorized transaction; its txid equals the inspect TxID before and after completion. No network was touched.
6. **Completion gate.** `npm run pczt:complete` over the real artifact fingerprints: every check PASS.

## Fingerprint chain

```text
intent commitment:      sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
source PCZT:            sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931
sighash:                sha256:cd551487fcc14602d52789ccd77bc3443ec16665ec5792ffa50a943051c99928
aggregate signature:    sha256:c9b7508cd554dfa8de311cdaabd4518c19093c95da5761474808cf2c277f12ac
signed PCZT:            sha256:df8cf3ad2fa7cfaa09def2756ba1995959fe9b70c0d5d98a9934cfd3e071b162
proven PCZT:            sha256:6b32eaa4f0fbd8abf862943cbabd77a46d2b3ab561038f4a8a617fb908235869
combined PCZT:          sha256:945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184
offline extracted txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
```

## Completion gate output

```text
SIGNED_PCZT                 PASS
PROVEN_PCZT                 PASS
PCZT_COMBINE                PASS
FINAL BINDING               PASS
BROADCAST                   NOT_BROADCAST
FINAL PCZT                  sha256:945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184
```

## Broadcast approval screen

```text
!!! MAINNET BROADCAST APPROVAL REQUIRED !!!

Network                    main
Intent commitment          sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
PCZT fingerprint           sha256:945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184
Intent ↔ PCZT              PASS
Threshold                  2 of 3
Unavailable                1
Selected signers           2
Aggregate signature        VERIFIED
Signed PCZT                PASS
Proven PCZT                PASS
Combined PCZT              PASS
Destination                u1y3untlvq77…5u2tz6a0 (vault self-send)
Amount                     0.00005000 ZEC (5000 zatoshis)
Fee                        10000 zatoshis (ZIP-317)
```

Broadcast requires the human operator to explicitly approve the exact broadcast action (ZSAFE-P0-023). It must never happen automatically.

## Budget

```text
project budget:                 20000 zatoshis
spent so far:                   0
committed if broadcast:         10000 zatoshis (fee only; self-send returns both outputs)
post-broadcast vault balance:   10000 zatoshis expected
```

## Evidence

Public fixture:

```text
fixtures/mainnet-demo/p0-022-mainnet-pczt-completion.json
```

External artifacts (kept outside the repository): signed/proven/combined PCZT bodies, raw inspect output, completion package/result, extract output, and logs under the external run directory.

## Judge-proof impact

- Public-safe evidence: the full fingerprint chain from intent commitment to combined PCZT and offline txid, the field-level final binding report, and the completion gate result.
- Private exclusions: raw PCZT bodies, raw sighash, raw signature, randomizer.
- Negative/tamper case: `npm run test:pczt-complete` covers mock signatures, corrupt signed/proven PCZTs, and mismatched pairs; the P0-020 live tamper probe remains the binding negative for this PCZT.
- Allowed claim: "A fully authorized, proven, intent-bound Zcash mainnet transaction exists offline, completed by a 2-of-3 FROST threshold signature with one participant unavailable, and is waiting at the human broadcast gate."
- Forbidden claim: any claim that the transaction was broadcast, accepted, mined, or confirmed.

## Boundary at task end

```text
broadcast status:   NOT_BROADCAST
budget consumed:    0 zatoshis
next gate:          explicit human approval of the exact broadcast action (ZSAFE-P0-023)
```

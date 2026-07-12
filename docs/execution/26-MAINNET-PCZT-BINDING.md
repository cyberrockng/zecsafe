# ZSAFE-P0-020 — Mainnet PCZT Creation and Binding Firewall

Task ID: `ZSAFE-P0-020`

Recorded UTC: `2026-07-12T14:19:39.000Z`

Status: `PASS`

External run: `/home/dell/.zecsafe/runs/p0-020-20260712T141448Z`

## What happened

1. The mainnet UFVK/view-only wallet was re-synchronized to tip `3409805` with the fingerprinted P0-018 pre-Ironwood compatibility binary (`zecrocks`, direct). Balance re-confirmed: `20000` Orchard zatoshis.
2. The final mainnet PCZT was created for real from the view-only wallet with `zcash-devtool pczt create` (account `9b81aa0f-5216-4007-977d-f8e95ac0ace9`, ZIP-317 standard fee rule):

```text
pczt byte length: 4897
pczt fingerprint: sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931
unbroadcast txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
transaction version: V5
```

3. The pinned inspect adapter (`zcash-devtool pczt inspect`, clean checkout at commit `1b065594d958d1cad2deafe7cd2e2fcc2774c46c`) produced the strict review:

```text
2 Orchard actions
action 0: spend 20000 -> output 5000 (modeled change, recipient not reported)
action 1: dummy spend -> output 5000 to the vault Orchard address (recipient reported)
fee: 20000 - 10000 = 10000 zatoshis
raw inspect fingerprint: sha256:84837faef5268e0347ee41267584e98b7b2876c137c507a2380a6e32e979dd14
shielded sighash fingerprint: sha256:aadf4d885fa722b766c4a35563c88464edb43432f411e2460fe56a52d7cb85c8
```

4. The Binding Firewall bound the P0-019 intent to this PCZT review. Every implemented check allows signing:

```text
source               PASS
network              MATCH
recipient            MATCH
amount               MATCH
fee_policy           PASS      (10000 observed <= 15000 reviewed maximum)
memo_policy          LIMITED   (inspect does not expose memo content; empty reviewed memo allowed)
unexpected_output    PASS
change_output        PASS
INTENT <-> PCZT      PASS
FROST SESSION        ALLOWED
intent commitment    sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
```

5. Live tamper probe (negative evidence): mutating the intent amount `5000 -> 6000` and re-binding against the same real review produced `FAIL`, `amount MISMATCH`, `FROST SESSION BLOCKED`, and the full blocked-operation list. No override path exists.

## Parser extension

Mainnet Orchard output from `pczt inspect` uses `N Orchard actions:` and appends a `Sighash for shielded components:` footer, which the adapter (built against testnet Ironwood output) rejected. `src/pczt-inspect-v1.mjs` now parses Ironwood and Orchard as one shielded-action format class and accepts the optional sighash footer, exposing `orchard_action_count`/`shielded_action_count` and `shielded_sighash`. `scripts/pczt-inspect-v1.test.mjs` adds Orchard positive coverage and negative coverage (malformed output line, malformed sighash line, wrong-network recipient, trailing extra output).

## Budget enforcement

```text
project budget:            20000 zatoshis (includes all fees)
intent amount:             5000 (self-send; returns to the vault)
actual ZIP-317 fee:        10000  <= 15000 reviewed maximum  PASS
amount + actual fee:       15000  <= 20000 budget            PASS
spent so far:              0 zatoshis (PCZT is unsigned and unbroadcast)
worst-case net debit:      10000 zatoshis (the fee) if broadcast is later approved
```

## Evidence

Public fixture:

```text
fixtures/mainnet-demo/p0-020-mainnet-pczt-binding.json
```

External artifacts (kept outside the repository):

```text
/home/dell/.zecsafe/runs/p0-020-20260712T141448Z/artifacts/source-mainnet.pczt
/home/dell/.zecsafe/runs/p0-020-20260712T141448Z/artifacts/source-mainnet.inspect.txt
/home/dell/.zecsafe/runs/p0-020-20260712T141448Z/artifacts/source-mainnet.review.json
/home/dell/.zecsafe/runs/p0-020-20260712T141448Z/artifacts/binding-report.json
/home/dell/.zecsafe/runs/p0-020-20260712T141448Z/artifacts/tamper-binding-report.json
```

## Judge-proof impact

- Public-safe evidence: PCZT fingerprint, raw-inspect fingerprint, field-level binding report (values appear only as per-field commitments), fee, output model, unbroadcast txid, and the live tamper probe are all recorded in the public fixture.
- Private exclusions: the raw PCZT bytes, raw inspect text, and raw shielded sighash stay in the external run directory; no UFVK, wallet DB, spend key, share, nonce, or randomizer was touched.
- Negative/tamper case: live amount-mutation probe FAILED and blocked `signing.prepare`, `frost.session.start`, `broadcast.preview`, `broadcast.execute`; test-suite mutation coverage also passes.
- Allowed claim: "A real mainnet PCZT exists that provably matches the human-approved P0-019 intent under the Binding Firewall, with a 10000-zatoshi ZIP-317 fee inside the approved ceiling."
- Forbidden claim: any claim that a FROST signature, completed transaction, or broadcast exists for this PCZT.

## Boundary at task end

```text
FROST session started:     NO
signatures created:        NO
broadcast status:          NOT_BROADCAST
budget consumed:           0 zatoshis
next gate:                 explicit human approval before ZSAFE-P0-021
```

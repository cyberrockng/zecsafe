> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-019 — Exact Mainnet Proof Intent

Task ID: `ZSAFE-P0-019`

Recorded UTC: `2026-07-12T14:07:32.000Z`

Status: `INTENT_CREATED`

## Purpose

Create the exact deterministic `zecsafe-intent-v1` for the mainnet proof run and present the human review screen. This task creates the intent commitment only. It does not create a PCZT, does not start a FROST session, and does not broadcast anything.

## Human-approved values

All spend-relevant values were explicitly supplied/approved by the user at the P0-019 human gate:

```text
destination:  vault self-send (the vault's own FROST-controlled Orchard unified address)
amount:       5000 zatoshis (0.00005000 ZEC)
memo:         none
fee policy:   tool_default, max_fee_zatoshis 15000
expiry:       none
```

## Review screen

```text
NETWORK                  ZCASH MAINNET
VAULT                    sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
THRESHOLD                2 OF 3
DESTINATION              u1y3untlvq77…5u2tz6a0 (vault self-send)
AMOUNT                   0.00005000 ZEC
AMOUNT ZATOSHIS          5000
MEMO                     NONE
FEE POLICY               tool_default max 15000 zatoshis
INTENT COMMITMENT        sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
```

## Budget enforcement

Project budget is the wallet-observed `20000` Orchard zatoshis from P0-018 and includes all fees.

```text
amount_zatoshis            5000
max_fee_zatoshis           15000
amount + max fee           20000  <= 20000 budget  PASS
self-send                  yes; worst-case net debit is the fee (<= 15000 zatoshis)
```

Later PCZT creation must reject any transaction whose actual fee exceeds `max_fee_zatoshis` and must not retry when remaining balance is insufficient.

## Evidence

Public fixture:

```text
fixtures/mainnet-demo/p0-019-mainnet-proof-intent.json
```

Intent commitment (deterministic; reproduced twice with identical output and independently confirmed by hashing the canonical intent JSON with `sha256sum`):

```text
sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
```

Reproduce:

```bash
cd $HOME/zecsafe
npm run intent:create -- \
  --network main \
  --vault-id vault_zecsafe_mainnet_demo \
  --group-fingerprint sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354 \
  --recipient u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0 \
  --amount-zatoshis 5000 \
  --memo-utf8 "" \
  --fee-mode tool_default \
  --max-fee-zatoshis 15000 \
  --created-at 2026-07-12T14:07:32.000Z \
  --print-json
```

## Judge-proof impact

- Public-safe evidence: the full canonical intent, its commitment, the review screen, and the budget check are recorded in the P0-019 fixture. The recipient is the vault's own Orchard address, already public in the P0-017/P0-018 fixtures, so no new private data is disclosed.
- Private exclusions: no UFVK, wallet DB, spend key, participant share, nonce, or randomizer is touched or recorded by this task.
- Negative/tamper case: any mutation of the intent fields changes the canonical JSON and therefore the sha256 commitment; the existing `npm run test:intent` mutation coverage plus the Binding Firewall (P0-020) reject a PCZT that does not match this commitment.
- Allowed claim: "The exact mainnet proof intent exists, is deterministic, was human-approved field by field, and fits the 20000-zatoshi budget including the fee ceiling."
- Forbidden claim: any claim that a mainnet PCZT, FROST signature, transaction, or broadcast exists for this intent.

## Boundary at task end

```text
PCZT created:              NO
FROST session started:     NO
broadcast status:          NOT_BROADCAST
budget consumed:           0 zatoshis (intent creation spends nothing)
next gate:                 explicit human approval before ZSAFE-P0-020
```

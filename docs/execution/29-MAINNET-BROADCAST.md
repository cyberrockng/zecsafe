# ZSAFE-P0-023 — Mainnet Broadcast and Chain Truth

Task ID: `ZSAFE-P0-023`

Recorded UTC: `2026-07-12T15:01:30.000Z`

Status: `CONFIRMED`

External run: `/home/dell/.zecsafe/runs/p0-023-20260712T145358Z`

## Human approval

The operator explicitly approved the exact action at the P0-022 broadcast gate:

```text
"I approve broadcasting txid 27d0e850…8527 to Zcash mainnet."
```

Exactly one transaction was broadcast, and the returned txid matches both the approved txid and the P0-022 offline extract.

## Broadcast

```text
path:      zcash-devtool pczt send (P0-018 pre-Ironwood compatibility binary; base commit 1b065594d958d1cad2deafe7cd2e2fcc2774c46c)
server:    zecrocks (https://zec.rocks:443), connection direct
input:     combined PCZT sha256:945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184
exit:      0
returned:  27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
```

## Documented chain-status rule

```text
SUBMITTED  = pinned pczt send exited 0 and echoed the txid
OBSERVED   = the wallet's own light-client sync via zec.rocks lists the txid in wallet list-tx
MINED      = wallet list-tx reports a mined height for the txid
CONFIRMED  = observed chain tip height >= mined height + 2 (3 confirmations including the mining block)
```

## Chronology (all statuses recorded only after their evidence existed)

```text
SUBMITTED   2026-07-12T14:53:58Z   send started 14:53:58.727Z, exited 0 at 14:54:20.033Z
MINED-BLOCK 2026-07-12T14:54:27Z   block 3409837 timestamp (mined ~7 seconds after submission completed)
OBSERVED    2026-07-12T14:56:43Z   first post-broadcast wallet sync listed the txid
MINED       2026-07-12T14:56:43Z   wallet reported mined height 3409837
CONFIRMED   2026-07-12T14:59:57Z   observed chain tip 3409840 >= 3409839 (4 confirmations at observation)
```

## Wallet-observed transaction

```text
txid:        27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
mined:       3409837 (2026-07-12 14:54:27 UTC)
fee paid:    0.00010000 ZEC (10000 zatoshis)
output 0:    0.00005000 ZEC Orchard, change back to the vault, empty memo
output 1:    0.00005000 ZEC Orchard, self-send payment to the vault's own address, empty memo
```

## Budget ledger (final for this transaction)

```text
project budget:                    20000 zatoshis
fee debited on-chain:              10000 zatoshis
value returned to the vault:       10000 zatoshis (5000 change + 5000 self-send)
cumulative amount + fees:          15000 <= 20000  PASS
remaining vault value:             10000 zatoshis
```

The two new 5000-zatoshi notes are wallet-observed but reported non-spendable until they reach the wallet's note-maturity confirmation depth. No funds are missing; no additional funding was requested or accepted; no retry or second broadcast occurred.

## Acceptance criteria check

```text
real txid:                YES — returned by the server and observed mined on chain
network main:             YES — chain_name main, zec.rocks
run ID linked:            YES — p0-023-20260712T145358Z, linked to p0-019/020/021/022 evidence
status chronology:        accurate; each status recorded only when its evidence existed
no false confirmation:    CONFIRMED only after tip >= mined + 2 per the documented rule
```

## Evidence

Public fixture:

```text
fixtures/mainnet-demo/p0-023-mainnet-broadcast.json
```

External artifacts: send stdout/stderr, sync logs, wallet list-tx captures, get-info captures, and the confirmation-rule record under the external run directory.

## Judge-proof impact

- Public-safe evidence: broadcast path, exit status, txid, mined height, block time, confirmation chronology, fee, and budget ledger. The txid is publicly visible on any Zcash mainnet explorer; the shielded contents remain private to the viewing key.
- Allowed claim: "The FROST 2-of-3 threshold transaction — created, reviewed, bound, signed with one participant unavailable, proven, and completed entirely through the recorded pipeline — was accepted by Zcash mainnet and confirmed at height 3409837."
- Forbidden claim: none of the prior forbidden claims remain except: do not claim more confirmations than observed, and do not claim the remaining notes are spendable before the wallet reports them spendable.

## Boundary at task end

```text
broadcasts performed:  exactly 1 (the approved transaction)
budget consumed:       10000 zatoshis (fee); 10000 zatoshis remain in the vault
next gate:             explicit human approval before ZSAFE-P0-024 (freeze the verified mainnet run fixture)
```

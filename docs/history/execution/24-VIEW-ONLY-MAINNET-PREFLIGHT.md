> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-018 - View-Only Mainnet Synchronization and Balance

Status: `COMPLETE`.

Completed UTC: `2026-07-12T13:45:53.014Z`.

## Outcome

The dedicated mainnet UFVK/view-only wallet synchronized successfully and observed the funded Orchard note:

```text
status: PASS
network: main
wallet type: UFVK/view-only
birthday height: 3408981
observed tip: 3409775
sync status: SYNC_COMPLETE
balance observed: YES
funded value observed: YES
total: 20000 zatoshis / 0.00020000 ZEC
Orchard spendable: 20000 zatoshis / 0.00020000 ZEC
```

This completes P0-018. It does not create a transaction, authorize a spend, or approve P0-019.

## Compatibility Fix

The pinned `zcash-devtool` requested future Ironwood subtree roots after loading Sapling and Orchard roots. The current `zec.rocks` server returned `Unknown: unrecognized shielded protocol` as a stream error instead of an empty Ironwood stream.

The official pinned checkout remains clean. P0-018 uses an isolated detached worktree with a narrow compatibility patch:

```text
official base commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
official checkout: $HOME/.zecsafe/toolchain/zcash-devtool
compatibility worktree: $HOME/.zecsafe/toolchain/zcash-devtool-p0-018-compat
patch: patches/zcash-devtool/p0-018-pre-ironwood-subtree-compat.patch
patch ref: sha256:4a44cfc533dec72fb4e93bcbf81406260d4b3f6e77344b53035426ab297c7d8e
binary ref: sha256:8e8e2110e80bb5ea92924e7300ddcf57cb58e7e4f2a0439404b5b59f836ba0b9
```

The patch tolerates only the exact `tonic::Code::Unknown` response with message `unrecognized shielded protocol`, at both RPC establishment and stream-consumption boundaries. Different status codes and messages still fail closed.

## Funding Evidence

Sender-provided transaction:

```text
txid: 9571fcf98f0d7b47ff1dfccc46f7c83412698a44b1aed147ed333800c95fe078
block: 3409633
time UTC: 2026-07-12 10:35:15
transaction type: shielded
transaction fee: 0.0001 ZEC
Orchard action transfers: 2
```

The public explorer alone could not reveal the shielded recipient or amount. The completed local UFVK scan now supplies the missing wallet-observed evidence: the target view-only wallet reports exactly `20000` Orchard zatoshis.

## Final Fixture

```text
fixture: fixtures/mainnet-demo/p0-018-view-only-preflight-funded.json
schema: zecsafe-mainnet-view-preflight-v1
recorded_at: 2026-07-12T13:45:53.014Z
status: PASS
network: main
wallet_type: UFVK/view-only
birthday_height: 3408981
observed_tip: 3409775
sync_status: SYNC_COMPLETE
balance_observed: YES
funded_value_observed: YES
total_zatoshis: 20000
orchard_spendable_zatoshis: 20000
coordinator spend key: ABSENT
coordinator participant share: ABSENT
preflight_ref: sha256:112c3b13a12b5760cbc2590771a3ec735e46e5bbd12c78caf5d80f6cd9598eea
```

Historical diagnostic fixtures remain available:

```text
fixtures/mainnet-demo/p0-018-view-only-preflight-pending.json
fixtures/mainnet-demo/p0-018-view-only-preflight-sync-blocked.json
```

## Final Output

```text
[PASS] P0-018 view-only mainnet preflight
Network: main
Wallet type: UFVK/view-only
Birthday height: 3408981
Observed tip: 3409775
Sync status: SYNC_COMPLETE
Balance observed: YES
Funded value observed: YES
[PASS] network_main
[PASS] wallet_type_view_only
[PASS] birthday_height_recorded
[PASS] observed_tip_recorded
[PASS] address_main_orchard
[PASS] sync_status
[PASS] funded_value_observed
[PASS] no_spend_key_in_coordinator_workspace
[PASS] no_participant_share_in_coordinator_workspace
```

## Commands

One-shot preflight with synchronization:

```bash
npm run mainnet:preflight -- --sync --summary
```

Bounded watcher:

```bash
npm run mainnet:watch -- --sync --summary --max-attempts 30 --interval-ms 60000
```

Reproduce the compatibility build:

```bash
git -C $HOME/.zecsafe/toolchain/zcash-devtool worktree add --detach $HOME/.zecsafe/toolchain/zcash-devtool-p0-018-compat 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
git -C $HOME/.zecsafe/toolchain/zcash-devtool-p0-018-compat apply $HOME/zecsafe/patches/zcash-devtool/p0-018-pre-ironwood-subtree-compat.patch
cargo test --locked identifies_only_the_known_pre_ironwood_response
cargo build --locked
```

Run the final two Cargo commands from the compatibility worktree.

## Public-Safe Evidence

The fixture contains network, wallet type, account metadata, the public Orchard address, observed tip, pool balances, compatibility patch and binary fingerprints, and coordinator workspace scan results.

The fixture excludes UFVK/UIVK values, wallet database contents, participant configs, FROST shares, contact tokens, TLS private keys, seed phrases, spending keys, and raw sync logs.

## Acceptance Criteria

- [x] Mainnet network observed.
- [x] UFVK/view-only account observed.
- [x] Birthday height recorded.
- [x] Orchard-only mainnet address inspected.
- [x] Sync completed through a tip above funding block `3409633`.
- [x] `20000` funded zatoshis observed by the local view-only wallet.
- [x] No spend key in the coordinator wallet workspace.
- [x] No participant share in the coordinator wallet workspace.
- [x] Public fixture excludes private material.
- [x] No transaction created or broadcast by the preflight.

## Claim Now Allowed

```text
ZecSafe completed P0-018: its dedicated mainnet UFVK/view-only wallet synchronized and observed 0.00020000 ZEC in the Orchard pool without exposing spending authority.
```

## Claim Still Forbidden

```text
ZecSafe has not created, signed, or broadcast the P0-019 mainnet transaction, and P0-018 does not authorize any spend.
```

## Verification

```bash
cargo test --locked identifies_only_the_known_pre_ironwood_response
cargo build --locked
npm run test:mainnet-view
npm run mainnet:preflight -- --sync --summary
npm run check
```

> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-003 - PCZT View-Only Reproduction

Status: `ZSAFE-P0-003` complete with funding boundary.

Completed UTC: `2026-07-11T07:09:33Z`

## Scope

Reproduce the official `zcash-devtool` PCZT/view-only wallet flow in an external workspace without committing wallet databases, viewing keys, identity files, generated addresses, PCZT bodies, or logs containing private wallet material.

This task did not fund a wallet and did not broadcast any transaction.

## External Workspace

All generated wallet and PCZT artifacts were kept outside the repository:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z
```

This directory contains sensitive test material and must not be committed:

```text
dev-wallet/
view-wallet/
artifacts/
ufvk.txt
recipient-address.txt
seed-fingerprint.txt
wallet and PCZT command logs
```

## Pinned Toolchain

Tool:

```text
zcash-devtool
```

Pinned commit:

```text
1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

Local source:

```text
$HOME/.zecsafe/toolchain/zcash-devtool
```

The default-feature build was sufficient for the wallet and PCZT commands used here. A prior `--all-features` build attempt was not used for this gate because optional QR/camera dependencies require local `libclang`/`v4l2` support in this environment.

## Network State

Testnet lightwalletd endpoint:

```text
https://testnet.zec.rocks:443
```

Observed chain:

```text
chain_name: test
chain_tip_height: 4159196
```

## Reproduced Official Flow

The spending wallet was initialized externally with a newly generated mnemonic encrypted by an age identity file:

```text
wallet -w <external-dev-wallet> init --name ZDevTest -i <external-identity-file> -n test -s zecrocks --connection direct
```

The spending wallet account was listed, and its UFVK, seed fingerprint, birthday height, and HD account index were extracted only into the external workspace.

The view-only wallet was initialized from the exported UFVK:

```text
wallet -w <external-view-wallet> init-fvk --name ZDevView --fvk <external-ufvk> --birthday 4159093 --seed-fingerprint <external-seed-fingerprint> --hd-account-index 0 -s zecrocks --connection direct
```

Both wallets were synced to testnet height `4159196`.

Balance result:

```text
spending wallet: 0 TAZ
view-only wallet: 0 TAZ
```

The official view-only PCZT creation command was then attempted:

```text
pczt -w <external-view-wallet> create --address <external-wallet-address> --value 1 --memo <redacted>
```

It stopped at the expected funding boundary:

```text
Error: Insufficient balance (have 0, need 10001 including fee)
```

No official funded PCZT was created because this task had no approval to fund a testnet or mainnet wallet.

## Manual PCZT Fixture

To exercise the non-broadcast PCZT command surface without funds, a disposable transparent-only fixture was generated outside the repository:

```text
artifacts/manual-transparent-key.pem
artifacts/manual-transparent-pubkey.hex
artifacts/manual-transparent-scriptpubkey.hex
artifacts/manual-transparent-recipient.txt
artifacts/manual-coin.json
```

The testnet transparent P2PKH address prefix was verified from the pinned `zcash_protocol` source:

```text
B58_PUBKEY_ADDRESS_PREFIX: [0x1d, 0x25]
```

The first manual attempt used the wallet unified address and failed because it tried to add a shielded cross-address output:

```text
Error: Could not add Orchard recipient: Cross-address transfers are disabled for this builder; use add_change_output for wallet-controlled change
```

The second manual attempt used a transparent testnet recipient and succeeded:

```text
pczt create-manual --coins <external-coin-json> --address <external-transparent-address> --memo <redacted> -n test -s zecrocks --connection direct
```

Output artifact:

```text
artifacts/manual-created-transparent.pczt
bytes: 286
sha256: 98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
```

Inspect summary:

```text
transparent inputs: 1
input value: 20000 zatoshis
transparent signatures present: 0
transparent outputs: 1
output value: 10000 zatoshis
transaction version: V6
```

The transparent-only fixture was also passed through `prove` and `combine`:

```text
manual-proven-transparent.pczt: 286 bytes, same sha256
manual-combined-transparent.pczt: 286 bytes, same sha256
```

This is expected for a transparent-only PCZT with no shielded proofs to add.

Applying `pczt sign` with the external spending wallet identity returned success but did not modify the fixture, because the fake transparent input is not wallet-derived:

```text
manual-signed-transparent.pczt: 286 bytes, same sha256
transparent signatures present after sign: 0
```

Extraction failed at the expected authorization boundary:

```text
Error: Failed to finalize PCZT spends: TransparentFinalize(MissingSignature)
```

## Result

`ZSAFE-P0-003` reproduced the official view-only setup path and reached a precise funding boundary for official PCZT creation.

The manual transparent fixture proved that `zcash-devtool` can create, inspect, prove, and combine a PCZT artifact locally without broadcast, but also proved that the fixture cannot be extracted without a real spend authorization.

## Public Claims Affected

ZecSafe can now accurately claim:

```text
Pinned zcash-devtool wallet initialization was reproduced locally.
A spending wallet was initialized outside the repository.
A view-only wallet was initialized from the spending wallet UFVK outside the repository.
Both wallets synced against testnet lightwalletd.
Official PCZT creation was attempted and stopped only because the wallet had zero funds.
A non-broadcast transparent PCZT fixture was created, inspected, proven, and combined.
Unsigned PCZT extraction fails with MissingSignature.
```

## Repository Verification

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

ZecSafe must not yet claim:

```text
funded PCZT creation
shielded PCZT spend authorization
FROST-bound PCZT signing
signed/proven/combined spend extracted to a raw transaction
testnet or mainnet broadcast
judge-verifiable PCZT proof bundle
```

## Files Changed

```text
docs/execution/07-PCZT-VIEW-ONLY-REPRO.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

## Acceptance Criteria

- [x] Pinned `zcash-devtool` commit used.
- [x] Spending wallet initialized outside the repository.
- [x] UFVK exported only to the external workspace.
- [x] View-only wallet initialized outside the repository from the UFVK.
- [x] Both wallets synced to testnet.
- [x] Official view-only PCZT creation attempted.
- [x] Zero-balance funding boundary recorded.
- [x] Manual transparent PCZT fixture created outside the repository.
- [x] Manual fixture inspected, proven, combined, and extraction failure recorded.
- [x] `npm run check` passed.
- [x] No wallet DB, key, UFVK, address file, PCZT body, or private log committed.
- [x] No mainnet funding or broadcast occurred.

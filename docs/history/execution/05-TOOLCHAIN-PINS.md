> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-001 - Toolchain Pins

Status: `COMPLETED`

Updated UTC: `2026-07-11T04:12:00Z`

Purpose: freeze the upstream FROST, PCZT, protocol, and deprecation baseline before any proof-run reproduction.

## Local Environment

Repository:

```text
$HOME/zecsafe
```

External toolchain workspace:

```text
$HOME/.zecsafe/toolchain
```

Observed host:

```text
rustc 1.96.0 (ac68faa20 2026-05-25)
cargo 1.96.0 (30a34c682 2026-05-25)
Linux Cyberrockng 6.18.33.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux
```

No wallet directory, participant config, PCZT body, signing share, randomizer, or private proof artifact was created inside the repository.

## Protocol Baseline

Current settled mainnet baseline:

```text
NU6.2
```

Verified source:

```text
Zcash Protocol Specification, Version v2026.7.0-31-g696109 [NU6.2]
https://zips.z.cash/protocol/protocol.pdf
```

Pinned source repository:

```text
Repository: https://github.com/zcash/zips
Commit: 69610984109078075e7e64989ecf89d63a259b97
```

Rule for ZecSafe: every protocol-sensitive public claim and proof check must identify the network upgrade baseline it was built against. The current proof work targets NU6.2 until a later task explicitly repins the spec and records the migration.

## Source Pins

| Source | Pin | License | Purpose | Limitation |
| --- | --- | --- | --- | --- |
| ZIP 312, FROST for Spend Authorization Multisignatures | zips commit `69610984109078075e7e64989ecf89d63a259b97`; source `https://zips.z.cash/zip-0312` | MIT | Draft wallet ZIP for adapting FROST to Zcash spend authorization. | Draft status; must be treated as design baseline, not final protocol law. |
| ZF FROST Book | `https://frost.zfnd.org/`, `https://frost.zfnd.org/zcash.html`, `https://frost.zfnd.org/tutorial.html`; captured 2026-07-11 | Site documentation | Explains FROST roles, trusted dealer, DKG, coordinator signing, signer checks, and Zcash shared-wallet context. | Documentation source; runnable behavior must be verified against pinned repos. |
| Zcash Foundation FROST library | repo `https://github.com/ZcashFoundation/frost`; commit `2016e44ba4a4757a996300350063b937a2ad33e8`; workspace version `3.0.0`; MSRV `1.81` | MIT OR Apache-2.0 | Reference FROST crates including `frost-core` and `frost-rerandomized`. | Library pin only; no binary proof run produced by this task. |
| Zcash Foundation frost-tools | repo `https://github.com/ZcashFoundation/frost-tools`; commit `7d33a95fecc91dacdb1503933e2bee43780d3293` | MIT OR Apache-2.0 | Coordination server and CLI tools: `frostd`, `frost-client`, `zcash-sign`. | README marks demos WIP and not production. Trusted-dealer mode is tests-only and does not preserve all share-validation information. |
| zcash-devtool | repo `https://github.com/zcash/zcash-devtool`; commit `1b065594d958d1cad2deafe7cd2e2fcc2774c46c`; package version `0.1.0`; MSRV `1.87` | MIT OR Apache-2.0 | Official developer CLI for wallet, inspection, and PCZT prototyping. | README says not production-ready, no binary artifacts, and CLI API can change without warning. |
| zcashd Book and support status | `https://zcash.github.io/zcash/`; captured as Zcash `6.20.0` documentation on 2026-07-11 | Site documentation | Establishes whether legacy `zcashd` can be a dependency. | `zcashd` is deprecated, will not support NU6.3, and must not be a new ZecSafe architecture dependency. |

## Critical Dependency Details

ZF FROST library manifest:

```text
workspace version: 3.0.0
rust-version: 1.81
license: MIT OR Apache-2.0
members: frost-core, frost-ed25519, frost-ed448, frost-p256, frost-ristretto255, frost-secp256k1, frost-secp256k1-tr, frost-rerandomized, gencode
```

frost-tools manifest:

```text
members: tests, frostd, frost-client, zcash-sign
frost-core: 2.2.0
frost-ed25519: 2.0.0
frost-rerandomized: 2.0.0-rc.0
pczt: 0.5
zcash_client_backend: 0.21.0
zcash_keys: 0.12.0
zcash_primitives: 0.26.1
zcash_proofs: 0.26.1
zcash_protocol: 0.7.1
reddsa git rev: ed49e9ca0699a6450f6d4a9fe62ff168f5ea1ead
patched orchard git rev: 4d001c5b6ad15373e68a5923d5868fbe42daba96
```

zcash-devtool manifest:

```text
package: zcash-devtool 0.1.0
edition: 2024
rust-version: 1.87
license: MIT OR Apache-2.0
pczt: 0.7
zcash_client_backend: 0.23
zcash_client_sqlite: 0.21
zcash_keys: 0.15.0-pre.0 with unstable-frost
zcash_primitives: 0.29.0-pre.0
zcash_proofs: 0.29.0-pre.0
zcash_protocol: 0.10.0-pre.0
librustzcash patch rev: 8e6864a3c67cab3c64a052dd20f83c553662e8b2
orchard patch rev: 475ef0ff77d45aebff93cb039d639250d82518a3
incrementalmerkletree patch rev: decefc469dbf1e686b20b7e7dcaa7cb4f122125b
```

Interop risk:

```text
frost-tools currently depends on pczt 0.5-era Zcash crates.
zcash-devtool currently depends on pczt 0.7-era Zcash crates.
```

P0-002 and P0-003 must prove whether these toolchains can be connected directly, need a narrow adapter, or must remain separate evidence streams.

## Build And Help Capture

External clone commands used:

```bash
git clone https://github.com/ZcashFoundation/frost-tools.git $HOME/.zecsafe/toolchain/frost-tools
git clone https://github.com/ZcashFoundation/frost.git $HOME/.zecsafe/toolchain/frost
git clone https://github.com/zcash/zcash-devtool.git $HOME/.zecsafe/toolchain/zcash-devtool
```

Pinned checkout verification:

```bash
git -C $HOME/.zecsafe/toolchain/frost-tools rev-parse HEAD
git -C $HOME/.zecsafe/toolchain/frost rev-parse HEAD
git -C $HOME/.zecsafe/toolchain/zcash-devtool rev-parse HEAD
```

Observed:

```text
frost-tools: 7d33a95fecc91dacdb1503933e2bee43780d3293
frost: 2016e44ba4a4757a996300350063b937a2ad33e8
zcash-devtool: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

frost-tools commands captured:

```bash
cargo run --locked -p frostd -- --help
cargo run --locked -p frost-client -- --help
cargo run --locked -p frost-client -- trusted-dealer --help
cargo run --locked -p frost-client -- dkg --help
cargo run --locked -p frost-client -- coordinator --help
cargo run --locked -p frost-client -- participant --help
cargo run --locked -p zcash-sign -- --help
cargo run --locked -p zcash-sign -- generate --help
cargo run --locked -p zcash-sign -- sign --help
```

Captured `frostd` surface:

```text
Usage: frostd [OPTIONS]
Options include: --ip, --port, --tls-cert, --tls-key, --no-tls-very-insecure, --help, --version
Default bind: 0.0.0.0
Default port: 2744
```

Captured `frost-client` surface:

```text
Usage: frost-client <COMMAND>
Commands: init, export, import, contacts, remove-contact, trusted-dealer, dkg, groups, remove-group, sessions, coordinator, participant, help
```

Important `frost-client trusted-dealer` warning:

```text
The command describes itself as test-only.
After trusted-dealer key generation, participants need to validate received shares with the verifying key and public verifying shares.
This tool does not preserve all required validation information after writing key packages to config files.
```

RedPallas spelling:

```text
The README and source both identify the ciphersuite selector as redpallas.
The older README examples use -C redpallas.
The current frost-client help exposes --ciphersuite with default ed25519 for trusted-dealer and dkg.
```

Captured `zcash-sign` surface:

```text
Usage: zcash-sign <COMMAND>
Commands: generate, sign, help

generate requires --ak and supports --network plus --danger-dummy-sapling.
sign requires --tx-plan and --tx. The --ufvk option is documented as not required for PCZTs and only required for Ywallet transaction plans.
```

zcash-devtool commands captured:

```bash
cargo run --locked -- --help
cargo run --locked -- pczt --help
cargo run --locked -- pczt create --help
cargo run --locked -- pczt inspect --help
cargo run --locked -- pczt prove --help
cargo run --locked -- pczt sign --help
cargo run --locked -- pczt update-with-signature --help
cargo run --locked -- pczt combine --help
cargo run --locked -- pczt extract --help
cargo run --locked -- pczt send --help
cargo run --locked -- pczt send-without-storing --help
cargo run --locked -- pczt redact --help
cargo run --locked -- wallet init-fvk --help
cargo run --locked -- wallet list-accounts --help
```

Captured `zcash-devtool` top-level surface:

```text
Usage: zcash-devtool [COMMAND]
Commands: inspect, wallet, zip48, pczt, create-multisig-address, help
```

Captured `zcash-devtool pczt` surface:

```text
Usage: zcash-devtool pczt [OPTIONS] <COMMAND>
Commands: create, create-max, shield, create-manual, pay-manual, inspect, update-with-derivation, redact, prove, sign, update-with-signature, combine, extract, send, send-without-storing, help
Wallet option: -w, --wallet-dir <WALLET_DIR>
```

PCZT flow from the current walkthrough:

```text
init a view wallet from a UFVK
sync it
create a PCZT
inspect it
prove it
sign it from the spending wallet or signing identity
combine proven and signed fragments
send it through the selected lightwallet endpoint
```

The walkthrough keeps wallet material outside the repository. ZecSafe must keep following that rule.

## zcashd Rule

ZecSafe must not introduce a new dependency on `zcashd`.

Current upstream status:

```text
zcashd is deprecated.
zcashd will not support NU6.3.
The zcashd Book describes an automatic End-of-Support halt estimated for 2026-07-18 at block height 3417100.
The zcashd Book directs users to migrate to Zebra and Zallet.
```

Permitted use:

```text
Temporary compatibility-only verification, if an official tool forces it, with the reason recorded in the ledger.
```

Forbidden use:

```text
Making zcashd the durable ZecSafe wallet, sync, proof, or broadcast dependency.
```

## Next Reproduction Gates

`ZSAFE-P0-002` must reproduce a 2-of-3 RedPallas FROST signing flow in the external workspace without committing participant configs or shares.

`ZSAFE-P0-003` must reproduce the official PCZT view-only flow in the external workspace without committing wallet DBs, PCZT bodies, identities, or private artifacts.

Open risks to resolve in those gates:

```text
Confirm current frost-client RedPallas command syntax end to end.
Confirm whether zcash-sign can consume the exact PCZT artifacts produced by zcash-devtool.
Resolve or document the pczt 0.5 versus pczt 0.7 toolchain split.
Decide whether DKG is usable now or whether the demo must remain trusted-dealer-only for the hackathon proof.
```

## Acceptance Criteria

- [x] Protocol baseline pinned to NU6.2.
- [x] ZIP 312 recorded with status and license.
- [x] ZF FROST library pinned to exact commit.
- [x] frost-tools pinned to exact commit with binaries and limitations.
- [x] zcash-devtool pinned to exact commit with PCZT commands and limitations.
- [x] zcashd deprecation rule recorded.
- [x] Current Rust, Cargo, OS, and architecture recorded.
- [x] Current help surfaces captured for critical tools.
- [x] No private wallet, participant, PCZT, randomizer, or proof artifact created in the repository.

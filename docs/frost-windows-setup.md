# FROST Windows Setup

ZecSafe's real workflow uses the pinned Zcash Foundation FROST tooling (`frost-client`, `frostd`) together with `zcash-devtool`. This guide sets up that toolchain on Windows. The local helper `scripts/frost-demo.mjs` (backed by `scripts/frost-local-wrapper.mjs`) exercises the installed binaries end to end and prints JSON. It is a local CLI utility only — the server exposes no FROST route.

## Required Tools

Windows needs:

- Rust/Cargo
- Visual Studio C++ Build Tools with the C++ workload
- Zcash Foundation demo CLIs from `frost-zcash-demo`

## Install Rust

```powershell
winget install --id Rustlang.Rustup -e
rustup default stable
cargo --version
rustc --version
```

## Install Visual Studio C++ Build Tools

Install Visual Studio Build Tools 2022 with the C++ workload:

```powershell
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--wait --quiet --norestart --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

If the silent installer stalls, open the Visual Studio Installer manually and select:

```text
Desktop development with C++
```

After install, verify that the MSVC linker is available from a developer shell:

```powershell
link /?
```

Also verify that the Windows SDK desktop libraries are installed:

```powershell
Get-ChildItem "C:\Program Files (x86)\Windows Kits" -Filter kernel32.lib -Recurse
```

## Install Zcash FROST Demo CLIs

```powershell
cargo install --git https://github.com/ZcashFoundation/frost-zcash-demo.git --locked frost-client
cargo install --git https://github.com/ZcashFoundation/frost-zcash-demo.git --locked zcash-sign
cargo install --git https://github.com/ZcashFoundation/frost-zcash-demo.git --locked frostd
```

## Connect ZecSafe

`scripts/frost-demo.mjs` now uses the built-in wrapper by default:

```text
scripts/frost-local-wrapper.mjs
```

That wrapper runs the installed `trusted-dealer`, `participant`, and `coordinator` binaries from `frost-zcash-demo` and prints JSON:

```json
{
  "groupPublicKey": "<hex>",
  "keyShares": ["<share1_hex>", "<share2_hex>", "<share3_hex>"],
  "signingRound1": { "commitment1": "<hex>", "commitment2": "<hex>" },
  "signingRound2": { "partialSig1": "<hex>", "partialSig2": "<hex>" },
  "aggregatedSignature": "<hex>",
  "verified": true
}
```

Run the wrapper directly:

```powershell
node scripts/frost-demo.mjs
```

A custom wrapper command can be supplied with the `FROST_DEMO_COMMAND` environment variable.

The mainnet proof run additionally used `zcash-devtool` (pinned commit in the README) for PCZT
creation, inspection, proving, and wallet sync; see `docs/frost-integration.md` and
`docs/mainnet-integration.md`.

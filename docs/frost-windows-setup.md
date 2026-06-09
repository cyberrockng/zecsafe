# FROST Windows Setup

ZecSafe can call official local Zcash FROST demo tooling through `scripts/frost-demo.mjs` and `GET /api/frost-demo`.

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

Then start ZecSafe:

```powershell
node server.mjs
```

You can still override the built-in wrapper with a custom command:

```powershell
$env:FROST_DEMO_COMMAND="your-local-frost-json-wrapper"
node server.mjs
```

## Current Machine Status

On this machine, Rust, the MSVC linker, Windows SDK desktop libraries, `frost-client`, and `zcash-sign` are installed. `kernel32.lib` is available under the Windows SDK `10.0.22621.0` library path.

$ErrorActionPreference = "Stop"

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$nodePath = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if (-not (Get-Command wsl.exe -ErrorAction SilentlyContinue)) {
  throw "WSL is not available. Install WSL and Ubuntu before starting the local Zcash RPC flow."
}

$rpcPassword = (wsl -d Ubuntu-24.04 -- bash -lc "cat /root/.zcash/zecsafe-rpc-password.txt 2>/dev/null").Trim()
if (-not $rpcPassword) {
  throw "Missing /root/.zcash/zecsafe-rpc-password.txt inside Ubuntu-24.04. Run the local zcashd setup first."
}

$nodeCheck = wsl -d Ubuntu-24.04 -- bash -lc "zcash-cli getblockchaininfo >/dev/null 2>&1; echo `$?"
if ($nodeCheck.Trim() -ne "0") {
  Write-Host "Starting zcashd inside Ubuntu-24.04..."
  wsl -d Ubuntu-24.04 -- bash -lc "zcashd -daemon >/dev/null 2>&1 || true"
  Start-Sleep -Seconds 8
}

$env:ZEC_RPC_URL = "http://127.0.0.1:8232"
$env:ZEC_RPC_USER = "zecsafe"
$env:ZEC_RPC_PASSWORD = $rpcPassword

Set-Location $projectRoot
Write-Host "Starting ZecSafe with local zcashd RPC at $env:ZEC_RPC_URL"
& $nodePath server.mjs

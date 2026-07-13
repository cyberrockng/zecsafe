# Mainnet Read-only Observation

ZecSafe's read-only mainnet layer answers two questions without ever holding funds or secrets:
"what is the chain doing?" and "does this transaction exist with how many confirmations?"

## What works

- `GET /api/mainnet/status` — chain status via `getblockchaininfo` on a configurable RPC
  endpoint (local server only).
- `POST /api/transaction-proof` — validates a 64-character txid, calls `getrawtransaction` and
  `getblock`, and reports confirmations, block height, and action counts.
- `scripts/mainnet-view.mjs preflight|watch` — view-only (UFVK) wallet observation through the
  pinned `zcash-devtool`, used to gate real proof runs (`WAIT_FUNDING` → `PASS`) and to watch a
  broadcast transaction to its confirmation rule.

## What is intentionally excluded

The earlier prototype's transparent-address balance route and HTTP viewing-key balance route
were removed during audit remediation. Shielded and unified balances are private: they are read
only by the local `zcash-devtool` wallet from a locally held UFVK. Viewing keys are never
accepted over HTTP, and the repository guard fails if such a route reappears.

## Endpoint configuration

```text
ZEC_PUBLIC_RPC_URL   override the default public documentation RPC endpoint
ZEC_RPC_URL          use a trusted local node instead (with ZEC_RPC_USER / ZEC_RPC_PASSWORD)
```

Production deployments should use a user-chosen trusted node, or self-hosted
lightwalletd/Zaino/Zebra infrastructure. The hosted demo page performs no network requests at
all — it replays recorded fixtures and verifies them in the visitor's browser.

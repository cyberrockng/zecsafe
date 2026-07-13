# Mainnet Integration

ZecSafe interacts with Zcash mainnet on two surfaces: the recorded proof run (real, human-gated
broadcast — see the README and `fixtures/verified-mainnet-run/`) and a small read-only
observation layer described here.

## Local server routes

`server.mjs` (loopback-only) exposes exactly four routes:

```text
GET  /api/health
GET  /api/mainnet/status
POST /api/transaction-proof
POST /api/intent/create
```

The earlier prototype routes (`/api/mainnet/address-balance`, `/api/viewing-key-balance`,
`/api/frost-demo`, `/api/proof-bundle`) were removed during audit remediation; a repository
guard (`scripts/verify.mjs`) fails if they reappear.

## RPC usage

- `getblockchaininfo` — network, consensus branch, and chain status for `/api/mainnet/status`.
- `getrawtransaction` and `getblock` — transaction observation for `/api/transaction-proof`
  (confirmations, block height, action counts).

The default public endpoint is a documentation RPC endpoint and can be overridden with
`ZEC_PUBLIC_RPC_URL`, or replaced entirely with a trusted local node via `ZEC_RPC_URL`,
`ZEC_RPC_USER`, and `ZEC_RPC_PASSWORD`. Production should always use a user-chosen trusted
node or self-hosted lightwalletd/Zaino infrastructure.

## Wallet observation for real runs

Real proof runs observe the funded view-only (UFVK) wallet through the pinned `zcash-devtool`
(`scripts/mainnet-view.mjs preflight` / `watch`), never through public transparent-address
explorers. Shielded balances are read only by the local wallet; viewing keys never leave the
machine and are never accepted over HTTP.

## Boundaries

- The hosted Vercel page performs no RPC at all (CSP `connect-src 'self'`); it serves recorded
  fixtures and verifies them in the browser.
- Broadcast is never automatic: the pipeline halts at an explicit human-approval gate.
- The recorded proof states chain status as of recording time; current chain state is checked
  on an explorer, not asserted by the bundle.

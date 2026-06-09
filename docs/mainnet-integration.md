# Mainnet Integration

ZecSafe uses Zcash mainnet in read-only mode. It does not broadcast transactions or move funds.

## Backend Adapter

The Node server exposes these routes:

```text
GET /api/mainnet-status
GET /api/mainnet/status
POST /api/mainnet/address-balance
POST /api/transaction-proof
POST /api/viewing-key-balance
```

The public prototype endpoint is:

```text
https://docs-demo.zec-mainnet.quiknode.pro/
```

Production should let users choose a trusted node, self-hosted lightwalletd/Zaino path, or private coordinator service.

## RPC Calls

The app currently uses:

- `getblockchaininfo` for network, headers, difficulty, consensus upgrades, and chain status.
- `getblockcount` for current block height.
- `getmempoolinfo` for mempool transaction count and memory usage.
- `getpeerinfo` for connected peer count.
- `getaddressbalance` for transparent address balance and total received.
- `getrawtransaction` for transaction proof lookup.
- `getblock` for block height and confirmation context on transaction proofs.
- `z_getbalanceforviewingkey` only when local zcashd wallet RPC is configured.

## Transparent Address Monitoring

Transparent address balances are public, so the app can validate a `t1` or `t3` address locally and query `getaddressbalance` safely.

The UI shows:

- Address type
- Balance
- Total received
- Source
- Last checked time

## Transaction Proof

The transaction proof flow accepts a real 64-character Zcash transaction ID. It calls `getrawtransaction`, then `getblock`, and displays:

- Transaction ID
- Confirmation status
- Confirmation count
- Block height
- Transparent output total
- Linked ZecSafe proposal

## Viewing-Key Balance

Shielded data is private. ZecSafe never asks for seed phrases or spending keys.

The viewing-key route accepts full viewing keys such as `uview1`, `uvf1`, or `zviews...`. If local zcashd is not configured, it returns:

```json
{
  "balance": null,
  "source": "public-rpc-unavailable",
  "message": "Viewing key balance requires a local zcashd with z_getbalanceforviewingkey support. Connect a local node via ZEC_RPC_URL to enable this feature."
}
```

That fallback is intentional. Public transparent RPC is not enough to safely scan shielded wallet data.

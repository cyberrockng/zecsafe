# Mainnet Read-only Integration

ZecSafe now includes a first read-only mainnet integration for transparent Zcash addresses.

## What works

- Classifies common Zcash address types.
- Validates transparent mainnet addresses locally with Base58Check.
- Calls the Zcash `getaddressbalance` RPC through a public docs endpoint.
- Calls `getblockchaininfo` to verify Zcash mainnet chain status.
- Calls `getblockcount`, `getmempoolinfo`, and `getpeerinfo` for the live dashboard status panel.
- Calls `getblock` after transaction proof lookup to display block height and confirmation context.
- Displays public transparent balance and total received values.
- Accepts full viewing keys through the local ZecSafe server.
- Calls `z_getbalanceforviewingkey` when a local `zcashd` RPC endpoint is configured.
- Checks a user-provided Zcash transaction ID with `getrawtransaction`.
- Attaches transaction proof metadata to the active proposal.

## What is intentionally limited

Transparent addresses are public. Their balances can be read from a Zcash node or explorer-style service.

Shielded and unified address balances are private. They should not be queried through a public transparent-address explorer. ZecSafe now includes the first safe boundary for this: a local-only viewing-key balance route. Full compact-block scanning still needs lightwalletd, Zaino, Zebra-backed infrastructure, or the Zcash wallet SDK stack.

## Current endpoint

The transparent-address prototype uses:

```text
https://docs-demo.zec-mainnet.quiknode.pro/
```

Method:

```text
getaddressbalance
```

This endpoint is useful for the hackathon prototype, but production should allow users to configure their own trusted node, lightwalletd-backed service, or self-hosted coordinator.

## Viewing-key balance route

The local server exposes:

```text
GET /api/mainnet/status
GET /api/mainnet-status
POST /api/mainnet/address-balance
POST /api/transaction-proof
```

These routes are the ZecSafe backend adapter for read-only Zcash mainnet infrastructure.

## Viewing-key balance route

The local server also exposes:

```text
POST /api/viewing-key-balance
```

It accepts full viewing keys beginning with `uview1`, `uvf1`, or `zviews`. It rejects likely seed phrases, spending keys, and incoming viewing keys.

When configured with `ZEC_RPC_URL`, `ZEC_RPC_USER`, and `ZEC_RPC_PASSWORD`, the server calls:

```text
z_getbalanceforviewingkey
```

## Transaction proof route

The local server exposes:

```text
POST /api/transaction-proof
```

It validates that the input is a 64-character transaction ID, then calls:

```text
getrawtransaction
getblock
```

The app records confirmations, block height, transparent output count, Orchard action count, source, and checked time.

## Next implementation step

The next development step is to add a scanner service:

1. Connect to lightwalletd or Zaino.
2. Fetch latest block height.
3. Stream compact blocks from the birthday height.
4. Use a Zcash wallet SDK/scanning library to detect notes viewable by the key.
5. Track per-pool balances and nullifiers locally.
6. Keep viewing keys local or encrypted at rest.

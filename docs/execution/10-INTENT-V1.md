# ZSAFE-P0-005 - Deterministic Transaction Intent v1

Status: `ZSAFE-P0-005` complete.

Completed UTC: `2026-07-11T07:28:47Z`

## Scope

Create the exact transaction intent object that humans review before PCZT binding and FROST authorization.

This task added a strict `zecsafe-intent-v1` schema, canonical JSON serialization, commitment generation, CLI creation, API creation, and focused mutation/rejection tests.

It did not yet bind an intent to a PCZT. That begins in later P0 tasks.

## Implemented Schema

The normalized intent contains:

```json
{
  "schema_version": "zecsafe-intent-v1",
  "network": "main",
  "vault_id": "vault_demo",
  "group_fingerprint": "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recipient": "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd",
  "amount_zatoshis": 10000,
  "memo_utf8": "ZecSafe intent fixture",
  "fee_policy": {
    "mode": "tool_default",
    "max_fee_zatoshis": 100000
  },
  "created_at": "2026-07-11T07:30:00.000Z",
  "expires_at": null
}
```

## Rules Enforced

Network:

```text
main
test
```

Address validation:

```text
main: transparent, unified, Sapling, and Sprout-looking mainnet prefixes
test: transparent, unified, Sapling, and TEX-looking testnet prefixes
```

Amount and fee:

```text
amount_zatoshis must be a positive safe integer
fee_policy.max_fee_zatoshis must be a non-negative safe integer
decimal notation is rejected
scientific notation is rejected
unsafe JavaScript integer values are rejected
```

Memo:

```text
memo_utf8 must be valid UTF-16 input
memo_utf8 must encode to no more than 512 UTF-8 bytes
```

Group and vault identity:

```text
group_fingerprint must be sha256:<64 hex>
vault_id must start with vault_
```

Time:

```text
created_at must be an ISO-8601 UTC timestamp
expires_at may be null or a later ISO-8601 UTC timestamp
```

## Canonicalization

`src/intent-v1.mjs` produces canonical JSON with lexicographically sorted object keys at every level, no whitespace, and safe-integer numeric rendering.

The commitment is:

```text
sha256:<sha256(canonical_intent_json)>
```

Fixture commitment:

```text
sha256:10124990b764067b015f1c0bd23fcc92db7cb1775cb5206fdfee64143ef2d9c1
```

## CLI Surface

Script:

```text
scripts/create-intent.mjs
```

Package alias:

```bash
npm run intent:create -- --network main --vault-id vault_demo --group-fingerprint sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa --recipient t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd --amount-zatoshis 10000 --memo-utf8 'ZecSafe intent fixture' --max-fee-zatoshis 100000 --created-at 2026-07-11T07:30:00.000Z
```

Acceptance output:

```text
Intent created
Intent commitment: sha256:<64 hex>
```

The CLI also supports:

```text
--json <file>
--print-json
```

## API Surface

Route:

```text
POST /api/intent/create
```

Success response includes:

```json
{
  "status": "success",
  "message": "Intent created",
  "intent": {},
  "canonical_intent_json": "{}",
  "intent_commitment": "sha256:..."
}
```

The API reads the raw JSON body before parsing so numeric fields using decimal or scientific notation can be rejected even when JavaScript would otherwise parse them into ordinary numbers.

API smoke results:

```text
valid fixture: 200, message "Intent created", commitment sha256:10124990b764067b015f1c0bd23fcc92db7cb1775cb5206fdfee64143ef2d9c1
scientific amount fixture: 400, amount_zatoshis must not use decimals or scientific notation.
```

## Tests

Focused test file:

```text
scripts/intent-v1.test.mjs
```

Coverage:

```text
stable key ordering
one-zatoshi mutation
recipient mutation
memo mutation
network mutation
fee mutation
floating-point rejection
scientific-notation rejection
CLI acceptance output
```

## Files Changed

```text
src/intent-v1.mjs
scripts/create-intent.mjs
scripts/intent-v1.test.mjs
server.mjs
package.json
scripts/verify.mjs
docs/execution/10-INTENT-V1.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

## Repository Verification

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe security scan passed.
```

## Public Claims Affected

ZecSafe can now accurately claim:

```text
It has a deterministic transaction intent v1 schema.
It represents spend amount and max fee as integer zatoshis.
It canonicalizes the reviewed intent before hashing.
It emits an intent commitment through both CLI and API.
It rejects decimals, scientific notation, unsafe integers, invalid network/address combinations, and overlong memos.
```

ZecSafe must not yet claim:

```text
the intent is bound to a PCZT
the intent has been signed by FROST participants
the intent maps to an extracted or broadcast transaction
the browser proposal UI fully consumes zecsafe-intent-v1
```

## Acceptance Criteria

- [x] Schema version fixed as `zecsafe-intent-v1`.
- [x] Amount represented as integer zatoshis.
- [x] Fee max represented as integer zatoshis.
- [x] Unsafe integers rejected.
- [x] Floating-point values rejected.
- [x] Scientific notation rejected.
- [x] Network validated.
- [x] Recipient validated against network.
- [x] Memo length and encoding validated.
- [x] Canonical JSON generated.
- [x] `intent_commitment` generated as `sha256:<hex>`.
- [x] CLI emits `Intent created`.
- [x] CLI emits `Intent commitment: sha256:...`.
- [x] API emits `Intent created` and `intent_commitment`.
- [x] Focused intent tests added.
- [x] `npm run check` passed.

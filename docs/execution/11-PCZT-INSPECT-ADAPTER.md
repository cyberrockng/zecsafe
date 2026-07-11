# ZSAFE-P0-006 - PCZT Fingerprint and Strict Inspect Adapter

Status: `ZSAFE-P0-006` complete.

Completed UTC: `2026-07-11T07:34:28Z`

## Scope

Turn pinned official `zcash-devtool pczt inspect` output into structured review data that later Binding Firewall logic can compare against the reviewed intent.

This task used the fallback path from the plan: invoke the pinned official inspection command and parse a strict allowlist of version-pinned output fields.

It did not implement the Intent-to-PCZT Binding Firewall. That begins in `ZSAFE-P0-007`.

## Implemented Adapter

Module:

```text
src/pczt-inspect-v1.mjs
```

Pinned tool identity:

```text
tool: zcash-devtool
commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

Accepted inspect source:

```text
zcash-devtool pczt inspect
```

The parser rejects any unsupported tool identity, missing required line, malformed line, unsupported transparent script type, network/recipient mismatch, invalid computed fee, or unexpected extra inspect output.

## Review Shape

The adapter emits:

```text
PcztReview {
  network
  source_fingerprint
  source
  tool_commit
  recipients[]
  amounts_zatoshis[]
  memo_metadata
  fee_metadata
  output_count
  pczt_fingerprint
  transaction_id
  transaction_version
}
```

Memo state is explicit:

```text
memo_metadata.status = not_reported_by_zcash_devtool_inspect
```

Fee state is explicit for the currently supported transparent fixture:

```text
fee_metadata.status = computed_from_transparent_values
```

The adapter does not guess recipients, amounts, memos, or fees when required inspect fields are missing.

## CLI Surface

Script:

```text
scripts/pczt-inspect.mjs
```

Package alias:

```bash
npm run pczt:inspect -- --pczt <external.pczt> --network test --pretty
```

The CLI:

```text
verifies the zcash-devtool git commit
runs cargo run --locked --release -- pczt inspect
passes the PCZT bytes on stdin
writes raw inspect output to an external diagnostics path
prints only structured review JSON
```

Default raw inspect directory:

```text
/home/dell/.zecsafe/pczt-inspect
```

## Real Fixture Smoke

The CLI was run against the external P0-003 manual transparent PCZT fixture:

```text
/home/dell/.zecsafe/runs/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
```

Raw inspect output was captured outside the repository:

```text
/home/dell/.zecsafe/pczt-inspect/inspect-20260711T073416Z.txt
```

Structured result:

```text
network: test
source_fingerprint: sha256:36ecbc4bdbcb956f347075c23035e048b31c722c6b746867369c4e8df6c667ac
pczt_fingerprint: sha256:98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
output_count: 1
amounts_zatoshis: [10000]
fee_zatoshis: 10000
transaction_version: V6
```

The recipient value is available in the structured review object, but raw inspect output remains external and must not be exposed publicly by default.

## Tests

Focused test file:

```text
scripts/pczt-inspect-v1.test.mjs
```

Coverage:

```text
valid fixture
missing field
malformed output
unexpected extra output
tool-version mismatch
```

## Files Changed

```text
src/pczt-inspect-v1.mjs
scripts/pczt-inspect.mjs
scripts/pczt-inspect-v1.test.mjs
package.json
scripts/verify.mjs
docs/execution/11-PCZT-INSPECT-ADAPTER.md
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
ZecSafe PCZT inspect v1 tests passed.
ZecSafe security scan passed.
```

## Public Claims Affected

ZecSafe can now accurately claim:

```text
It has a strict PCZT inspect adapter for the pinned zcash-devtool commit.
It fingerprints both the raw inspect source and the PCZT bytes.
It extracts recipients, output zatoshi amounts, output count, memo metadata, and fee metadata from allowlisted inspect output.
It rejects missing fields, malformed output, unexpected extra output, and tool-version mismatch.
Raw inspect output is captured locally for diagnosis and not exposed publicly by default.
```

ZecSafe must not yet claim:

```text
the adapter supports every PCZT shape
the adapter validates shielded memo content
the adapter binds a PCZT to a reviewed intent
the adapter authorizes signing
the adapter proves a broadcastable transaction
```

## Acceptance Criteria

- [x] Pinned `zcash-devtool` commit enforced.
- [x] Missing required fields rejected.
- [x] Malformed inspect output rejected.
- [x] Unexpected extra inspect output rejected.
- [x] Tool-version mismatch rejected.
- [x] Amounts and recipients are parsed only from required inspect lines.
- [x] PCZT fingerprint computed from PCZT bytes.
- [x] Raw inspect output captured outside the repository by the CLI.
- [x] Focused PCZT inspect tests added.
- [x] Real external fixture smoke run completed.
- [x] `npm run check` passed.

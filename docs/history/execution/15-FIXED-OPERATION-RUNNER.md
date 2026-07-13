> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-009 - Local Fixed-Operation Runner

Status: `ZSAFE-P0-009` complete.

Completed UTC: `2026-07-11T16:10:03Z`

## Scope

Build the first local fixed-operation runner for controlled headless proof work.

This task creates the runner safety boundary, operation allowlist, typed result format, CLI, ProofEvent emission, redaction, path containment, and security tests.

It does not implement real PCZT creation, real FROST session orchestration, signing-context preparation, broadcast, proof generation, or proof verification. Those operations are registered and blocked/not implemented until their later P0 tasks.

## Implemented Module

```text
src/fixed-runner-v1.mjs
```

Result schema:

```text
zecsafe-fixed-runner-result-v1
```

Primary APIs:

```js
runFixedOperation(request, options)
runAllowedBinary({ binaryId, args, cwd, timeoutMs, input, spawnImpl })
resolveWorkspacePath(workspaceRoot, requestedPath, label)
redactText(text)
createRunId(prefix)
```

## Implemented CLI

```text
scripts/fixed-runner.mjs
npm run fixed:run
```

Usage:

```bash
npm run fixed:run -- run --request <request.json> --pretty
```

The CLI exits:

```text
0 = operation PASS or non-blocking typed result
1 = invalid runner request
2 = operation FAIL, BLOCKED, or NOT_IMPLEMENTED
```

## Fixed Operation Allowlist

The runner accepts only these operation IDs:

```text
toolchain.status
wallet.status
intent.create
pczt.create
pczt.inspect
pczt.bind
signing.prepare
frost.session.start
frost.session.status
pczt.sign.complete
pczt.prove
pczt.combine
broadcast.preview
broadcast.execute
transaction.status
proof.generate
proof.verify
```

Current implemented operations:

```text
toolchain.status
wallet.status
intent.create
pczt.bind
```

Reserved operations currently return typed blocked/not-implemented results instead of executing arbitrary commands.

## Binary Allowlist

The only binary IDs available through `runAllowedBinary` are:

```text
node
git
cargo
```

The runner uses:

```text
shell: false
argument arrays only
controlled environment
stdout/stderr capture
timeout
secret redaction
```

No `sh -c`, command string, user-selected executable, or shell expansion is accepted.

## Localhost Boundary

Runner requests are local-only.

Allowed host values:

```text
localhost
127.0.0.1
::1
```

The runner rejects non-local host values such as `0.0.0.0`.

## Workspace Boundary

The default fixed runner workspace is outside the repository:

```text
$HOME/.zecsafe/runner
```

Path inputs are canonicalized and must remain inside the active runner workspace.

The runner rejects:

```text
../ traversal
absolute paths outside the workspace
Windows absolute path syntax
shell metacharacters
NUL bytes
Unicode traversal lookalikes
```

## ProofEvent Emission

Every operation result includes one public-safe `proof-event-v1` object.

The event includes:

```text
operation_id
operation_status
exit_status
timeout_status
redaction_status
```

Implemented operations also emit operation-specific public fields:

```text
intent.create -> intent_commitment
pczt.bind -> intent_commitment, pczt_fingerprint, source_fingerprint, binding_status, binding_report_ref, blocked_operations, check_statuses, limitations
toolchain.status -> toolchain_status
wallet.status -> wallet_sync_status
```

If `events_path` is provided, the runner appends the event to an NDJSON event log under the runner workspace after validating ProofEvent sequence rules.

## Redaction

Captured output is redacted for:

```text
private key blocks
full viewing keys
spending keys
mnemonic-like assignments
FROST secret/share assignments
signing randomizer/nonce assignments
```

Captured text is also truncated after the configured capture limit.

## Test Coverage

```text
scripts/fixed-runner-v1.test.mjs
```

Coverage includes:

```text
binary allowlist
shell:false behavior
arbitrary executable rejection
path containment
semicolon payload
&& payload
pipe payload
backtick payload
$() payload
../ traversal
absolute path injection
Unicode traversal lookalike
oversized run ID
non-local host rejection
redaction
intent.create operation
pczt.bind operation
reserved broadcast.execute blocked/not-implemented result
events_path append
CLI run path
```

## Judge-Proof Impact

`ZSAFE-P0-009` creates the constrained execution surface that future tasks can use to emit ProofEvent v1 without letting user input become shell execution.

The immediate judge-proof value is:

```text
operation allowlist
local-only execution
path containment
safe command invocation model
typed operation result
ProofEvent v1 per operation
redacted stdout/stderr capture
security tests for injection payloads
```

## Public-Safe Evidence Emitted

The runner emits:

```text
operation ID
operation status
exit status
timeout status
redaction status
operation-specific commitments/fingerprints/statuses
ProofEvent v1
typed runner result
```

## Private Material Intentionally Excluded

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was committed or copied into the repository.

The runner tests avoid realistic secrets and assert redaction with constructed harmless strings.

## Negative/Tamper Case

The tests prove the runner rejects or blocks:

```text
;
&&
|
backticks
$()
../ traversal
absolute path injection
Unicode traversal lookalike
arbitrary executable
oversized run ID
non-local host
```

Rejected path payloads do not reach the spawn layer.

## Claim Now Allowed

ZecSafe can accurately claim:

```text
It has a local fixed-operation runner with a fixed operation allowlist, fixed binary allowlist, argument-array process execution, path containment, local-only host enforcement, timeout/capture/redaction, typed results, ProofEvent v1 emission, and injection-focused security tests.
```

## Claim Still Forbidden

ZecSafe must not yet claim:

```text
The runner creates real PCZTs.
The runner prepares real Zcash signing context.
The runner starts real A+B FROST sessions.
The runner signs/proves/combines funded PCZTs.
The runner broadcasts transactions.
zecsafe-proof-v1 exists.
make judge-proof exists.
Mainnet proof exists.
```

## Acceptance

- [x] Fixed operation allowlist implemented.
- [x] Fixed binary allowlist implemented.
- [x] `shell: false` process execution enforced.
- [x] Argument arrays used.
- [x] Fixed runner workspace boundary implemented.
- [x] Canonical path containment implemented.
- [x] Random run IDs implemented.
- [x] Timeout support implemented.
- [x] stdout/stderr capture implemented.
- [x] Secret redaction implemented.
- [x] Typed result implemented.
- [x] ProofEvent v1 emitted per operation.
- [x] `;` payload tested.
- [x] `&&` payload tested.
- [x] `|` payload tested.
- [x] Backtick payload tested.
- [x] `$()` payload tested.
- [x] `../` payload tested.
- [x] Absolute path injection tested.
- [x] Unicode traversal edge tested.
- [x] Arbitrary executable rejection tested.
- [x] Oversized run ID tested.
- [x] Non-local host rejection tested.
- [x] `npm run check` passed.

> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-011 - Signing-Context Preparation

Status: `ZSAFE-P0-011` complete.

Completed UTC: `2026-07-11T17:19:42Z`.

## Outcome

ZecSafe now prepares a shielded transaction signing context through the fixed `signing.prepare` operation. It hashes the actual PCZT bytes, requires that fingerprint to match a passing Binding Firewall report, checks intent expiry before invoking the tool, and invokes the pinned `zcash-devtool pczt inspect` path with `shell: false`.

The strict adapter accepts exactly one shielded SIGHASH from successful pinned-tool output. Public output contains only the PCZT fingerprint, binding-report reference, SIGHASH fingerprint, expiry status, tool commit, and readiness status.

## Private Boundary

Raw PCZT bytes are streamed only to the local pinned process. Raw inspect output and stderr are removed from runner results after parsing. The raw SIGHASH exists only in the in-memory adapter result and is discarded by the fixed-runner operation. No randomizer, authorization material, viewing key, wallet path, or raw signing context is written to ProofEvent, fixtures, logs, or documentation.

The official inspect path does not require an FVK/UFVK and does not generate a RedPallas randomizer. Randomizer creation remains part of the later FROST session and must stay local and ephemeral.

## Files

```text
src/signing-context-v1.mjs
src/fixed-runner-v1.mjs
src/proof-event-v1.mjs
scripts/signing-context-v1.test.mjs
scripts/fixed-runner.mjs
scripts/verify.mjs
package.json
```

## Negative Coverage

```text
expired intent
actual PCZT fingerprint mismatch
non-PASS binding report
wrong pinned tool commit
pinned tool non-zero exit
pinned tool timeout
missing or multiple shielded SIGHASH lines
raw SIGHASH exclusion from public result
signing material redaction from command output
```

## Verification

`npm run check` passed at `2026-07-11T17:19:42Z`, including the new signing-context tests and the repository security scan.

## Claim Boundary

Allowed: ZecSafe can link a passing Binding Firewall report to the actual PCZT bytes, derive the real shielded SIGHASH through the pinned official inspect path, and emit a public-safe SIGHASH fingerprint and expiry status.

Forbidden: ZecSafe has not started a real FROST session against this context, generated or distributed randomizer material, completed signer review, signed/proved/combined a funded PCZT, broadcast a transaction, or generated judge-proof v1.

## Acceptance Criteria

- [x] Actual PCZT bytes fingerprinted and linked to a passing binding report.
- [x] Pinned official `zcash-devtool` inspect path invoked through the fixed runner.
- [x] Exactly one real shielded SIGHASH extracted.
- [x] Only the SIGHASH fingerprint is emitted publicly.
- [x] Intent expiry is checked before tool invocation.
- [x] Raw tool output is removed from runner results.
- [x] Randomizer and authorization material are never emitted.
- [x] ProofEvent v1 records public-safe `SIGNING_CONTEXT` evidence.
- [x] Focused negative and redaction tests pass.
- [x] `npm run check` passes.

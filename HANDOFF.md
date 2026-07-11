# ZecSafe Handoff

Last updated UTC: `2026-07-11T18:27:25Z`

Workspace root:

```text
/home/dell/zecsafe
```

Active Windows plan source:

```text
C:\Users\DELL\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
/mnt/c/Users/DELL/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
```

Historical Windows plan baseline:

```text
C:\Users\DELL\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
/mnt/c/Users/DELL/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
```

## Current State

Branch and remote baseline:

```text
branch: main
HEAD: 29a0e57d22d79aceeca779398db57fc17eab7a22
remote: https://github.com/cyberrockng/zecsafe.git
```

Current worktree is intentionally dirty. No execution-plan commit has been created.

Known dirty/untracked areas:

```text
.github/
.gitignore
HANDOFF.md
SUBMISSION.md
docs/execution/
package.json
scripts/security-scan.mjs
scripts/create-intent.mjs
scripts/intent-v1.test.mjs
scripts/pczt-inspect.mjs
scripts/pczt-inspect-v1.test.mjs
scripts/pczt-bind.mjs
scripts/pczt-bind-v1.test.mjs
scripts/proof-event.mjs
scripts/proof-event-v1.test.mjs
scripts/fixed-runner.mjs
scripts/fixed-runner-v1.test.mjs
scripts/signer-selection.mjs
scripts/signer-selection-v1.test.mjs
scripts/signing-context-v1.test.mjs
scripts/signer-review.mjs
scripts/signer-review-v1.test.mjs
scripts/frost-session.mjs
scripts/frost-session-v1.test.mjs
server.mjs
src/intent-v1.mjs
src/pczt-inspect-v1.mjs
src/pczt-bind-v1.mjs
src/proof-event-v1.mjs
src/fixed-runner-v1.mjs
src/signer-selection-v1.mjs
src/signing-context-v1.mjs
src/signer-review-v1.mjs
src/frost-session-v1.mjs
```

Latest completed task ID:

```text
ZSAFE-P0-013
```

Current gate:

```text
Funded-wallet boundary resolved. Awaiting human approval before creating/binding a real PCZT input or starting ZSAFE-P0-014.
```

Last known verification:

```text
2026-07-11T18:27:25Z
npm run check: passed
```

Latest funded-wallet proof:

```text
2026-07-11T18:24:59Z
source: Fauzec Zcash testnet faucet direct API
request_id: 01KX9638ZRP6N1X51YTW2KT4P2
txid: bef12267c983bfb2b3bfd54c4fdb2ecc3353e50cc8bc3a7a52bc585e5e22bca5
mined_height: 4160350
synced_height: 4160359
address: utest12erssr45tfcpehtq3l9fmjug9304k8vs8c0lk702fs2e70q8tpv4ekd6ncfrgnnsymdgwl99eux7t94pzgd6d2ud2k5r3dtsvzm3mkz2rzrewv0qfxsw86up2lj7kg85lnkrggg78aypn7tu35r5ukgkhlxlqjqlu5jgwfc0tl9q5aktm64xv6jq99d9ax72u2yrn9w0cd3rqr5u0v8
dev-wallet: 1.00000000 TAZ Ironwood spendable
view-wallet: 1.00000000 TAZ Ironwood spendable
```

User rule added on 2026-07-11:

```text
After every completed task ID, update HANDOFF.md.
Ask for permission before moving to the next task/session.
```

## Completed Execution Tasks

```text
ZSAFE-W0-001  COMPLETE
ZSAFE-W0-002  COMPLETE
ZSAFE-W0-003  COMPLETE
ZSAFE-W0-004  COMPLETE
ZSAFE-W0-005  COMPLETE
ZSAFE-P0-001  COMPLETE
ZSAFE-P0-002  COMPLETE
ZSAFE-P0-003  COMPLETE_WITH_FUNDING_BOUNDARY
ZSAFE-P0-004  PASS_FOR_FROST_GROUP_SETUP
ZSAFE-P0-005  COMPLETE
ZSAFE-P0-006  COMPLETE
ZSAFE-V3-001  COMPLETE
ZSAFE-P0-007  COMPLETE
ZSAFE-P0-008  COMPLETE
ZSAFE-P0-009  COMPLETE
ZSAFE-P0-010  COMPLETE
ZSAFE-P0-011  COMPLETE
ZSAFE-P0-012  COMPLETE
ZSAFE-P0-013  COMPLETE_WITH_PCZT_INPUT_BOUNDARY
```

## Execution Docs

```text
docs/execution/00-MISSION.md
docs/execution/01-CURRENT-STATE.md
docs/execution/02-COMPETITIVE-BENCHMARK.md
docs/execution/03-SECRET-WALLET-SCAN.md
docs/execution/04-FEATURE-SURVIVAL.md
docs/execution/05-TOOLCHAIN-PINS.md
docs/execution/06-REDPALLAS-REPRO.md
docs/execution/07-PCZT-VIEW-ONLY-REPRO.md
docs/execution/08-EXECUTION-LEDGER.md
docs/execution/09-DKG-FEASIBILITY.md
docs/execution/10-INTENT-V1.md
docs/execution/11-PCZT-INSPECT-ADAPTER.md
docs/execution/12-JUDGE-PROOF-AMENDMENT.md
docs/execution/13-BINDING-FIREWALL.md
docs/execution/14-PROOF-EVENT-V1.md
docs/execution/15-FIXED-OPERATION-RUNNER.md
docs/execution/16-SIGNER-SELECTION.md
docs/execution/17-SIGNING-CONTEXT.md
docs/execution/18-SIGNER-REVIEW.md
docs/execution/19-FROST-SESSION.md
```

## P0 Results So Far

`ZSAFE-P0-001` pinned the upstream toolchain:

```text
Zcash protocol spec: Zcash Protocol Specification, Version v2026.7.0-31-g696109 [NU6.2]
zips commit: 69610984109078075e7e64989ecf89d63a259b97
ZF FROST repo commit: 2016e44ba4a4757a996300350063b937a2ad33e8
frost-tools commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
zcash-devtool commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

`ZSAFE-P0-002` reproduced a pinned 2-of-3 RedPallas FROST signing run with one unavailable participant:

```text
external run: /home/dell/.zecsafe/runs/p0-002-20260711T041846Z
selected signers: Alice and Bob
offline signer: Eve
signature bytes: 64
signature sha256: 70ce85e40b7bf1987e0c5af7104dc26ba76f312a58f96969ae38bcbdcc138e94
```

`ZSAFE-P0-003` reproduced the official zcash-devtool wallet/view-only setup path and recorded the PCZT funding boundary:

```text
external run: /home/dell/.zecsafe/runs/p0-003-20260711T070024Z
network: testnet
endpoint: https://testnet.zec.rocks:443
chain tip observed: 4159196
spending wallet balance: 0 TAZ
view-only wallet balance: 0 TAZ
official PCZT create result: Insufficient balance (have 0, need 10001 including fee)
manual transparent PCZT bytes: 286
manual transparent PCZT sha256: 98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
extract result: TransparentFinalize(MissingSignature)
```

`ZSAFE-P0-004` reproduced DKG group setup and downstream RedPallas signing:

```text
external run: /home/dell/.zecsafe/runs/p0-004-20260711T071646Z
group setup: DKG
threshold: 2
participants: 3
public group key: 943022b2c25fe277b6f150c36b88af0e6dcc95e67422fc66fd561327083cb324
selected signers: Alice and Bob
offline signer: Eve
message bytes: 54
signature bytes: 64
message sha256: 2dad43d0efb88849fc448c401dee319b330cda3f9bf0c16f4339659959462468
signature sha256: 81189e428c8c1100f25e4ee54b6aaf9819535c2a649f6b092c0e74080113c4b3
```

`ZSAFE-P0-005` created deterministic transaction intent v1:

```text
schema_version: zecsafe-intent-v1
module: src/intent-v1.mjs
CLI: scripts/create-intent.mjs
API: POST /api/intent/create
test: scripts/intent-v1.test.mjs
fixture commitment: sha256:10124990b764067b015f1c0bd23fcc92db7cb1775cb5206fdfee64143ef2d9c1
check coverage: stable ordering, mutation checks, float/scientific rejection, CLI output
```

`ZSAFE-P0-006` created the PCZT fingerprint and strict inspect adapter:

```text
module: src/pczt-inspect-v1.mjs
CLI: scripts/pczt-inspect.mjs
test: scripts/pczt-inspect-v1.test.mjs
pinned tool: zcash-devtool 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
external fixture: /home/dell/.zecsafe/runs/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
raw inspect capture: /home/dell/.zecsafe/pczt-inspect/inspect-20260711T073416Z.txt
source_fingerprint: sha256:36ecbc4bdbcb956f347075c23035e048b31c722c6b746867369c4e8df6c667ac
pczt_fingerprint: sha256:98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
output_count: 1
amounts_zatoshis: [10000]
fee_zatoshis: 10000
check coverage: valid fixture, missing field, malformed output, unexpected extra output, tool-version mismatch
```

`ZSAFE-V3-001` created the judge-proof integration amendment:

```text
active plan: C:\Users\DELL\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
historical baseline: C:\Users\DELL\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
repo doc: docs/execution/12-JUDGE-PROOF-AMENDMENT.md
new execution ideal: Judge-First Verifiability
remaining-task rule: every completed task must state judge-proof impact, public-safe evidence, private exclusions, negative/tamper case, allowed claim, and forbidden claim
P0-007 extra requirement: Binding Firewall must produce a redacted deterministic report for future ProofEvent v1 and zecsafe-proof-v1 use
```

`ZSAFE-P0-007` created the deterministic Intent-to-PCZT Binding Firewall:

```text
module: src/pczt-bind-v1.mjs
CLI: scripts/pczt-bind.mjs
test: scripts/pczt-bind-v1.test.mjs
package alias: npm run pczt:bind
test alias: npm run test:bind
report schema: zecsafe-binding-report-v1
blocked operations on FAIL: signing.prepare, frost.session.start, broadcast.preview, broadcast.execute
checks: source, network, recipient, amount, fee policy, memo policy, unexpected output, modeled change output
real external fixture smoke: PASS ALLOWED sha256:98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
negative coverage: amount mutation, recipient mutation, network mutation, extra output, memo mismatch where reported, fee-policy violation
```

`ZSAFE-P0-008` created ProofEvent v1 and the deterministic run-state reducer:

```text
module: src/proof-event-v1.mjs
CLI: scripts/proof-event.mjs
test: scripts/proof-event-v1.test.mjs
package alias: npm run proof:event
test alias: npm run test:events
event schema: proof-event-v1
run-state schema: zecsafe-run-state-v1
features: stage enum, FROST status vocabulary, chain status vocabulary, schema validation, monotonic sequence validation, timestamp non-regression, public-safe projection, append-only NDJSON helper, events[] -> RunState reducer
negative coverage: out-of-order sequence, time regression, private recipient field, mnemonic field, wrong chain status vocabulary, duplicate append
```

`ZSAFE-P0-009` created the local fixed-operation runner:

```text
module: src/fixed-runner-v1.mjs
CLI: scripts/fixed-runner.mjs
test: scripts/fixed-runner-v1.test.mjs
package alias: npm run fixed:run
test alias: npm run test:runner
result schema: zecsafe-fixed-runner-result-v1
default workspace: /home/dell/.zecsafe/runner
implemented operations: toolchain.status, wallet.status, intent.create, pczt.bind
registered reserved operations: pczt.create, pczt.inspect, signing.prepare, frost.session.start, frost.session.status, pczt.sign.complete, pczt.prove, pczt.combine, broadcast.preview, broadcast.execute, transaction.status, proof.generate, proof.verify
safety: local-only host, operation allowlist, binary allowlist, shell:false, argument arrays, canonical path containment, random run IDs, timeout, capture, redaction, typed results, ProofEvent v1 per operation
negative coverage: semicolon, &&, pipe, backticks, $(), ../, absolute path, Unicode traversal lookalike, arbitrary executable, oversized run ID, non-local host
```

`ZSAFE-P0-010` created participant availability and signer selection:

```text
module: src/signer-selection-v1.mjs
CLI: scripts/signer-selection.mjs
test: scripts/signer-selection-v1.test.mjs
package alias: npm run signers:select
test alias: npm run test:signers
schema: zecsafe-signer-selection-v1
fixed-runner operation implemented: frost.session.status
proof event stage: FROST_SESSION
proof-run rule: total=3, threshold=2, C=UNAVAILABLE, selected=A+B only
statuses: SATISFIABLE, UNSATISFIABLE, BLOCKED
public-safe evidence: threshold, participant total, unavailable participant count, selected public fingerprints, group fingerprint, threshold status, FROST status
critical rule: unavailable or unknown selected participants block the session instead of being treated as optional
negative coverage: 0 available, 1 available, selected set below threshold, explicit empty selected set, unavailable selected, unknown selected, invalid threshold, duplicate participant IDs, duplicate selected IDs, CLI blocked summary, fixed-runner blocked path
```

`ZSAFE-P0-011` created signing-context preparation:

```text
module: src/signing-context-v1.mjs
test: scripts/signing-context-v1.test.mjs
test alias: npm run test:signing
schema: zecsafe-signing-context-v1
fixed-runner operation implemented: signing.prepare
proof event stage: SIGNING_CONTEXT
public-safe evidence: PCZT fingerprint, binding report reference, SIGHASH fingerprint, expiry status, readiness status, pinned tool commit
private boundary: raw PCZT and tool output stay local; raw SIGHASH is ephemeral; randomizer and authorization material are never emitted
negative coverage: expiry, PCZT mismatch, tool failure, malformed SIGHASH output, raw output exclusion, signing-material redaction
```

`ZSAFE-P0-012` created selected-signer review:

```text
module: src/signer-review-v1.mjs
CLI: scripts/signer-review.mjs
test: scripts/signer-review-v1.test.mjs
package alias: npm run signer:review
test alias: npm run test:review
schemas: zecsafe-signer-review-package-v1, zecsafe-signer-review-v1
fixed-runner operation implemented: signer.review
proof event stage: FROST_SESSION
review mode: semantic_pczt_review
confirmation phrase: I REVIEWED AND APPROVE
public-safe evidence: review mode, PASS/FAIL/BLOCKED status, checked field statuses, reviewer public fingerprint, selected public fingerprints, PCZT/source/binding/SIGHASH fingerprints, limitation statement
private boundary: raw PCZT, recipient value, amount value, unredacted memo text, randomizer, nonces, keys, shares, and authorization material are excluded from ProofEvents and runner public output
negative coverage: missing confirmation, amount mutation, fee/output-count mutation, SIGHASH mutation, reviewer not selected, unsupported independent_sighash claim, raw recipient/amount public-output exclusion
```

`ZSAFE-P0-013` created the FROST session gate and live A+B smoke:

```text
module: src/frost-session-v1.mjs
CLI: scripts/frost-session.mjs
test: scripts/frost-session-v1.test.mjs
package alias: npm run frost:session
test alias: npm run test:frost-session
schema: zecsafe-frost-session-v1
fixed-runner operation implemented: frost.session.start
proof event stage: FROST_SESSION
positive statuses: THRESHOLD_REACHED, AGGREGATE_SIGNATURE_VERIFIED
public-safe evidence: group fingerprint, threshold, participant total, unavailable count, selected public fingerprints, session fingerprint, SIGHASH fingerprint, aggregate signature fingerprint, signature byte length, checked field statuses
negative coverage: only A selected -> UNSATISFIABLE / NOT_STARTED, blocked review, SIGHASH mismatch, aggregate signature byte-length mismatch, invalid threshold, raw message/signature public-output exclusion
live smoke: /home/dell/.zecsafe/runs/p0-013-20260711T174838Z
live result: coordinator=0, Alice=0, Bob=0, Eve not started, aggregate signature bytes=64, aggregate signature sha256=ba54761340ff4fe7a163cf4f1df6c015533a7e5a85044058cdb0d6e94c2f912d
boundary: live smoke signed a private 32-byte smoke input because current P0-003 PCZT artifacts produce zero shielded SIGHASH lines; not yet transaction-completion-ready PCZT-bound signing
```

## Sensitive External Artifacts

Do not commit or print raw contents from:

```text
/home/dell/.zecsafe/runs/p0-002-20260711T041846Z
/home/dell/.zecsafe/runs/p0-003-20260711T070024Z
/home/dell/.zecsafe/runs/p0-004-20260711T071646Z
/home/dell/.zecsafe/runs/p0-013-20260711T174838Z
/home/dell/.zecsafe/pczt-inspect
```

The P0-002 directory contains local FROST participant configs, key packages, TLS keys, and logs.

The P0-003 directory contains wallet DBs, an age identity file, a UFVK, seed/account metadata, generated addresses, a disposable transparent private key, manual coin JSON, raw PCZT bodies, and logs that may include sensitive wallet material.

The P0-004 directory contains unencrypted participant configs, contact tokens, TLS keys, logs, and a raw signature artifact.

The P0-013 directory contains TLS key copies, protocol logs, a private 32-byte smoke signing input, and a raw aggregate signature artifact.

The PCZT inspect diagnostics directory contains raw inspect output and must stay outside the repository.

## Current Product Truth

ZecSafe still does not yet have:

```text
live A+B FROST signature over a real shielded Zcash PCZT/SIGHASH
independent SIGHASH recomputation inside signer review
signed/proven/combined funded PCZT
zecsafe-proof-v1 schema
one-command judge verifier
mainnet broadcast proof
```

ZecSafe now has a headless Binding Firewall report, but it is not yet persisted as ProofEvent v1 and is not yet included in a judge-verifiable proof bundle.

ZecSafe now has ProofEvent v1 validation and a reducer, but existing app UI/server proof-bundle routes still use older prototype state.

ZecSafe now has the fixed-operation runner framework, real signing-context preparation, semantic selected-signer review, and a FROST session evidence gate. Most later protocol operations remain reserved/not implemented.

ZecSafe now links actual PCZT bytes to a real shielded SIGHASH fingerprint and can record selected-signer semantic review. A pinned DKG group completed a live A+B FROST smoke with Eve offline, but current available PCZT artifacts do not provide a real shielded PCZT SIGHASH for transaction-completion-ready signing.

Existing app runtime is still a prototype dashboard with read-only mainnet status/balance/tx lookup, browser ECDSA proposal attestations, simulated recovery, and old proof-bundle summary behavior.

## Commands

Run all current checks:

```bash
cd /home/dell/zecsafe
npm run check
```

Run signer-selection tests only:

```bash
cd /home/dell/zecsafe
npm run test:signers
```

Run signer-review tests only:

```bash
cd /home/dell/zecsafe
npm run test:review
```

Run FROST session tests only:

```bash
cd /home/dell/zecsafe
npm run test:frost-session
```

Run signer-selection CLI:

```bash
cd /home/dell/zecsafe
npm run signers:select -- --json selection.json --summary
```

Run signer-review CLI:

```bash
cd /home/dell/zecsafe
npm run signer:review -- review review-package.json --confirm "I REVIEWED AND APPROVE" --summary
```

Run FROST session CLI:

```bash
cd /home/dell/zecsafe
npm run frost:session -- --json session-package.json --summary
```

Run fixed runner:

```bash
cd /home/dell/zecsafe
npm run fixed:run -- run --request request.json --pretty
```

Start app:

```bash
cd /home/dell/zecsafe
npm start
```

Open:

```text
http://127.0.0.1:4173
```

## Human Approval Boundaries

Stop and ask the user before:

```text
Moving to each next task/session.
Funding a dedicated testnet or mainnet demo wallet.
Broadcasting any Zcash transaction.
Deleting or rotating a discovered live secret.
Publishing the final ZecHub PR.
Posting the final Discord submission.
Creating a commit.
```

## Exact Next Steps In Priority Order

1. Do not start until the user explicitly approves the next step.
2. Before `ZSAFE-P0-014`, resolve the PCZT input boundary: current artifacts produce zero shielded SIGHASH lines, so a funded/shielded PCZT or equivalent transaction-completion input is required.
3. If the user approves resolving that boundary, read the V3 plan around `ZSAFE-P0-014 - Complete signed/proven/combined PCZT` plus `docs/execution/19-FROST-SESSION.md`.
4. Do not fund a testnet or mainnet demo wallet without explicit human approval.
5. Keep shares, nonces, randomizers, keys, raw PCZT, raw SIGHASH, raw signatures, and authorization material out of ProofEvents and logs.
6. Run `npm run check`, update execution docs and `HANDOFF.md`, then stop at the next approval boundary.

## Notes For The Next Session

Do not redo completed task IDs unless the worktree changed in a way that invalidates their evidence.

Use V3 as the active execution plan. Keep V2 as historical baseline.

Do not begin UI redesign until the headless proof kernel path is ready.

Do not start recovery work.

Use `rg`/`rg --files` first for searches.

Use `apply_patch` for manual repo edits.

Keep all Zcash/FROST private material outside the repository.

Update this file immediately after every completed task ID.

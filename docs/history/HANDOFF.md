> **HISTORICAL RECORD.** Operational chronology of the ZecSafe execution gates.
> Not current product documentation. Where this disagrees with `README.md`, `SUBMISSION.md`,
> `PROOF_SPEC.md`, or `SECURITY.md`, **those are authoritative**.
> Absolute local machine paths have been replaced with placeholders (`<runs>`, `<repo>`, `<plans>`).
> The proof bundle hash recorded below was later superseded by a reproducible regeneration from the
> same frozen artifacts; see `fixtures/verified-mainnet-run/README.md`. No evidence-bearing field changed.

# ZecSafe Handoff

Last updated UTC: `2026-07-12T15:14:59Z`

Workspace root:

```text
<repo>
```

Active Windows plan source:

```text
<plans>\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
<plans>/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
```

Historical Windows plan baseline:

```text
<plans>\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
<plans>/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
```

## Current State

Branch and remote baseline:

```text
branch: main
HEAD: 0cd8aeb (Complete verified mainnet FROST run: P0-018 through P0-024)
remote: https://github.com/cyberrockng/zecsafe.git
```

All `ZSAFE-P0-018` through `ZSAFE-P0-024` implementation, fixtures, docs, and the compatibility patch were committed and pushed in `0cd8aeb` (2026-07-12). The worktree is clean apart from this HANDOFF bookkeeping update. Note: `fixtures/verified-mainnet-run/proof.json` records `zecsafe_commit: ad83269...` — the HEAD at proof recording time, one commit before the freeze landed; the fixture README documents this.

Latest completed task ID:

```text
ZSAFE-P0-024
```

Current gate:

```text
ZSAFE-P0-024 complete. The verified mainnet run is frozen under fixtures/verified-mainnet-run/ (proof.json bundle hash sha256:e90c3c46ae1474d848d3cc20ef4157e52b151dddda2015c034f83ad31ee9cb64, events.public.json with 5 hash-annotated gate events, labeled README). make judge-proof-mainnet returns VERIFIED RECORDED ZECSAFE PROOF; make judge-proof-mainnet-tamper rejects all 7 semantic mutations; security scan passes. The completion gate now accepts broadcast statuses only with explicit recorded human approval (new negative tests included). Stop for explicit human approval before any next step (commit of all P0-018..P0-024 work, ZecHub PR, and Discord submission each remain separately human-gated).
```

Last known verification:

```text
2026-07-12T15:14:59Z
npm run check: passed
```

Hard project budget (carried through every remaining task):

```text
total budget: 20000 zatoshis (wallet-observed P0-018 balance; includes all fees)
spent so far: 0 zatoshis (PCZT is unsigned and unbroadcast)
committed by the P0-020 PCZT if later broadcast: 10000-zatoshi ZIP-317 fee (both 5000 outputs return to the vault); 10000 <= 15000 approved ceiling PASS; amount + fee = 15000 <= 20000 budget PASS
rules: no additional funding; no broadcast without that task's explicit human gate; do not retry when remaining balance is insufficient
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

Latest FROST-controlled PCZT completion proof:

```text
2026-07-11T18:52:00Z
external run: <runs>/p0-014-20260711T183213Z
funding source: Fauzec Zcash testnet faucet direct API
funding request_id: 01KX977K8G59R5EZGGR21JBVFG
funding txid: d8b6f151c2265a40fc7c5ee42313b84ae494018157f257a5a60c2c353ddb697a
funding mined_height: 4160374
funding amount: 1.00000000 TAZ
source PCZT sha256: 7d494c53178afbd39c50dafedd5d2755681d02d49bd95918847ae672382a2789
source inspect sha256: 6b3f8edf8fc34d92a2ac9cae3ae4fe767d74f20a779ae220082c57b2e139fd33
shielded SIGHASH sha256: 855d695441fd87747ebf92109b041fe88adff8a539f9850901ed5f5c1d6e60e3
aggregate signature bytes: 64
aggregate signature sha256: 6752d1b0eae9fc190848545a1b7868e3dd78a3e3883208c3620d17a78acfd231
signed PCZT sha256: 01730fc518d4a83ae6a6172e714650feebc0a0d3b5851ddd6bf8b28529ac85ce
proven PCZT sha256: 4e4518d785ed027da3adaae6a4b381b92e5e5c8b314900f2bdc14baabefda0f0
combined PCZT sha256: 2eb89c4c78bc11eff300ea9362fb771960658d643d97f3e8b14bc5e27938f54f
offline extracted txid: 1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b
broadcast status: NOT_BROADCAST
completion summary: SIGNED_PCZT PASS, PROVEN_PCZT PASS, PCZT_COMBINE PASS, FINAL BINDING PASS
```

Latest public proof bundle:

```text
2026-07-11T22:35:59Z
fixture: fixtures/proofs/p0-014-zecsafe-proof-v1.json
schema: zecsafe-proof-v1
bundle hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
network: test
FROST policy: 2 of 3
unavailable participants: 1
selected signers: 2
intent to PCZT: PASS
threshold reached: PASS
transaction txid: PRESENT
broadcast status: NOT_BROADCAST
judge-proof: PASS
tamper demo: PASS
```

Latest dry-broadcast proof run:

```text
2026-07-11T22:57:22Z
fixture: fixtures/proof-runs/p0-016-dry-broadcast-proof-run.json
schema: zecsafe-proof-run-v1
mode: dry-broadcast
status: PASS
recorded_at: 2026-07-11T22:52:30.000Z
proof_bundle_hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
proof_run_ref: sha256:dcfa154cd662bb4e23a85f8e5977caae82f394f695b169d65466e12fea6a8048
sequence: PASS Toolchain pinned; PASS View-only wallet available; PASS Intent commitment created; PASS PCZT created; PASS Intent to PCZT binding; PASS Participant C unavailable; PASS Threshold satisfiable 2/3; PASS A+B selected; PASS FROST threshold reached; PASS Aggregate signature verified; PASS Signed PCZT; PASS Proven PCZT; PASS Combined PCZT; WAIT Mainnet broadcast requires human approval; PASS Pre-broadcast proof generated
funding/broadcast: no wallet funded, no transaction broadcast
```

Historical P0-017 pre-funding gate (superseded by P0-018 wallet observation):

```text
2026-07-11T23:14:41Z
external run: <runs>/p0-017-20260711T231314Z
fixture: fixtures/mainnet-demo/p0-017-mainnet-demo-env.json
schema: zecsafe-mainnet-demo-env-v1
status: READY_FOR_FUNDING_APPROVAL
network: main
Orchard address: u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0
group setup mode: DKG
ciphersuite: redpallas
public group key: df7823871b1ceb00632a60ba9cfe348ad5f2c14f36ebf27083873d37a0b32a26
group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
threshold: 2
participant count: 3
view-only wallet status: INITIALIZED
mainnet server: https://zec.rocks:443
mainnet observed tip: 3409081
recommended tiny funding amount: 0.0001 ZEC
funding status: NOT_FUNDED
broadcast status: NOT_BROADCAST
risk warning: Fund only disposable tiny mainnet ZEC after explicit approval; no production or personal funds; no broadcast is approved by this step.
```

Latest P0-018 wallet-observed preflight:

```text
2026-07-12T13:45:53.014Z
fixture: fixtures/mainnet-demo/p0-018-view-only-preflight-funded.json
schema: zecsafe-mainnet-view-preflight-v1
status: PASS
network: main
wallet type: UFVK/view-only
birthday height: 3408981
observed tip in fixture: 3409775
sync status: SYNC_COMPLETE
balance observed: YES
funded value observed: YES
total balance: 20000 zatoshis / 0.00020000 ZEC
Orchard spendable: 20000 zatoshis / 0.00020000 ZEC
coordinator wallet spend key: ABSENT
coordinator wallet participant share: ABSENT
compatibility patch ref: sha256:4a44cfc533dec72fb4e93bcbf81406260d4b3f6e77344b53035426ab297c7d8e
compatibility binary ref: sha256:8e8e2110e80bb5ea92924e7300ddcf57cb58e7e4f2a0439404b5b59f836ba0b9
preflight ref: sha256:112c3b13a12b5760cbc2590771a3ec735e46e5bbd12c78caf5d80f6cd9598eea
command: npm run mainnet:preflight -- --sync --summary
watch command: npm run mainnet:watch -- --sync --summary --max-attempts 30 --interval-ms 60000
```

External explorer check for txid `9571fcf98f0d7b47ff1dfccc46f7c83412698a44b1aed147ed333800c95fe078` showed block `3409633`, shielded transaction type, fee `0.0001 ZEC`, and 2 Orchard action transfers. The public explorer could not disclose the recipient or amount; the completed local UFVK scan now provides the wallet-observed evidence.

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
ZSAFE-P0-014  COMPLETE
ZSAFE-P0-015  COMPLETE
ZSAFE-P0-016  COMPLETE
ZSAFE-P0-017  COMPLETE
ZSAFE-P0-018  COMPLETE
ZSAFE-P0-019  COMPLETE
ZSAFE-P0-020  COMPLETE
ZSAFE-P0-021  COMPLETE
ZSAFE-P0-022  COMPLETE
ZSAFE-P0-023  COMPLETE_CONFIRMED
ZSAFE-P0-024  COMPLETE
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
docs/execution/20-PCZT-COMPLETION.md
docs/execution/21-ZECSAFE-PROOF-V1.md
docs/execution/22-DRY-BROADCAST-PROOF-RUN.md
docs/execution/23-MAINNET-DEMO-ENV.md
docs/execution/24-VIEW-ONLY-MAINNET-PREFLIGHT.md
docs/execution/25-MAINNET-PROOF-INTENT.md
docs/execution/26-MAINNET-PCZT-BINDING.md
docs/execution/27-MAINNET-FROST-SESSION.md
docs/execution/28-MAINNET-PCZT-COMPLETION.md
docs/execution/29-MAINNET-BROADCAST.md
docs/execution/30-VERIFIED-MAINNET-RUN.md
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
external run: <runs>/p0-002-20260711T041846Z
selected signers: Alice and Bob
offline signer: Eve
signature bytes: 64
signature sha256: 70ce85e40b7bf1987e0c5af7104dc26ba76f312a58f96969ae38bcbdcc138e94
```

`ZSAFE-P0-003` reproduced the official zcash-devtool wallet/view-only setup path and recorded the PCZT funding boundary:

```text
external run: <runs>/p0-003-20260711T070024Z
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
external run: <runs>/p0-004-20260711T071646Z
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
external fixture: <runs>/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
raw inspect capture: <zecsafe-private>/pczt-inspect/inspect-20260711T073416Z.txt
source_fingerprint: sha256:36ecbc4bdbcb956f347075c23035e048b31c722c6b746867369c4e8df6c667ac
pczt_fingerprint: sha256:98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
output_count: 1
amounts_zatoshis: [10000]
fee_zatoshis: 10000
check coverage: valid fixture, missing field, malformed output, unexpected extra output, tool-version mismatch
```

`ZSAFE-V3-001` created the judge-proof integration amendment:

```text
active plan: <plans>\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
historical baseline: <plans>\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
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
default workspace: <zecsafe-private>/runner
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
live smoke: <runs>/p0-013-20260711T174838Z
live result: coordinator=0, Alice=0, Bob=0, Eve not started, aggregate signature bytes=64, aggregate signature sha256=ba54761340ff4fe7a163cf4f1df6c015533a7e5a85044058cdb0d6e94c2f912d
boundary: live smoke signed a private 32-byte smoke input because current P0-003 PCZT artifacts produce zero shielded SIGHASH lines; not yet transaction-completion-ready PCZT-bound signing
```

`ZSAFE-P0-014` completed a real signed/proven/combined PCZT:

```text
module: src/pczt-completion-v1.mjs
CLI: scripts/pczt-complete.mjs
test: scripts/pczt-completion-v1.test.mjs
package alias: npm run pczt:complete
test alias: npm run test:pczt-complete
schema: zecsafe-pczt-completion-v1
fixed-runner operations implemented: pczt.sign.complete, pczt.prove, pczt.combine
proof event stage: PCZT_COMBINE
Ironwood inspect parsing added: 5 Ironwood actions, modeled change outputs, one reviewed recipient output
live run: <runs>/p0-014-20260711T183213Z
funding txid: d8b6f151c2265a40fc7c5ee42313b84ae494018157f257a5a60c2c353ddb697a
source PCZT sha256: 7d494c53178afbd39c50dafedd5d2755681d02d49bd95918847ae672382a2789
shielded SIGHASH sha256: 855d695441fd87747ebf92109b041fe88adff8a539f9850901ed5f5c1d6e60e3
aggregate signature sha256: 6752d1b0eae9fc190848545a1b7868e3dd78a3e3883208c3620d17a78acfd231
signed PCZT sha256: 01730fc518d4a83ae6a6172e714650feebc0a0d3b5851ddd6bf8b28529ac85ce
proven PCZT sha256: 4e4518d785ed027da3adaae6a4b381b92e5e5c8b314900f2bdc14baabefda0f0
combined PCZT sha256: 2eb89c4c78bc11eff300ea9362fb771960658d643d97f3e8b14bc5e27938f54f
offline extracted txid: 1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b
broadcast status: NOT_BROADCAST
completion summary: SIGNED_PCZT PASS, PROVEN_PCZT PASS, PCZT_COMBINE PASS, FINAL BINDING PASS
negative coverage: mock signature, corrupt signature length, corrupt signed PCZT, corrupt proven PCZT, mismatched pair, raw/private package fields
```

`ZSAFE-P0-015` implemented `zecsafe-proof-v1`:

```text
module: src/zecsafe-proof-v1.mjs
CLI: scripts/zecsafe.mjs
test: scripts/zecsafe-proof-v1.test.mjs
schema doc: docs/proof/zecsafe-proof-v1.schema.json
trust model: docs/proof/TRUST_MODEL.md
proof spec: PROOF_SPEC.md
fixture: fixtures/proofs/p0-014-zecsafe-proof-v1.json
package aliases: npm run proof:generate, npm run proof:verify, npm run proof:tamper
make targets: make judge-proof, make judge-proof-tamper
fixed-runner operations implemented: proof.generate, proof.verify
bundle hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
negative coverage: txid, threshold, group fingerprint, selected signer, intent commitment, PCZT fingerprint, binding status, unsupported proof fields, private/policy-excluded proof material
```

`ZSAFE-P0-016` implemented the dry-broadcast proof-run gate:

```text
module: src/proof-run-v1.mjs
CLI: scripts/zecsafe.mjs proof-run --dry-broadcast
test: scripts/proof-run-v1.test.mjs
fixture: fixtures/proof-runs/p0-016-dry-broadcast-proof-run.json
package alias: npm run proof:run
make target: make proof-run-dry
schema: zecsafe-proof-run-v1
mode: dry-broadcast
status: PASS
proof bundle hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
proof-run ref: sha256:dcfa154cd662bb4e23a85f8e5977caae82f394f695b169d65466e12fea6a8048
sequence: required PASS/WAIT dry-broadcast sequence emitted in order
broadcast approval: WAIT Mainnet broadcast requires human approval
negative coverage: source proof must verify, broadcasted proof status rejected, unknown view-only wallet status rejected, missing WAIT rejected by tests
funding/broadcast: no wallet funded, no transaction broadcast
```

`ZSAFE-P0-017` created the dedicated mainnet demo environment:

```text
external run: <runs>/p0-017-20260711T231314Z
fixture: fixtures/mainnet-demo/p0-017-mainnet-demo-env.json
schema: zecsafe-mainnet-demo-env-v1
status: READY_FOR_FUNDING_APPROVAL
network: main
group setup mode: DKG
ciphersuite: redpallas
public group key: df7823871b1ceb00632a60ba9cfe348ad5f2c14f36ebf27083873d37a0b32a26
group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
threshold: 2
participants: 3
Orchard-only unified address: u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0
view-only wallet status: INITIALIZED
mainnet info: chain_name=main, chain_tip_height=3409081, server_uri=https://zec.rocks:443
recommended tiny funding amount: 0.0001 ZEC
funding status: NOT_FUNDED
broadcast status: NOT_BROADCAST
```

The P0-017 values above are the historical pre-funding boundary. The P0-018 fixture below is the current balance evidence.

`ZSAFE-P0-018` is complete:

```text
module: src/mainnet-view-v1.mjs
CLI: scripts/mainnet-view.mjs
test: scripts/mainnet-view-v1.test.mjs
fixture: fixtures/mainnet-demo/p0-018-view-only-preflight-funded.json
package aliases: npm run mainnet:preflight, npm run mainnet:watch
make targets: make mainnet-preflight, make mainnet-watch
schema: zecsafe-mainnet-view-preflight-v1
current status: PASS
sync status: SYNC_COMPLETE
wallet-observed balance: 20000 Orchard zatoshis / 0.00020000 ZEC
compatibility patch: patches/zcash-devtool/p0-018-pre-ironwood-subtree-compat.patch
next gate: explicit human approval before P0-019
```

`ZSAFE-P0-019` created the exact mainnet proof intent:

```text
fixture: fixtures/mainnet-demo/p0-019-mainnet-proof-intent.json
doc: docs/execution/25-MAINNET-PROOF-INTENT.md
schema: zecsafe-intent-v1 (evidence wrapper: zecsafe-mainnet-proof-intent-v1)
status: INTENT_CREATED
network: main
vault_id: vault_zecsafe_mainnet_demo
group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
recipient: vault self-send to u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0
amount: 5000 zatoshis / 0.00005000 ZEC
memo: NONE
fee policy: tool_default, max_fee_zatoshis 15000
expires_at: null
created_at: 2026-07-12T14:07:32.000Z
intent commitment: sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
budget check: amount + max fee = 20000 <= 20000 budget PASS; self-send worst-case net debit 15000 zatoshis
determinism: commitment reproduced twice via npm run intent:create and independently confirmed with sha256sum over the canonical intent JSON
human approval: destination, amount, memo, max fee, and expiry each explicitly user-approved at the P0-019 gate
boundary: no PCZT, no FROST session, NOT_BROADCAST, no spend key or share in coordinator workspace
```

`ZSAFE-P0-020` created the real mainnet PCZT and passed the Binding Firewall:

```text
external run: <runs>/p0-020-20260712T141448Z
fixture: fixtures/mainnet-demo/p0-020-mainnet-pczt-binding.json
doc: docs/execution/26-MAINNET-PCZT-BINDING.md
schema: zecsafe-mainnet-pczt-binding-v1
status: PASS
network: main
synced tip before create: 3409805
create tool: P0-018 pre-Ironwood compat worktree binary (base commit 1b065594d958d1cad2deafe7cd2e2fcc2774c46c)
inspect tool: clean pinned zcash-devtool checkout (same commit)
pczt byte length: 4897
pczt fingerprint: sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931
unbroadcast txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
transaction version: V5
pool: orchard (2 actions; 5000 payment to vault + 5000 modeled change)
actual fee: 10000 zatoshis (ZIP-317) <= 15000 approved ceiling
raw inspect fingerprint: sha256:84837faef5268e0347ee41267584e98b7b2876c137c507a2380a6e32e979dd14
shielded sighash fingerprint: sha256:aadf4d885fa722b766c4a35563c88464edb43432f411e2460fe56a52d7cb85c8
binding report: source PASS, network MATCH, recipient MATCH, amount MATCH, fee_policy PASS, memo_policy LIMITED (empty memo allowed), unexpected_output PASS, change_output PASS
binding status: PASS; FROST SESSION ALLOWED; intent commitment sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7
live tamper probe: amount 5000 -> 6000 rebind FAILED with amount MISMATCH and blocked signing.prepare/frost.session.start/broadcast.preview/broadcast.execute
parser change: src/pczt-inspect-v1.mjs now parses mainnet Orchard actions and the shielded-sighash footer (generalized from Ironwood); Orchard tests added; scripts/verify.mjs markers updated
boundary: no FROST session, no signatures, NOT_BROADCAST, raw PCZT/inspect/sighash stay in the external run directory
```

`ZSAFE-P0-021` completed the live mainnet A+B FROST session with C unavailable:

```text
external run: <runs>/p0-021-20260712T142858Z
fixture: fixtures/mainnet-demo/p0-021-mainnet-frost-session.json
doc: docs/execution/27-MAINNET-FROST-SESSION.md
schema: zecsafe-mainnet-frost-session-evidence-v1
status: PASS
signer review mode: semantic_pczt_review (confirmation phrase required; no independent SIGHASH recomputation claimed)
selection: SATISFIABLE; A+B selected; C UNAVAILABLE and never started
signing context: READY; sighash fingerprint sha256:cd551487fcc14602d52789ccd77bc3443ec16665ec5792ffa50a943051c99928 (raw 32 bytes)
sighash cross-check: signer-library bytes equal the pinned zcash-devtool inspect 'Sighash for shielded components' line
A review: PASS; B review: PASS
frost session: THRESHOLD_REACHED; AGGREGATE_SIGNATURE_VERIFIED
aggregate signature: 64 bytes; fingerprint sha256:c9b7508cd554dfa8de311cdaabd4518c19093c95da5761474808cf2c277f12ac
session fingerprint: sha256:cd6d729fcccc48458027b584cbc32363b65c83a9c29e7d2c91e5f1211605d9f8
ceremony: frostd (commit 7d33a95fecc91dacdb1503933e2bee43780d3293) + separate Alice/Bob participant processes + coordinator with PCZT-bound Orchard randomizer
helper: p0-021 pczt-helper extended with prepare-orchard/apply-orchard (librustzcash rev 8e6864a3c67cab3c64a052dd20f83c553662e8b2)
A fingerprint: sha256:a0c24753e044d224a7e5a9d7b572f6abb14375693b090e4c24b49cd856c52b0b
B fingerprint: sha256:533c516a94d7d1dec4192dd46afb1fe02620ce6bbd974736d0cfe7c36ec14cf5
C fingerprint: sha256:d6400dfe81d098e85cce57fe785b15c2ae5a3916e9b319022af6d14c2e31213c
hard rules: no single-process shares, no legacy browser signature, no cached signature, C not secretly used
boundary: signature NOT applied to PCZT; nothing proven/combined; NOT_BROADCAST; budget spent 0
```

`ZSAFE-P0-022` completed the final mainnet PCZT offline and stopped at the broadcast gate:

```text
external run: <runs>/p0-022-20260712T144710Z
fixture: fixtures/mainnet-demo/p0-022-mainnet-pczt-completion.json
doc: docs/execution/28-MAINNET-PCZT-COMPLETION.md
schema: zecsafe-mainnet-pczt-completion-evidence-v1
status: PASS_AWAITING_BROADCAST_APPROVAL
signed PCZT: sha256:df8cf3ad2fa7cfaa09def2756ba1995959fe9b70c0d5d98a9934cfd3e071b162 (apply-orchard; signature verified against rerandomized verification key)
proven PCZT: sha256:6b32eaa4f0fbd8abf862943cbabd77a46d2b3ab561038f4a8a617fb908235869 (offline Halo2 proofs, clean pinned devtool)
combined PCZT: sha256:945ffd063dc1921caa5e37cd01564cb0a0ac4e9f801f9214b5b9b1c6d69d7184
combined inspect ref: sha256:84837faef5268e0347ee41267584e98b7b2876c137c507a2380a6e32e979dd14 (byte-identical to source inspect)
final binding: PASS (INTENT <-> PCZT PASS, all field checks allow)
offline extracted txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
completion gate: source_pczt/signing_context/frost_signature/signed_pczt/proven_pczt/pczt_combine/final_binding/broadcast_gate all PASS
broadcast: NOT_BROADCAST; fee if broadcast: 10000 zatoshis; expected post-broadcast vault balance: 10000 zatoshis
next: ZSAFE-P0-023 broadcast ONLY after the user explicitly approves the exact broadcast action
```

`ZSAFE-P0-023` broadcast the approved transaction and recorded chain truth:

```text
external run: <runs>/p0-023-20260712T145358Z
fixture: fixtures/mainnet-demo/p0-023-mainnet-broadcast.json
doc: docs/execution/29-MAINNET-BROADCAST.md
schema: zecsafe-mainnet-broadcast-evidence-v1
status: CONFIRMED
approval: user explicitly approved broadcasting txid 27d0e850…8527
broadcast path: zcash-devtool pczt send, P0-018 compat binary, zec.rocks:443 direct, exit 0
txid: 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527 (matches approval and offline extract)
SUBMITTED: 2026-07-12T14:53:58Z
mined block: 3409837 at 2026-07-12T14:54:27Z
OBSERVED/MINED (wallet): 2026-07-12T14:56:43Z
CONFIRMED: 2026-07-12T14:59:57Z at observed tip 3409840 (rule: tip >= mined + 2)
fee paid: 10000 zatoshis; outputs: 5000 change + 5000 self-send, both back to the vault
budget: cumulative amount+fees 15000 <= 20000 PASS; remaining vault value 10000 zatoshis (non-spendable until note maturity)
broadcasts performed: exactly 1
```

`ZSAFE-P0-024` froze the Recorded Verified Mainnet Run:

```text
fixture dir: fixtures/verified-mainnet-run/ (proof.json, events.public.json, README.md)
doc: docs/execution/30-VERIFIED-MAINNET-RUN.md
bundle hash: sha256:e90c3c46ae1474d848d3cc20ef4157e52b151dddda2015c034f83ad31ee9cb64
network: main; chain status CONFIRMED; txid 27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
recorded zecsafe commit: ad83269298b73396ac0f4b743c59301de77fe937 (HEAD at recording; P0-018..024 work uncommitted at that moment)
make targets added: judge-proof-mainnet, judge-proof-mainnet-tamper
verification: VERIFIED RECORDED ZECSAFE PROOF; tamper demo rejects all 7 mutations; security scan passes
completion-gate change: src/pczt-completion-v1.mjs broadcast_gate now accepts SUBMITTED/OBSERVED/MINED/CONFIRMED only with an explicit broadcast_approval record; REJECTED and unapproved statuses still fail; tests added
post-broadcast completion package: <runs>/p0-023-20260712T145358Z/artifacts/completion-package.json (run gate result: BROADCAST CONFIRMED, all checks PASS)
```

## Sensitive External Artifacts

Do not commit or print raw contents from:

```text
<runs>/p0-002-20260711T041846Z
<runs>/p0-003-20260711T070024Z
<runs>/p0-004-20260711T071646Z
<runs>/p0-013-20260711T174838Z
<runs>/p0-014-20260711T183213Z
<runs>/p0-017-20260711T230737Z
<runs>/p0-017-20260711T231206Z
<runs>/p0-017-20260711T231314Z
<runs>/p0-020-20260712T141448Z
<runs>/p0-021-20260712T142858Z
<runs>/p0-022-20260712T144710Z
<runs>/p0-023-20260712T145358Z
<zecsafe-private>/pczt-inspect
```

The P0-002 directory contains local FROST participant configs, key packages, TLS keys, and logs.

The P0-003 directory contains wallet DBs, an age identity file, a UFVK, seed/account metadata, generated addresses, a disposable transparent private key, manual coin JSON, raw PCZT bodies, and logs that may include sensitive wallet material.

The P0-004 directory contains unencrypted participant configs, contact tokens, TLS keys, logs, and a raw signature artifact.

The P0-013 directory contains TLS key copies, protocol logs, a private 32-byte smoke signing input, and a raw aggregate signature artifact.

The P0-014 directory contains a UFVK-only wallet, wallet DB, generated FROST-controlled address record, source/signed/proven/combined PCZT bodies, raw SIGHASH bytes, Ironwood randomizer, raw aggregate signature, raw protocol logs, TLS key copies, and an offline extraction artifact.

The P0-017 successful directory contains mainnet demo FROST participant configs, contact tokens, TLS private keys, generated UFVK, view-only wallet DB, and private setup logs. The two earlier partial P0-017 directories contain failed setup artifacts such as TLS private keys and, for the second attempt, participant configs/contact tokens. Keep all P0-017 runtime directories outside the repository.

The P0-020 directory contains the raw unsigned mainnet PCZT bytes, raw inspect output including the raw shielded sighash, the full review JSON, binding reports, and sync logs. Keep it outside the repository.

The P0-021 directory contains copies of the mainnet demo participant configs (with shares), contact tokens, TLS private keys, raw sighash bytes, the Orchard randomizer, the raw aggregate signature, and ceremony logs whose participant output includes the raw sighash hex. Keep it outside the repository.

The PCZT inspect diagnostics directory contains raw inspect output and must stay outside the repository.

## Current Product Truth

ZecSafe still does not yet have:

```text
independent SIGHASH recomputation inside signer review
funded mainnet demo wallet balance
mainnet PCZT
mainnet broadcast proof
broadcasted P0-014 Zcash transaction
mainnet chain acceptance evidence
final mainnet judge fixture
```

ZecSafe now has a headless Binding Firewall report, and the P0-014 public proof fixture includes binding evidence through `zecsafe-proof-v1`.

ZecSafe now has ProofEvent v1 validation and a reducer, but existing app UI/server proof-bundle routes still use older prototype state.

ZecSafe now has the fixed-operation runner framework, real signing-context preparation, semantic selected-signer review, a FROST session evidence gate, a real signed/proven/combined PCZT completion gate, and proof.generate/proof.verify gates.

ZecSafe now links actual funded Ironwood PCZT bytes to a real shielded SIGHASH fingerprint, records selected-signer semantic review, completes a live A+B FROST aggregate signature over that SIGHASH with Eve offline, and combines the signed/proven PCZT. The P0-014 transaction was extracted offline as a txid and was not broadcast.

ZecSafe now has a public, tamper-evident `zecsafe-proof-v1` fixture for that P0-014 pre-broadcast run. It is verified by `make judge-proof`; required semantic mutations are rejected by `make judge-proof-tamper`.

ZecSafe now has a headless dry-broadcast proof-run command and public fixture. It proves the whole public proof kernel reaches pre-broadcast proof generation and stops at `WAIT Mainnet broadcast requires human approval`; it does not create, fund, open, or export any mainnet wallet.

ZecSafe now has a dedicated disposable mainnet demo group/address and initialized view-only wallet. The P0-017 fixture preserves the historical pre-funding gate; the live wallet has since observed `0.00020000 ZEC`. Broadcast remains `NOT_BROADCAST`.

ZecSafe completed P0-018 through the preflight path. It reports `PASS`, `SYNC_COMPLETE`, `20000` Orchard zatoshis, and passing coordinator-workspace checks without exposing the UFVK or spending authority.

ZecSafe now has the exact human-approved mainnet proof intent (P0-019): a deterministic `zecsafe-intent-v1` self-send of 5000 zatoshis with a 15000-zatoshi fee ceiling, commitment `sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7`, recorded in a public fixture.

ZecSafe now has a real unsigned mainnet PCZT (P0-020) that provably matches that intent under the Binding Firewall: 2 Orchard actions, 10000-zatoshi ZIP-317 fee, every implemented binding check allowing signing, plus a live tamper probe demonstrating the FAIL/BLOCKED path against the same real PCZT. It is not signed, not proven, and NOT_BROADCAST.

ZecSafe now has a live mainnet A+B FROST aggregate signature (P0-021) over that PCZT's shielded sighash, produced with C genuinely unavailable, both selected signers reviewing semantically and confirming, and rerandomized RedPallas signing with the PCZT-bound randomizer.

ZecSafe now has a fully authorized, proven, intent-bound mainnet transaction completed OFFLINE (P0-022): signature applied and cryptographically verified, Halo2 proofs created, combined PCZT final-binding PASS, txid extracted offline.

ZecSafe now has real Zcash mainnet chain acceptance (P0-023): the FROST 2-of-3 transaction with one participant unavailable was broadcast once after explicit human approval, mined at height 3409837, and CONFIRMED per the documented rule.

ZecSafe now has the final mainnet judge fixture (P0-024): fixtures/verified-mainnet-run/ with a hash-sealed proof bundle, public gate events, and one-command verification (make judge-proof-mainnet) plus tamper rejection (make judge-proof-mainnet-tamper). All former product-truth gaps from the original list are closed except "independent SIGHASH recomputation inside signer review", which remains an honest recorded limitation.

Existing app runtime is still a prototype dashboard with read-only mainnet status/balance/tx lookup, browser ECDSA proposal attestations, simulated recovery, and old proof-bundle summary behavior.

## Commands

Run all current checks:

```bash
cd <repo>
npm run check
```

Run signer-selection tests only:

```bash
cd <repo>
npm run test:signers
```

Run signer-review tests only:

```bash
cd <repo>
npm run test:review
```

Run FROST session tests only:

```bash
cd <repo>
npm run test:frost-session
```

Run signer-selection CLI:

```bash
cd <repo>
npm run signers:select -- --json selection.json --summary
```

Run signer-review CLI:

```bash
cd <repo>
npm run signer:review -- review review-package.json --confirm "I REVIEWED AND APPROVE" --summary
```

Run FROST session CLI:

```bash
cd <repo>
npm run frost:session -- --json session-package.json --summary
```

Run PCZT completion CLI:

```bash
cd <repo>
npm run pczt:complete -- --json completion-package.json --summary
```

Run proof verifier:

```bash
cd <repo>
make judge-proof
```

Run proof tamper demo:

```bash
cd <repo>
make judge-proof-tamper
```

Run dry-broadcast proof run:

```bash
cd <repo>
make proof-run-dry
```

Inspect P0-017 public fixture:

```bash
cd <repo>
npm run verify
```

Run P0-018 preflight:

```bash
cd <repo>
npm run mainnet:preflight -- --summary
```

Run bounded P0-018 watcher for a later balance re-check:

```bash
cd <repo>
npm run mainnet:watch -- --sync --summary --max-attempts 30 --interval-ms 60000
```

Run fixed runner:

```bash
cd <repo>
npm run fixed:run -- run --request request.json --pretty
```

Start app:

```bash
cd <repo>
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
2. The mainnet proof pipeline (P0-019..P0-024) is COMPLETE. Remaining human-gated actions, each needing its own explicit approval: (a) commit and push all uncommitted P0-018..P0-024 work; (b) any P0-025+/P1 tasks the user selects from the V3 plan (the one-command judge proof and tamper climax already exist for both the testnet and mainnet fixtures); (c) ZecHub PR publication; (d) Discord submission post.
3. The mainnet transaction is DONE and CONFIRMED; do not broadcast anything else. The remaining 10000 zatoshis in the vault stay untouched.
4. Do not broadcast the P0-014 testnet transaction. Do not add more testnet or mainnet funding.
5. Keep shares, nonces, randomizers, keys, raw PCZT, raw SIGHASH, raw signatures, UFVKs, wallet DBs, and authorization material out of ProofEvents and logs.
6. Preserve the clean official zcash-devtool checkout and use the fingerprinted P0-018 compatibility worktree only for the documented pre-Ironwood server case.
7. Re-run `npm run check` after any P0-019 implementation, update execution docs and `HANDOFF.md`, then stop at the next approval boundary.

## Notes For The Next Session

Do not redo completed task IDs unless the worktree changed in a way that invalidates their evidence.

Use V3 as the active execution plan. Keep V2 as historical baseline.

Do not begin UI redesign until the headless proof kernel path is ready.

Do not start recovery work.

Use `rg`/`rg --files` first for searches.

Use `apply_patch` for manual repo edits.

Keep all Zcash/FROST private material outside the repository.

Update this file immediately after every completed task ID.

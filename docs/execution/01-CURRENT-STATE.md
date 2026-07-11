# ZecSafe Current State

Status: `ZSAFE-W0-002` current-state truth map complete.

Updated UTC: `2026-07-11T03:24:04Z`

## Repository Identity

Repository root:

```text
/home/dell/zecsafe
```

Current branch:

```text
main
```

Baseline commit before this execution task:

```text
29a0e57d22d79aceeca779398db57fc17eab7a22
```

Remote:

```text
origin  https://github.com/cyberrockng/zecsafe.git (fetch)
origin  https://github.com/cyberrockng/zecsafe.git (push)
```

Recent Git history:

```text
29a0e57 (HEAD -> main, origin/main, origin/HEAD) Initial ZecSafe prototype
```

## Baseline Worktree State

`git status --short --branch`:

```text
## main...origin/main
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? scripts/security-scan.mjs
```

Tracked modifications present before the W0-001 documentation files were added:

```text
M  SUBMISSION.md
M  package.json
M  server.mjs
```

Untracked files present before W0-001 documentation files were added:

```text
.github/workflows/verify.yml
scripts/security-scan.mjs
```

Dirty-tree summary:

```text
 SUBMISSION.md |  2 +-
 package.json  |  5 ++++-
 server.mjs    | 60 +++++++++++++++++++++++++++++++++++++++++++++++++++++------
 3 files changed, 59 insertions(+), 8 deletions(-)
```

The W0-001 task did not overwrite or revert any pre-existing worktree change.

## Root Files

Root directory listing at baseline:

```text
.git/
.github/
.gitignore
LICENSE
README.md
SUBMISSION.md
docs/
index.html
package.json
scripts/
server.mjs
src/
```

Tracked files at baseline:

```text
.gitignore
LICENSE
README.md
SUBMISSION.md
docs/architecture-diagram.md
docs/architecture.md
docs/demo-script.md
docs/frost-integration.md
docs/frost-windows-setup.md
docs/mainnet-integration.md
docs/mainnet-readonly.md
docs/operator-notepad.md
docs/pr-checklist.md
docs/roadmap.md
docs/screenshots/mainnet-monitor.png
docs/screenshots/recovery-flow.png
docs/screenshots/transaction-proof.png
docs/screenshots/vault-dashboard.png
docs/submission-plan.md
docs/threat-model.md
index.html
package.json
scripts/capture-screenshots.mjs
scripts/frost-demo.mjs
scripts/frost-local-wrapper.mjs
scripts/start-zecsafe-local-rpc.ps1
scripts/verify.mjs
server.mjs
src/app.js
src/styles.css
```

## Stack Detection

Package manager:

```text
npm-compatible package.json is present.
No package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lock, or bun.lockb was found.
```

Runtime:

```text
Node.js v24.16.0
npm 11.13.0
```

CI runtime:

```text
.github/workflows/verify.yml configures Node 20 and runs npm run check.
The workflow file is currently untracked.
```

Application framework:

```text
No React, Next, Vite, Svelte, Vue, Remix, Astro, or bundler dependency was detected.
The app is a vanilla ES module frontend mounted by index.html and served by server.mjs.
server.mjs uses node:http and static-file serving plus local API routes.
```

Rust workspace:

```text
No Cargo.toml or rust-toolchain file was found inside the repository.
Rust/FROST tooling is external to the repo at this baseline.
```

Deployment target:

```text
No Vercel, Netlify, Docker, Fly, Railway, Render, Wrangler, or other deployment config was found.
Only the untracked GitHub Actions verify workflow was detected.
```

Operating environment:

```text
Linux Cyberrockng 6.18.33.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux
```

## Command Surface

`package.json` scripts:

```json
{
  "start": "node server.mjs",
  "verify": "node scripts/verify.mjs",
  "check:syntax": "node --check server.mjs && node --check src/app.js && node --check scripts/verify.mjs && node --check scripts/security-scan.mjs && node --check scripts/frost-demo.mjs && node --check scripts/frost-local-wrapper.mjs && node --check scripts/capture-screenshots.mjs",
  "security:scan": "node scripts/security-scan.mjs",
  "check": "npm run verify && npm run check:syntax && npm run security:scan"
}
```

Detected test/check commands:

```text
npm run verify
npm run check:syntax
npm run security:scan
npm run check
```

No dedicated unit-test, integration-test, lint, type-check, or production-build command exists yet.

## Baseline Verification

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

Exit code: `0`

## Server Smoke Test

Command:

```bash
node server.mjs
curl -fsS http://127.0.0.1:4173/api/health
```

Result:

```json
{"status":"ok","rpcConfigured":false,"supportedViewingKeys":["uview1","uvf1","zviews"],"transactionProof":true,"frostDemoRoute":true,"frostStatus":"check /api/frost-demo"}
```

Server log:

```text
ZecSafe listening on http://127.0.0.1:4173
```

The temporary smoke-test server was stopped after the check.

## W0-001 Acceptance

- [x] Exact repository remote recorded.
- [x] Exact baseline commit recorded.
- [x] Dirty worktree recorded.
- [x] Repository root confirmed.
- [x] Package manager detected.
- [x] Application framework detected.
- [x] Rust workspace status detected.
- [x] Test/check commands detected.
- [x] Deployment target status detected.
- [x] No prior work overwritten.

## W0-002 Executive Truth

The current ZecSafe repo is a browser-heavy proof-of-concept served by a custom Node server. It has real read-only Zcash mainnet evidence, browser-side ECDSA proposal attestations, an externally broadcast txid attachment flow, and a local FROST demo adapter that can run only if the required external demo binaries are installed.

It does not currently implement the execution plan's serious proof path:

```text
No deterministic integer-zatoshi intent schema.
No PCZT creation.
No PCZT inspect adapter.
No Intent-to-PCZT Binding Firewall.
No ProofEvent v1 schema.
No run-state reducer.
No fixed-operation local runner.
No signer selection model tied to real FROST participants.
No signer-side review command.
No real A+B Zcash FROST spend session.
No signed/proven/combined PCZT flow.
No zecsafe-proof-v1 schema.
No independent proof verifier.
No make judge-proof.
No real mainnet broadcast path.
No verified mainnet fixture.
```

Explicit answers:

```text
Does real FROST execute today?
Not on this machine. /api/frost-demo is wired to scripts/frost-demo.mjs, but the current environment lacks frost-client, zcash-sign, trusted-dealer, participant, and coordinator. The route returns tooling-unavailable.

Does ZecSafe create its own Zcash transaction today?
No. It creates browser-side proposal records and hashes only.

Does ZecSafe broadcast its own transaction today?
No. There is no broadcast API route. The UI uses external/manual broadcast plus txid proof attachment, and the old dashboard broadcast buttons are simulations.

Does ZecSafe bind a real FROST signature to a real Zcash spend transaction today?
No. The FROST demo, when available, signs a message derived from the proposal payload hash. It is not a Zcash SIGHASH or PCZT signing context.

Does ZecSafe have a judge-verifiable formal proof bundle today?
No. It has a downloadable JSON evidence bundle, but no frozen schema, canonical bundle hash, independent verifier, or tamper test.
```

## Repository Tree Summary

Current files:

```text
index.html
src/app.js
src/styles.css
server.mjs
package.json
README.md
SUBMISSION.md
LICENSE
scripts/capture-screenshots.mjs
scripts/frost-demo.mjs
scripts/frost-local-wrapper.mjs
scripts/security-scan.mjs
scripts/start-zecsafe-local-rpc.ps1
scripts/verify.mjs
docs/architecture.md
docs/architecture-diagram.md
docs/demo-script.md
docs/frost-integration.md
docs/frost-windows-setup.md
docs/mainnet-integration.md
docs/mainnet-readonly.md
docs/operator-notepad.md
docs/pr-checklist.md
docs/roadmap.md
docs/submission-plan.md
docs/threat-model.md
docs/screenshots/*.png
docs/execution/00-MISSION.md
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
.github/workflows/verify.yml
```

State/storage:

```text
Browser memory: guardians, proposals, current state, audit log, proof results.
localStorage: zecsafe_proposals_v1.
sessionStorage: zecsafe_frost_verified.
Server memory: FROST demo response cache.
Database: none.
Persistent backend store: none.
```

## Frontend Route Map

The application uses hash-based navigation. `src/app.js` defines `navGroups`, and CSS hides every `[data-page-section]` except the active hash.

### Vault Overview

Feature: Vault Overview.

Entry point: `#vault`, rendered by `renderVaultMissionPanel`, `renderLiveMainnetPanel`, and the `vault-grid` section.

Implementation: In-memory guardian/proposal state, readiness summaries, mainnet status preview, simulated broadcast action once browser-signature threshold is met.

External dependency: `/api/mainnet-status` auto-refresh for live chain status.

Classification: `REFRAME`.

Evidence: `src/app.js` navGroups around line 100, `state` around line 139, `simulateBroadcast` around line 1306, render route around line 4015.

Current public claim: Mainnet safety vault dashboard with 2-of-3 readiness.

Truth risk: The visible "vault balance" is static UI data, browser signatures are not FROST spend authorization, and broadcast is simulated.

Survival recommendation: Reframe into proof-run dashboard after ProofEvent v1 exists. Remove static balance from primary proof path.

### Vault Policy

Feature: Vault Policy.

Entry point: `#vault-policy`, rendered by `renderVaultPolicySection`.

Implementation: Static policy table and computed local readiness via `policyReadinessFor`.

External dependency: none.

Classification: `SUPPORTING_PROOF`.

Evidence: `policyReadinessFor` around line 1646, `renderVaultPolicySection` around line 3423.

Current public claim: Normal payments require 2-of-3, large payments require 3-of-3, broadcast requires FROST.

Truth risk: Policy is UI/app logic only and does not gate a real PCZT or FROST transaction.

Survival recommendation: Keep only if wired into deterministic intent and Binding Firewall checks.

### Proposal Center

Feature: Proposal Center.

Entry point: `#proposals`, rendered by `renderRaiseProposalForm` and `renderProposalCard`.

Implementation: Form creates proposal objects, validates rough Zcash address type, stores proposal list in browser localStorage, computes `canonicalProposalPayload`, and hashes JSON with browser SHA-256.

External dependency: browser crypto and localStorage. Transparent address validation is local Base58Check.

Classification: `CORE / REWRITE`.

Evidence: `validateProposalInput` around line 1097, `raiseProposalFromForm` around line 1133, `confirmReviewedProposal` around line 1209, `canonicalProposalPayload` around line 2511.

Current public claim: Creates real proposal details and locks proposal payload hash for guardian signatures.

Truth risk: Amounts are JavaScript `Number` ZEC values, not integer zatoshis. JSON is `JSON.stringify` insertion-order output, not a formal canonicalization spec. The payload is not tied to a PCZT or Zcash SIGHASH.

Survival recommendation: Replace with `zecsafe-intent-v1` using integer/string zatoshis, strict schema validation, canonicalization, and commitment generation.

### Audit Log

Feature: Audit Log.

Entry point: `#audit-log`, rendered by `state.auditLog` and `renderAuditEvent`.

Implementation: In-memory append-ish UI event list with duplicate suppression by label/detail id.

External dependency: none.

Classification: `CORE / REWRITE`.

Evidence: initial `auditLog` around line 235, `addAuditEvent` around line 581, `renderAuditEvent` around line 2493.

Current public claim: Visible audit log for proposal, guardian, mainnet, FROST, and recovery events.

Truth risk: It is not immutable, not persisted, not monotonic UTC sequence, and not the execution plan's `ProofEvent v1`.

Survival recommendation: Replace with ProofEvent v1 append-only events and derive UI state from the reducer.

### Guardian Center

Feature: Guardian Center.

Entry point: `#guardians`, rendered by `renderGuardian` and `renderGuardianModel`.

Implementation: Three hardcoded guardians with health state, local browser-generated ECDSA P-256 keys, and proposal-hash signatures stored in memory.

External dependency: browser `crypto.subtle`.

Classification: `REFRAME`.

Evidence: `guardians` around line 1, `ensureGuardianKey` around line 401, `signGuardianApproval` around line 425, `renderGuardian` around line 2036.

Current public claim: Guardian health, local share readiness, and signature proof state.

Truth risk: These are not FROST participant shares, not separate devices, and not Zcash spend signatures. The UI phrase "share readiness" is stronger than the implementation.

Survival recommendation: Rename/reframe to signer availability and review attestation only, or remove from primary navigation until it is backed by real FROST participant state.

### Recovery Center

Feature: Recovery Center.

Entry point: `#recovery`, rendered by `renderRecoveryResult`.

Implementation: Simulated workflow for lost guardian selection, reason, out-of-band checkbox, two approvals, 10-second demo timelock, suspicious flag, and disabled simulated broadcast.

External dependency: none.

Classification: `EXPERIMENTAL / DEMOTE`.

Evidence: recovery state around line 213, `setLostGuardian` around line 1328, `createRecoveryProposal` around line 1345, `approveRecovery` around line 1372, `startRecoveryTimelock` around line 1973, `renderRecoveryResult` around line 3828.

Current public claim: Recovery Center with guarded 7-step flow and hardened recovery controls.

Truth risk: No share repair, share refresh, participant removal, vault migration, PCZT, broadcast, or real fund movement.

Survival recommendation: Remove from primary demo until the real FROST/mainnet proof is complete. Reintroduce only under the plan's recovery gate.

### Mainnet Proof Run

Feature: Mainnet Proof Run.

Entry point: `#mainnet-proof-run`, rendered by `renderMainnetProofRun`.

Implementation: Readiness checklist combines proposal hash, browser signatures, mainnet status, transparent address check, externally supplied txid proof, FROST demo route, and proof bundle generation.

External dependency: `/api/mainnet-status`, `/api/mainnet/address-balance`, `/api/transaction-proof`, `/api/frost-demo`, `/api/proof-bundle`.

Classification: `SUPPORTING_PROOF / REWRITE`.

Evidence: `finalMainnetProofReadiness` around line 1728, `runFinalProofAction` around line 1855, `renderMainnetProofRun` around line 2850.

Current public claim: Final submission checklist for judge-verifiable mainnet demo.

Truth risk: It measures old prototype evidence, not a real PCZT/FROST authorization run. External broadcast can be unrelated to the proposal beyond manually supplied txid.

Survival recommendation: Replace checklist items with ProofEvent-derived run state after W2/W3.

### Evidence Center

Feature: Evidence Center.

Entry point: `#evidence-center`, rendered by `renderEvidenceCenter`.

Implementation: Read-only mainnet status, address balance, transaction proof, FROST demo result, proof bundle panel, and real-vs-simulated table.

External dependency: server API routes and public RPC/explorer.

Classification: `SUPPORTING_PROOF / REFRAME`.

Evidence: `renderEvidenceCenter` around line 2976, real/simulated table around line 3240.

Current public claim: Hackathon proof area combining real and simulated evidence.

Truth risk: It can over-center generic chain telemetry instead of the three protected differentiators.

Survival recommendation: Keep only as a renderer for verified proof-run events and proof bundle status.

### FROST Live Demo

Feature: FROST Live Demo.

Entry point: `#frost-integration`, rendered by `renderFrostDemoResult`; calls `runFrostDemo`.

Implementation: Browser calls `/api/frost-demo`, which spawns `scripts/frost-demo.mjs`. That script checks for external FROST-related binaries and can call `scripts/frost-local-wrapper.mjs`.

External dependency: Rust/Cargo and external demo binaries. Current environment has Rust/Cargo but not the required FROST binaries.

Classification: `CORE BLOCKER`.

Evidence: `runFrostDemo` around line 1503, `renderFrostDemoResult` around line 3583, server `handleFrostDemo` around line 654, `scripts/frost-demo.mjs`.

Current public claim: Local FROST demo through official tooling when installed.

Truth risk: Current route returns `tooling-unavailable`. The wrapper signs an arbitrary message/proposal hash, not a PCZT/Zcash SIGHASH. The wrapper exposes round 2 signature-share values in JSON, which should be treated as sensitive until proven safe.

Survival recommendation: W1 must pin and manually reproduce the official flow before any UI use. W2 must wrap only public-safe evidence.

### How It Works

Feature: How It Works.

Entry point: `#how-it-works`.

Implementation: Static explanatory flow and honesty panel.

External dependency: none.

Classification: `SUPPORTING / REWRITE COPY`.

Evidence: render route around line 4232 and honesty panel around line 4297.

Current public claim: Explains prototype architecture and real/simulated boundaries.

Truth risk: It still describes the old proposal-hash flow rather than the plan's intent-to-PCZT flow.

Survival recommendation: Rewrite after W2 to explain actual proof kernel.

### Threat Model

Feature: Threat Model.

Entry point: `#threat-model` and `docs/threat-model.md`.

Implementation: Static in-app threat copy plus markdown file.

External dependency: none.

Classification: `SUPPORTING / REWRITE`.

Evidence: render route around line 4372; markdown file `docs/threat-model.md`.

Current public claim: Prototype does not protect real funds; FROST threshold signing not implemented yet.

Truth risk: Docs conflict slightly with README/SUBMISSION that describe a "FROST local demo" as real when tools are available.

Survival recommendation: Keep but update after W1/W2 with ZIP 312 privacy/trust caveats and rerandomized FROST audit-scope disclosure.

### Hidden Mainnet Monitor

Feature: Mainnet status and transparent address monitor.

Entry point: `#mainnet`, valid hash but not listed in primary nav.

Implementation: Chain status and address balance UI.

External dependency: `/api/mainnet-status`, `/api/mainnet/address-balance`.

Classification: `DEMOTE`.

Evidence: `activePageHash` includes `#mainnet` around line 493; rendered section around line 4120.

Current public claim: Read-only mainnet monitoring.

Truth risk: Useful but generic; does not prove FROST or PCZT.

Survival recommendation: Keep as supporting evidence only.

### Hidden Transaction Proof

Feature: Transaction proof checker.

Entry point: `#transaction-proof`, valid hash but not listed in primary nav.

Implementation: Accepts 64-character txid, calls server proof route, links result to current proposal.

External dependency: `/api/transaction-proof`, local/public RPC, Blockchair fallback.

Classification: `SUPPORTING_PROOF`.

Evidence: `checkTransactionProof` around line 906, `renderTransactionProofResult` around line 3504, rendered section around line 4176.

Current public claim: Attaches proposal to real Zcash mainnet txid.

Truth risk: It cannot prove the txid was produced by ZecSafe/FROST; it only verifies chain evidence for a supplied txid.

Survival recommendation: Keep as chain observer after real W3 proof run. Do not treat as FROST provenance.

### Hidden Shielded Sync

Feature: Viewing-key balance sync.

Entry point: `#shielded-sync`, valid hash but not listed in primary nav.

Implementation: Accepts full viewing key-looking inputs, rejects seed/spending-key-looking inputs, calls local zcashd RPC route when configured, otherwise returns fallback.

External dependency: `/api/viewing-key-balance`, local `zcashd` RPC with `z_getbalanceforviewingkey`.

Classification: `EXPERIMENTAL / DEMOTE`.

Evidence: `classifyViewingKey` around line 695, `syncViewingKeyBalance` around line 847, rendered section around line 4197.

Current public claim: Future shielded/unified sync route.

Truth risk: Sending full viewing keys to local server is sensitive; current route is not a complete lightwalletd/Zaino scanning architecture.

Survival recommendation: Remove from primary demo unless needed for W3 view-only wallet proof and accompanied by strict local/private boundary.

## Backend API Map

### `GET /api/health`

Feature: Health/capability report.

Entry point: `handleApi` in `server.mjs`.

Implementation: Returns server ok, `rpcConfigured`, supported viewing-key prefixes, transaction proof and FROST route availability flags.

External dependency: environment variables only.

Classification: `SUPPORTING`.

Evidence: `handleApi` around line 693.

Current public claim: Basic server health.

Truth risk: `frostDemoRoute: true` means route exists, not that FROST tooling works.

Survival recommendation: Keep but add precise capability statuses.

### `GET /api/mainnet-status` and `GET /api/mainnet/status`

Feature: Zcash mainnet status.

Entry point: `handleMainnetStatus`.

Implementation: Calls `getblockchaininfo`, `getblockcount`, `getmempoolinfo`, and `getpeerinfo` through local RPC first, then public RPC.

External dependency: `ZEC_RPC_URL`/`ZCASH_RPC_URL` or `ZEC_PUBLIC_RPC_URL`; default public RPC `https://docs-demo.zec-mainnet.quiknode.pro/`.

Classification: `SUPPORTING_PROOF`.

Evidence: server lines around 121-228 and 358-410.

Current smoke result: success, chain `main`, block `3408133`, source default public RPC.

Truth risk: Public RPC trust and availability; chain status is not proof of FROST provenance.

Survival recommendation: Keep as observer, not core differentiator.

### `POST /api/mainnet/address-balance`

Feature: Transparent address balance lookup.

Entry point: `handleAddressBalance`.

Implementation: Regex accepts t1/t3-looking address, calls `getaddressbalance`.

External dependency: local/public Zcash RPC.

Classification: `DEMOTE`.

Evidence: server around line 412.

Current smoke result: default address success, balance `7883358` zatoshis, source default public RPC.

Truth risk: Server-side regex is weaker than frontend Base58Check validation. Transparent balance is generic telemetry.

Survival recommendation: Keep as optional supporting evidence, not primary proof.

### `POST /api/transaction-proof`

Feature: Transaction proof lookup.

Entry point: `handleTransactionProof` and `getTransactionProof`.

Implementation: Validates 64 hex txid, tries `getrawtransaction` and `getblock`, then falls back to Blockchair transaction dashboard and stats.

External dependency: local/public RPC and `https://api.blockchair.com/zcash`.

Classification: `SUPPORTING_PROOF`.

Evidence: server around lines 452-533.

Current smoke result: default txid success via `blockchair-public-explorer-api`, `74491` confirmations.

Truth risk: It verifies a txid exists but cannot prove ZecSafe created, signed, or broadcast it.

Survival recommendation: Keep for W3 chain observation, with explicit limitation.

### `POST /api/viewing-key-balance`

Feature: Viewing-key balance bridge.

Entry point: `handleViewingKeyBalance`.

Implementation: Rejects seed/spending-key-looking material, accepts `uview1`, `uvf1`, `zviews`, calls local `z_getbalanceforviewingkey` only if RPC configured.

External dependency: local `zcashd` wallet RPC.

Classification: `EXPERIMENTAL`.

Evidence: server around lines 54-99 and 301-356.

Current smoke result: seed-like input rejected as `dangerous-secret`.

Truth risk: Full viewing keys are private wallet metadata. No local wallet isolation model is implemented.

Survival recommendation: Keep out of primary proof path unless W3 needs a local view-only proof with strict data classification.

### `GET /api/frost-demo` and `POST /api/frost-demo`

Feature: Local FROST demo adapter.

Entry point: `handleFrostDemo`, `runFrostDemoScript`, `scripts/frost-demo.mjs`, `scripts/frost-local-wrapper.mjs`.

Implementation: Spawns Node to run the FROST demo script. The script checks Cargo/Rust/linker/frost-client/zcash-sign and optionally runs a wrapper using trusted-dealer, participant, and coordinator. POST binds the message to the active proposal payload hash.

External dependency: external Rust/FROST binaries; currently missing on this machine.

Classification: `CORE BLOCKER`.

Evidence: server around lines 604-691; script files in `scripts/`.

Current smoke result: `tooling-unavailable`; Cargo and rustc detected, FROST demo tools missing.

Truth risk: Not PCZT/SIGHASH signing, no toolchain pins, not RedPallas/PCZT-proven in repo, potential exposure of signature-share values in wrapper JSON.

Survival recommendation: W1 must reproduce official flow externally; W2 must build a safe runner and public-safe event projection.

### `GET /api/proof-bundle`

Feature: Combined proof bundle.

Entry point: `handleProofBundle`.

Implementation: Runs mainnet status, address balance, transaction proof, and FROST demo in parallel, returns JSON with `realVsSimulated`.

External dependency: public/local RPC, Blockchair fallback, FROST demo route.

Classification: `SUPPORTING / REWRITE`.

Evidence: server around lines 535-602.

Current smoke result: success with mainnet/address/tx proof real, FROST unavailable, guardian approvals/broadcast/recovery simulated.

Truth risk: No JSON schema, no canonical hash, no verifier, no tamper test, not tied to ProofEvent v1.

Survival recommendation: Replace with `zecsafe-proof-v1` after W2.

## Scripts Map

### `scripts/verify.mjs`

Feature: Static presence verification.

Implementation: Checks required files and string markers in `index.html`, `src/app.js`, `src/styles.css`, `server.mjs`, docs, and scripts.

Classification: `SUPPORTING`.

Truth risk: Mostly presence/string checks; does not verify behavior or security properties.

Survival recommendation: Keep temporarily; replace/add unit and integration tests for proof kernel.

### `scripts/security-scan.mjs`

Feature: Basic tracked-file secret scan.

Implementation: Scans `git ls-files`, skips binary extensions, checks common API-key patterns, `.env`, submission placeholder, and concrete Zcash RPC password assignments.

Classification: `SUPPORTING`.

Truth risk: Only scans tracked files; does not scan untracked files, build output, proof fixtures, logs, screenshots, or history deeply.

Survival recommendation: Expand under W0-004 and W5.

### `scripts/frost-demo.mjs`

Feature: FROST tool availability and wrapper launcher.

Implementation: Checks tool presence and runs either `FROST_DEMO_COMMAND` or `scripts/frost-local-wrapper.mjs`.

Classification: `CORE BLOCKER`.

Truth risk: Tool check does not pin versions or prove official PCZT flow.

Survival recommendation: Replace with pinned W1 commands and W2 runner operations.

### `scripts/frost-local-wrapper.mjs`

Feature: Local trusted-dealer demo wrapper.

Implementation: Creates temporary 2-of-3 group with trusted-dealer, starts two participant processes and coordinator, signs a message, prints JSON.

Classification: `CORE BLOCKER / REWRITE`.

Truth risk: Not currently runnable here. It signs arbitrary message text, not a Zcash transaction SIGHASH. It emits `signingRound2` share values in JSON.

Survival recommendation: Do not use as final proof surface until reviewed against official tool semantics and redacted public evidence requirements.

### `scripts/capture-screenshots.mjs`

Feature: Screenshot capture.

Implementation: Starts app and Chrome remote debugging, captures selected hash routes.

Classification: `SUPPORTING`.

Truth risk: UI screenshot only; not proof.

Survival recommendation: Use after proof UI exists.

### `scripts/start-zecsafe-local-rpc.ps1`

Feature: Windows/WSL startup helper.

Implementation: Reads RPC password from WSL file and starts server with local RPC env vars.

Classification: `SUPPORTING`.

Truth risk: Windows-specific path; not current proof architecture.

Survival recommendation: Keep as operator helper, not core architecture.

## Current External Dependency State

Observed local tools:

```text
zcashd: /usr/local/bin/zcashd, v6.12.2
zcash-cli: /usr/local/bin/zcash-cli, v6.12.2
cargo: /home/dell/.cargo/bin/cargo, 1.96.0
rustc: /home/dell/.cargo/bin/rustc, 1.96.0
frost-client: not found
zcash-sign: not found
trusted-dealer: not found
participant: not found
coordinator: not found
```

Observed runtime services:

```text
No ZecSafe server left running on :4173 after smoke tests.
No local zcashd RPC listener observed on :8232.
No ZEC_RPC_*, ZCASH_RPC_*, FROST_*, ZECSAFE_*, or PORT env vars were set in this shell.
```

## Current API Smoke Results

`GET /api/health`:

```json
{"status":"ok","rpcConfigured":false,"supportedViewingKeys":["uview1","uvf1","zviews"],"transactionProof":true,"frostDemoRoute":true,"frostStatus":"check /api/frost-demo"}
```

`GET /api/mainnet-status`:

```text
status=success
chain=main
blocks=3408133
source=https://docs-demo.zec-mainnet.quiknode.pro/
```

`POST /api/mainnet/address-balance` with invalid address:

```json
{"status":"rejected","message":"Enter a valid transparent Zcash mainnet address starting with t1 or t3."}
```

`POST /api/mainnet/address-balance` with default address:

```text
status=success
source=https://docs-demo.zec-mainnet.quiknode.pro/
balance=7883358
received=1960047820858
```

`POST /api/transaction-proof` with default txid:

```text
status=success
source=blockchair-public-explorer-api
height=3333643
confirmations=74491
fallback=true
```

`POST /api/viewing-key-balance` with seed-like text:

```json
{"status":"rejected","balance":null,"source":"input-validation","keyType":"dangerous-secret","message":"This looks like seed or spending-key material. ZecSafe only accepts viewing keys."}
```

`GET /api/frost-demo`:

```text
status=tooling-unavailable
cargoInstalled=true
rustcInstalled=true
frostClientInstalled=false
zcashSignInstalled=false
verified=false
```

`GET /api/proof-bundle`:

```text
status=success
mainnetRpcReads=real
addressBalance=real
transactionProof=real
frostKeyGeneration=unavailable
guardianApprovals=simulated
transactionBroadcast=simulated
recoveryMigration=simulated
```

## Claim Truth Risks

README/SUBMISSION claims that remain mostly accurate:

```text
Read-only mainnet status/balance/transaction proof are real.
Transaction broadcast is external/manual.
Guardian browser attestations are not Zcash spend signatures.
Recovery migration is simulated.
Viewing-key balance requires local zcashd.
```

Claims requiring stricter wording before final submission:

```text
"local threshold-signing proof" - only true when external FROST tooling is installed and successfully run.
"FROST local demo real" - current machine returns tooling-unavailable.
"guardian shares stay local" - current implementation does not create FROST shares for guardians.
"proof bundle" - current JSON is evidence summary, not formal zecsafe-proof-v1.
"ZecSafe creates, signs, verifies, and documents the safety workflow around a real mainnet transaction" - it does not sign a real Zcash transaction.
```

Docs with known stale/conflicting wording:

```text
docs/threat-model.md says FROST threshold signing is not implemented yet.
README.md says FROST local demo is real when local tools are installed.
Both can be reconciled by saying: real local message-signing demo is possible with tools, but real Zcash transaction FROST signing is not implemented.
```

## W0-002 Acceptance

- [x] Complete repository tree inspected.
- [x] README inspected.
- [x] Application hash routes inspected.
- [x] API routes inspected.
- [x] Server actions inspected.
- [x] Database/state layer inspected.
- [x] Mainnet clients inspected.
- [x] Zcash RPC/light-client code inspected.
- [x] Proposal hashing inspected.
- [x] Guardian signature flow traced end to end.
- [x] Recovery flow traced end to end.
- [x] Proof bundle traced end to end.
- [x] Transaction lookup traced end to end.
- [x] Audit log traced end to end.
- [x] Tests/check scripts inspected.
- [x] CI inspected.
- [x] Deployment files checked.
- [x] Explicit answer recorded for real FROST execution today.
- [x] Explicit answer recorded for ZecSafe transaction creation/broadcast today.

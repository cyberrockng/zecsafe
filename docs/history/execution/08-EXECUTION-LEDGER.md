> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZecSafe Execution Ledger

## ZSAFE-W0-001 - Verify repository identity and baseline

Status: `COMPLETED`

Priority: `P0`

Protected differentiator: `N/A - baseline control task`

Started UTC: `2026-07-11T03:18:10Z`

Completed UTC: `2026-07-11T03:19:59Z`

Commit: `not created; pre-existing dirty worktree recorded and left intact`

### Confirmed Starting State

Repository root:

```text
$HOME/zecsafe
```

Current branch:

```text
main
```

Baseline commit:

```text
29a0e57d22d79aceeca779398db57fc17eab7a22
```

Remote:

```text
origin  https://github.com/cyberrockng/zecsafe.git (fetch)
origin  https://github.com/cyberrockng/zecsafe.git (push)
```

Dirty worktree:

```text
## main...origin/main
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? scripts/security-scan.mjs
```

### Implementation

Created W0 execution-control documentation for the baseline:

```text
docs/execution/00-MISSION.md
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
```

No application source, runtime behavior, UI, proof logic, or existing dirty worktree file was modified by this task.

### Files Changed

Added:

```text
docs/execution/00-MISSION.md
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
```

Pre-existing dirty files recorded but not touched by this task:

```text
SUBMISSION.md
package.json
server.mjs
.github/workflows/verify.yml
scripts/security-scan.mjs
```

### Upstream Tools / Pinned Commits

Toolchain pinning is not part of W0-001. It begins at `ZSAFE-P0-001`.

Environment observed during W0-001:

```text
Node.js v24.16.0
npm 11.13.0
Linux Cyberrockng 6.18.33.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux
```

### Security Impact

No secret, wallet, participant, or signing artifact was created.

No mainnet wallet was funded.

No transaction was broadcast.

No new command runner was introduced.

### Public Claims Affected

No public product claim changed.

The baseline now records that the current app is a vanilla Node/ES module prototype and that the serious FROST/PCZT proof work has not begun in this wave.

### Tests Changed

No tests changed.

### Verification Commands

Command:

```bash
pwd
```

Result:

```text
$HOME/zecsafe
```

Command:

```bash
git status --short
```

Result:

```text
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? scripts/security-scan.mjs
```

Command:

```bash
git status --short --branch
```

Result:

```text
## main...origin/main
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? scripts/security-scan.mjs
```

Command:

```bash
git branch --show-current
```

Result:

```text
main
```

Command:

```bash
git rev-parse HEAD
```

Result:

```text
29a0e57d22d79aceeca779398db57fc17eab7a22
```

Command:

```bash
git remote -v
```

Result:

```text
origin  https://github.com/cyberrockng/zecsafe.git (fetch)
origin  https://github.com/cyberrockng/zecsafe.git (push)
```

Command:

```bash
find . -maxdepth 3 -type f \( -name 'package-lock.json' -o -name 'pnpm-lock.yaml' -o -name 'yarn.lock' -o -name 'bun.lockb' -o -name 'bun.lock' -o -name 'Cargo.toml' -o -name 'rust-toolchain*' -o -name 'vercel.json' -o -name 'netlify.toml' -o -name 'Dockerfile' -o -name 'docker-compose.yml' -o -name 'wrangler.toml' -o -name 'fly.toml' -o -name 'railway.json' -o -name 'render.yaml' \) -not -path './node_modules/*' -print | sort
```

Result:

```text
```

Command:

```bash
node --version
```

Result:

```text
v24.16.0
```

Command:

```bash
npm --version
```

Result:

```text
11.13.0
```

Command:

```bash
npm run check
```

Result:

```text
> zecsafe@0.1.0 check
> npm run verify && npm run check:syntax && npm run security:scan

> zecsafe@0.1.0 verify
> node scripts/verify.mjs

ZecSafe static verification passed.

> zecsafe@0.1.0 check:syntax
> node --check server.mjs && node --check src/app.js && node --check scripts/verify.mjs && node --check scripts/security-scan.mjs && node --check scripts/frost-demo.mjs && node --check scripts/frost-local-wrapper.mjs && node --check scripts/capture-screenshots.mjs

> zecsafe@0.1.0 security:scan
> node scripts/security-scan.mjs

ZecSafe security scan passed.
```

Exit code: `0`

Command:

```bash
curl -fsS http://127.0.0.1:4173/api/health
```

Result:

```json
{"status":"ok","rpcConfigured":false,"supportedViewingKeys":["uview1","uvf1","zviews"],"transactionProof":true,"frostDemoRoute":true,"frostStatus":"check /api/frost-demo"}
```

Exit code: `0`

### Exact Results

Repository identity was verified and recorded.

Dirty worktree was verified and recorded.

Stack and command surface were detected and recorded.

Baseline verification passed.

Temporary server health smoke test passed.

### Artifacts / Evidence

```text
docs/execution/00-MISSION.md
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Limitations

`ZSAFE-W0-001` does not classify every feature, route, API, proof claim, or browser signature path. That work is explicitly reserved for `ZSAFE-W0-002`.

No official FROST/PCZT toolchain was pinned in this task.

No commit was created because the repository already had unrelated dirty worktree changes. A focused commit can be made after the user confirms the desired commit policy.

### Acceptance Criteria

- [x] Exact repository remote recorded.
- [x] Exact baseline commit recorded.
- [x] Dirty worktree recorded.
- [x] No prior work overwritten.
- [x] Repository root confirmed.
- [x] Package manager detected.
- [x] Application framework detected.
- [x] Rust workspace status detected.
- [x] Test/check commands detected.
- [x] Deployment target status detected.
- [x] Ledger entry with exact command results created.

## ZSAFE-W0-002 - Complete route/API/feature truth map

Status: `COMPLETED`

Priority: `P0`

Protected differentiator: `N/A - truth control task`

Started UTC: `2026-07-11T03:20:00Z`

Completed UTC: `2026-07-11T03:24:04Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

The user approved proceeding with the current uncommitted state after W0-001.

Starting status:

```text
## main...origin/main
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? docs/execution/
?? scripts/security-scan.mjs
```

### Implementation

Inspected and mapped:

```text
Complete repository tree.
README and public docs.
Hash-based frontend routes.
Server API routes.
Mainnet RPC/explorer adapters.
Browser proposal hashing.
Browser guardian signature flow.
Recovery workflow.
Proof bundle generation.
Transaction proof flow.
Audit log behavior.
Scripts, CI, and deployment config.
Local tool availability.
```

Updated:

```text
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
```

No app code, UI, server route, or runtime behavior was changed.

### Files Changed

```text
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Upstream Tools / Pinned Commits

Toolchain pinning is not part of W0-002. It begins at `ZSAFE-P0-001`.

Observed tool availability:

```text
zcashd v6.12.2 installed.
zcash-cli v6.12.2 installed.
cargo 1.96.0 installed.
rustc 1.96.0 installed.
frost-client not found.
zcash-sign not found.
trusted-dealer not found.
participant not found.
coordinator not found.
```

### Security Impact

No wallet, participant, signing, or proof artifact was created.

No mainnet funding or broadcast occurred.

The map identifies a current proof-surface risk: `scripts/frost-local-wrapper.mjs` prints round 2 signature-share values if it runs successfully, so W1/W2 must define public-safe evidence before using it in judge artifacts.

### Public Claims Affected

No public docs were rewritten in W0-002, but claim risks were recorded:

```text
Current app does not create or broadcast Zcash transactions.
Current app does not bind FROST to a Zcash SIGHASH or PCZT.
Current proof bundle is not a formal zecsafe-proof-v1 artifact.
Current Guardian Center is browser ECDSA attestation, not FROST participant signing.
```

### Tests Changed

No tests changed.

### Verification Commands

Command:

```bash
rg --files
```

Result:

```text
Repository tree listed and recorded in docs/execution/01-CURRENT-STATE.md.
```

Command:

```bash
rg -n "pathname ===|url\\.pathname|/api/|function handle|async function handle|createServer|fetch\\(|navigator|localStorage|sessionStorage|crypto\\.subtle|download|proposal|guardian|recovery|simulate|mock|txid|mainnet|viewing|UFVK|PCZT|sighash|randomizer|proof|TODO|FIXME" server.mjs src/app.js index.html package.json README.md docs scripts -g '!docs/screenshots/*'
```

Result:

```text
Routes, APIs, state flows, proof paths, and claim terms traced.
```

Command:

```bash
GET /api/health
```

Result:

```json
{"status":"ok","rpcConfigured":false,"supportedViewingKeys":["uview1","uvf1","zviews"],"transactionProof":true,"frostDemoRoute":true,"frostStatus":"check /api/frost-demo"}
```

Command:

```bash
GET /api/mainnet-status
```

Result:

```text
status=success
chain=main
blocks=3408133
source=https://docs-demo.zec-mainnet.quiknode.pro/
```

Command:

```bash
POST /api/mainnet/address-balance
```

Result:

```text
invalid address rejected
default address success
balance=7883358
received=1960047820858
```

Command:

```bash
POST /api/transaction-proof
```

Result:

```text
default txid success
source=blockchair-public-explorer-api
height=3333643
confirmations=74491
fallback=true
```

Command:

```bash
POST /api/viewing-key-balance
```

Result:

```text
seed-like text rejected as dangerous-secret
```

Command:

```bash
GET /api/frost-demo
```

Result:

```text
status=tooling-unavailable
cargoInstalled=true
rustcInstalled=true
frostClientInstalled=false
zcashSignInstalled=false
verified=false
```

Command:

```bash
GET /api/proof-bundle
```

Result:

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

### Exact Results

Every current primary-nav route was classified.

Every current API route was classified.

Browser signature flow was traced end to end.

Recovery flow was traced end to end.

Proof bundle flow was traced end to end.

Mainnet interaction flow was traced end to end.

### Artifacts / Evidence

```text
docs/execution/01-CURRENT-STATE.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Limitations

W0-002 did not perform the W0-003 competitive benchmark, W0-004 secret/history scan, or W0-005 final feature survival decision.

No official FROST or PCZT toolchain was pinned or reproduced.

### Acceptance Criteria

- [x] Every current primary-nav route classified.
- [x] Every API classified.
- [x] Browser signature flow traced end to end.
- [x] Recovery flow traced end to end.
- [x] Current proof bundle traced end to end.
- [x] Current mainnet interaction traced end to end.
- [x] Explicit answer recorded: "Does real FROST execute today?"
- [x] Explicit answer recorded: "Does ZecSafe create/broadcast its own transaction today?"

## ZSAFE-W0-003 - Public competitive benchmark

Status: `COMPLETED`

Priority: `P1`

Protected differentiator: `N/A - field benchmark and scope control task`

Started UTC: `2026-07-11T03:41:47Z`

Completed UTC: `2026-07-11T03:43:26Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

`ZSAFE-W0-001` and `ZSAFE-W0-002` were already complete.

`ZSAFE-W0-003` was started but incomplete in `HANDOFF.md`.

Starting status:

```text
## main...origin/main
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? HANDOFF.md
?? docs/execution/
?? scripts/security-scan.mjs
```

### Implementation

Created:

```text
docs/execution/02-COMPETITIVE-BENCHMARK.md
```

Inspected and summarized the Appendix A public benchmark sources:

```text
https://zechub.wiki/hackathon
https://github.com/ZecHub/zechub/blob/main/site/Start_Here/Developer_Resources.md
https://github.com/ZecHub/zechub/pulls?q=is%3Apr+is%3Aopen+hackathon+2026
https://github.com/Jubrilabdulazeez/z3-launcher
https://github.com/Jubrilabdulazeez/z3-launcher/blob/main/z3-node-launcher-implementation-plan.md
https://github.com/raycre8-g/zecauth
https://github.com/raycre8-g/zecauth/blob/main/PROTOCOL.md
https://github.com/EdCryptoFi/zshield
https://forum.zcashcommunity.com/t/zechub-hackathon/52165/6
https://github.com/ZecHub/zechub/tree/main/Hackathon/2025/zec-bounties
https://github.com/ZecHub/zechub/tree/main/Hackathon/2025/zyberquest
https://github.com/ZecHub/zechub/tree/main/Hackathon/2025/BananaBetting
```

Benchmarked:

```text
Z3 Launcher
ZecAuth
ZShield
ZEC-Bounties
ZyberQuest
Banana Betting
```

No app source, UI, server route, runtime behavior, wallet artifact, signing material, or mainnet state was changed.

### Files Changed

```text
docs/execution/02-COMPETITIVE-BENCHMARK.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Upstream Tools / Pinned Commits

Toolchain pinning is not part of W0-003. It begins at `ZSAFE-P0-001`.

No FROST, PCZT, zcashd, wallet, or proof-verifier tool was installed or pinned in this task.

### Security Impact

No secret, wallet, participant, signing, or proof artifact was created.

No mainnet wallet was funded.

No transaction was broadcast.

The benchmark reinforces that ZecSafe must not publicly claim real FROST/PCZT/mainnet proof capability until the proof kernel exists and `make judge-proof` verifies a recorded run.

### Public Claims Affected

The competitive position is now locally documented:

```text
We do not win on page count, generic dashboards, generic transaction lookups, or a future FROST roadmap.
We compete on failure-on-screen continuity, intent-to-PCZT authorization binding, and privacy-preserving proof verification.
```

The planned fastest judge proof is:

```bash
make judge-proof
```

The planned technical climax is a visibly unavailable participant, A+B FROST authorization, intent-to-PCZT binding pass, completed PCZT flow, accepted Zcash mainnet transaction, and verified redacted proof bundle.

### Tests Changed

No tests changed.

### Verification Commands

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

### Exact Results

The public benchmark file was created.

All required Appendix A source URLs were inspected.

All six minimum projects were benchmarked with the required fields.

The required `ZECSAFE COMPETITIVE POSITION` conclusion was included at the end of the file.

Project checks passed after the benchmark file was added.

### Artifacts / Evidence

```text
docs/execution/02-COMPETITIVE-BENCHMARK.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Limitations

W0-003 did not perform the W0-004 secret/history scan or the W0-005 feature survival decision.

The visible open-PR field observation is time-bound to the inspected public page on July 11, 2026. It does not prove the absence of unpublished, closed, differently named, or later FROST submissions.

No official FROST or PCZT toolchain was pinned or reproduced.

### Acceptance Criteria

- [x] `docs/execution/02-COMPETITIVE-BENCHMARK.md` created.
- [x] Appendix A public sources inspected.
- [x] Z3 Launcher benchmarked.
- [x] ZecAuth benchmarked.
- [x] ZShield benchmarked.
- [x] ZEC-Bounties benchmarked.
- [x] ZyberQuest benchmarked.
- [x] Banana Betting benchmarked.
- [x] Required competitive-position ending included.
- [x] `docs/execution/08-EXECUTION-LEDGER.md` updated.
- [x] `npm run check` passed.

## ZSAFE-W0-004 - Secret and wallet-artifact scan

Status: `COMPLETED`

Priority: `P0`

Protected differentiator: `N/A - security boundary and artifact hygiene task`

Started UTC: `2026-07-11T03:44:00Z`

Completed UTC: `2026-07-11T03:50:50Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

The user approved proceeding to `ZSAFE-W0-004` after `ZSAFE-W0-003` completed.

Starting status:

```text
## main...origin/main
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? HANDOFF.md
?? docs/execution/
?? scripts/security-scan.mjs
```

### Implementation

Created:

```text
docs/execution/03-SECRET-WALLET-SCAN.md
```

Updated:

```text
.gitignore
scripts/security-scan.mjs
docs/execution/08-EXECUTION-LEDGER.md
```

Scan coverage:

```text
tracked files
untracked workspace files
.gitignore
single committed history tree
binary screenshot artifacts
generated-artifact locations present in repo
```

No secret values were printed or recorded in the ledger.

### Files Changed

```text
.gitignore
scripts/security-scan.mjs
docs/execution/03-SECRET-WALLET-SCAN.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Upstream Tools / Pinned Commits

Toolchain pinning is not part of W0-004. It begins at `ZSAFE-P0-001`.

No FROST, PCZT, zcashd, wallet, or proof-verifier tool was installed or pinned in this task.

### Security Impact

No known live secret was found in tracked files, untracked workspace files, or committed history.

No wallet database was found in the repository workspace.

No participant config was found in the repository workspace.

No PCZT artifact was found in the repository workspace.

No demo log file was found in the repository workspace.

The four existing screenshot artifacts were visually reviewed and did not show mnemonics, spending keys, full viewing keys, FROST shares, participant configs, RPC passwords, wallet databases, randomizers, or PCZT bodies.

The external private workspace root is now defined as:

```text
POSIX / WSL / macOS: ~/.zecsafe/
Windows: %USERPROFILE%\.zecsafe\
```

Required private subdirectories:

```text
participants/
wallets/
runs/
toolchain/
```

`.gitignore` now blocks accidental repository entry for local private runtime directories, participant configs, wallet databases, PCZT artifacts, viewing-key files, and FROST share/secret filenames.

### Public Claims Affected

No public product capability claim changed.

The security boundary is now explicit: private wallet, participant, PCZT, randomizer, run, and toolchain material must stay outside the repository.

### Tests Changed

`scripts/security-scan.mjs` now scans the whole repository workspace rather than only `git ls-files`, while continuing to report sanitized file-level findings only.

New scan coverage includes:

```text
environment files
participant config filenames
wallet database filenames
PCZT artifacts
log artifacts
private runtime directories inside repo
common API token formats
private key blocks
Zcash viewing/spending key patterns
mnemonic assignments
FROST secret-share and randomizer assignments
concrete Zcash RPC password assignments
```

### Verification Commands

Command:

```bash
rg --files -uu -g '!.git/**' -g '!node_modules/**'
```

Result:

```text
Workspace files listed. No .env, participant config, wallet DB, PCZT artifact, demo log, dist, coverage, fixture, participant, wallet, run, or toolchain directory was present.
```

Command:

```bash
git rev-list --all --count
```

Result:

```text
1
```

Command:

```bash
git log --oneline --all --decorate
```

Result:

```text
29a0e57 (HEAD -> main, origin/main, origin/HEAD) Initial ZecSafe prototype
```

Command:

```bash
npm run security:scan
```

Result:

```text
ZecSafe security scan passed.
```

Exit code: `0`

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

Command:

```text
sanitized history scan
```

Result:

```text
history_sanitized_findings=0
```

Exit code: `0`

### Exact Results

Tracked files were scanned.

Untracked workspace files were scanned.

The single committed history tree was scanned.

`.gitignore` was inspected and updated.

Screenshot artifacts were visually reviewed.

External private workspace root and subdirectories were defined.

No known live secret or wallet artifact was found in the repo.

### Artifacts / Evidence

```text
docs/execution/03-SECRET-WALLET-SCAN.md
docs/execution/08-EXECUTION-LEDGER.md
.gitignore
scripts/security-scan.mjs
```

### Limitations

W0-004 did not inspect external private files outside the repository, including the local zcashd RPC password file referenced by the PowerShell helper.

W0-004 did not create participant configs, wallets, PCZTs, proof fixtures, or run artifacts.

Future proof fixtures must be generated from the external workspace and redacted before entering the repository.

No official FROST or PCZT toolchain was pinned or reproduced.

### Acceptance Criteria

- [x] No known live secret in tracked files.
- [x] No known live secret in untracked workspace files.
- [x] No known live secret in committed history.
- [x] Participant configs absent from repo and assigned to external workspace.
- [x] Wallet workspaces absent from repo and assigned to external workspace.
- [x] Proof fixtures absent; future fixtures must be redacted.
- [x] Ignore patterns updated for private wallet/FROST/PCZT/run artifacts.

## ZSAFE-W0-005 - Feature survival decision

Status: `COMPLETED`

Priority: `P1`

Protected differentiator: `all - scope freeze around the winning proof story`

Started UTC: `2026-07-11T03:52:00Z`

Completed UTC: `2026-07-11T03:55:41Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

The user approved proceeding to `ZSAFE-W0-005` after `ZSAFE-W0-004` completed.

Starting status:

```text
## main...origin/main
 M .gitignore
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? HANDOFF.md
?? docs/execution/
?? scripts/security-scan.mjs
```

### Implementation

Created:

```text
docs/execution/04-FEATURE-SURVIVAL.md
```

Updated:

```text
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

The survival decision classifies:

```text
primary frontend routes
hidden frontend routes
backend APIs
scripts and tooling
items to remove from the primary proof path
core rewrite queue
target primary navigation contract
```

No app runtime source, UI layout, server route behavior, wallet artifact, signing material, or mainnet state was changed.

### Files Changed

```text
docs/execution/04-FEATURE-SURVIVAL.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Upstream Tools / Pinned Commits

Toolchain pinning is not part of W0-005. It begins at `ZSAFE-P0-001`.

No FROST, PCZT, zcashd, wallet, or proof-verifier tool was installed or pinned in this task.

### Security Impact

No secret, wallet, participant, signing, or proof artifact was created.

No mainnet wallet was funded.

No transaction was broadcast.

The decision document explicitly keeps private wallet/FROST/PCZT/run material outside the repository and removes simulated recovery, browser ECDSA guardian signatures, arbitrary-message FROST signatures, and generic telemetry from the primary proof claim.

### Public Claims Affected

The final primary story is now frozen around proof-run surfaces:

```text
Run Dashboard
Intent Builder
Signer Availability
Proof Timeline
Evidence / Judge Proof
FROST/PCZT Runner
Proof Docs
```

The following are removed from the final primary proof path:

```text
Recovery Center
Hidden Mainnet monitor
Hidden Shielded Sync
standalone transparent balance lookup
generic transaction lookup not linked to the recorded proof run
static vault-balance dashboard cards
old FROST roadmap pages/copy
simulated broadcast
legacy browser guardian signatures as FROST proof
```

### Tests Changed

No tests changed.

### Verification Commands

Command:

```bash
rg -n "const navGroups|href:|hash:|data-page-section|#mainnet|#transaction-proof|#shielded-sync|/api/" src/app.js server.mjs index.html
```

Result:

```text
Current visible routes, hidden routes, and API routes were identified for survival classification.
```

Command:

```bash
rg -n "Classification:|Feature:|Entry point:" docs/execution/01-CURRENT-STATE.md
```

Result:

```text
Existing route/API/script truth-map classifications were used as the W0-005 baseline.
```

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

### Exact Results

Every existing primary frontend route was classified.

Hidden frontend routes were classified.

Backend APIs were classified.

Scripts and tooling were classified.

Target primary navigation was frozen around the winning proof story.

Features retained solely because they exist were excluded from the final primary proof path.

No UI redesign was started before the headless proof kernel exists.

`docs/execution/00-MISSION.md` was updated to show W0 complete and the next task pending approval.

### Artifacts / Evidence

```text
docs/execution/04-FEATURE-SURVIVAL.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Limitations

W0-005 is a scope-freeze decision. It does not implement ProofEvent v1, deterministic intent, PCZT inspection, FROST signing, proof verification, source navigation changes, or UI redesign.

Actual source navigation changes should happen after the ProofEvent v1 reducer and proof-run state exist, so the UI renders real proof state instead of renamed prototype screens.

No official FROST or PCZT toolchain was pinned or reproduced.

### Acceptance Criteria

- [x] Every existing primary frontend route classified.
- [x] Hidden frontend routes classified.
- [x] Backend APIs classified.
- [x] Scripts and tooling classified.
- [x] Target primary navigation excludes features retained only because they exist.
- [x] Simulated recovery and legacy guardian signatures removed from the primary proof path.
- [x] No UI redesign started before the headless proof kernel exists.

## ZSAFE-P0-001 - Pin upstream toolchain

Status: `COMPLETED`

Priority: `P0`

Protected differentiator: `all - establishes the official FROST, PCZT, and protocol baseline`

Started UTC: `2026-07-11T03:58:39Z`

Completed UTC: `2026-07-11T04:12:00Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

The user approved proceeding to `ZSAFE-P0-001` after `ZSAFE-W0-005` completed.

Starting status:

```text
## main...origin/main
 M .gitignore
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? HANDOFF.md
?? docs/execution/
?? scripts/security-scan.mjs
```

### Implementation

Created:

```text
docs/execution/05-TOOLCHAIN-PINS.md
```

Updated:

```text
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

Pinned and recorded current upstream sources for:

```text
ZIP 312
ZF FROST Book
ZF FROST library
frost-tools
zcash-devtool
PCZT walkthrough
Zcash protocol specification
zcashd support and deprecation status
```

No app runtime source, UI layout, server route behavior, wallet artifact, participant artifact, PCZT artifact, signing material, or mainnet state was changed.

### Files Changed

```text
docs/execution/05-TOOLCHAIN-PINS.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Upstream Tools / Pinned Commits

Protocol baseline:

```text
Zcash Protocol Specification, Version v2026.7.0-31-g696109 [NU6.2]
zips commit: 69610984109078075e7e64989ecf89d63a259b97
```

FROST library:

```text
Repository: https://github.com/ZcashFoundation/frost
Commit: 2016e44ba4a4757a996300350063b937a2ad33e8
Workspace version: 3.0.0
License: MIT OR Apache-2.0
```

frost-tools:

```text
Repository: https://github.com/ZcashFoundation/frost-tools
Commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
Binaries: frostd, frost-client, zcash-sign
License: MIT OR Apache-2.0
Known limitation: WIP demo tooling, not production; trusted-dealer mode is tests-only.
```

zcash-devtool:

```text
Repository: https://github.com/zcash/zcash-devtool
Commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
Binary: zcash-devtool through cargo run
License: MIT OR Apache-2.0
Known limitation: not production-ready; command-line API can change without warning.
```

zcashd rule:

```text
Do not make zcashd a durable ZecSafe dependency.
zcashd is deprecated and will not support NU6.3.
```

### Security Impact

No secret, wallet, participant, signing, PCZT, randomizer, or proof artifact was created inside the repository.

Toolchain source and build artifacts were kept outside the repository:

```text
$HOME/.zecsafe/toolchain
```

No mainnet wallet was funded.

No transaction was broadcast.

No private values were printed into execution docs.

### Public Claims Affected

The project now has an explicit toolchain baseline for the proof-first story:

```text
FROST baseline: pinned ZF FROST and frost-tools commits.
PCZT baseline: pinned zcash-devtool commit and walkthrough.
Protocol baseline: NU6.2 from the current protocol PDF.
Legacy-node baseline: zcashd is deprecated and excluded as a durable dependency.
```

The final submission should avoid claiming production readiness from frost-tools or zcash-devtool. Both are developer/demo tools; ZecSafe can claim reproducible evidence only after P0-002 and P0-003 produce local proof artifacts.

### Tests Changed

No tests changed.

### Verification Commands

Command:

```bash
rustc --version
```

Result:

```text
rustc 1.96.0 (ac68faa20 2026-05-25)
```

Command:

```bash
cargo --version
```

Result:

```text
cargo 1.96.0 (30a34c682 2026-05-25)
```

Command:

```bash
uname -a
```

Result:

```text
Linux Cyberrockng 6.18.33.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026 x86_64 x86_64 x86_64 GNU/Linux
```

Command:

```bash
git rev-parse HEAD
```

Result:

```text
frost-tools: 7d33a95fecc91dacdb1503933e2bee43780d3293
frost: 2016e44ba4a4757a996300350063b937a2ad33e8
zcash-devtool: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

Command:

```bash
cargo run --locked -p frostd -- --help
cargo run --locked -p frost-client -- --help
cargo run --locked -p frost-client -- trusted-dealer --help
cargo run --locked -p frost-client -- dkg --help
cargo run --locked -p frost-client -- coordinator --help
cargo run --locked -p frost-client -- participant --help
cargo run --locked -p zcash-sign -- --help
cargo run --locked -p zcash-sign -- generate --help
cargo run --locked -p zcash-sign -- sign --help
```

Result:

```text
Current frost-tools help surfaces captured and summarized in docs/execution/05-TOOLCHAIN-PINS.md.
```

Command:

```bash
cargo run --locked -- --help
cargo run --locked -- pczt --help
cargo run --locked -- pczt create --help
cargo run --locked -- pczt inspect --help
cargo run --locked -- pczt prove --help
cargo run --locked -- pczt sign --help
cargo run --locked -- pczt update-with-signature --help
cargo run --locked -- pczt combine --help
cargo run --locked -- pczt extract --help
cargo run --locked -- pczt send --help
cargo run --locked -- pczt send-without-storing --help
cargo run --locked -- pczt redact --help
cargo run --locked -- wallet init-fvk --help
cargo run --locked -- wallet list-accounts --help
```

Result:

```text
Current zcash-devtool help surfaces captured and summarized in docs/execution/05-TOOLCHAIN-PINS.md.
```

Command:

```bash
rg -n "production|WIP|demo|DO NOT|trusted dealer|trusted-dealer|API can change|security|should not" README.md doc/walkthrough.md
```

Result:

```text
Tool limitations and production-readiness warnings identified from pinned local clones.
```

### Exact Results

Protocol baseline is pinned to NU6.2.

Critical source repositories and commits are recorded.

Critical binary surfaces are recorded.

zcashd is explicitly excluded as a durable dependency.

The external toolchain workspace is identified as the only place for reproduction work.

P0-002 and P0-003 are now unblocked, pending human approval.

### Artifacts / Evidence

```text
docs/execution/05-TOOLCHAIN-PINS.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
$HOME/.zecsafe/toolchain/frost-tools
$HOME/.zecsafe/toolchain/frost
$HOME/.zecsafe/toolchain/zcash-devtool
```

### Limitations

P0-001 pinned and inspected the toolchains, but did not reproduce a FROST signing run.

P0-001 pinned and inspected the PCZT flow, but did not create, prove, sign, combine, extract, or send a PCZT.

No live mainnet wallet, funding, transaction, or broadcast was performed.

The pczt 0.5 versus pczt 0.7 split remains a known interop risk for P0-002 and P0-003.

### Acceptance Criteria

- [x] Protocol baseline pinned.
- [x] ZIP 312 recorded.
- [x] ZF FROST repo and book recorded.
- [x] FROST coordination/tool repo pinned.
- [x] zcash-devtool pinned.
- [x] PCZT docs/walkthrough recorded.
- [x] zcashd support status recorded.
- [x] Rust, Cargo, OS, and architecture recorded.
- [x] Tool purposes, binaries, install/build commands, licenses, help surfaces, and known limitations recorded.
- [x] No private toolchain artifacts committed to repository.

## ZSAFE-P0-002 - Reproduce trusted-dealer 2-of-3 RedPallas signing

Status: `COMPLETED`

Priority: `P0`

Protected differentiator: `failure-on-screen continuity proof and FROST execution proof`

Started UTC: `2026-07-11T04:18:46Z`

Completed UTC: `2026-07-11T04:30:50Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

The user approved proceeding to `ZSAFE-P0-002` after `ZSAFE-P0-001` completed.

Starting status:

```text
## main...origin/main
 M .gitignore
 M SUBMISSION.md
 M package.json
 M server.mjs
?? .github/
?? HANDOFF.md
?? docs/execution/
?? scripts/security-scan.mjs
```

### Implementation

Created:

```text
docs/execution/06-REDPALLAS-REPRO.md
```

Updated:

```text
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

Reproduced a 2-of-3 RedPallas signing run with pinned frost-tools in an external workspace:

```text
$HOME/.zecsafe/runs/p0-002-20260711T041846Z
```

The successful path used:

```text
frostd
frost-client init
frost-client trusted-dealer
frost-client coordinator
frost-client participant
```

No app runtime source, UI layout, server route behavior, wallet artifact, PCZT artifact, Zcash key, or mainnet state was changed.

### Files Changed

```text
docs/execution/06-REDPALLAS-REPRO.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
```

### Upstream Tools / Pinned Commits

frost-tools:

```text
Repository: https://github.com/ZcashFoundation/frost-tools
Commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
Binaries: frostd, frost-client
Ciphersuite selector: redpallas
```

Protocol result:

```text
threshold: 2
participant count: 3
selected signers: Alice and Bob
offline signer: Eve
signature output bytes: 64
```

Public group key:

```text
faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28
```

### Security Impact

No generated participant config, key package, TLS key, log, or signature file was copied into the repository.

Private or sensitive external files remain under:

```text
$HOME/.zecsafe/runs/p0-002-20260711T041846Z
```

The external run directory contains unencrypted frost-client test configs and key packages. It must not be committed.

No wallet database was created.

No PCZT was created.

No Zcash viewing key or spending key was used.

No mainnet wallet was funded.

No transaction was broadcast.

### Public Claims Affected

ZecSafe can now accurately claim that the pinned frost-tools RedPallas 2-of-3 signing path was reproduced locally with one unavailable participant.

ZecSafe must not yet claim:

```text
DKG production readiness
PCZT signing
SIGHASH signing
Zcash transaction authorization
mainnet broadcast
standalone judge verification
```

### Tests Changed

No tests changed.

### Verification Commands

Command:

```bash
cargo run --locked -p frost-client -- trusted-dealer -c alice.toml -c bob.toml -c eve.toml -d 'ZecSafe P0-002 RedPallas 2-of-3' -N Alice,Bob,Eve -s 127.0.0.1:2746 -C redpallas -t 2 -n 3
```

Result:

```text
RedPallas trusted-dealer group written to three external configs.
```

Command:

```bash
cargo run --locked -p frostd -- --ip 127.0.0.1 --port 2746 --tls-cert server.cert.pem --tls-key server.key.pem
```

Result:

```text
frostd started as HTTPS server on 127.0.0.1:2746.
```

Command:

```bash
SSL_CERT_FILE=ca.cert.pem cargo run --locked -p frost-client -- coordinator -c alice.toml -g faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28 -S AlicePublicKey,BobPublicKey -m message.txt -o signature-attempt2.raw
```

Result:

```text
Coordinator created signing session, received Alice/Bob commitments and signature shares, and wrote signature-attempt2.raw.
```

Command:

```bash
printf 'y\n' | SSL_CERT_FILE=ca.cert.pem cargo run --locked -p frost-client -- participant -c alice.toml -g faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28
printf 'y\n' | SSL_CERT_FILE=ca.cert.pem cargo run --locked -p frost-client -- participant -c bob.toml -g faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28
```

Result:

```text
Alice and Bob reviewed the message prompt and completed with Done.
```

Command:

```bash
wc -c message.txt public-key-package.json signature-attempt2.raw
```

Result:

```text
message.txt: 56 bytes
public-key-package.json: 573 bytes
signature-attempt2.raw: 64 bytes
```

Command:

```bash
sha256sum message.txt public-key-package.json signature-attempt2.raw
```

Result:

```text
message.txt: 85c3ce7ed93397093231ae7e34c9f7b05f245263983b21da2bee1a7d4a26d3a1
public-key-package.json: c84c62b61edd13d104f0bc568c8c33a6a174cfdc5253f35f0bebd76ef7f6f331
signature-attempt2.raw: 70ce85e40b7bf1987e0c5af7104dc26ba76f312a58f96969ae38bcbdcc138e94
```

### Exact Results

Pinned frost-tools RedPallas signing reproduced.

Two selected participants approved the message and produced shares.

The third participant stayed offline.

Coordinator produced a 64-byte group signature artifact outside the repository.

The old lower-level coordinator path was found unsuitable for this gate because its CLI comms path does not support rerandomized RedPallas signing.

The current high-level `frost-client` path requires HTTPS; local reproduction used a temporary CA through per-process `SSL_CERT_FILE`.

Managed sandbox blocked local bind/connect operations, so local network commands were rerun with explicit approval.

### Artifacts / Evidence

```text
docs/execution/06-REDPALLAS-REPRO.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
$HOME/.zecsafe/runs/p0-002-20260711T041846Z
```

### Limitations

This is a trusted-dealer test flow, not DKG.

This is arbitrary-message RedPallas signing, not PCZT signing or Zcash transaction authorization.

The coordinator-generated rerandomization context was not persisted into a standalone verifier bundle.

No judge verifier command exists yet for this artifact.

### Acceptance Criteria

- [x] Pinned frost-tools commit used.
- [x] 2-of-3 RedPallas group created.
- [x] Two signers selected and one signer left offline.
- [x] Alice approved the message.
- [x] Bob approved the message.
- [x] Coordinator produced a 64-byte signature.
- [x] Private artifacts kept outside repository.
- [x] No wallet, PCZT, mainnet funding, or broadcast occurred.

## ZSAFE-P0-003 - Reproduce official PCZT/view-only flow

Started UTC: `2026-07-11T07:00:24Z`

Completed UTC: `2026-07-11T07:09:33Z`

Status: `COMPLETE_WITH_FUNDING_BOUNDARY`

### Preconditions

`ZSAFE-P0-001` pinned `zcash-devtool` at:

```text
1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

`ZSAFE-P0-002` reproduced pinned RedPallas FROST signing, but did not create any wallet or PCZT artifact.

The user approved proceeding to `ZSAFE-P0-003` after `ZSAFE-P0-002` completed.

The user also instructed that `HANDOFF.md` must be updated after every completed task ID.

### Work Performed

Created an external run workspace:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z
```

Built and ran `zcash-devtool` from the pinned local source:

```text
$HOME/.zecsafe/toolchain/zcash-devtool
```

Initialized a testnet spending wallet outside the repository.

Exported the wallet UFVK, seed fingerprint, account index, birthday height, and recipient address only into the external run workspace.

Initialized a view-only testnet wallet from the exported UFVK outside the repository.

Synced both wallets against:

```text
https://testnet.zec.rocks:443
```

Observed chain state:

```text
chain_name: test
chain_tip_height: 4159196
```

Confirmed both wallets had zero spendable balance.

Attempted the official view-only PCZT creation path.

Recorded the funding boundary:

```text
Error: Insufficient balance (have 0, need 10001 including fee)
```

Generated a disposable transparent-only manual fixture outside the repository to exercise the non-broadcast PCZT command surface.

Verified the testnet transparent P2PKH prefix from pinned `zcash_protocol` source:

```text
B58_PUBKEY_ADDRESS_PREFIX: [0x1d, 0x25]
```

Created a transparent-only PCZT fixture:

```text
manual-created-transparent.pczt
bytes: 286
sha256: 98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
```

Inspected the fixture:

```text
transparent inputs: 1
input value: 20000 zatoshis
transparent signatures present: 0
transparent outputs: 1
output value: 10000 zatoshis
transaction version: V6
```

Ran `prove` and `combine` against the transparent-only fixture. The resulting PCZT artifacts were byte-identical, which is expected because no shielded proofs or additional partial data were present:

```text
manual-proven-transparent.pczt: 286 bytes, same sha256
manual-combined-transparent.pczt: 286 bytes, same sha256
```

Ran `sign` with the spending wallet identity against the fixture. The command returned success but made no change because the fake transparent input was not derived from the wallet:

```text
manual-signed-transparent.pczt: 286 bytes, same sha256
transparent signatures present after sign: 0
```

Ran `extract` and recorded the expected authorization failure:

```text
Error: Failed to finalize PCZT spends: TransparentFinalize(MissingSignature)
```

No PCZT was sent.

No raw transaction was extracted.

No transaction was broadcast.

### Files Changed

```text
docs/execution/07-PCZT-VIEW-ONLY-REPRO.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Repository Verification

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

### Security Impact

No wallet database, mnemonic, age identity, UFVK, UIVK, recipient address file, transparent private key, manual coin JSON, raw PCZT body, extracted transaction, or private command log was copied into the repository.

Sensitive external files remain under:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z
```

That directory must remain outside version control.

### Public Claims Affected

ZecSafe can now accurately claim:

```text
Pinned zcash-devtool wallet initialization reproduced locally.
Spending wallet and derived view-only wallet created externally.
Both wallets synced to testnet through lightwalletd.
Official view-only PCZT creation reached a zero-balance funding boundary.
Manual transparent PCZT creation, inspect, prove, and combine commands were exercised without broadcast.
Unsigned PCZT extraction fails with MissingSignature.
```

ZecSafe must not yet claim:

```text
funded PCZT creation
shielded PCZT spend authorization
FROST-bound PCZT signing
signed/extracted spend transaction
testnet or mainnet broadcast
judge-verifiable PCZT proof bundle
```

### Verification Commands

Command:

```bash
cargo run --locked --release -- wallet -w <external-dev-wallet> init --name ZDevTest -i <external-identity-file> -n test -s zecrocks --connection direct
```

Result:

```text
Spending wallet initialized outside the repository.
```

Command:

```bash
cargo run --locked --release -- wallet -w <external-view-wallet> init-fvk --name ZDevView --fvk <external-ufvk> --birthday 4159093 --seed-fingerprint <external-seed-fingerprint> --hd-account-index 0 -s zecrocks --connection direct
```

Result:

```text
View-only wallet initialized outside the repository.
```

Command:

```bash
cargo run --locked --release -- wallet -w <external-wallet> sync
```

Result:

```text
Wallets synced to testnet height 4159196.
```

Command:

```bash
cargo run --locked --release -- pczt -w <external-view-wallet> create --address <external-wallet-address> --value 1 --memo <redacted>
```

Result:

```text
Error: Insufficient balance (have 0, need 10001 including fee)
```

Command:

```bash
cargo run --locked --release -- pczt create-manual --coins <external-coin-json> --address <external-transparent-address> --memo <redacted> -n test -s zecrocks --connection direct
```

Result:

```text
286-byte transparent-only PCZT created outside the repository.
```

Command:

```bash
cargo run --locked --release -- pczt inspect < manual-created-transparent.pczt
cargo run --locked --release -- pczt prove < manual-created-transparent.pczt
cargo run --locked --release -- pczt combine -i manual-created-transparent.pczt -i manual-proven-transparent.pczt
```

Result:

```text
Inspect succeeded. Prove and combine produced byte-identical transparent-only PCZTs.
```

Command:

```bash
cargo run --locked --release -- pczt -w <external-dev-wallet> sign -i <external-identity-file> < manual-combined-transparent.pczt
cargo run --locked --release -- pczt extract < manual-signed-transparent.pczt
```

Result:

```text
Sign made no change because the fake transparent input is not wallet-derived.
Extract failed with TransparentFinalize(MissingSignature).
```

### Artifacts / Evidence

```text
docs/execution/07-PCZT-VIEW-ONLY-REPRO.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
$HOME/.zecsafe/runs/p0-003-20260711T070024Z
```

### Limitations

The official funded PCZT creation path was not completed because the generated wallet has zero funds.

The manual transparent fixture is not a real chain coin and is not a replacement for the official funded flow.

No shielded PCZT spend was signed.

No FROST signature was bound to a PCZT.

No raw transaction was extracted.

No transaction was broadcast.

### Acceptance Criteria

- [x] Pinned `zcash-devtool` commit used.
- [x] Spending wallet initialized outside the repository.
- [x] UFVK exported only to the external workspace.
- [x] View-only wallet initialized outside the repository from the UFVK.
- [x] Both wallets synced to testnet.
- [x] Official view-only PCZT creation attempted.
- [x] Zero-balance funding boundary recorded.
- [x] Manual transparent PCZT fixture created outside the repository.
- [x] Manual fixture inspected, proven, combined, and extraction failure recorded.
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.
- [x] No wallet DB, key, UFVK, address file, PCZT body, or private log committed.
- [x] No mainnet funding or broadcast occurred.

## ZSAFE-P0-004 - DKG feasibility spike

Started UTC: `2026-07-11T07:13:00Z`

Completed UTC: `2026-07-11T07:19:29Z`

Status: `PASS_FOR_FROST_GROUP_SETUP`

### Preconditions

`ZSAFE-P0-002` reproduced a trusted-dealer 2-of-3 RedPallas signing path.

`ZSAFE-P0-003` reproduced the official `zcash-devtool` wallet/view-only setup path and recorded the zero-balance PCZT creation boundary.

The user approved proceeding to `ZSAFE-P0-004` after being told it was the next task.

### Work Performed

Created an external run workspace:

```text
$HOME/.zecsafe/runs/p0-004-20260711T071646Z
```

Used pinned frost-tools:

```text
Repository: https://github.com/ZcashFoundation/frost-tools
Commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
```

Initialized three fresh participant configs outside the repository:

```text
alice.toml
bob.toml
eve.toml
```

Generated local TLS material outside the repository and started `frostd` on:

```text
127.0.0.1:2747
```

Exported and imported participant contact strings so all three configs could address one another through the encrypted HTTP DKG communication layer.

Ran a RedPallas DKG with:

```text
threshold: 2
participant count: 3
ciphersuite: redpallas
```

All three DKG clients exited with status `0`.

Sanitized DKG logs showed:

```text
Alice: Creating DKG session -> Round 1 -> broadcasted Round 1 -> Round 2 -> Group created
Bob: Joining DKG session -> Round 1 -> broadcasted Round 1 -> Round 2 -> Group created
Eve: Joining DKG session -> Round 1 -> broadcasted Round 1 -> Round 2 -> Group created
```

All three configs reported the same group:

```text
description: ZecSafe P0-004 DKG RedPallas 2-of-3
public group key: 943022b2c25fe277b6f150c36b88af0e6dcc95e67422fc66fd561327083cb324
server URL: 127.0.0.1:2747
threshold: 2
participants: 3
```

Tested downstream signing with the DKG-created group:

```text
selected signers: Alice and Bob
offline signer: Eve
```

Signing statuses:

```text
coordinator: 0
alice: 0
bob: 0
```

Generated external signing artifacts:

```text
message bytes: 54
signature bytes: 64
message sha256: 2dad43d0efb88849fc448c401dee319b330cda3f9bf0c16f4339659959462468
signature sha256: 81189e428c8c1100f25e4ee54b6aaf9819535c2a649f6b092c0e74080113c4b3
```

Stopped `frostd` after the signing test and confirmed no `frostd` or `frost-client` process remained running.

### Decision

DKG is feasible for the final proof's FROST group setup path.

Trusted-dealer fallback is not required at this point.

Do not claim production DKG. The upstream docs still describe these demos as WIP, and `frost-client` stores participant secrets unencrypted in its config files.

### Files Changed

```text
docs/execution/09-DKG-FEASIBILITY.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Repository Verification

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

### Security Impact

No generated participant config, contact token, TLS key, raw signature, or command log was copied into the repository.

Sensitive external files remain under:

```text
$HOME/.zecsafe/runs/p0-004-20260711T071646Z
```

That directory must remain outside version control.

### Public Claims Affected

ZecSafe can now accurately claim:

```text
Pinned frost-tools DKG was reproduced locally with three participants.
The DKG-created RedPallas group has threshold 2 and participant count 3.
The DKG-created group completed a downstream 2-of-3 signing session with Eve offline.
The final proof path can use DKG for FROST group setup if later PCZT-specific gates do not expose a blocker.
```

ZecSafe must not yet claim:

```text
production-ready DKG
PCZT/SIGHASH authorization with the DKG group
funded transaction signing
transaction extraction
mainnet broadcast
judge-verifiable DKG proof bundle
```

### Verification Commands

Command:

```bash
cargo run --locked -p frost-client -- dkg -c <external-alice-config> -d 'ZecSafe P0-004 DKG RedPallas 2-of-3' -s 127.0.0.1:2747 -C redpallas -t 2 -S <bob-pubkey>,<eve-pubkey>
cargo run --locked -p frost-client -- dkg -c <external-bob-config> -d 'ZecSafe P0-004 DKG RedPallas 2-of-3' -s 127.0.0.1:2747 -C redpallas -t 2
cargo run --locked -p frost-client -- dkg -c <external-eve-config> -d 'ZecSafe P0-004 DKG RedPallas 2-of-3' -s 127.0.0.1:2747 -C redpallas -t 2
```

Result:

```text
All three DKG clients exited with status 0 and wrote matching group information.
```

Command:

```bash
cargo run --locked -p frost-client -- coordinator -c <external-alice-config> -g <dkg-public-group-key> -S <alice-pubkey>,<bob-pubkey> -m <external-message-file> -o <external-signature-file>
printf 'y\n' | cargo run --locked -p frost-client -- participant -c <external-alice-config> -g <dkg-public-group-key>
printf 'y\n' | cargo run --locked -p frost-client -- participant -c <external-bob-config> -g <dkg-public-group-key>
```

Result:

```text
Alice and Bob completed downstream signing. Eve stayed offline. Coordinator wrote a 64-byte signature.
```

### Artifacts / Evidence

```text
docs/execution/09-DKG-FEASIBILITY.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
$HOME/.zecsafe/runs/p0-004-20260711T071646Z
```

### Limitations

This proves DKG feasibility for RedPallas group setup and arbitrary-message signing only.

This does not prove PCZT signing, Zcash SIGHASH authorization, raw transaction extraction, mainnet broadcast, or judge verification.

The DKG configs contain unencrypted participant secrets and must remain outside the repository.

### Acceptance Criteria

- [x] Pinned `frost-tools` commit used.
- [x] Three fresh participant configs initialized outside the repository.
- [x] Three participants imported each other's contacts.
- [x] DKG attempted with RedPallas and threshold 2.
- [x] All three DKG clients created the same group.
- [x] DKG-created group used for downstream signing.
- [x] Alice and Bob completed the signing session.
- [x] Eve remained offline for the downstream signing session.
- [x] Coordinator produced a 64-byte signature.
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.
- [x] Private configs, contact tokens, TLS keys, logs, and signature file stayed outside the repository.
- [x] No wallet, PCZT, mainnet funding, or broadcast occurred.

## ZSAFE-P0-005 - Create deterministic transaction intent v1

Started UTC: `2026-07-11T07:22:00Z`

Completed UTC: `2026-07-11T07:28:47Z`

Status: `COMPLETE`

### Preconditions

`ZSAFE-P0-004` completed with DKG feasible for FROST group setup.

The user approved proceeding to `ZSAFE-P0-005`.

### Work Performed

Added a strict intent module:

```text
src/intent-v1.mjs
```

Implemented:

```text
schema_version: zecsafe-intent-v1
network validation
vault_id validation
group_fingerprint validation
recipient validation by network
integer zatoshi amount validation
integer max-fee validation
memo UTF-8 byte-length validation
created_at and expires_at validation
canonical JSON serialization
sha256 intent commitment
raw JSON numeric syntax rejection helper
```

Added a CLI:

```text
scripts/create-intent.mjs
npm run intent:create
```

CLI acceptance output:

```text
Intent created
Intent commitment: sha256:<64 hex>
```

Added an API:

```text
POST /api/intent/create
```

API success response includes:

```text
message: Intent created
intent_commitment: sha256:<64 hex>
canonical_intent_json
intent
```

Added focused tests:

```text
scripts/intent-v1.test.mjs
```

Test coverage includes:

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

Updated `package.json` so `npm run check` now runs:

```text
npm run verify
npm run test:intent
npm run check:syntax
npm run security:scan
```

API smoke test results:

```text
valid fixture: 200, message "Intent created"
valid fixture commitment: sha256:10124990b764067b015f1c0bd23fcc92db7cb1775cb5206fdfee64143ef2d9c1
scientific amount fixture: 400, amount_zatoshis must not use decimals or scientific notation.
```

### Files Changed

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

### Repository Verification

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

### Security Impact

No wallet, participant, PCZT, signature, viewing key, or private runtime artifact was created in the repository.

The intent fixture uses public test values only.

### Public Claims Affected

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

### Artifacts / Evidence

```text
docs/execution/10-INTENT-V1.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
src/intent-v1.mjs
scripts/create-intent.mjs
scripts/intent-v1.test.mjs
```

### Limitations

This task creates and commits deterministic intent semantics only.

The current browser proposal UI still has legacy proposal state and does not fully consume `zecsafe-intent-v1`.

No PCZT inspect adapter exists yet.

No Binding Firewall exists yet.

No FROST signature is bound to an intent yet.

### Acceptance Criteria

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
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

## ZSAFE-P0-006 - Implement PCZT fingerprint and strict inspect adapter

Started UTC: `2026-07-11T07:31:00Z`

Completed UTC: `2026-07-11T07:34:28Z`

Status: `COMPLETE`

### Preconditions

`ZSAFE-P0-005` created deterministic transaction intent v1.

The user approved proceeding to `ZSAFE-P0-006`.

### Work Performed

Added a strict PCZT inspect adapter:

```text
src/pczt-inspect-v1.mjs
```

Implemented:

```text
pinned zcash-devtool commit check
network validation
transparent input header parsing
transparent output header parsing
recipient extraction
amount_zatoshis extraction
output_count extraction
transparent fee calculation
memo metadata status
source_fingerprint
pczt_fingerprint
transaction id extraction
transaction version extraction
strict rejection of unexpected output
```

Pinned tool identity:

```text
tool: zcash-devtool
commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
```

Added a CLI:

```text
scripts/pczt-inspect.mjs
npm run pczt:inspect
```

The CLI verifies the pinned tool commit, invokes:

```bash
cargo run --locked --release -- pczt inspect
```

and writes raw inspect output to an external diagnostics directory by default:

```text
$HOME/.zecsafe/pczt-inspect
```

Added focused tests:

```text
scripts/pczt-inspect-v1.test.mjs
```

Test coverage includes:

```text
valid fixture
missing field
malformed output
unexpected extra output
tool-version mismatch
```

Updated `package.json` so `npm run check` now runs:

```text
npm run verify
npm run test:intent
npm run test:pczt
npm run check:syntax
npm run security:scan
```

### Real Fixture Smoke

Ran the adapter CLI against the external P0-003 manual transparent PCZT fixture:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
```

Raw inspect output was captured outside the repository:

```text
$HOME/.zecsafe/pczt-inspect/inspect-20260711T073416Z.txt
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

### Files Changed

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

### Repository Verification

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

### Security Impact

No raw PCZT body, raw inspect output, wallet artifact, participant config, private key, or log was copied into the repository.

The real PCZT fixture and raw inspect output remain outside the repository:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
$HOME/.zecsafe/pczt-inspect/inspect-20260711T073416Z.txt
```

### Public Claims Affected

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

### Artifacts / Evidence

```text
docs/execution/11-PCZT-INSPECT-ADAPTER.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
src/pczt-inspect-v1.mjs
scripts/pczt-inspect.mjs
scripts/pczt-inspect-v1.test.mjs
```

### Limitations

The adapter currently supports the allowlisted transparent inspect output shape exercised by the P0-003 manual fixture.

The adapter does not yet parse shielded memo content.

The adapter does not yet compare a PCZT review to `zecsafe-intent-v1`.

The adapter does not authorize signing.

### Acceptance Criteria

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
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

## ZSAFE-V3-001 - Judge-proof integration amendment

Started UTC: `2026-07-11T08:11:30Z`

Completed UTC: `2026-07-11T08:14:09Z`

Status: `COMPLETE`

Priority: `P0 control gate`

Protected differentiator: `all - enforces judge-proof evidence output across the remaining plan`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

`ZSAFE-P0-006` was complete.

The repo was waiting for human approval before `ZSAFE-P0-007 - Build the Intent-to-PCZT Binding Firewall`.

The active Windows plan was still V2:

```text
%USERPROFILE%\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
%USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
```

Starting status:

```text
## main...origin/main
 M .gitignore
 M SUBMISSION.md
 M package.json
 M scripts/verify.mjs
 M server.mjs
?? .github/
?? HANDOFF.md
?? docs/execution/
?? scripts/create-intent.mjs
?? scripts/intent-v1.test.mjs
?? scripts/pczt-inspect-v1.test.mjs
?? scripts/pczt-inspect.mjs
?? scripts/security-scan.mjs
?? src/intent-v1.mjs
?? src/pczt-inspect-v1.mjs
```

### Implementation

Created the V3 execution plan beside V2:

```text
%USERPROFILE%\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
%USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
```

V2 remains unchanged as historical baseline.

V3 adds one execution ideal:

```text
Judge-First Verifiability
```

V3 inserts a new control gate before `ZSAFE-P0-007`:

```text
ZSAFE-V3-001 - Judge-proof integration amendment
```

The amendment requires every remaining completed task ledger entry to include:

```text
Judge-proof impact:
Public-safe evidence emitted:
Private material intentionally excluded:
Negative/tamper case:
Claim now allowed:
Claim still forbidden:
```

The amendment also adds a P0-007 requirement: the Binding Firewall must produce a redacted deterministic report suitable for future `ProofEvent v1` and `zecsafe-proof-v1` inclusion.

### Files Changed

```text
%USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
docs/execution/12-JUDGE-PROOF-AMENDMENT.md
HANDOFF.md
```

### Upstream Tools / Pinned Commits

No upstream FROST, PCZT, zcashd, wallet, or proof-verifier tool was installed, repinned, or executed in this task.

Existing pins from `ZSAFE-P0-001` remain authoritative until a later task explicitly repins them.

### Security Impact

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was created or copied by this amendment.

The amendment strengthens the public/private boundary by requiring each future task to state what public-safe evidence it emits and what private material it intentionally excludes.

### Public Claims Affected

ZecSafe can now accurately claim:

```text
The active execution plan has been amended so every remaining core task must feed public-safe evidence into the judge verifier path.
```

ZecSafe must not yet claim:

```text
Intent-to-PCZT binding exists.
ProofEvent v1 exists.
zecsafe-proof-v1 exists.
make judge-proof exists.
A real FROST signature is bound to a Zcash PCZT/SIGHASH.
A mainnet transaction has been authorized by ZecSafe's FROST flow.
```

### Tests Changed

No code tests changed.

### Verification Commands

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

Exit code: `0`

### Exact Results

V3 plan was created and amended.

The repo now records V3 as the active execution plan.

`ZSAFE-P0-007` now has a stricter evidence-output requirement before implementation starts.

### Artifacts / Evidence

```text
%USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
docs/execution/12-JUDGE-PROOF-AMENDMENT.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Judge-proof Impact

The amendment makes `make judge-proof` the spine of the remaining plan.

Every future core task must either produce verifier evidence, protect verifier evidence, prevent a false verifier claim, or remove a blocker to the verifier path.

### Public-safe Evidence Emitted

Documentation-only evidence:

```text
V3 plan file
repo amendment doc
mission update
ledger entry
handoff update
```

### Private Material Intentionally Excluded

No private wallet, FROST, PCZT, signing, viewing-key, or runtime artifact was created or copied.

### Negative/Tamper Case

No executable proof artifact was created by this amendment, so no runtime tamper case exists yet.

The amendment requires future `ZSAFE-P0-015`, `ZSAFE-P0-025`, and `ZSAFE-P0-026` work to verify semantic tampering through `make judge-proof` and `make judge-proof-tamper`.

### Claim Now Allowed

```text
V3 is the active plan and requires judge-proof evidence output for every remaining core task.
```

### Claim Still Forbidden

```text
ZecSafe has not yet implemented Binding Firewall, ProofEvent v1, zecsafe-proof-v1, make judge-proof, FROST-bound PCZT signing, or mainnet proof.
```

### Limitations

This task is a control-plane documentation amendment only.

It does not implement Binding Firewall behavior.

It does not modify the UI.

It does not create or verify a proof bundle.

### Acceptance Criteria

- [x] V3 plan exists beside V2.
- [x] V2 remains unchanged as historical baseline.
- [x] `docs/execution/00-MISSION.md` points to V3 as the active source plan.
- [x] `docs/execution/12-JUDGE-PROOF-AMENDMENT.md` records this gate in the repo.
- [x] `docs/execution/08-EXECUTION-LEDGER.md` records `ZSAFE-V3-001`.
- [x] `HANDOFF.md` records the new active plan and next task.
- [x] No FROST, wallet, PCZT, or mainnet artifact was created by this amendment.
- [x] `npm run check` passed.

## ZSAFE-P0-007 - Build the Intent-to-PCZT Binding Firewall

Started UTC: `not separately captured; began immediately after user approval in this turn`

Completed UTC: `2026-07-11T15:50:59Z`

Status: `COMPLETE`

Priority: `P0`

Protected differentiator: `#2 - Intent-to-PCZT Binding Firewall`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

`ZSAFE-P0-005` had created deterministic `zecsafe-intent-v1`.

`ZSAFE-P0-006` had created the strict PCZT inspect adapter and external fixture smoke.

`ZSAFE-V3-001` had added the judge-proof evidence-output requirement.

The repo was waiting for human approval before `ZSAFE-P0-007`.

### Implementation

Added a deterministic Binding Firewall module:

```text
src/pczt-bind-v1.mjs
```

Report schema:

```text
zecsafe-binding-report-v1
```

Added a CLI:

```text
scripts/pczt-bind.mjs
npm run pczt:bind
```

Added focused tests:

```text
scripts/pczt-bind-v1.test.mjs
npm run test:bind
```

The firewall compares:

```text
source/tool identity where present
network
recipient
amount
fee policy
memo policy where inspectable
unexpected outputs
explicitly modeled change outputs
```

On binding failure, the report blocks:

```text
signing.prepare
frost.session.start
broadcast.preview
broadcast.execute
```

### Files Changed

```text
src/pczt-bind-v1.mjs
scripts/pczt-bind.mjs
scripts/pczt-bind-v1.test.mjs
package.json
scripts/verify.mjs
docs/execution/13-BINDING-FIREWALL.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Upstream Tools / Pinned Commits

No upstream tool was repinned.

The Binding Firewall consumes output from the existing pinned inspect adapter:

```text
zcash-devtool commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
inspect source: zcash-devtool pczt inspect
```

### Security Impact

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was committed or copied into the repository.

The Binding Firewall report is public-safe by construction: it emits commitments, fingerprints, check statuses, blockers, and limitation text rather than raw PCZT bodies or private runtime files.

### Public Claims Affected

ZecSafe can now accurately claim:

```text
It has a deterministic headless Binding Firewall that compares zecsafe-intent-v1 against a structured PCZT review, emits a redacted report, and blocks signing/FROST/broadcast operations on mismatch.
```

ZecSafe must not yet claim:

```text
ProofEvent v1 exists.
The Binding Firewall is persisted in an append-only run log.
The Binding Firewall supports every PCZT shape.
The firewall independently verifies shielded memo content when the inspect source does not report it.
The firewall proves signer group membership.
A real FROST signature is bound to a Zcash PCZT/SIGHASH.
A signed/proven/combined funded PCZT exists.
make judge-proof exists.
Mainnet proof exists.
```

### Tests Changed

Added:

```text
scripts/pczt-bind-v1.test.mjs
```

Updated:

```text
package.json
scripts/verify.mjs
```

`npm run check` now includes:

```text
npm run test:bind
node --check src/pczt-bind-v1.mjs
node --check scripts/pczt-bind.mjs
node --check scripts/pczt-bind-v1.test.mjs
```

### Verification Commands

Focused command:

```bash
npm run test:bind
```

Focused result:

```text
ZecSafe Binding Firewall tests passed.
```

Full command:

```bash
npm run check
```

Full result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe security scan passed.
```

Exit code: `0`

### Exact Results

The Binding Firewall emits the V3-required minimum fields:

```text
schema_version
run_id
intent_commitment
pczt_fingerprint
source_fingerprint
network_check
recipient_check
amount_check
fee_policy_check
memo_policy_check
unexpected_output_check
change_output_check
status
blocked_operations
limitation
```

Negative tests cover:

```text
amount mutation
recipient mutation
network mutation
extra recipient / unexpected output
memo mismatch where reported
fee-policy violation
```

The CLI mismatch summary emits:

```text
INTENT ↔ PCZT: FAIL
FROST SESSION: BLOCKED
```

The real external P0-003 manual transparent PCZT fixture produced:

```text
PASS ALLOWED sha256:98630ff6eab3d0a5621fb17c05d62a687c09ae030a8a111ae4b4d1e4d0b129bd
```

The same smoke path first blocked when the reviewed recipient did not match, confirming the firewall does not pass by fingerprint alone.

### Artifacts / Evidence

```text
src/pczt-bind-v1.mjs
scripts/pczt-bind.mjs
scripts/pczt-bind-v1.test.mjs
docs/execution/13-BINDING-FIREWALL.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

External fixture inputs remained outside the repository:

```text
$HOME/.zecsafe/runs/p0-003-20260711T070024Z/artifacts/manual-created-transparent.pczt
$HOME/.zecsafe/pczt-inspect/inspect-20260711T073416Z.txt
```

### Judge-proof Impact

This task creates the first deterministic Binding Firewall report that can later become a `ProofEvent v1` event and a `zecsafe-proof-v1` field.

The future verifier can use this report to prove that signing was allowed only after intent-to-PCZT semantic checks passed.

### Public-safe Evidence Emitted

```text
intent_commitment
pczt_fingerprint
source_fingerprint
field-level status objects
expected/observed commitments
blocked operation names
limitation text
PASS/FAIL summary
```

### Private Material Intentionally Excluded

```text
raw PCZT body
raw inspect output
wallet database
mnemonic
spending key
viewing key
FROST participant configs
FROST shares
nonces
signing randomizers
mainnet funding or broadcast material
```

### Negative/Tamper Case

The task proves the firewall blocks mismatched intent or PCZT semantics before signing context, FROST session, or broadcast gate.

Covered mismatches:

```text
amount
recipient
network
extra output
memo where reported
fee policy
```

### Claim Now Allowed

```text
ZecSafe has a deterministic headless Intent-to-PCZT Binding Firewall with redacted evidence and blocking semantics.
```

### Claim Still Forbidden

```text
ZecSafe has not yet persisted Binding Firewall output as ProofEvent v1, generated zecsafe-proof-v1, created make judge-proof, signed a PCZT with FROST, or proven/broadcast a mainnet transaction.
```

### Limitations

The current PCZT inspect adapter does not classify change outputs. Extra unclassified outputs are blocked until a later task provides explicit change modeling from supported tooling.

The current transparent PCZT inspect path does not report memo content. Non-empty reviewed memos fail unless a future review source reports matching memo content.

The Binding Firewall does not prove FROST group membership or SIGHASH authorization. Later P0 tasks must link the binding result to signer review, signing context, FROST execution, PCZT completion, and proof verification.

### Acceptance Criteria

- [x] Deterministic report shape implemented.
- [x] Redacted field-level checks implemented.
- [x] Signing/FROST/broadcast blockers emitted on FAIL.
- [x] Amount mutation blocked.
- [x] Recipient mutation blocked.
- [x] Network mutation blocked.
- [x] Extra recipient/unexpected output blocked.
- [x] Memo mismatch blocked where memo content is reported.
- [x] Fee-policy violation blocked.
- [x] Explicit modeled change output handled without being treated as an unreviewed recipient.
- [x] CLI summary emits the required FAIL/BLOCKED shape.
- [x] Real external fixture smoke produced PASS/ALLOWED for matching intent.
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

## ZSAFE-P0-008 - Freeze ProofEvent v1 and run-state reducer

Started UTC: `not separately captured; began immediately after user approval in this turn`

Completed UTC: `2026-07-11T16:01:47Z`

Status: `COMPLETE`

Priority: `P0`

Protected differentiator: `all - creates the public-safe event source of truth for proof replay`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

`ZSAFE-P0-007` had created the deterministic Binding Firewall report.

The repo was waiting for human approval before `ZSAFE-P0-008`.

`docs/execution/00-MISSION.md` still listed `ZSAFE-P0-008` as the current active task.

### Implementation

Added the ProofEvent v1 module:

```text
src/proof-event-v1.mjs
```

Implemented:

```text
proof-event-v1 event validation
frozen stage enum
FROST status vocabulary
chain status vocabulary
strict top-level event fields
public-safe data allowlist
monotonic sequence validation
timestamp non-regression validation
events[] -> RunState reducer
run_state_hash
public event projection
append-only NDJSON helper
event-log reader
event hash helper
```

Added the CLI:

```text
scripts/proof-event.mjs
npm run proof:event
```

CLI commands:

```text
append
replay
project
```

Added focused tests:

```text
scripts/proof-event-v1.test.mjs
npm run test:events
```

### Files Changed

```text
src/proof-event-v1.mjs
scripts/proof-event.mjs
scripts/proof-event-v1.test.mjs
package.json
scripts/verify.mjs
docs/execution/14-PROOF-EVENT-V1.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Upstream Tools / Pinned Commits

No upstream FROST, PCZT, zcashd, wallet, or proof-verifier tool was installed, repinned, or executed in this task.

Existing pins from `ZSAFE-P0-001` remain authoritative.

### Security Impact

The ProofEvent schema rejects public data fields that would expose:

```text
recipient
amount
memo
mnemonic
seed
spending/private keys
secret/share fields
nonce fields
randomizer fields
wallet DB/path fields
raw PCZT fields
raw inspect fields
UFVK/UIVK/viewing-key fields
```

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was committed or copied into the repository.

Tests use harmless placeholders instead of realistic secret material so the repository security scan remains clean.

### Public Claims Affected

ZecSafe can now accurately claim:

```text
It has ProofEvent v1 validation, append-only local event-log helpers, public-safe projection, and a deterministic run-state reducer that can replay the current headless proof evidence.
```

ZecSafe must not yet claim:

```text
The fixed-operation runner exists.
ProofEvent v1 is fully wired into every existing runtime path.
The UI consumes ProofEvent v1 only.
zecsafe-proof-v1 exists.
make judge-proof exists.
A real FROST signature is bound to a Zcash PCZT/SIGHASH.
A signed/proven/combined funded PCZT exists.
Mainnet proof exists.
```

### Tests Changed

Added:

```text
scripts/proof-event-v1.test.mjs
```

Updated:

```text
package.json
scripts/verify.mjs
```

`npm run check` now includes:

```text
npm run test:events
node --check src/proof-event-v1.mjs
node --check scripts/proof-event.mjs
node --check scripts/proof-event-v1.test.mjs
```

### Verification Commands

Focused command:

```bash
npm run test:events
```

Focused result:

```text
ZecSafe ProofEvent v1 tests passed.
```

Full command:

```bash
npm run check
```

Full result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe ProofEvent v1 tests passed.
ZecSafe security scan passed.
```

Exit code: `0`

### Exact Results

ProofEvent v1 validates:

```text
schema_version
sequence
run_id
occurred_at
stage
status
evidence_ref
public_message
data
```

RunState reducer derives:

```text
run_id
latest_sequence
last_event_at
network
zecsafe_commit
upstream_commits
intent_commitment
pczt_fingerprint
source_fingerprint
stage statuses
binding status and blockers
FROST threshold/session status
PCZT completion status
chain observation status
proof bundle/verify status
limitations
readiness booleans
run_state_hash
```

Negative tests reject:

```text
out-of-order sequence
time-regressing events
private recipient field
mnemonic field
wrong chain status vocabulary
duplicate append
```

### Artifacts / Evidence

```text
src/proof-event-v1.mjs
scripts/proof-event.mjs
scripts/proof-event-v1.test.mjs
docs/execution/14-PROOF-EVENT-V1.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Judge-proof Impact

This task creates the replayable event layer that future `zecsafe-proof-v1` and `make judge-proof` can verify.

The same `ProofEvent v1` stream can be used by CLI replay, future proof generation, and future UI state.

### Public-safe Evidence Emitted

```text
proof-event-v1 schema
zecsafe-run-state-v1 reducer
public projection function
event hash helper
append-only NDJSON helper
CLI replay output
tests proving private fields are rejected
```

### Private Material Intentionally Excluded

```text
raw recipient
raw amount
raw memo
raw PCZT body
raw inspect output
wallet database
mnemonic
spending key
viewing key
FROST participant configs
FROST shares
nonces
signing randomizers
mainnet funding or broadcast material
```

### Negative/Tamper Case

The task proves the event schema rejects non-monotonic replay, time regression, chain status misuse, duplicate append, and private public-data fields.

### Claim Now Allowed

```text
ZecSafe has a public-safe ProofEvent v1 schema, append-only local event-log helpers, public projection, and deterministic RunState reducer.
```

### Claim Still Forbidden

```text
ZecSafe has not yet built the fixed-operation runner, wired every runtime path to ProofEvent v1, generated zecsafe-proof-v1, created make judge-proof, signed a PCZT with FROST, or proven/broadcast a mainnet transaction.
```

### Limitations

ProofEvent v1 is now implemented but only directly exercised by tests and CLI helpers.

Existing app UI and server proof bundle paths still use older prototype state.

P0-009 must build the fixed-operation runner that emits real ProofEvent v1 entries from controlled operations.

### Acceptance Criteria

- [x] Stage enum implemented.
- [x] FROST status vocabulary implemented.
- [x] Chain status vocabulary implemented.
- [x] Schema validation implemented.
- [x] Monotonic sequence validation implemented.
- [x] Reducer implemented: `events[] -> RunState`.
- [x] Local append-only NDJSON helper implemented.
- [x] Public-safe event projection implemented.
- [x] CLI consumes and prints RunState.
- [x] Replay consumes same events.
- [x] Secret/private public data fields rejected by tests.
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

## ZSAFE-P0-009 - Build local fixed-operation runner

Started UTC: `not separately captured; began immediately after user approval in this turn`

Completed UTC: `2026-07-11T16:10:03Z`

Status: `COMPLETE`

Priority: `P0`

Protected differentiator: `all - creates the constrained local operation surface that emits ProofEvent v1`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Confirmed Starting State

`ZSAFE-P0-008` had created ProofEvent v1 and the deterministic RunState reducer.

The repo was waiting for human approval before `ZSAFE-P0-009`.

`docs/execution/00-MISSION.md` still listed `ZSAFE-P0-009` as the current active task.

### Implementation

Added the fixed-operation runner module:

```text
src/fixed-runner-v1.mjs
```

Result schema:

```text
zecsafe-fixed-runner-result-v1
```

Implemented:

```text
fixed operation allowlist
fixed binary allowlist
shell:false process execution
argument-array command execution
local-only host validation
fixed runner workspace boundary
canonical path containment
random run IDs
timeout support
stdout/stderr capture
secret redaction
typed result
ProofEvent v1 emission per operation
optional append to ProofEvent NDJSON log
```

Added the CLI:

```text
scripts/fixed-runner.mjs
npm run fixed:run
```

Added focused tests:

```text
scripts/fixed-runner-v1.test.mjs
npm run test:runner
```

Registered operation IDs:

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

Implemented operations:

```text
toolchain.status
wallet.status
intent.create
pczt.bind
```

Reserved operations return typed blocked/not-implemented results instead of accepting arbitrary commands.

### Files Changed

```text
src/fixed-runner-v1.mjs
scripts/fixed-runner.mjs
scripts/fixed-runner-v1.test.mjs
src/proof-event-v1.mjs
package.json
scripts/verify.mjs
docs/execution/15-FIXED-OPERATION-RUNNER.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Upstream Tools / Pinned Commits

No upstream FROST, PCZT, zcashd, wallet, or proof-verifier tool was installed, repinned, or executed in this task.

The binary allowlist contains only fixed IDs:

```text
node
git
cargo
```

The runner does not accept arbitrary executable names.

### Security Impact

The runner rejects non-local host values.

The runner rejects paths that escape the active runner workspace.

The runner rejects shell metacharacters in path inputs.

The runner executes allowlisted binaries with:

```text
shell: false
argument arrays
controlled environment
timeout
stdout/stderr capture
redaction
```

No FROST participant config, wallet database, mnemonic, spending key, viewing key, PCZT body, raw inspect output, nonce, signing randomizer, or mainnet artifact was committed or copied into the repository.

### Public Claims Affected

ZecSafe can now accurately claim:

```text
It has a local fixed-operation runner with a fixed operation allowlist, fixed binary allowlist, argument-array process execution, path containment, local-only host enforcement, timeout/capture/redaction, typed results, ProofEvent v1 emission, and injection-focused security tests.
```

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

### Tests Changed

Added:

```text
scripts/fixed-runner-v1.test.mjs
```

Updated:

```text
package.json
scripts/verify.mjs
src/proof-event-v1.mjs
```

`npm run check` now includes:

```text
npm run test:runner
node --check src/fixed-runner-v1.mjs
node --check scripts/fixed-runner.mjs
node --check scripts/fixed-runner-v1.test.mjs
```

### Verification Commands

Focused command:

```bash
node scripts/fixed-runner-v1.test.mjs
```

Focused result:

```text
ZecSafe fixed-operation runner tests passed.
```

Full command:

```bash
npm run check
```

Full result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe ProofEvent v1 tests passed.
ZecSafe fixed-operation runner tests passed.
ZecSafe security scan passed.
```

Exit code: `0`

### Exact Results

The runner enforces:

```text
localhost only
operation allowlist
binary allowlist
no shell command strings
process argument arrays
workspace path containment
random run IDs
timeouts
stdout/stderr capture
secret redaction
typed result
ProofEvent v1 per operation
```

The tests cover:

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

### Artifacts / Evidence

```text
src/fixed-runner-v1.mjs
scripts/fixed-runner.mjs
scripts/fixed-runner-v1.test.mjs
docs/execution/15-FIXED-OPERATION-RUNNER.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Judge-proof Impact

This task creates the constrained execution surface that future proof-run steps can use to emit ProofEvent v1 without letting user input become shell execution.

It also gives future `make judge-proof` a typed operation record with operation status, timing, redaction status, and public-safe ProofEvent data.

### Public-safe Evidence Emitted

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

### Private Material Intentionally Excluded

```text
raw recipient
raw amount
raw memo
raw PCZT body
raw inspect output
wallet database
mnemonic
spending key
viewing key
FROST participant configs
FROST shares
nonces
signing randomizers
mainnet funding or broadcast material
```

### Negative/Tamper Case

The task proves tested injection and path payloads cannot reach shell execution or escape the runner workspace.

Covered payloads:

```text
;
&&
|
backticks
$()
../
absolute path
Unicode traversal lookalike
arbitrary executable
oversized run ID
non-local host
```

### Claim Now Allowed

```text
ZecSafe has a local fixed-operation runner that safely accepts only allowlisted operations and emits typed ProofEvent v1 records.
```

### Claim Still Forbidden

```text
ZecSafe has not yet implemented real PCZT creation, signing-context preparation, FROST orchestration, PCZT completion, broadcast, zecsafe-proof-v1, make judge-proof, or mainnet proof through the fixed runner.
```

### Limitations

The runner currently implements only `toolchain.status`, `wallet.status`, `intent.create`, and `pczt.bind`.

`wallet.status` is intentionally blocked until a fixed wallet workspace is configured by a later task.

PCZT creation, inspection through external tooling, signing context, FROST session, PCZT completion, broadcast, proof generation, and proof verification are registered but not implemented in this task.

### Acceptance Criteria

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
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

## ZSAFE-P0-010 - Build participant availability and signer selection

Status: `COMPLETED`

Priority: `P0`

Protected differentiator: `#1 - failure-on-screen continuity proof`

Started UTC: `2026-07-11T16:12:20Z`

Completed UTC: `2026-07-11T16:22:16Z`

Commit: `not created; proceeding with current uncommitted state by user instruction`

### Objective

Make participant unavailability a real input to the headless proof run and block FROST session start when the selected signer set cannot satisfy threshold.

### Implementation

Added:

```text
src/signer-selection-v1.mjs
scripts/signer-selection.mjs
scripts/signer-selection-v1.test.mjs
docs/execution/16-SIGNER-SELECTION.md
```

Updated:

```text
src/fixed-runner-v1.mjs
scripts/fixed-runner.mjs
scripts/fixed-runner-v1.test.mjs
package.json
scripts/verify.mjs
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

Implemented schema:

```text
zecsafe-signer-selection-v1
```

Implemented operation:

```text
frost.session.status
```

Implemented package scripts:

```text
npm run signers:select
npm run test:signers
```

### Selection Rule

The P0 proof-run rule is:

```text
total participants: 3
threshold: 2
C availability: UNAVAILABLE
selected participants: A+B only
```

The selector returns:

```text
SATISFIABLE
UNSATISFIABLE
BLOCKED
```

`SATISFIABLE` requires:

```text
available_count >= threshold
selected_count >= threshold
no selected participant is UNAVAILABLE
no selected participant is UNKNOWN
```

An explicitly empty selected set is not auto-filled. Auto-selection only happens when no selected set is provided.

### Fixed Runner Integration

`src/fixed-runner-v1.mjs` now handles `frost.session.status` by calling `selectSignersV1()`.

The operation emits a `proof-event-v1` at:

```text
stage: FROST_SESSION
status: SATISFIABLE | UNSATISFIABLE | BLOCKED
```

Public-safe ProofEvent data includes:

```text
threshold
participant_total
unavailable_participant_count
selected_public_fingerprints
threshold_status
frost_status
group_fingerprint
limitations
```

### Tests Changed

Added:

```text
scripts/signer-selection-v1.test.mjs
```

Expanded:

```text
scripts/fixed-runner-v1.test.mjs
```

Coverage:

```text
0 available -> UNSATISFIABLE
1 available -> UNSATISFIABLE
2 available -> SATISFIABLE
3 available -> SATISFIABLE
selected set below threshold -> UNSATISFIABLE
explicit empty selected set -> UNSATISFIABLE
unavailable selected -> BLOCKED with warning
unknown selected -> BLOCKED with warning
A+B selected with C unavailable -> SATISFIABLE
auto-select A+B when no selected set is provided
threshold greater than participant count rejected
duplicate participant IDs rejected
duplicate selected IDs rejected
CLI blocked summary
fixed-runner `frost.session.status` SATISFIABLE path
fixed-runner `frost.session.status` BLOCKED path
```

### Verification Commands

Command:

```bash
node scripts/signer-selection-v1.test.mjs
```

Result:

```text
ZecSafe signer selection tests passed.
```

Exit code: `0`

Command:

```bash
node scripts/fixed-runner-v1.test.mjs
```

Result:

```text
ZecSafe fixed-operation runner tests passed.
```

Exit code: `0`

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe ProofEvent v1 tests passed.
ZecSafe fixed-operation runner tests passed.
ZecSafe signer selection tests passed.
ZecSafe security scan passed.
```

Exit code: `0`

### Exact Results

ZecSafe now has a deterministic signer-selection gate that:

```text
validates participant IDs and public fingerprints
validates availability state
enforces threshold satisfiability
blocks unavailable selected participants
blocks unknown selected participants
emits public selected fingerprints
emits FROST_SESSION ProofEvent v1
integrates with the fixed-operation runner
```

### Artifacts / Evidence

```text
src/signer-selection-v1.mjs
scripts/signer-selection.mjs
scripts/signer-selection-v1.test.mjs
src/fixed-runner-v1.mjs
scripts/fixed-runner-v1.test.mjs
docs/execution/16-SIGNER-SELECTION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

### Judge-proof Impact

This task gives the future proof bundle a public-safe FROST-session readiness record:

```text
threshold
participant total
unavailable participant count
selected public fingerprints
group fingerprint linkage
threshold status
FROST session status
```

It proves the unavailable third participant is excluded from the selected signing set instead of being silently relied upon.

### Public-safe Evidence Emitted

```text
schema version
run ID
group fingerprint
threshold
participant total
availability counts
selected public fingerprints
selection reference
FROST_SESSION ProofEvent v1
```

### Private Material Intentionally Excluded

```text
participant secret configs
contact tokens
private share paths
wallet database
mnemonic
spending key
viewing key
raw PCZT body
raw signing context
nonces
signing randomizers
mainnet funding or broadcast material
```

### Negative/Tamper Case

The task proves tested threshold and participant-set failures cannot pass the FROST-session gate:

```text
zero available participants
one available participant
explicit selected set below threshold
selected unavailable participant
selected unknown participant
threshold greater than participant count
duplicate participant IDs
duplicate selected IDs
```

### Claim Now Allowed

```text
ZecSafe has a deterministic signer-selection gate that proves a 2-of-3 signer set is satisfiable with participant C unavailable, selects A+B only for the proof run, and blocks FROST session start when the selected set is below threshold or includes unavailable/unknown participants.
```

### Claim Still Forbidden

```text
ZecSafe has not yet prepared the real PCZT signing context, extracted the real SIGHASH fingerprint, started a real FROST session, completed selected signer shares, signed/proved/combined a funded PCZT, broadcast a transaction, created zecsafe-proof-v1, or implemented make judge-proof.
```

### Limitations

Signer selection proves threshold satisfiability only.

`ZSAFE-P0-011` must still build signing-context preparation from the actual PCZT, handle expiry, keep ephemeral signing context local, and emit only approved public-safe fingerprints.

### Acceptance Criteria

- [x] Participant availability state implemented.
- [x] `AVAILABLE`, `UNAVAILABLE`, and `UNKNOWN` states validated.
- [x] 3-participant, 2-threshold A+B selection supported.
- [x] C unavailable scenario passes with A+B selected.
- [x] Unavailable selected participant blocks session start.
- [x] Unknown selected participant blocks session start.
- [x] Selected set below threshold fails closed.
- [x] Explicit empty selected set fails closed.
- [x] Public selected fingerprints emitted.
- [x] ProofEvent v1 emitted at `FROST_SESSION`.
- [x] Fixed runner implements `frost.session.status`.
- [x] Static verifier checks signer-selection files.
- [x] `HANDOFF.md` updated after completing the task ID.
- [x] `npm run check` passed.

## ZSAFE-P0-011 - Build signing-context preparation

Completed UTC: `2026-07-11T17:19:42Z`.

The user explicitly approved this task after `ZSAFE-P0-010`. ZecSafe implemented `zecsafe-signing-context-v1` and fixed-runner operation `signing.prepare`.

The operation reads actual PCZT bytes from the contained runner workspace, requires their SHA-256 fingerprint to match a passing Binding Firewall report, rejects expired intent before tool invocation, and passes the bytes over stdin to pinned `zcash-devtool pczt inspect` with `shell: false`.

The strict adapter accepts exactly one shielded SIGHASH. Public output contains only its fingerprint, PCZT linkage, binding-report reference, expiry/readiness status, and pinned source identity. Raw PCZT, inspect output, SIGHASH, randomizer, viewing data, and authorization material are excluded from runner and ProofEvent output. The official inspect path needs no FVK/UFVK and does not generate the later FROST randomizer.

`npm run check` passed at `2026-07-11T17:19:42Z`.

### Claim Now Allowed

```text
ZecSafe links actual PCZT bytes to a passing Binding Firewall report and prepares the real shielded transaction SIGHASH through the pinned official tool, exposing only a public-safe SIGHASH fingerprint and expiry status.
```

### Claim Still Forbidden

```text
ZecSafe has not implemented signer review, started the real A+B FROST session against this SIGHASH, produced randomizer or signing shares, signed/proved/combined a funded PCZT, broadcast a transaction, created zecsafe-proof-v1, or implemented make judge-proof.
```

### Acceptance Criteria

- [x] Actual PCZT fingerprint linkage enforced.
- [x] Pinned official signing-context path invoked.
- [x] Shielded SIGHASH strictly extracted and fingerprinted.
- [x] Expired context and pinned-tool failures fail closed.
- [x] Raw output and signing material excluded from public results.
- [x] Fixed runner and ProofEvent public-safe evidence implemented.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

## ZSAFE-P0-012 - Implement signer review command

Completed UTC: `2026-07-11T17:39:21Z`.

The user explicitly approved this task after `ZSAFE-P0-011`. ZecSafe implemented a stack-equivalent signer review command:

```bash
npm run signer:review -- review <review-package.json> --confirm "I REVIEWED AND APPROVE" --summary
```

The task added `zecsafe-signer-review-package-v1` validation and `zecsafe-signer-review-v1` results. A selected signer can locally review transaction details, validate that those details align with the structured PCZT review and passing Binding Firewall report, compare the expected SIGHASH fingerprint from the prepared signing context, and explicitly confirm before FROST authorization.

The review mode is truthfully recorded as:

```text
semantic_pczt_review
```

No stronger SIGHASH claim is made. The signer-review gate compares the prepared pinned-tool SIGHASH fingerprint; it does not independently rerun SIGHASH computation.

`signer.review` is now implemented in the fixed-operation runner and emits public-safe `FROST_SESSION` ProofEvent v1 data.

`npm run check` passed at `2026-07-11T17:39:21Z`.

### Claim Now Allowed

```text
ZecSafe has a local selected-signer review command that validates a review package, requires explicit confirmation, emits public-safe PASS/FAIL/BLOCKED evidence, and blocks FROST start when review fails or is unconfirmed.
```

### Claim Still Forbidden

```text
ZecSafe has not independently rerun SIGHASH computation inside signer review, started the real A+B FROST signing session, generated signing shares, signed/proved/combined a funded PCZT, broadcast a transaction, created zecsafe-proof-v1, or implemented make judge-proof.
```

### Judge-proof Impact

```text
Signer review now contributes public-safe evidence that a selected signer reviewed transaction truth before FROST authorization, with an explicit review-mode limitation that prevents overclaiming independent SIGHASH verification.
```

### Public-safe Evidence Emitted

```text
review mode
review PASS/FAIL/BLOCKED status
checked field statuses
reviewer participant ID
reviewer public fingerprint
selected public fingerprints
PCZT fingerprint
source fingerprint
binding report reference
SIGHASH fingerprint
limitation statement
FROST_SESSION ProofEvent v1
```

### Private Material Intentionally Excluded

```text
raw PCZT bytes
recipient value in public evidence
amount value in public evidence
unredacted memo text
randomizer
nonce
private keys
spending keys
viewing keys
FROST secret shares
authorization material
wallet database
```

### Negative/Tamper Case

```text
missing explicit confirmation -> BLOCKED
reviewed amount mutation -> FAIL
displayed fee/output-count mutation -> FAIL
expected SIGHASH fingerprint mutation -> FAIL
reviewer not in selected signer set -> FAIL
unsupported independent_sighash claim -> rejected
raw recipient and amount excluded from module/fixed-runner public output
```

### Acceptance Criteria

- [x] `zecsafe-signer review` stack-equivalent implemented.
- [x] Review package validates run ID, group fingerprint, PCZT path, PCZT review, reviewed transaction details, intent commitment, expected SIGHASH fingerprint, and coordinator session reference.
- [x] Recipient, amount, memo policy, fee policy, unexpected output, and change-output checks are enforced.
- [x] SIGHASH fingerprint is compared to the prepared signing-context report.
- [x] Review mode truthfully recorded as `semantic_pczt_review`.
- [x] Explicit local confirmation required.
- [x] Fixed runner implements `signer.review`.
- [x] ProofEvent v1 records public-safe signer-review evidence.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

## ZSAFE-P0-013 - Orchestrate the real A+B FROST session

Completed UTC: `2026-07-11T17:51:40Z`.

Status: `COMPLETE_WITH_PCZT_INPUT_BOUNDARY`.

The user explicitly approved this task after `ZSAFE-P0-012`. ZecSafe implemented a fixed-runner FROST-session gate:

```text
frost.session.start
```

The task added `zecsafe-frost-session-package-v1` validation and `zecsafe-frost-session-v1` results. The gate links threshold satisfiability, selected signer public fingerprints, signer-review PASS records, signing-context SIGHASH fingerprint, session fingerprint, aggregate signature fingerprint, and aggregate verification status.

The gate records:

```text
THRESHOLD_REACHED
AGGREGATE_SIGNATURE_VERIFIED
```

only when all public-safe prerequisites match.

`npm run check` passed at `2026-07-11T17:51:40Z`.

### Live External Smoke

External run:

```text
$HOME/.zecsafe/runs/p0-013-20260711T174838Z
```

Result:

```text
coordinator status: 0
alice status: 0
bob status: 0
eve started: false
private signing input bytes: 32
private signing input sha256: 014d8d2c20e1e41e1e012d562f3c0f70c773d559e491e9b57ee20075cb739e4a
aggregate signature bytes: 64
aggregate signature sha256: ba54761340ff4fe7a163cf4f1df6c015533a7e5a85044058cdb0d6e94c2f912d
```

Boundary: the live smoke signed a private 32-byte smoke input because current P0-003 PCZT artifacts produce zero shielded SIGHASH lines. It does not yet satisfy transaction-completion-ready PCZT-bound signing.

### Claim Now Allowed

```text
ZecSafe has a fixed-runner FROST-session gate that can record public-safe threshold and aggregate-signature verification evidence, and the pinned DKG group completed a live A+B signing run with Eve offline.
```

### Claim Still Forbidden

```text
ZecSafe has not yet produced a live aggregate signature over a real shielded PCZT SIGHASH, used that signature to complete a PCZT, proven/combined a funded PCZT, broadcast a transaction, created zecsafe-proof-v1, or implemented make judge-proof.
```

### Judge-proof Impact

```text
FROST session evidence can now be replayed as public-safe ProofEvent v1 data, linking selected public fingerprints, signer reviews, signing-context SIGHASH fingerprint, session fingerprint, and aggregate verification status.
```

### Public-safe Evidence Emitted

```text
group fingerprint
threshold
participant total
selected public fingerprints
unavailable participant count
session fingerprint
SIGHASH fingerprint
aggregate signature fingerprint
signature byte length
threshold status
aggregate verification status
checked field statuses
FROST_SESSION ProofEvent v1
```

### Private Material Intentionally Excluded

```text
FROST participant configs
contact tokens
TLS private keys
signing shares
nonces
randomizers
raw SIGHASH
raw aggregate signature
raw PCZT
wallet database
spending keys
viewing keys
logs with protocol transcript material
```

### Negative/Tamper Case

```text
only A selected -> THRESHOLD: UNSATISFIABLE, FROST SESSION: NOT_STARTED
review blocked -> session BLOCKED
SIGHASH fingerprint mismatch -> session BLOCKED
aggregate signature byte-length mismatch -> aggregate signature FAIL
threshold greater than participant count -> rejected
raw signature/message fields excluded from public output
```

### Acceptance Criteria

- [x] Fixed runner implements `frost.session.start`.
- [x] C unavailable is represented by selected A+B public fingerprints and unavailable count.
- [x] Threshold satisfiability is enforced.
- [x] Signer review PASS records are required.
- [x] Signing-context SIGHASH fingerprint is linked to FROST session evidence.
- [x] Session fingerprint emitted.
- [x] Aggregate signature status and 64-byte length are enforced.
- [x] One-signer negative proof emits `THRESHOLD: UNSATISFIABLE` and `FROST SESSION: NOT_STARTED`.
- [x] Live A+B FROST smoke produced a 64-byte aggregate signature with Eve offline.
- [x] Raw shares, nonces, randomizers, raw SIGHASH, and raw signature are excluded from public evidence.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

Boundary not satisfied:

```text
The live signature is not yet over a real shielded PCZT SIGHASH because no such funded/shielded PCZT artifact exists in the current workspace.
```

## ZSAFE-P0-014 - Signed, Proven, Combined PCZT

Status: `ZSAFE-P0-014` complete.

Completed UTC: `2026-07-11T18:52:00Z`.

### Outcome

ZecSafe resolved the PCZT input boundary by funding a FROST-controlled testnet unified address derived from the existing RedPallas DKG group public key. The live run created a real Ironwood source PCZT, extracted the PCZT SIGHASH through the pinned PCZT signer-library path, produced a live A+B FROST aggregate signature with Eve offline, applied that signature to the PCZT, created proofs separately, combined the signed and proven PCZTs, re-ran binding, and stopped before broadcast.

### Gate Added

```text
module: src/pczt-completion-v1.mjs
CLI: scripts/pczt-complete.mjs
test: scripts/pczt-completion-v1.test.mjs
package alias: npm run pczt:complete
test alias: npm run test:pczt-complete
schema: zecsafe-pczt-completion-v1
fixed-runner operations implemented: pczt.sign.complete, pczt.prove, pczt.combine
proof event stage: PCZT_COMBINE
```

The PCZT inspect adapter was also extended to parse V6/Ironwood action output and model unreported non-recipient outputs as change.

### Live External Run

External run:

```text
$HOME/.zecsafe/runs/p0-014-20260711T183213Z
```

Funding proof:

```text
source: Fauzec Zcash testnet faucet direct API
request_id: 01KX977K8G59R5EZGGR21JBVFG
txid: d8b6f151c2265a40fc7c5ee42313b84ae494018157f257a5a60c2c353ddb697a
mined_height: 4160374
amount: 1.00000000 TAZ
```

Source and completion artifacts:

```text
source PCZT sha256: 7d494c53178afbd39c50dafedd5d2755681d02d49bd95918847ae672382a2789
source inspect sha256: 6b3f8edf8fc34d92a2ac9cae3ae4fe767d74f20a779ae220082c57b2e139fd33
shielded SIGHASH bytes: 32
shielded SIGHASH sha256: 855d695441fd87747ebf92109b041fe88adff8a539f9850901ed5f5c1d6e60e3
aggregate signature bytes: 64
aggregate signature sha256: 6752d1b0eae9fc190848545a1b7868e3dd78a3e3883208c3620d17a78acfd231
signed PCZT sha256: 01730fc518d4a83ae6a6172e714650feebc0a0d3b5851ddd6bf8b28529ac85ce
proven PCZT sha256: 4e4518d785ed027da3adaae6a4b381b92e5e5c8b314900f2bdc14baabefda0f0
combined PCZT sha256: 2eb89c4c78bc11eff300ea9362fb771960658d643d97f3e8b14bc5e27938f54f
offline extracted txid: 1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b
broadcast status: NOT_BROADCAST
```

Completion gate output:

```text
SIGNED_PCZT                 PASS
PROVEN_PCZT                 PASS
PCZT_COMBINE                PASS
FINAL BINDING               PASS
BROADCAST                   NOT_BROADCAST
FINAL PCZT                  sha256:2eb89c4c78bc11eff300ea9362fb771960658d643d97f3e8b14bc5e27938f54f
```

### Claim Now Allowed

```text
ZecSafe completed a real funded testnet Ironwood PCZT through signing, proving, combining, final binding, and offline extraction, using a live A+B FROST aggregate signature over the PCZT SIGHASH with Eve offline.
```

### Claim Still Forbidden

```text
ZecSafe has not broadcast this transaction, has not produced a mainnet spend, has not implemented zecsafe-proof-v1, and has not implemented the one-command judge verifier.
```

### Judge-proof Impact

```text
The proof kernel can now link intent binding, real PCZT SIGHASH fingerprint, FROST aggregate signature fingerprint, signed PCZT fingerprint, proven PCZT fingerprint, combined PCZT fingerprint, final binding PASS, and an explicit non-broadcast gate.
```

### Public-safe Evidence Emitted

```text
source PCZT fingerprint
source binding report ref
final binding report ref
SIGHASH fingerprint
aggregate signature fingerprint
signature byte length
signed PCZT fingerprint
proven PCZT fingerprint
combined PCZT fingerprint
offline extracted txid
completion check statuses
broadcast gate status
PCZT_COMBINE ProofEvent v1
```

### Private Material Intentionally Excluded

```text
UFVK
wallet database
FROST participant configs
contact tokens
TLS private keys
signing shares
nonces
randomizers
raw SIGHASH
raw aggregate signature
raw PCZT bodies
raw extracted transaction material
logs with protocol transcript material
```

### Negative/Tamper Case

```text
mock signature source -> signed PCZT FAIL
63-byte signature -> FROST signature and signed PCZT FAIL
corrupt signed PCZT status -> signed PCZT FAIL
corrupt proven PCZT proof status -> proven PCZT FAIL
mismatched signed/proven pair -> PCZT combine FAIL
raw/private fields in completion package -> rejected
Ironwood malformed output line -> PCZT inspect rejected
unreported change outputs -> modeled as change, not treated as recipient payments
```

### Acceptance Criteria

- [x] Real funded FROST-controlled Ironwood PCZT created.
- [x] Real shielded PCZT SIGHASH fingerprint extracted from the PCZT signer path.
- [x] A+B FROST session produced a 64-byte aggregate signature over that SIGHASH with Eve offline.
- [x] Signed PCZT produced by applying the FROST aggregate signature.
- [x] Proven PCZT produced separately.
- [x] Signed and proven PCZTs combined.
- [x] Combined PCZT passed final binding verification.
- [x] Offline extraction produced txid `1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b`.
- [x] Broadcast gate remained `NOT_BROADCAST`.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

## ZSAFE-P0-015 - zecsafe-proof-v1

Status: `ZSAFE-P0-015` complete.

Completed UTC: `2026-07-11T22:35:59Z`.

### Outcome

ZecSafe implemented the public proof bundle and verifier layer:

```text
module: src/zecsafe-proof-v1.mjs
CLI: scripts/zecsafe.mjs
test: scripts/zecsafe-proof-v1.test.mjs
schema doc: docs/proof/zecsafe-proof-v1.schema.json
trust model: docs/proof/TRUST_MODEL.md
proof spec: PROOF_SPEC.md
fixture: fixtures/proofs/p0-014-zecsafe-proof-v1.json
make targets: judge-proof, judge-proof-tamper
fixed-runner operations implemented: proof.generate, proof.verify
```

Generated P0-014 public proof:

```text
bundle hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
network: test
FROST policy: 2 of 3
unavailable participants: 1
selected signers: 2
intent to PCZT: PASS
threshold reached: PASS
transaction txid: PRESENT
broadcast status: NOT_BROADCAST
```

### Verifier Output

```text
Schema                       PASS
Bundle hash                  PASS
Network                      test
FROST policy                 2 of 3
Unavailable participants     1
Selected signers             2
Intent to PCZT               PASS
Threshold reached            PASS
Transaction txid             PRESENT
Recorded run integrity       PASS

VERDICT: VERIFIED RECORDED ZECSAFE PROOF
```

### Judge-proof Impact

```text
ZecSafe now has the public artifact judge-proof verifies: schema-constrained proof JSON, canonical bundle hash, no-wallet verifier, and required semantic tamper rejection.
```

### Public-safe Evidence Emitted

```text
canonical proof hash
schema validation result
verifier result
network
run id
vault group fingerprint
threshold and participant count
available and unavailable counts
intent commitment
PCZT fingerprints
binding report refs
binding check statuses
selected public signer fingerprints
FROST session fingerprint
aggregate signature fingerprint
signature byte length
offline extracted txid
broadcast status
toolchain commits
limitations
tamper rejection result
```

### Private Material Intentionally Excluded

```text
recipient address
payment amount
memo text
raw PCZT bodies
raw SIGHASH
raw aggregate signature
FROST participant configs
FROST shares
contact tokens
TLS private keys
wallet database
UFVK or viewing keys
spending keys
protocol transcript logs
```

### Negative/Tamper Case

```text
txid mutation -> rejected
threshold mutation -> rejected
group fingerprint mutation -> rejected
selected signer mutation -> rejected
intent commitment mutation -> rejected
PCZT fingerprint mutation -> rejected
binding status mutation -> rejected
unsupported public proof field -> rejected
private/policy-excluded public proof material -> rejected
```

### Claim Now Allowed

```text
ZecSafe can generate and verify a public, tamper-evident zecsafe-proof-v1 bundle for the recorded P0-014 pre-broadcast proof, including canonical hash verification and semantic tamper rejection.
```

### Claim Still Forbidden

```text
ZecSafe has not broadcast this transaction, has not produced a mainnet spend, has not replaced the app UI/server proof-bundle route with zecsafe-proof-v1, and has not produced the final mainnet judge fixture.
```

### Acceptance Criteria

- [x] `zecsafe-proof-v1` module implemented.
- [x] Public/private field projection enforced.
- [x] Bundle hash implemented as SHA-256 over canonical proof without `bundle_hash`.
- [x] Verifier implemented independent of the main UI.
- [x] Secret/policy-excluded material scanner implemented for public bundles.
- [x] `zecsafe proof generate`, `zecsafe proof verify`, and `zecsafe proof tamper-demo` implemented through `scripts/zecsafe.mjs`.
- [x] Fixed runner implements `proof.generate` and `proof.verify`.
- [x] `make judge-proof` verifies the P0-014 public proof fixture.
- [x] `make judge-proof-tamper` rejects all required semantic mutations.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

## ZSAFE-P0-016 - Dry-Broadcast Proof Run

Status: `ZSAFE-P0-016` complete.

Completed UTC: `2026-07-11T22:54:50Z`.

### Outcome

ZecSafe implemented the headless dry-broadcast proof-run layer:

```text
module: src/proof-run-v1.mjs
CLI: scripts/zecsafe.mjs proof-run --dry-broadcast
test: scripts/proof-run-v1.test.mjs
fixture: fixtures/proof-runs/p0-016-dry-broadcast-proof-run.json
make target: make proof-run-dry
package alias: npm run proof:run
schema: zecsafe-proof-run-v1
```

The command verifies the existing P0-014 public proof bundle before it emits a dry-run result. It does not fund a wallet, does not open private wallet material, and does not broadcast a Zcash transaction.

Generated P0-016 dry-run proof:

```text
mode: dry-broadcast
status: PASS
recorded_at: 2026-07-11T22:52:30.000Z
proof_bundle_hash: sha256:e3e8862fa44b010721cb40fdaaf241a98b12729b2e798fdeb0274a4183effa3e
proof_run_ref: sha256:dcfa154cd662bb4e23a85f8e5977caae82f394f695b169d65466e12fea6a8048
broadcast approval: WAIT
```

### Required Output

```text
[PASS] Toolchain pinned
[PASS] View-only wallet available
[PASS] Intent commitment created
[PASS] PCZT created
[PASS] Intent ↔ PCZT binding
[PASS] Participant C unavailable
[PASS] Threshold satisfiable 2/3
[PASS] A+B selected
[PASS] FROST threshold reached
[PASS] Aggregate signature verified
[PASS] Signed PCZT
[PASS] Proven PCZT
[PASS] Combined PCZT
[WAIT] Mainnet broadcast requires human approval
[PASS] Pre-broadcast proof generated
```

`View-only wallet available` is a public status carried from the recorded P0-014 proof evidence. P0-016 itself did not create, fund, open, or export any wallet.

### Judge-Proof Impact

This task closes the plan gate that required the whole headless proof kernel to work before mainnet funding. The dry-run fixture demonstrates the full public proof sequence through pre-broadcast proof generation while preserving a hard human approval gate before broadcast.

### Public-Safe Evidence Emitted

```text
dry-run schema version
mode and status
source proof run id
proof bundle hash
proof reference hash
toolchain commit fingerprints
intent commitment
PCZT fingerprints
binding report references
participant availability summary
selected signer labels and public fingerprints
FROST threshold and aggregate signature status
aggregate signature fingerprint and byte length
signed/proven/combined PCZT statuses and fingerprints
offline extracted txid
mainnet broadcast approval WAIT
proof-run reference hash
limitations
```

### Private Material Intentionally Excluded

```text
mainnet wallet seed
spending key
UFVK or viewing keys
wallet database
recipient address
payment amount
memo text
raw PCZT bodies
raw SIGHASH
raw aggregate signature
FROST participant configs
FROST shares
nonces
randomizers
contact tokens
TLS private keys
protocol transcript logs
```

### Negative/Tamper Case

```text
source proof must verify before dry-run PASS
broadcasted transaction status -> rejected for dry-broadcast
unknown view-only wallet status -> rejected
wrong step sequence -> rejected by tests
missing mainnet approval WAIT -> rejected by tests
```

### Claim Now Allowed

```text
ZecSafe can run the complete headless dry-broadcast proof sequence through pre-broadcast proof generation, with mainnet broadcast held at explicit human approval WAIT.
```

### Claim Still Forbidden

```text
ZecSafe has not funded a dedicated mainnet demo wallet, has not broadcast a Zcash transaction, has not produced mainnet chain acceptance evidence, and has not produced the final mainnet judge fixture.
```

### Acceptance Criteria

- [x] `zecsafe-proof-run-v1` module implemented.
- [x] `zecsafe proof-run --dry-broadcast` repository-equivalent command implemented.
- [x] Required PASS/WAIT sequence emitted in order.
- [x] Dry-run command verifies the source proof first.
- [x] Dry-run rejects broadcasted proof status.
- [x] Mainnet broadcast remains explicit `WAIT`.
- [x] Public dry-run fixture generated.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

## ZSAFE-P0-017 - Mainnet Demo Wallet/Group

Status: `ZSAFE-P0-017` complete.

Completed UTC: `2026-07-11T23:14:41Z`.

### Outcome

ZecSafe created a dedicated disposable mainnet demo environment outside the repository:

```text
external run: $HOME/.zecsafe/runs/p0-017-20260711T231314Z
public fixture: fixtures/mainnet-demo/p0-017-mainnet-demo-env.json
schema: zecsafe-mainnet-demo-env-v1
status: READY_FOR_FUNDING_APPROVAL
network: main
funding_status: NOT_FUNDED
broadcast_status: NOT_BROADCAST
```

### Human Funding Gate

```text
Network: main
Orchard address: u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0
Group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
Threshold: 2
Participant count: 3
Wallet purpose: disposable tiny-value ZecSafe mainnet demo; not production custody
Recommended tiny funding amount: 0.0001 ZEC
Risk warning: Fund only disposable tiny mainnet ZEC after explicit approval; no production or personal funds; no broadcast is approved by this step.
```

### Group Setup

```text
setup mode: DKG
ciphersuite: redpallas
threshold: 2
participants: 3
public group key: df7823871b1ceb00632a60ba9cfe348ad5f2c14f36ebf27083873d37a0b32a26
group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
Alice DKG status: 0
Bob DKG status: 0
Eve DKG status: 0
same group key reported by all participants: true
```

### Mainnet Compatibility Recheck

```text
frost-tools commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
zcash-devtool commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
ZF FROST commit: 2016e44ba4a4757a996300350063b937a2ad33e8
chain_name: main
chain_tip_height: 3409081
server_uri: https://zec.rocks:443
address inspect: Network main, Unified Address, Orchard receiver
```

### Judge-Proof Impact

This task establishes the real mainnet funding target for the final proof run while preserving the funding boundary. The public record proves that the mainnet group/address exists before funds are sent and before any transaction can be broadcast.

### Public-Safe Evidence Emitted

```text
network
funding status
broadcast status
DKG setup mode
ciphersuite
public group key
group fingerprint
threshold and participant count
participant communication public fingerprints
Orchard-only unified mainnet address
view-only wallet initialization status
mainnet chain info
toolchain commits
human funding gate text
```

### Private Material Intentionally Excluded

```text
UFVK
wallet database
FROST participant configs
FROST shares
contact tokens
TLS private keys
seed phrases
spending keys
raw protocol logs
```

### Negative/Tamper Case

```text
wrong network -> funding gate invalid
non-DKG setup mode -> task claim invalid
threshold other than 2/3 -> task claim invalid
missing view-only wallet initialization -> task claim invalid
funding_status other than NOT_FUNDED -> P0-017 boundary violated
broadcast_status other than NOT_BROADCAST -> P0-017 boundary violated
UFVK or participant config in repo -> security scan violation
```

### Claim Now Allowed

```text
ZecSafe has a dedicated disposable mainnet demo group/address and view-only wallet ready for a tiny-value funding approval decision.
```

### Claim Still Forbidden

```text
ZecSafe has not funded the mainnet demo wallet, has not observed a funded mainnet balance, has not created a mainnet PCZT, has not broadcast a Zcash transaction, and has not produced final mainnet proof-run evidence.
```

### Acceptance Criteria

- [x] No meaningful personal funds used.
- [x] No production custody claim made.
- [x] Participant files remain outside repo.
- [x] Exact group setup mode recorded as DKG.
- [x] Network recorded as main.
- [x] Tool compatibility rechecked against pinned commits.
- [x] Mainnet server info observed.
- [x] Funding gate displayed.
- [x] Wallet remains `NOT_FUNDED`.
- [x] Broadcast remains `NOT_BROADCAST`.
- [x] Dedicated execution doc and `HANDOFF.md` updated.
- [x] `npm run check` passed.

## ZSAFE-P0-018 - View-Only Mainnet Synchronization and Balance

Status: `COMPLETE`.

Completed UTC: `2026-07-12T13:45:53.014Z`.

### Outcome

The dedicated mainnet UFVK/view-only wallet synchronized and observed the funded Orchard value:

```text
module: src/mainnet-view-v1.mjs
CLI: scripts/mainnet-view.mjs
test: scripts/mainnet-view-v1.test.mjs
fixture: fixtures/mainnet-demo/p0-018-view-only-preflight-funded.json
package aliases: npm run mainnet:preflight, npm run mainnet:watch
make targets: make mainnet-preflight, make mainnet-watch
schema: zecsafe-mainnet-view-preflight-v1
status: PASS
sync_status: SYNC_COMPLETE
observed_tip: 3409775
total_zatoshis: 20000
orchard_spendable_zatoshis: 20000
funded_value_observed: true
```

The earlier public explorer check proved only that the sender's shielded transaction was mined in block `3409633`. The completed UFVK scan now proves the missing local fact: this view-only wallet observes `0.00020000 ZEC` in its Orchard pool.

### Compatibility Resolution

The server returned `Unknown: unrecognized shielded protocol` inside the Ironwood subtree stream. A detached worktree at the official base commit applies a narrow patch that treats only that exact pre-Ironwood response as an empty future-pool result. Other errors remain fatal.

```text
official checkout status: clean
base commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
compat worktree: $HOME/.zecsafe/toolchain/zcash-devtool-p0-018-compat
patch: patches/zcash-devtool/p0-018-pre-ironwood-subtree-compat.patch
patch ref: sha256:4a44cfc533dec72fb4e93bcbf81406260d4b3f6e77344b53035426ab297c7d8e
binary ref: sha256:8e8e2110e80bb5ea92924e7300ddcf57cb58e7e4f2a0439404b5b59f836ba0b9
targeted Rust test: PASS
live mainnet sync: PASS
```

### Judge-Proof Impact

P0-018 now provides public-safe wallet-observed funding evidence, rather than relying on sender testimony or a public explorer that cannot disclose shielded recipients and amounts.

### Public-Safe Evidence Emitted

```text
network
wallet type
account id
birthday height
account source and purpose
Orchard-only unified mainnet address
mainnet address inspection result
observed tip height
balance observation status
funded value observation status
pool balance in zatoshis
coordinator workspace scan status
toolchain base commit, compatibility patch ref, and binary ref
preflight reference hash
```

### Private Material Intentionally Excluded

```text
UFVK value
UIVK value
wallet database contents
FROST participant configs
FROST shares
contact tokens
TLS private keys
seed phrases
spending keys
raw sync logs
```

### Negative/Tamper Case

```text
wrong network -> FAIL
non-view-only account purpose -> FAIL
missing birthday height -> FAIL
non-mainnet/non-Orchard address inspection -> FAIL
spend key detected in coordinator wallet workspace -> FAIL
participant share detected in coordinator wallet workspace -> FAIL
unfunded or unobserved balance -> WAIT_FUNDING, not PASS
different Ironwood server status/message -> sync failure, not compatibility bypass
```

### Claim Now Allowed

```text
ZecSafe completed P0-018: the dedicated mainnet UFVK/view-only wallet synchronized and observed 0.00020000 ZEC in its Orchard pool without exposing spending authority.
```

### Claim Still Forbidden

```text
ZecSafe has not created, signed, or broadcast the P0-019 mainnet transaction, and P0-018 does not authorize a spend.
```

### Acceptance Criteria

- [x] Mainnet sync completed above funding block `3409633`.
- [x] Funded value observed as `20000` Orchard zatoshis.
- [x] No spend key in coordinator wallet workspace.
- [x] No participant share in coordinator wallet workspace.
- [x] Compatibility patch is narrow, tested, fingerprinted, and reproducible.
- [x] Public fixture excludes private material.
- [x] No transaction created or broadcast by this task.

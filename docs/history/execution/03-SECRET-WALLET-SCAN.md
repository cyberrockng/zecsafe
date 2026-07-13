> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZecSafe Secret and Wallet-Artifact Scan

Status: `ZSAFE-W0-004` complete.

Updated UTC: `2026-07-11T03:50:10Z`

## Objective

Detect unsafe committed or local workspace material before creating any new Zcash wallet, PCZT, FROST participant, or proof-run artifacts.

This scan records only sanitized finding types and locations. No secret value, private key, mnemonic, viewing key, participant share, RPC password, wallet database, randomizer, or PCZT body is recorded here.

## Scan Scope

Inspected:

- tracked repository files;
- untracked workspace files, excluding `.git/` and `node_modules/`;
- `.gitignore`;
- the single committed history tree at `29a0e57d22d7`;
- current binary screenshot artifacts under `docs/screenshots/`;
- generated-artifact locations present in the repository.

Not present at scan time:

- `.env` or `.env.*` files in the repository workspace;
- `alice.toml`, `bob.toml`, or `eve.toml`;
- wallet databases;
- PCZT artifacts;
- demo log files;
- `dist/` or `coverage/`;
- `fixtures/`;
- local participant/wallet/run directories.

## Commands and Checks

Workspace inventory:

```bash
rg --files -uu -g '!.git/**' -g '!node_modules/**'
```

History inventory:

```bash
git rev-list --all --count
git log --oneline --all --decorate
```

Result:

```text
commit count: 1
history head: 29a0e57 Initial ZecSafe prototype
```

Hardened workspace scan:

```bash
npm run security:scan
```

Result:

```text
ZecSafe security scan passed.
```

Full project check after ignore-rule and scanner updates:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

Sanitized history scan:

```text
history_sanitized_findings=0
```

Screenshot artifact review:

```text
docs/screenshots/mainnet-monitor.png
docs/screenshots/recovery-flow.png
docs/screenshots/transaction-proof.png
docs/screenshots/vault-dashboard.png
```

Result:

```text
No mnemonic, spending key, full viewing key, FROST share, participant config, RPC password, wallet database, randomizer, or PCZT body was observed in the screenshots.
The screenshots contain public/demo UI data such as a transparent address, a txid, placeholder viewing-key prefixes, and prototype copy.
```

## Findings

No known live secret was found in tracked files, untracked workspace files, or the single committed history tree.

No wallet artifact was found in the repository workspace.

No participant config was found in the repository workspace.

No PCZT artifact was found in the repository workspace.

No demo log file was found in the repository workspace.

No proof fixture exists yet. Future proof fixtures must be redacted before they enter the repository.

## Reviewed False Positives

An initial broad scanner flagged generic `*KEY*`, `*USER*`, and `*PASSWORD*` assignments in source and documentation. Those hits were reviewed by key name and sanitized value class only.

Classified as non-live:

- README RPC examples use placeholders.
- `scripts/start-zecsafe-local-rpc.ps1` reads the RPC password from an external WSL file and sets an environment variable at runtime.
- `server.mjs` references RPC environment variables and accepts user-supplied viewing keys at runtime.
- FROST demo scripts contain output object keys such as `groupPublicKey` and `keyShares`, not committed participant share material.
- `src/app.js` contains browser key object names and storage keys, not committed private key material.

The actual RPC password file path referenced by the PowerShell helper is outside the repo:

```text
/root/.zcash/zecsafe-rpc-password.txt
```

That external file was not copied, printed, or recorded.

## Required External Workspace

All private wallet, participant, toolchain, and run artifacts must live outside the repository.

Default platform-aware root:

```text
POSIX / WSL / macOS: ~/.zecsafe/
Windows: %USERPROFILE%\.zecsafe\
```

Required subdirectories:

```text
~/.zecsafe/
├── participants/
├── wallets/
├── runs/
└── toolchain/
```

Cross-platform product code must not hardcode the POSIX path. Later implementation should resolve this through a platform-aware helper or an explicit environment variable such as `ZECSAFE_WORKSPACE_ROOT`.

## Ignore Rules Added

`.gitignore` now blocks accidental repository entry for:

```text
logs/
.zecsafe/
zecsafe-private/
participants/
wallets/
runs/
toolchain/
alice.toml
bob.toml
eve.toml
*.pczt
*.pczt.json
*.wallet
wallet.dat
wallet.db
*.sqlite
*.sqlite3
*.db
*.ufvk
*.fvk
*.uview
*frost-share*
*frost-secret*
```

Existing ignored patterns already covered:

```text
node_modules/
*.log
.env
.env.*
dist/
coverage/
```

## Tooling Changes

`scripts/security-scan.mjs` now scans the whole repository workspace, not only tracked files. It still excludes `.git/`, `node_modules/`, and binary file content, and it reports only sanitized file-level findings.

It now checks for:

- environment files in the workspace;
- participant config filenames;
- wallet database filenames;
- PCZT artifacts;
- log artifacts;
- private runtime directories accidentally created inside the repo;
- common API token formats;
- private key blocks;
- Zcash viewing-key and spending-key patterns;
- mnemonic assignments;
- FROST secret-share and randomizer assignments;
- concrete Zcash RPC password assignments.

## Acceptance

- [x] No known live secret in tracked files.
- [x] No known live secret in untracked workspace files.
- [x] No known live secret in committed history.
- [x] Participant configs are absent from the repo and must be created outside it.
- [x] Wallet workspaces are absent from the repo and must be created outside it.
- [x] No proof fixtures exist yet; future fixtures must be redacted.
- [x] Ignore patterns were updated for private wallet/FROST/PCZT/run artifacts.

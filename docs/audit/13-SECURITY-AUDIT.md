# 13 — Security Audit

## ZAUD-1500 — Secret scan: **PASS**

| Surface | Method | Result |
|---|---|---|
| Tracked files | `git ls-files` + pattern scan for `.pem`/`.key`/wallet/`.toml`/contact/mnemonic/seed | **CLEAN** — only `docs/execution/03-SECRET-WALLET-SCAN.md` (a report, not a secret) |
| Git history | walked blobs via `git rev-list --all --objects` + `git cat-file`, matched PEM private-key headers, `secret_share` hex, `mnemonic` phrases | **CLEAN** — zero hits |
| Public fixtures | `fixtures/verified-mainnet-run/{proof,events.public}.json` scanned for address-like (`t1`/`t3`/`zs1`/`u1`+20), key-like, and hex-secret **values** (not field names) | **CLEAN** |
| Repo scanner | `npm run security:scan` | **PASS** |
| `.gitignore` | covers `.zecsafe/`, `runs/`, `wallets/`, `*.wallet`, `wallet.dat`, `wallet.db`, `.env*` | **ADEQUATE** |

The only occurrences of `randomizer` in `proof.json` are inside the `limitations[]` array, in sentences stating the randomizer is **excluded** from public evidence. Per V3 ZAUD-1303, field names and classification labels are not disclosure. Distinguishing labels from values was applied throughout; no underlying recipient address, amount, memo, key, or share value appears in any public artifact.

`HANDOFF.md` *describes* which external directories contain secret material (shares, TLS keys, randomizers, wallet DBs, UFVKs) and instructs that they be kept outside the repository. It contains no secret values. This is correct practice, not a leak.

**Level B secret handling:** participant configs (`configs/*.toml`), TLS private keys, and the `randomizers/` directory were **not read** during this audit. Their existence and classification only are recorded, in an external manifest outside Git.

---

## SEC-001 — Server binds to all interfaces while claiming localhost

```text
Finding ID:       SEC-001
Severity:         P1
Area:             Server / network exposure
Status:           OPEN
Confidence:       CONFIRMED
Evidence level:   A_PUBLIC

Claim:            server.mjs:854 logs "ZecSafe listening on http://127.0.0.1:${port}".
                  V3 ZAUD-1501 requires "localhost binding".
Observed:         server.mjs:853 calls `server.listen(port, callback)` with NO host argument.
                  Node therefore binds all interfaces.
Evidence:         $ PORT=4890 node server.mjs
                  ZecSafe listening on http://127.0.0.1:4890
                  $ ss -tlnp | grep 4890
                  LISTEN 0 511 *:4890 *:*
                  ^^^ bound to *, not 127.0.0.1
Reproduction:     Start the server; run `ss -tlnp`. Reachable from any host on the LAN.
Impact:           The operator is told the surface is loopback-only while it is in fact exposed
                  to the local network. Compounding SEC-002, this publishes the repository —
                  including .git — to the LAN. During a hackathon this typically means a shared
                  conference/hotel Wi-Fi network. It also exposes POST /api/viewing-key-balance,
                  which is designed to receive a UFVK.
Attack path:      Attacker on the same L2 segment → http://<operator-ip>:4173/.git/ → full source
                  and history; → /HANDOFF.md → internal run chronology and local paths.
Preconditions:    Server running; attacker on the same network.
Required fix:     server.listen(port, "127.0.0.1", …)
Acceptance:       `ss -tlnp` shows `127.0.0.1:4173`; the log message becomes true.
Residual risk:    None once bound to loopback.
Retest:           Start server, assert bind address is 127.0.0.1.
```

## SEC-002 — Static document root is the repository root

```text
Finding ID:       SEC-002
Severity:         P2  (P1 in combination with SEC-001)
Area:             Server / information disclosure
Status:           OPEN
Confidence:       CONFIRMED
Evidence level:   A_PUBLIC

Claim:            The web surface should serve the application, not the repository.
Observed:         server.mjs:809/832 map any path onto rootDir. Confirmed at runtime:
                    GET /.git/HEAD               → 200
                    GET /.git/config             → 200
                    GET /server.mjs              → 200
                    GET /package.json            → 200
                    GET /HANDOFF.md              → 200
                    GET /docs/operator-notepad.md → 200
Impact:           Source, Git history, internal handoff chronology, and local machine paths are
                  served over HTTP. No secrets are in the repo (see ZAUD-1500), so this is
                  disclosure of already-public-on-GitHub material — EXCEPT that it also serves
                  the *uncommitted working tree*, which is not public.
Note:             Path traversal is correctly defended. staticFilePath() decodes, normalizes, and
                  strips leading `../`. Verified: `/../../../etc/passwd` → 404;
                  `/..%2f..%2f..%2fetc%2fpasswd` → 404. The weakness is the document root, not
                  the traversal guard.
Required fix:     Serve only an explicit allowlist: index.html, src/*, and
                  fixtures/verified-mainnet-run/*. Deny dotfiles and repository metadata.
Acceptance:       GET /.git/HEAD → 404; GET /HANDOFF.md → 404; /demo and the proof fixtures
                  still load.
Residual risk:    Low.
```

## SEC-003 — No security headers on the local web surface

```text
Finding ID:       SEC-003
Severity:         P3
Area:             Web hardening
Status:           OPEN
Confidence:       CONFIRMED
Evidence level:   A_PUBLIC
Observed:         Response headers on GET / are Content-Type, Date, Connection, Keep-Alive only.
                  No Content-Security-Policy, X-Content-Type-Options, Referrer-Policy, or frame
                  restrictions.
Impact:           Low for a loopback prototype with no authentication and no session. Raised only
                  because the app renders user-controlled strings (proposal title, recipient,
                  memo, txid) and V3 ZAUD-1505 requires the check.
Required fix:     Add CSP (`default-src 'self'`), X-Content-Type-Options: nosniff,
                  Referrer-Policy: no-referrer, X-Frame-Options: DENY.
```

## ZAUD-1501 — Local runner: **PASS**

`src/fixed-runner-v1.mjs` + `scripts/fixed-runner-v1.test.mjs` (in `npm run check`, passing). Architecture confirms the required properties: fixed operation allowlist, argument **arrays** (no shell string interpolation — `spawn(process.execPath, [scriptPath], …)`, `server.mjs:655`), per-run workspace, path containment, redaction, and timeout. `server.requestTimeout = 15s`, `headersTimeout = 16s`. No shell injection path found: no `exec`/`execSync` with interpolated user input.

## ZAUD-1502 — Authorization boundaries: **PASS with one caveat**

- Web app cannot invoke arbitrary local commands — **PASS** (fixed allowlist).
- Hosted deployment cannot access participant shares — **PASS / NOT_APPLICABLE** (`NOT_DEPLOYED`; shares live outside the repo under `/home/dell/.zecsafe/runs/`, gitignored).
- Mainnet broadcast requires a local human gate — **PASS, CONFIRMED at Level B.** `make proof-run-dry` halts at `[WAIT] Mainnet broadcast requires human approval`. The real broadcast (p0-023) was a separate, explicitly approved step; `broadcast-attempt-utc.txt` and `send-exit.txt` record it as a discrete human action.
- **Caveat:** the coordinator/server surface is exposed beyond loopback (SEC-001), which weakens every boundary above in practice, even though none of them is directly breakable.

## ZAUD-1503 — Denial of service

`frostd` is not exposed by the product; it runs locally during a ceremony with TLS material generated per run (`p0-021/tls/`). `NOT_APPLICABLE_WITH_REASON` for public rate-limiting/reverse-proxy requirements: there is no hosted deployment. Request timeouts are set on the local server.

## ZAUD-1504 — Integrity: **PASS**

Tamper detection is enforced cryptographically, not by convention. `make judge-proof-mainnet-tamper` mutates and **rejects** all seven: `txid`, `threshold`, `group_fingerprint`, `selected_signer`, `intent_commitment`, `pczt_fingerprint`, `binding_status`. Substitution of any evidence field invalidates the canonical bundle hash.

## ZAUD-1506 — Supply chain and CI

| Check | Result |
|---|---|
| Node/Rust versions match docs | **PARTIAL** — CI (`.github/workflows/verify.yml`) pins `node-version: 20`; the audit ran Node v24.16.0. Both pass. Document the supported range. |
| Lockfile | **NOT_APPLICABLE_WITH_REASON** — `package.json` declares zero `dependencies` and zero `devDependencies`. Nothing to lock. This is a genuine strength: the entire attack surface is Node's standard library. |
| GitHub Actions pinned | **P3** — `actions/checkout@v4`, `actions/setup-node@v4` pinned by tag, not commit SHA. Acceptable under most risk policies; note it. |
| External FROST/Zcash repos at documented commits | **PASS — CONFIRMED.** `proof.json.toolchain` matches `docs/execution/05-TOOLCHAIN-PINS.md` exactly: frost-tools `7d33a95f…3293`, zcash-devtool `1b065594…c46c`, pczt signer library (librustzcash rev) `8e6864a3…2b02`. |
| Compatibility patch recorded | **PASS** — `patches/zcash-devtool` present; librustzcash rev recorded at `05-TOOLCHAIN-PINS.md:110`. |
| No result relies on a floating branch | **PASS** — every toolchain reference is a commit SHA. |

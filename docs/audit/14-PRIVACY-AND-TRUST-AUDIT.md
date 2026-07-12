# 14 — Privacy and Trust Model Audit

## Required disclosures

| Disclosure | Present? | Where |
|---|---|---|
| Coordinator may learn transaction information | **YES** | `SECURITY.md`, `PRIVACY.md`, `docs/proof/TRUST_MODEL.md` |
| Participant signers may link the signing operation to a transaction | **YES** | `SUBMISSION.md:91` names "signer linkability" explicitly |
| Network privacy is not automatically solved | **YES** | `SUBMISSION.md:91` names "network privacy limits" |
| UFVK/viewing-key access is sensitive | **YES** | `PRIVACY.md` classification; `proof.json.limitations[1]` lists UFVK among withheld material |
| Public proof bundle intentionally withholds private payment details | **YES** | `proof.json.limitations[0]`: only "fingerprints, statuses, counts, tool commits, limitations, and transaction observation status" |
| Local private audit export may reveal details | **YES** | Level B run directories are documented as private and gitignored |
| Replay fixture is a public-safe projection | **YES** | enforced by `npm run test:proof-data` (green) |
| Chain evidence and signing-session evidence are different | **YES** | `SUBMISSION.md:53` |

## ZAUD-702 — Forbidden privacy claims: **PASS**

Searched for each. **None are made:**

- ❌ "coordinator learns nothing" — not claimed; the opposite is disclosed.
- ❌ "signers cannot link signing to transaction" — not claimed; linkability is disclosed.
- ❌ "FROST provides network anonymity" — not claimed.
- ❌ "proof bundle is zero-knowledge" — not claimed. It is described as a *privacy-preserving projection*, which is accurate: it withholds values and publishes fingerprints. That is redaction, not zero-knowledge, and the project does not confuse the two.

## Privacy failure conditions

| P0/P1 condition | Present? |
|---|---|
| recipient/amount/memo exposed without purpose | **NO** — zero underlying values in public artifacts (13-SECURITY-AUDIT ZAUD-1500) |
| UFVK exposed carelessly | **NO in artifacts.** But see below. |
| proof claims zero knowledge without proof | **NO** |
| product claims FROST provides network anonymity | **NO** |
| coordinator described as unable to view transaction data | **NO** |
| private audit export uploads automatically | **NO** — no upload path exists |

### PRIV-01 (P2) — The viewing-key form is a privacy hazard in context

`POST /api/viewing-key-balance` (`server.mjs:762`) invites the operator to paste a **UFVK** into a web form. A UFVK grants full visibility of a shielded wallet's transaction history — `PRIVACY.md` correctly classifies it as sensitive.

The endpoint is dead in the final stack (it requires a local `zcashd`, which is absent; README:61 concedes the fallback). But it is still live, still reachable, and — per SEC-001 — the server is bound to **all interfaces**, not loopback. A UFVK pasted into that form travels to a server process listening on the LAN.

No UFVK has been leaked. This is a latent hazard, not a realized breach. **Delete the endpoint and the form** (already the decision in `08-SERVER-API-SURVIVAL.md`), which removes the hazard entirely.

## ZAUD-700 — View-only / key boundary: **PASS**

| Check | Result |
|---|---|
| Wallet initialized from a UFVK | **PASS** — view-only mainnet wallet (p0-024 preflight; `docs/execution/24-VIEW-ONLY-MAINNET-PREFLIGHT.md`) |
| Wallet can sync/observe | **PASS** — light-client sync via zec.rocks; `wallet list-tx` observed the txid |
| Wallet cannot sign alone | **PASS** — signing required the FROST ceremony; the coordinator holds no share |
| No mnemonic / spending key in coordinator workspace | **PASS** — zero hits across tracked files and full Git history |
| No participant secret share in coordinator workspace | **PASS** — shares live only in `/home/dell/.zecsafe/runs/p0-021/configs/`, gitignored, and were **not read** by this audit |
| Coordinator has no spending authority | **PASS** — confirmed at Level B: the coordinator drives `frostd` and applies the aggregate; it cannot produce one alone |

## ZAUD-701 — Data classification: **PASS**

The three-tier classification (PUBLIC / LOCAL_PRIVATE / EPHEMERAL_SECRET) is not just documented — it is **enforced by a test**: `npm run test:proof-data` → *"ZecSafe public proof data-classification tests passed."*

| Tier | Items | Location |
|---|---|---|
| Public-safe | group fingerprint, threshold, participant fingerprints, intent commitment, PCZT fingerprints, txid, bundle hash | `fixtures/verified-mainnet-run/` ✅ |
| Local private | full intent, recipient, amount, memo, full PCZT, UFVK, wallet DB | `/home/dell/.zecsafe/runs/` — outside Git ✅ |
| Ephemeral secret | mnemonic, spending key, secret share, signer nonce, randomizer | `p0-021/configs/`, `p0-021/artifacts/randomizers`, `p0-021/tls/` — outside Git, **not read by this audit** ✅ |

**No ephemeral secret appears in Git, fixtures, build output, public API, browser bundle, logs, CI, screenshots, or the proof bundle.** This is the cleanest area of the project.

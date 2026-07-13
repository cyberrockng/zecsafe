> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 12 — Proof Bundle and Verifier Audit

## ZAUD-1300 — Schema: **PASS**

`schema_version: zecsafe-proof-v1`. Machine-readable JSON Schema at `docs/proof/zecsafe-proof-v1.schema.json`. Required fields enforced by `src/zecsafe-proof-v1.mjs` (`requireHash()` guards on every fingerprint field, `server.mjs`-independent). Unknown-field behavior and versioning covered by `scripts/zecsafe-proof-v1.test.mjs` (green). Public/private/secret distinction is enforced by a dedicated test suite — `npm run test:proof-data` → *"ZecSafe public proof data-classification tests passed."*

## ZAUD-1301 — Canonical bundle hash: **PASS — independently recomputed**

```text
bundle_hash = "sha256:" + SHA-256( canonicalizeJson( bundle_without_bundle_hash ) )
```

Implementation: `src/zecsafe-proof-v1.mjs:89`, using `canonicalizeJson()` from `src/intent-v1.mjs:215`. The auditor recomputed it independently and matched:

```text
Recorded:  sha256:e90c3c46ae1474d848d3cc20ef4157e52b151dddda2015c034f83ad31ee9cb64
Verified:  make judge-proof-mainnet → "Bundle hash  PASS"
```

The same canonicalization was used to independently reproduce both binding-report refs (`0bd48dfd…`, `d309efc2…`) from the raw Level B JSON — confirming the hashing scheme is genuinely deterministic and correctly applied, not merely self-consistent.

| Mutation | Expected | Observed |
|---|---|---|
| Property-order change | hash preserved | **preserved** (canonicalization sorts keys) |
| Whitespace change | hash preserved | **preserved** |
| Semantic mutation | hash invalidated | **invalidated** — all 7 tamper cases REJECTED |
| Field deletion | invalidated / schema fail | **detected** |
| Field addition | invalidated | **detected** |

## ZAUD-1302 — Evidence content: **PASS**

All required public-safe fields present: network, run ID, ZecSafe commit, toolchain commits (×3), group fingerprint, threshold, participant total, selected participant fingerprints, unavailable count, intent commitment, PCZT fingerprints (source/signed/proven/final), binding result + per-field checks, session fingerprint, threshold result, aggregate verification status, aggregate fingerprint, signature byte length, sighash fingerprint, txid, chain status, block height, confirmations, evidence refs, and an explicit `limitations[]` array.

**Missing:** `signer_review_mode`. See BIND-02 in `10-PCZT-AND-BINDING-AUDIT.md` (P1).

## ZAUD-1303 — Forbidden content: **PASS**

Programmatic scan of `proof.json` and `events.public.json` for **values**, not field names:

| Class | Method | Result |
|---|---|---|
| Address values | regex `\b(t1\|t3\|zs1\|u1)[a-zA-Z0-9]{20,}` | **zero hits** |
| Key material | PEM headers, long hex secrets | **zero hits** |
| `mnemonic` / `spending_key` / `secret_share` with a value | key-with-value regex | **zero hits** |
| `randomizer` | 2 occurrences — **both inside `limitations[]`**, in sentences stating the randomizer is *excluded* from public evidence | **not disclosure** |
| Underlying recipient / amount / memo values | inspected | **absent** — only check *names* and statuses (`recipient: MATCH`) appear |

Per V3 ZAUD-1303, field labels and classification names are not disclosure. The audit distinguished labels from values throughout and tested for address-, key-, and amount-**like values** rather than relying on a blanket word search. **No secret appears in the proof bundle.**

The `limitations[]` array is, correctly, where the sensitive nouns appear — declaring what has been withheld:

> *"Raw PCZT bytes, raw SIGHASH, raw aggregate signature, action randomizer, UFVK, wallet database, and FROST shares are excluded from public evidence."*

## ZAUD-1304 — Verifier truth: **PASS (fresh public clone)**

```bash
$ git clone https://github.com/cyberrockng/zecsafe.git   # fresh, from the public remote
$ cd zecsafe && git rev-parse HEAD
707ced2e4e5a99f48e566dc003a05f8d492c10d6
$ make judge-proof-mainnet
```

```text
ZecSafe Judge Proof v1
Schema                       PASS
Bundle hash                  PASS
Network                      main
FROST policy                 2 of 3
Unavailable participants     1
Selected signers             2
Intent ↔ PCZT                PASS
Threshold reached            PASS
Transaction txid             PRESENT
Recorded run integrity       PASS

VERDICT: VERIFIED RECORDED ZECSAFE PROOF
exit 0
```

Confirmed: it reads `fixtures/verified-mainnet-run/proof.json`, reports `network: main`, and verifies the recorded mainnet txid and bundle hash. It required **no funded wallet, no mainnet broadcast, and no secret**. `npm run check` also passes in the fresh clone (exit 0). The regression target `make judge-proof` (earlier test-network, `NOT_BROADCAST` fixture) also passes and was **not** substituted for the mainnet targets.

## ZAUD-1305 — Tamper proof: **PASS**

```bash
$ make judge-proof-mainnet-tamper
```

```text
txid                     REJECTED
threshold                REJECTED
group_fingerprint        REJECTED
selected_signer          REJECTED
intent_commitment        REJECTED
pczt_fingerprint         REJECTED
binding_status           REJECTED

VERDICT: TAMPER DETECTION PASS
exit 0
```

All six required mutations (plus a seventh) are detected.

## ZAUD-1306 — Verifier limitations: **PASS**

`proof.json.limitations[]` states what the verifier does *not* prove, in the bundle itself — inside the hashed boundary. It correctly discloses that raw artifacts are withheld, that broadcast is human-gated, that the signature was verified by the signer library at apply time while **chain acceptance is proven only by the later approved broadcast**, and how the chain status was derived.

The verifier proves the public bundle's **schema, canonical integrity, and internal evidence consistency**. It does **not** re-execute FROST, regenerate the PCZT, inspect private participant state, or rebroadcast. Those provenance claims required Level B — which this audit performed and confirmed (see `11-MAINNET-EVIDENCE-AUDIT.md`).

## ZAUD-1400/1401/1402 — Recorded replay: **PASS**

| Check | Result |
|---|---|
| Replay fixture came from the real mainnet run | **PASS** — run ID `p0-023-20260712T145358Z`; every fingerprint matches Level B artifacts |
| Replay loads the exact tracked files, not a hand-authored duplicate | **PASS** — `src/app.js:153-154` reference `fixtures/verified-mainnet-run/proof.json` and `events.public.json`; fetched at `:3514-3515` |
| Bundle hash matches the canonical proof file | **PASS** |
| Recorded-run → freeze → submission lineage documented | **PASS** — `ad83269` → `0cd8aeb` → `707ced2` (see 01-BASELINE.md) |
| Labelled "Recorded", not "Live" | **PASS** — `grep -in "live run\|live signing\|live broadcast" src/app.js` → **zero hits**. 12 occurrences of "recorded". |
| Event-driven UI (not hardcoded animation) | **PASS** — `src/demo-proof-state.mjs` reduces state from `ProofEvent v1`. `scripts/demo-proof-state.test.mjs` (green) asserts: remove threshold event → no threshold success; remove txid → no broadcast success; remove chain observation → no observed state; remove confirmation → no confirmed state. |

**No hardcoded animation invents state.** This is a P0 in V3 and the project passes it cleanly.

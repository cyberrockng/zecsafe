> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 10 — PCZT and Binding Firewall Audit

The most important phase. ZIP 312-based signing must be tied to the transaction the participants intended to authorize.

## ZAUD-900 — PCZT creation: **PASS**

| Property | Value |
|---|---|
| Created from | view-only (UFVK) wallet workflow via pinned `zcash-devtool` `1b065594…c46c` |
| Network | `main` |
| Source PCZT fingerprint | `sha256:3823d5eb24c81262fbb8d7628c40d3b4d36bad8fc105fea2afdbca0b3cd12931` |
| Level B artifact | `p0-020/artifacts/source-mainnet.pczt` |
| Hash verification | `sha256sum source-mainnet.pczt` → `3823d5eb…2931` — **matches the public proof exactly** |
| Linked to run | `p0-020-20260712T141448Z` → carried into p0-021, p0-022, p0-023 |

## ZAUD-901 — PCZT inspection: **PASS**

Structured extraction is performed by `src/pczt-inspect-v1.mjs` against pinned `zcash-devtool` output (`p0-020/artifacts/source-mainnet.inspect.txt`). The parser is version-pinned and **fails closed**: `scripts/pczt-inspect-v1.test.mjs` (green in `npm run check`) covers unknown structure and missing fields, and rejects rather than defaulting.

## ZAUD-902 — Binding comparisons: **PASS, with one honest limitation**

`p0-020/artifacts/binding-report.json`, canonical hash `sha256:0bd48dfd…cbcb4` — **recomputed by the auditor and matched exactly** (the ref is `sha256(canonicalizeJson(report))`, not a raw file hash; verified via `src/intent-v1.mjs:215`).

Public `proof.json.pczt.checks`:

```text
source              PASS
network             MATCH
recipient           MATCH
amount              MATCH      (exact integer zatoshis)
fee_policy          PASS
memo_policy         LIMITED    ← honestly reported, not silently passed
unexpected_output   PASS
change_output       PASS
binding_status      PASS
```

`memo_policy: LIMITED` is exactly the behaviour V3 demands: the check is reported at its *actual* support level rather than being inflated to `MATCH`. Same for `source: PASS` — recorded per what the pinned inspect path actually exposes.

### The cryptographic-linkage caveat (V3 ZAUD-902, required)

> *Do not treat the PCZT parser's tool/source label as proof of FROST group membership.*

**Finding — BIND-01 (P1, disclosure gap):**

The Binding Firewall establishes a **semantic** match between reviewed intent and PCZT contents. It does **not**, by itself, prove that the FROST group key is the PCZT action's spend-authorization key. The PCZT inspection path does not expose a FROST group fingerprint, so that linkage cannot be read off the binding report.

The linkage nevertheless **does exist** and this audit confirmed it at Level B, through the signer/application path rather than through the inspector:

```text
p0-023/artifacts/completion-result-confirmed.json:
  completion_flow: "pczt-library-signer-apply-orchard-signature"
  signing_pool:    "orchard"

proof.json.limitations[4]:
  "The signer library verified the aggregate signature against the action's rerandomized
   verification key when applying it; chain acceptance is proven only by a later approved
   broadcast."
```

The pinned signer library (librustzcash rev `8e6864a3…`) **verified the aggregate signature against the action's rerandomized verification key at apply time**. Had the FROST group key not corresponded to the PCZT action's spend-authorization key, the apply step would have failed — and, downstream, Zcash consensus would have rejected the transaction. **The transaction was accepted and mined at height 3,409,837.** Chain acceptance of a shielded spend is itself proof that the spend authorization was valid for that action.

So the linkage is proven — by the signer library plus consensus — but it is **not** proven by the Binding Firewall, and the distinction is currently only visible to a reader who parses `limitations[4]` carefully. That sentence is accurate but it is doing a lot of load-bearing work quietly.

**Required correction:** state plainly, in `PROOF_SPEC.md` and `docs/proof/TRUST_MODEL.md`, that (a) the Binding Firewall is a *semantic* check, (b) the FROST-group-to-PCZT-authorization-key linkage is established by the pinned signer library's verification at apply time and confirmed by mainnet acceptance, and (c) a semantic Binding Firewall PASS does not by itself substitute for that cryptographic linkage.

## ZAUD-903 — Block behavior: **PASS**

Mismatch blocks signing. Evidence is not merely a code path — a tampered-intent run was actually executed:

```text
p0-020/artifacts/tampered-intent.json
p0-020/artifacts/tamper-binding-report.json
```

`src/pczt-bind-v1.mjs` + `scripts/pczt-bind-v1.test.mjs` (green) cover amount mismatch, recipient mismatch, network mismatch, unexpected recipient, memo mismatch where supported, fee-policy violation, malformed PCZT, and parser-version mismatch. On mismatch the pipeline yields:

```text
INTENT ↔ PCZT  = FAIL
SIGNING CONTEXT = NOT PREPARED
FROST SESSION   = BLOCKED
```

`frost-session-report.json` carries an explicit `blocked_operations: []` field — the block list is a first-class, recorded concept, not an implicit branch. **No fail-open path was found.** The demo's mismatch mode (`createBindingMismatchEvents`, `src/demo-proof-state.mjs`) derives the blocked state from the event log rather than hardcoding it, and is labelled `SAFETY TEST - recipient mismatch blocked signing.`

## ZAUD-904 — Signer review mode: **PARTIAL → P1**

**Actual mode: `semantic_pczt_review`.** Confirmed at Level B in both signer results:

```text
p0-021/artifacts/review-result-A.json → signer_review_mode: semantic_pczt_review, status: PASS, reviewer: A
p0-021/artifacts/review-result-B.json → signer_review_mode: semantic_pczt_review, status: PASS, reviewer: B
```

The project does **not** claim `independent_sighash`, and that restraint is correct and commendable. The public event log is admirably explicit:

> `events.public.json:69` — *"Signer review mode is semantic_pczt_review: the signer checks PCZT semantics and compares the prepared pinned-tool SIGHASH fingerprint; it does not claim an independently rerun SIGHASH."*

**Finding — BIND-02 (P1):** V3 ZAUD-904 requires that *"Documentation and proof bundle must state the real mode."*

- `events.public.json` — states it. ✅
- `proof.json` — **does not contain a `signer_review_mode` field at all.** ❌
- `PROOF_SPEC.md`, `docs/proof/TRUST_MODEL.md`, `SECURITY.md` — **zero occurrences** of `signer_review_mode` / `semantic_pczt_review`. ❌

A judge who runs `make judge-proof-mainnet` and reads `proof.json` — the canonical, hash-covered artifact — cannot see the review mode. It lives only in the companion event log. Since the bundle hash covers `proof.json`, the review mode is currently **outside the tamper-evident boundary**.

**Required correction:** add `signer_review_mode: "semantic_pczt_review"` to the `zecsafe-proof-v1` schema and to the recorded bundle, and document the mode and its limits in `PROOF_SPEC.md` and `TRUST_MODEL.md`. Note this changes the bundle hash — it must be regenerated from the recorded run, **not** hand-edited (V3 §1.2: never rewrite recorded evidence to make a finding disappear; regenerate from source artifacts, which are intact at Level B).

## Intent and canonicalization (ZAUD-800/801/802): **PASS**

| Check | Result |
|---|---|
| Intent schema, network, vault/group fingerprint, recipient, memo/fee policy | `src/intent-v1.mjs`; commitment `sha256:2bc6da15…09d7` |
| Amount in **integer zatoshis** | **PASS** — no floating-point internal accounting found |
| Amount safety (float, negative, zero, scientific notation, excessive, JS safe-integer boundary, bigint/string, duplicate conversion) | **PASS** — covered by `scripts/intent-v1.test.mjs`, green |
| Canonicalization documented, pinned, deterministic | **PASS** — `canonicalizeJson()` at `src/intent-v1.mjs:215`; the auditor independently recomputed both binding-report refs and the bundle hash with it and matched exactly |
| Mutation tests (amount, recipient, memo, fee, network, vault/group) | **PASS** — every relevant mutation changes the commitment; enforced by the tamper demo |

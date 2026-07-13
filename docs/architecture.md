# ZecSafe Architecture

ZecSafe is a FROST-native threshold authorization control plane for shielded Zcash. One
participant can be unavailable while a 2-of-3 threshold still authorizes the exact reviewed
transaction, and every run emits a tamper-evident public proof.

This document describes the product as it exists now. The earlier browser-guardian prototype
(guardian acknowledgement signatures, simulated broadcast, recovery center) was removed during
the audit remediation; its documentation is archived under `docs/history/`.

## The authorization pipeline

```text
intent  →  PCZT  →  Binding Firewall  →  signing context / shielded SIGHASH
        →  FROST session (A+B; C unavailable)  →  aggregate signature
        →  signed PCZT  →  proven PCZT  →  combined PCZT
        →  human approval  →  broadcast  →  txid  →  chain observation
```

Each stage is implemented as a schema-versioned module in `src/` with a CLI in `scripts/` and a
dedicated test suite:

| Stage | Module | Schema |
|---|---|---|
| Intent commitment | `src/intent-v1.mjs` | `zecsafe-intent-v1` |
| PCZT inspection | `src/pczt-inspect-v1.mjs` | pinned `zcash-devtool` output parser |
| Binding Firewall | `src/pczt-bind-v1.mjs` | `zecsafe-binding-report-v1` |
| Signer selection | `src/signer-selection-v1.mjs` | `zecsafe-signer-selection-v1` |
| Signing context | `src/signing-context-v1.mjs` | `zecsafe-signing-context-v1` |
| Signer review | `src/signer-review-v1.mjs` | `zecsafe-signer-review-v1` (`semantic_pczt_review`) |
| FROST session | `src/frost-session-v1.mjs` | `zecsafe-frost-session-v1` |
| PCZT completion | `src/pczt-completion-v1.mjs` | `zecsafe-pczt-completion-v1` |
| Proof bundle | `src/zecsafe-proof-v1.mjs` | `zecsafe-proof-v1` |
| Proof-run gates | `src/proof-run-v1.mjs` | `zecsafe-proof-run-v1` |
| Mainnet observation | `src/mainnet-view-v1.mjs` | `zecsafe-mainnet-view-preflight-v1` |

ZecSafe implements **no cryptography of its own**. FROST (re-randomized RedPallas), Orchard
proving, SIGHASH computation, and PCZT handling are delegated to pinned upstream tooling
(`frost-tools`, `zcash-devtool`, the librustzcash PCZT signer library — exact commits in the
README and the proof bundle). Real operations run through `src/fixed-runner-v1.mjs`, which
executes only an allowlisted set of operations with `shell: false`.

## Execution surfaces

**1. Local CLI (the real workflow).** `scripts/zecsafe.mjs` plus the per-stage CLIs drive real
runs. This path needs Rust, the pinned toolchain, participant configuration, and a funded
view-only wallet; private run artifacts live outside the repository (`~/.zecsafe/runs`). This is
the surface that produced the verified mainnet transaction.

**2. Local server (`server.mjs`).** A loopback-bound Node server that serves the same static app
locally and four API routes:

```text
GET  /api/health
GET  /api/mainnet/status        (public RPC chain status; configurable endpoint)
POST /api/transaction-proof     (txid → getrawtransaction/getblock observation)
POST /api/intent/create         (deterministic intent commitment)
```

It binds `127.0.0.1` by default, serves an explicit static allowlist (never the repository
root), and sets CSP/nosniff/referrer/frame headers.

**3. Hosted evidence page (Vercel).** `scripts/build-vercel.mjs` emits an exact allowlist of
static files (app, styles, the two recorded-run fixtures, and the browser verifier). There is no
backend, no API, and no key material. The page replays the recorded run, and its Tamper Lab
re-runs the proof verifier in the visitor's browser (`src/verify-browser.mjs`, pinned to the
authoritative verifier by `scripts/verify-browser.test.mjs`). The hosted page cannot spend funds
by design.

## Verification chain

- `make judge-proof-mainnet` verifies the recorded bundle's schema, canonical bundle hash,
  internal consistency, and — because the unkeyed hash alone cannot prove provenance — an
  **anchored expected hash** pinned in the Makefile.
- `make judge-proof-mainnet-tamper` demonstrates that a single edited byte is detected.
- `make proof-run-dry` re-verifies every recorded gate and halts at the human broadcast gate.
- `npm run check` runs the full guard: `scripts/verify.mjs` (structural and product-truth
  checks), all unit suites, syntax checks, the Vercel allowlist build, and a secret scan.

## Security boundaries

- No single participant can authorize alone; the recorded run completed with one signer absent.
- The Binding Firewall is a semantic intent-to-PCZT gate; the FROST-key-to-PCZT linkage is
  established by the signer library at apply time and by consensus, not by the firewall.
- Broadcast always requires explicit human approval.
- The public proof bundle is a redacted projection (fingerprints, statuses, counts) — recipient,
  amount, and memo are withheld from it; it is not a zero-knowledge proof.
- Full trust model: `docs/proof/TRUST_MODEL.md`, `SECURITY.md`, `PRIVACY.md`,
  `docs/threat-model.md`.

# 00 — Audit Scope

**Audit contract:** `ZECSAFE_REPO_GROUNDED_FINAL_AUDIT_PLAN_V3.md`
**Contract SHA-256:** `6aae8c432326fad9282541e1d5b41d6eb4d0f59cbebd5506aae40f1fec1f8ddc`
**Audit executed:** 2026-07-12 UTC
**Stage:** Stage 1 — evidence collection (read-only). No product code, documentation, fixture, txid, proof event, or proof bundle was modified.

## Evidence levels completed

```text
Level A public fresh-clone audit:            COMPLETE
Level B privileged local provenance audit:   COMPLETE
Private manifest hash: sha256:002000ab7c0c246b1d3c47bba27054088c3afb560def235d07609b546c417df5
Private manifest location: /home/dell/.zecsafe/audit/manifest-2026-07-12.json (outside Git)
```

Level B material was available at `/home/dell/.zecsafe/runs/` for run IDs `p0-020` through `p0-023`. Artifacts were hashed, not disclosed. Participant configs (`configs/*.toml`), TLS private keys, and the randomizer directory were **not read** — their existence and classification only are recorded.

## What this audit is

An independent, evidence-first reconstruction of ZecSafe's truth from repository state, source, pinned toolchain, local execution, generated artifacts, FROST session evidence, proof bundles, mainnet chain data, documentation, and tests.

## What this audit is NOT

- Not a formal cryptographic audit of upstream FROST, RedPallas, Orchard, Halo2, or Zcash consensus.
- Not a production custody certification.
- Not a guarantee against all implementation or operational vulnerabilities.
- Not a penetration test of infrastructure that is not deployed.
- Not proof that rerandomized FROST was covered by an upstream audit. **It was not.** The NCC audit of the ZF FROST repository did not cover rerandomized FROST.

## Scope limits carried into the final report

The verifier proves the public bundle's schema, canonical integrity, and internal evidence claims. It does not re-execute FROST, regenerate the PCZT, inspect private participant state, or rebroadcast. Those provenance claims were established separately at Level B in this audit and are labelled as such.

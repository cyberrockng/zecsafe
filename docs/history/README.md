# Historical Records

**These documents are historical evidence, not current product documentation.**

They record how ZecSafe was built and how the verified mainnet run was executed. They are retained for independent verification and reproducibility. Where they disagree with the current [`README.md`](../../README.md), [`SUBMISSION.md`](../../SUBMISSION.md), [`PROOF_SPEC.md`](../../PROOF_SPEC.md), or [`SECURITY.md`](../../SECURITY.md), **the current documents are authoritative.**

A judge does not need to read anything in this directory. Start at the repository [`README.md`](../../README.md).

## Contents

| File | What it is | Status |
|---|---|---|
| [`HANDOFF.md`](HANDOFF.md) | The authoritative operational chronology of the P0 execution gates, including the verified mainnet run (P0-018 → P0-024). The single best record of what was actually done, in what order, with which artifacts. | **Historical.** Absolute local machine paths have been replaced with placeholders (`<runs>`, `<repo>`, `<plans>`). |
| [`operator-notepad.md`](operator-notepad.md) | A private demo runbook written for the **superseded prototype**. Its "Winning Claim" and "start with Evidence Center" demo path describe a product that no longer exists. | **Superseded.** Retained only as a record. Use [`DEMO.md`](../../DEMO.md) instead. |
| [`roadmap.md`](roadmap.md) | Forward-looking plans. Not proof, and not part of the submission. | **Historical.** |

## Related

- [`docs/execution/`](../execution/) — the numbered execution gates (P0-001 … P0-024), each with its own evidence.
- [`docs/audit/`](../audit/) — the independent V3 audit, its findings, and the remediation record.

## Bundle-hash note

`HANDOFF.md` records the originally frozen proof bundle hash `sha256:e90c3c46…9cb64`. That bundle was later **regenerated from the same frozen run artifacts** to bring `signer_review_mode` inside the hash boundary and to fix a reproducibility defect. No evidence-bearing field changed. The current hash and the full explanation are in [`fixtures/verified-mainnet-run/README.md`](../../fixtures/verified-mainnet-run/README.md).

Historical records are not rewritten to match later corrections. They are annotated.

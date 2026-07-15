# ZecSafe Documentation

**If you are reviewing ZecSafe, you need five documents:**

1. [`../README.md`](../README.md) — what ZecSafe is, the verified mainnet run, and the
   60-second verification commands.
2. [`architecture.md`](architecture.md) — the authorization pipeline, module map, and the
   three execution surfaces (CLI, local server, hosted evidence page).
3. [`threat-model.md`](threat-model.md) and [`proof/TRUST_MODEL.md`](proof/TRUST_MODEL.md) —
   what is trusted, what is proven, and what is explicitly not claimed.
4. [`claim-to-code-matrix.md`](claim-to-code-matrix.md) — every product claim mapped to the
   code and evidence that backs it.
5. [`demo-script.md`](demo-script.md) — the exact demo walkthrough.

## Current documents

| File | Purpose |
|---|---|
| `architecture.md` / `architecture-diagram.md` | Current system design |
| `claim-to-code-matrix.md` | Claim-by-claim evidence map |
| `submission-gate.md` | Live submission blocker status |
| `discord-submission.md` | Ready-to-post Discord submission text |
| `demo-script.md` | Video/demo walkthrough |
| `frost-integration.md` / `frost-windows-setup.md` | FROST toolchain setup |
| `mainnet-integration.md` / `mainnet-readonly.md` | Mainnet observation boundaries |
| `threat-model.md`, `proof/` | Security and trust boundaries |
| `post-hackathon-roadmap.md` | Production roadmap after the hackathon proof of concept |
| `pr-checklist.md`, `submission-plan.md` | Submission process |
| `screenshots/` | Current product screenshots (`npm run screenshots`) |
| `ui-redesign/` | First-glance redesign verdict |

## Historical archive

[`history/`](history/README.md) holds the full development and audit ledger — the numbered
execution gates (P0-001…P0-024) that produced the verified mainnet run, the independent V3
audit with its findings and remediation record, and the operational handoff chronology. Every
archived file carries a banner; where an archived document disagrees with the current docs,
**the current documents are authoritative**. Nothing in the archive is required reading to
verify the product — but it is retained in full because a development log you can cross-examine
is part of the evidence.

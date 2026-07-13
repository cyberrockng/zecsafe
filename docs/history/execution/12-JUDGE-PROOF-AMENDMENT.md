> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-V3-001 - Judge-Proof Integration Amendment

Status: `ZSAFE-V3-001` complete.

Completed UTC: `2026-07-11T08:14:09Z`

## Scope

Create V3 of the Windows execution plan as a controlled amendment to V2.

V3 does not restart the project and does not change the proof-first FROST/mainnet mission. It adds one execution ideal:

```text
Judge-First Verifiability
```

Meaning:

```text
Anything ZecSafe claims must be independently checkable by a judge with one command,
without a wallet, without secrets, without trusting the UI, and without rerunning the
entire live signing ceremony.
```

## Plan Files

V2 remains the historical baseline:

```text
%USERPROFILE%\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
%USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V2.md
```

V3 is the active execution plan:

```text
%USERPROFILE%\Downloads\ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
%USERPROFILE%/Downloads/ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
```

## Product Values

The product values from this point forward are:

```text
Continuity After Failure
Transaction Truth Before Signing
Judge-First Verifiability
```

Operational promise:

```text
ZecSafe proves a Zcash team can still safely spend after signer failure,
and a judge can independently verify that the spend matched the reviewed intent.
```

## Protected Differentiators

The three protected differentiators remain unchanged:

1. Failure-on-screen continuity proof.
2. Intent-to-PCZT Binding Firewall.
3. Privacy-preserving FROST Proof Bundle plus one-command verifier.

Judge-First Verifiability is not a fourth feature. It is the acceptance filter for the remaining work.

## Competitor Lessons Adopted

Adopted as discipline:

- Z3 Launcher: one-command proof path.
- ZecAuth: formal protocol/spec and CLI verification style.
- ZShield: immediate demo packaging.
- ZEC-Bounties: real-life payment usefulness.
- ZyberQuest: visible Zcash mainnet climax.
- Banana Betting: blunt limitation language.

Explicitly not adopted as scope:

- node launcher;
- login/auth protocol;
- DID/OIDC provider;
- bounty workflow;
- game;
- betting product;
- generic dashboard.

## Remaining Task Evidence Contract

Every remaining completed task ledger entry must include:

```text
Judge-proof impact:
Public-safe evidence emitted:
Private material intentionally excluded:
Negative/tamper case:
Claim now allowed:
Claim still forbidden:
```

If a task cannot fill those fields, it is not ready to be marked complete.

## P0-007 Added Requirement

`ZSAFE-P0-007` must not only return `PASS` or `FAIL`.

It must produce a redacted, deterministic Binding Firewall report suitable for future inclusion in `ProofEvent v1` and `zecsafe-proof-v1`.

Minimum report fields:

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

## Judge-Proof Impact

This amendment makes `make judge-proof` the spine of the remaining plan.

Every future core task must either:

- produce verifier evidence;
- protect verifier evidence;
- prevent a false verifier claim;
- or remove a blocker to the verifier path.

## Public-Safe Evidence Emitted

This task emits only documentation:

```text
ZECSAFE_ZECHUB_3_WIN_EXECUTION_PLAN_V3.md
docs/execution/12-JUDGE-PROOF-AMENDMENT.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
docs/execution/00-MISSION.md
```

## Private Material Intentionally Excluded

No FROST participant configs, wallet databases, key material, PCZT bodies, raw inspect output, signing shares, nonces, randomizers, mnemonics, or mainnet funds were created or copied by this amendment.

## Negative/Tamper Case

No executable proof artifact was created by this amendment, so there is no runtime tamper case yet.

The amendment creates the requirement that future `ZSAFE-P0-015`, `ZSAFE-P0-025`, and `ZSAFE-P0-026` work must verify semantic tampering through `make judge-proof` and `make judge-proof-tamper`.

## Claim Now Allowed

ZecSafe can accurately claim:

```text
The active execution plan has been amended so every remaining core task must feed public-safe evidence into the judge verifier path.
```

## Claim Still Forbidden

ZecSafe must not yet claim:

```text
Intent-to-PCZT binding exists.
ProofEvent v1 exists.
zecsafe-proof-v1 exists.
make judge-proof exists.
A real FROST signature is bound to a Zcash PCZT/SIGHASH.
A mainnet transaction has been authorized by ZecSafe's FROST flow.
```

## Acceptance

- [x] V3 plan exists beside V2.
- [x] V2 remains unchanged as historical baseline.
- [x] Mission document points to V3 as the active source plan.
- [x] Repo records the V3 amendment.
- [x] Ledger records `ZSAFE-V3-001`.
- [x] Handoff records the active V3 plan and next task gate.
- [x] No FROST, wallet, PCZT, or mainnet artifact was created by this amendment.
- [x] `npm run check` passed after the amendment.

> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-024 — Recorded Verified Mainnet Run

Task ID: `ZSAFE-P0-024`

Recorded UTC: `2026-07-12T15:12:54.000Z`

Status: `PASS`

## Objective met

The real p0-019 → p0-023 mainnet run is frozen as a replayable judge fixture under a clearly named path with the required label `Recorded Verified Mainnet Run`:

```text
fixtures/verified-mainnet-run/
├── proof.json           zecsafe-proof-v1 bundle from the real run
├── events.public.json   public-safe ProofEvent v1 projections, annotated by source run
└── README.md            labeled record; distinguishes recorded proof vs current chain vs live execution
```

## Bundle facts

```text
bundle hash:        sha256:e90c3c46ae1474d848d3cc20ef4157e52b151dddda2015c034f83ad31ee9cb64
network:            main
txid:               27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
chain status:       CONFIRMED (mined 3409837; 4 confirmations at recording)
FROST policy:       2 of 3, one participant unavailable, two selected signers
Intent <-> PCZT:    PASS (source and final binding refs recorded)
zecsafe commit:     ad83269298b73396ac0f4b743c59301de77fe937 (HEAD at recording; P0-018..024 work uncommitted — see README note)
recorded at:        2026-07-12T15:12:54.000Z
```

## Actions performed

1. **Broadcast-aware completion gate.** `src/pczt-completion-v1.mjs` previously hard-coded `broadcast_status === "NOT_BROADCAST"`. It now accepts `SUBMITTED/OBSERVED/MINED/CONFIRMED` **only** when the package carries an explicit `broadcast_approval` record (`approved: true` + non-empty approval statement); `REJECTED`/unknown statuses still fail, the pre-broadcast path is unchanged, and a broadcast status without approval fails. New tests cover the approved pass, the missing-approval fail, the `REJECTED` fail, and malformed approval rejections.
2. **Post-broadcast completion package.** The P0-022 package was re-issued under the broadcast run ID with `broadcast_status: CONFIRMED` and the operator's recorded approval statement; the completion gate passes with `BROADCAST CONFIRMED`.
3. **Final public proof bundle.** `npm run proof:generate -- p0-023-20260712T145358Z --txid … --chain-status CONFIRMED --network main --observed-block-height 3409837 --confirmations-at-recording 4` produced `fixtures/verified-mainnet-run/proof.json`; generation self-verifies.
4. **Public ProofEvent projection.** Five real gate events (selection, review A, review B, FROST session, post-broadcast completion) were projected with `projectPublicProofEvent` and hash-annotated into `events.public.json`. Events span two source run IDs and are annotated per source rather than merged into one artificial sequence.
5. **Secret scan.** `npm run security:scan` passes; a direct pattern scan of `fixtures/verified-mainnet-run/` found no viewing keys, spend keys, share/randomizer/signature material.
6. **Verification + tamper climax.** New one-command targets:

```text
make judge-proof-mainnet          -> VERDICT: VERIFIED RECORDED ZECSAFE PROOF
make judge-proof-mainnet-tamper   -> all 7 semantic mutations REJECTED; TAMPER DETECTION PASS
```

## Acceptance criteria

A reviewer can distinguish, via the README and bundle fields:

- **recorded proof** — the hash-sealed bundle with its recording timestamp and confirmation count at recording;
- **current chain observation** — the txid is publicly checkable now and will have more confirmations than recorded;
- **live/local execution** — `make judge-proof-mainnet` verifies the record offline without wallet, secrets, or broadcast.

## Judge-proof impact

- Public-safe evidence: the sealed bundle, five gate events with hashes, and the labeled README.
- Private exclusions: unchanged; nothing sensitive enters the fixture directory.
- Negative/tamper case: `make judge-proof-mainnet-tamper` rejects every semantic mutation; completion-gate tests reject unapproved broadcast statuses.
- Allowed claim: "A judge can verify ZecSafe's recorded, confirmed mainnet FROST run with one command in under a minute, offline."
- Forbidden claim: that the recorded bundle reflects live chain state after recording, or that verification re-executes the ceremony.

## Boundary at task end

```text
broadcasts performed:  0 in this task (the P0-023 transaction remains the only one)
budget consumed:       0 in this task; project total remains fee 10000 of 20000
next gate:             explicit human approval before further tasks (commit, ZecHub PR, Discord submission all remain human-gated)
```

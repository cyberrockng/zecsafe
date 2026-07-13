> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-004 - DKG Feasibility Spike

Status: `ZSAFE-P0-004` complete.

Completed UTC: `2026-07-11T07:19:29Z`

Outcome: `PASS_FOR_FROST_GROUP_SETUP`

## Scope

Determine whether the final proof path can use the pinned `frost-client dkg` flow without risking the proof schedule.

This spike was intentionally bounded. It tested:

```text
three participant configs
RedPallas ciphersuite
2-of-3 threshold
DKG-created group material
downstream Alice+Bob signing with Eve offline
```

It did not test:

```text
PCZT binding
Zcash SIGHASH signing
funded PCZT extraction
testnet or mainnet broadcast
judge proof verification
```

## External Workspace

All generated DKG and signing artifacts were kept outside the repository:

```text
$HOME/.zecsafe/runs/p0-004-20260711T071646Z
```

This directory contains sensitive participant material and must not be committed:

```text
configs/alice.toml
configs/bob.toml
configs/eve.toml
tls/ca.key.pem
tls/server.key.pem
contacts/*.contact-token
logs/
artifacts/dkg-signature.raw
```

## Pinned Toolchain

Tool:

```text
frost-tools
```

Pinned commit:

```text
7d33a95fecc91dacdb1503933e2bee43780d3293
```

Local source:

```text
$HOME/.zecsafe/toolchain/frost-tools
```

## DKG Setup

Fresh participant configs were initialized externally:

```text
alice.toml
bob.toml
eve.toml
```

Each participant exported a contact string, and those contact strings were imported into the other two configs so the HTTP DKG message encryption layer could address all participants.

Local HTTPS transport used `frostd` on:

```text
127.0.0.1:2747
```

The DKG creator command shape was:

```bash
SSL_CERT_FILE=<external-ca-cert> cargo run --locked -p frost-client -- dkg \
  -c <external-alice-config> \
  -d 'ZecSafe P0-004 DKG RedPallas 2-of-3' \
  -s 127.0.0.1:2747 \
  -C redpallas \
  -t 2 \
  -S <bob-communication-pubkey>,<eve-communication-pubkey>
```

Bob and Eve joined with the same command shape, without `-S`.

All three DKG clients exited with status `0`.

Sanitized DKG log proof:

```text
Alice: Creating DKG session -> Round 1 -> broadcasted Round 1 -> Round 2 -> Group created
Bob: Joining DKG session -> Round 1 -> broadcasted Round 1 -> Round 2 -> Group created
Eve: Joining DKG session -> Round 1 -> broadcasted Round 1 -> Round 2 -> Group created
```

## Created Group

All three configs reported the same group:

```text
description: ZecSafe P0-004 DKG RedPallas 2-of-3
public group key: 943022b2c25fe277b6f150c36b88af0e6dcc95e67422fc66fd561327083cb324
server URL: 127.0.0.1:2747
threshold: 2
participants: 3
```

## Downstream Signing Check

The DKG group was then used for a normal `frost-client` signing session:

```text
selected signers: Alice and Bob
offline signer: Eve
ciphersuite: RedPallas
```

Coordinator command shape:

```bash
SSL_CERT_FILE=<external-ca-cert> cargo run --locked -p frost-client -- coordinator \
  -c <external-alice-config> \
  -g <dkg-public-group-key> \
  -S <alice-communication-pubkey>,<bob-communication-pubkey> \
  -m <external-message-file> \
  -o <external-signature-file>
```

Participant command shape:

```bash
printf 'y\n' | SSL_CERT_FILE=<external-ca-cert> cargo run --locked -p frost-client -- participant \
  -c <external-participant-config> \
  -g <dkg-public-group-key>
```

Signing results:

```text
coordinator status: 0
alice status: 0
bob status: 0
message bytes: 54
signature bytes: 64
message sha256: 2dad43d0efb88849fc448c401dee319b330cda3f9bf0c16f4339659959462468
signature sha256: 81189e428c8c1100f25e4ee54b6aaf9819535c2a649f6b092c0e74080113c4b3
```

Sanitized signing log proof:

```text
Coordinator: Creating signing session -> commitments received -> SigningPackage sent -> SignatureShares received -> raw signature written
Alice: Joining signing session -> commitments sent -> signing package received -> approved -> Done
Bob: Joining signing session -> commitments sent -> signing package received -> approved -> Done
Eve: not started
```

## Decision

DKG is feasible for the final proof's FROST group setup path.

Do not use the trusted-dealer fallback unless a later PCZT-specific integration reveals a new DKG blocker.

Do not claim production DKG. The upstream docs still describe these demos as WIP, and `frost-client` stores participant secrets unencrypted in its config files.

## Public Claims Affected

ZecSafe can now accurately claim:

```text
Pinned frost-tools DKG was reproduced locally with three participants.
The DKG-created RedPallas group has threshold 2 and participant count 3.
The DKG-created group completed a downstream 2-of-3 signing session with Eve offline.
The final proof path can use DKG for FROST group setup if later PCZT-specific gates do not expose a blocker.
```

ZecSafe must not yet claim:

```text
production-ready DKG
PCZT/SIGHASH authorization with the DKG group
funded transaction signing
transaction extraction
mainnet broadcast
judge-verifiable DKG proof bundle
```

## Repository Verification

Command:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

## Files Changed

```text
docs/execution/09-DKG-FEASIBILITY.md
docs/execution/00-MISSION.md
docs/execution/08-EXECUTION-LEDGER.md
HANDOFF.md
```

## Acceptance Criteria

- [x] Pinned `frost-tools` commit used.
- [x] Three fresh participant configs initialized outside the repository.
- [x] Three participants imported each other's contacts.
- [x] DKG attempted with RedPallas and threshold 2.
- [x] All three DKG clients created the same group.
- [x] DKG-created group used for downstream signing.
- [x] Alice and Bob completed the signing session.
- [x] Eve remained offline for the downstream signing session.
- [x] Coordinator produced a 64-byte signature.
- [x] `npm run check` passed.
- [x] Private configs, contact tokens, TLS keys, logs, and signature file stayed outside the repository.
- [x] No wallet, PCZT, mainnet funding, or broadcast occurred.

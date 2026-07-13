> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-017 - Mainnet Demo Wallet/Group

Status: `ZSAFE-P0-017` complete.

Completed UTC: `2026-07-11T23:14:41Z`.

## Outcome

ZecSafe now has a dedicated disposable mainnet demonstration environment ready for a human funding decision.

The environment was created outside the repository under:

```text
$HOME/.zecsafe/runs/p0-017-20260711T231314Z
```

It contains a fresh RedPallas 2-of-3 DKG group, a generated Orchard-only unified mainnet address, and a view-only wallet initialized from the generated UFVK. It is not funded and no transaction was broadcast.

## Human Funding Gate

```text
Network: main
Orchard address: u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0
Group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
Threshold: 2
Participant count: 3
Wallet purpose: disposable tiny-value ZecSafe mainnet demo; not production custody
Recommended tiny funding amount: 0.0001 ZEC
Risk warning: Fund only disposable tiny mainnet ZEC after explicit approval; no production or personal funds; no broadcast is approved by this step.
```

## Public Fixture

```text
fixture: fixtures/mainnet-demo/p0-017-mainnet-demo-env.json
schema: zecsafe-mainnet-demo-env-v1
status: READY_FOR_FUNDING_APPROVAL
network: main
funding_status: NOT_FUNDED
broadcast_status: NOT_BROADCAST
```

## Group Setup

```text
setup mode: DKG
ciphersuite: redpallas
threshold: 2
participants: 3
public group key: df7823871b1ceb00632a60ba9cfe348ad5f2c14f36ebf27083873d37a0b32a26
group fingerprint: sha256:bbdab30a787df9ea12c048e5785aa63b8d7337e67b4b0c4206ce05727d0d0354
Alice DKG status: 0
Bob DKG status: 0
Eve DKG status: 0
same group key reported by all participants: true
```

## Mainnet Compatibility Recheck

Pinned tool commits:

```text
frost-tools: 7d33a95fecc91dacdb1503933e2bee43780d3293
zcash-devtool: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
ZF FROST: 2016e44ba4a4757a996300350063b937a2ad33e8
```

The view-only wallet was initialized through `zcash-devtool` against mainnet `zecrocks` direct mode. Read-only chain info returned:

```text
chain_name: main
chain_tip_height: 3409081
server_uri: https://zec.rocks:443
```

The generated address was inspected locally:

```text
Network: main
Kind: Unified Address
Receivers: Orchard
```

## Judge-Proof Impact

This task creates the real mainnet funding target for the final proof run while keeping the proof boundary explicit. A judge can see that the group, network, address, and funding gate were established before any value was sent.

## Public-Safe Evidence Emitted

```text
network
funding status
broadcast status
DKG setup mode
ciphersuite
public group key
group fingerprint
threshold and participant count
participant communication public fingerprints
Orchard-only unified mainnet address
view-only wallet initialization status
mainnet chain info
toolchain commits
human funding gate text
```

## Private Material Intentionally Excluded

```text
UFVK
wallet database
FROST participant configs
FROST shares
contact tokens
TLS private keys
seed phrases
spending keys
raw protocol logs
```

## Negative/Tamper Case

```text
wrong network -> funding gate invalid
non-DKG setup mode -> task claim invalid
threshold other than 2/3 -> task claim invalid
missing view-only wallet initialization -> task claim invalid
funding_status other than NOT_FUNDED -> P0-017 boundary violated
broadcast_status other than NOT_BROADCAST -> P0-017 boundary violated
UFVK or participant config in repo -> security scan violation
```

## Claim Now Allowed

```text
ZecSafe has a dedicated disposable mainnet demo group/address and view-only wallet ready for a tiny-value funding approval decision.
```

## Claim Still Forbidden

```text
ZecSafe has not funded the mainnet demo wallet, has not observed a funded mainnet balance, has not created a mainnet PCZT, has not broadcast a Zcash transaction, and has not produced final mainnet proof-run evidence.
```

## Verification

```bash
npm run verify
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe security scan passed.
```

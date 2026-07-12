# Recorded Verified Mainnet Run

This directory freezes the public, tamper-evident record of ZecSafe's real Zcash **mainnet** FROST 2-of-3 proof run of 2026-07-12.

## What a reviewer is looking at

Distinguish three things:

1. **Recorded proof (this directory).** `proof.json` is a `zecsafe-proof-v1` bundle generated from the real run's completion package. It contains only fingerprints, statuses, counts, tool commits, limitations, and the transaction observation as it stood at recording time (`CONFIRMED`, mined height `3409837`, 4 confirmations at `2026-07-12T14:59:57Z`). It never updates itself.
2. **Current chain observation.** The transaction id below is publicly checkable on any Zcash mainnet explorer right now; its confirmation count has grown since recording. The recorded proof intentionally does not claim today's count.
3. **Live/local execution.** Re-running ZecSafe gates locally (e.g. `make judge-proof-mainnet`) verifies the recorded bundle; it does not re-execute the wallet, FROST ceremony, or broadcast.

## The run in one paragraph

A human-approved intent (vault self-send of 5000 zatoshis, fee ceiling 15000) was committed as `sha256:2bc6da1543372f8d7babcd4e7050f5ebf8f889d6a33a3b834602e581fea709d7`; a real PCZT was created from the funded view-only mainnet wallet and bound to that intent by the Binding Firewall (every check PASS, live tamper probe FAIL as required); participants A and B — with C genuinely unavailable — semantically reviewed the PCZT context and produced a live rerandomized RedPallas aggregate signature over the PCZT's shielded sighash through frostd; the signature was applied (cryptographically verified by the signer library), Halo2 proofs were created, the combined PCZT re-passed binding, and after explicit human approval the transaction was broadcast once and confirmed on mainnet.

```text
network:            main
txid:               27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
mined height:       3409837 (2026-07-12T14:54:27Z)
chain status:       CONFIRMED (observed tip 3409840 at recording; rule: tip >= mined + 2)
fee:                10000 zatoshis
bundle hash:        sha256:e90c3c46ae1474d848d3cc20ef4157e52b151dddda2015c034f83ad31ee9cb64
zecsafe commit:     ad83269298b73396ac0f4b743c59301de77fe937 (see note below)
recorded at (UTC):  2026-07-12T15:12:54.000Z
```

Commit note: the recorded commit is the repository HEAD at recording time; the P0-018 through P0-024 implementation and evidence files were present in the working tree but not yet committed when the run executed. The freeze commit that lands this directory supersedes that gap.

## Files

```text
proof.json          zecsafe-proof-v1 bundle (canonical, hash-sealed)
events.public.json  public-safe ProofEvent v1 projections from the real gates, annotated by source run
README.md           this file
```

## Verify (offline, no wallet, no secrets, no broadcast)

```bash
make judge-proof-mainnet          # verify the recorded bundle
make judge-proof-mainnet-tamper   # every semantic mutation must be REJECTED
```

## Source evidence chain (public fixtures)

```text
fixtures/mainnet-demo/p0-019-mainnet-proof-intent.json      exact human-approved intent
fixtures/mainnet-demo/p0-020-mainnet-pczt-binding.json      real PCZT + Binding Firewall + tamper probe
fixtures/mainnet-demo/p0-021-mainnet-frost-session.json     live A+B FROST session with C unavailable
fixtures/mainnet-demo/p0-022-mainnet-pczt-completion.json   offline sign/prove/combine/extract + broadcast gate
fixtures/mainnet-demo/p0-023-mainnet-broadcast.json         approved broadcast + chain-truth chronology
```

## Private material intentionally excluded

UFVK, wallet databases, FROST participant configs, contact tokens, TLS keys, signing shares, nonces, randomizers, raw sighash bytes, raw signatures, and raw PCZT bodies remain in external run directories outside this repository.

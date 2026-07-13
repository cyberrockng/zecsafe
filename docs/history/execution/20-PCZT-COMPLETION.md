> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# ZSAFE-P0-014 - Signed, Proven, Combined PCZT

Status: `ZSAFE-P0-014` complete.

Completed UTC: `2026-07-11T18:52:00Z`.

## Outcome

ZecSafe now has a headless PCZT completion gate for a real funded Ironwood PCZT. The live run funded a FROST-controlled testnet unified address, created a source PCZT from that note, extracted the real shielded PCZT SIGHASH through the pinned PCZT signer-library path, produced a live A+B FROST aggregate signature with Eve offline, inserted that signature into the PCZT, created proofs separately, combined the signed and proven PCZTs, re-ran final binding, and stopped before broadcast.

The fixed runner now implements:

```text
pczt.sign.complete
pczt.prove
pczt.combine
```

The public completion gate records:

```text
SIGNED_PCZT PASS
PROVEN_PCZT PASS
PCZT_COMBINE PASS
FINAL BINDING PASS
BROADCAST NOT_BROADCAST
```

## Boundary Resolved

The prior `ZSAFE-P0-013` boundary was real: the smoke signature was a private 32-byte signing input, not a transaction-completion-ready PCZT SIGHASH.

This task resolved that boundary by deriving a testnet unified address from the existing RedPallas FROST DKG group public key and funding that FROST-controlled address. The resulting source PCZT spends the FROST-controlled Ironwood note, so the aggregate signature applies to the real PCZT SIGHASH for that input.

## Files

```text
src/pczt-completion-v1.mjs
scripts/pczt-complete.mjs
scripts/pczt-completion-v1.test.mjs
src/pczt-inspect-v1.mjs
src/pczt-bind-v1.mjs
src/fixed-runner-v1.mjs
src/proof-event-v1.mjs
scripts/verify.mjs
package.json
```

## CLI

```bash
npm run pczt:complete -- --json completion-package.json --summary
```

Exit behavior:

```text
0 = signed, proven, combined, final binding PASS, and broadcast gate NOT_BROADCAST
1 = malformed JSON or invalid completion package
2 = completion package is valid but one or more checks failed
```

## Live External Run

External run:

```text
$HOME/.zecsafe/runs/p0-014-20260711T183213Z
```

Pinned tools:

```text
zcash-devtool commit: 1b065594d958d1cad2deafe7cd2e2fcc2774c46c
frost-tools commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
pczt signer-library helper commit: 8e6864a3c67cab3c64a052dd20f83c553662e8b2
```

Existing DKG group:

```text
public group key: 943022b2c25fe277b6f150c36b88af0e6dcc95e67422fc66fd561327083cb324
group fingerprint: sha256:74d814d1ee5114db18439b44bb3ccde50e6dd64952eda3675ac3797a117fefc3
threshold: 2
participant total: 3
selected signers: Alice and Bob
unavailable participant: Eve
```

Funding proof:

```text
source: Fauzec Zcash testnet faucet direct API
request_id: 01KX977K8G59R5EZGGR21JBVFG
txid: d8b6f151c2265a40fc7c5ee42313b84ae494018157f257a5a60c2c353ddb697a
mined_height: 4160374
amount: 1.00000000 TAZ
```

Source PCZT and signing context:

```text
source PCZT sha256: 7d494c53178afbd39c50dafedd5d2755681d02d49bd95918847ae672382a2789
source inspect sha256: 6b3f8edf8fc34d92a2ac9cae3ae4fe767d74f20a779ae220082c57b2e139fd33
shielded SIGHASH bytes: 32
shielded SIGHASH sha256: 855d695441fd87747ebf92109b041fe88adff8a539f9850901ed5f5c1d6e60e3
non-dummy Ironwood spends: 1
Ironwood spend indexes: [0]
```

FROST output:

```text
session id: 7233af1b-efb8-4b1c-8619-b7a605d55af9
aggregate signature bytes: 64
aggregate signature sha256: 6752d1b0eae9fc190848545a1b7868e3dd78a3e3883208c3620d17a78acfd231
```

PCZT completion artifacts:

```text
signed PCZT sha256: 01730fc518d4a83ae6a6172e714650feebc0a0d3b5851ddd6bf8b28529ac85ce
proven PCZT sha256: 4e4518d785ed027da3adaae6a4b381b92e5e5c8b314900f2bdc14baabefda0f0
combined PCZT sha256: 2eb89c4c78bc11eff300ea9362fb771960658d643d97f3e8b14bc5e27938f54f
extracted txid: 1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b
broadcast status: NOT_BROADCAST
```

The source and combined PCZT inspect output showed:

```text
5 Ironwood actions
1 non-dummy spend: 100000000 zatoshis
4 modeled change outputs: 22493750 zatoshis each
1 reviewed recipient output: 10000000 zatoshis
fee: 25000 zatoshis
Version: V6
```

## Completion Gate Output

```text
SIGNED_PCZT                 PASS
PROVEN_PCZT                 PASS
PCZT_COMBINE                PASS
FINAL BINDING               PASS
BROADCAST                   NOT_BROADCAST
FINAL PCZT                  sha256:2eb89c4c78bc11eff300ea9362fb771960658d643d97f3e8b14bc5e27938f54f
```

## ProofEvent Evidence

`pczt.combine` emits a `PCZT_COMBINE` ProofEvent v1 with public-safe fields:

```text
pczt_fingerprint
binding_report_ref
sighash_fingerprint
aggregate_signature_fingerprint
signature_byte_length
signed_pczt_status
proven_pczt_status
pczt_combine_status
final_binding_status
broadcast_status
check_statuses
limitations
```

Raw PCZT bytes, raw SIGHASH bytes, raw aggregate signature bytes, randomizers, UFVK, wallet DBs, FROST configs, shares, nonces, contact tokens, TLS private keys, and wallet authorization material are excluded.

## Negative Coverage

```text
mock signature source -> signed PCZT FAIL
63-byte signature -> FROST signature and signed PCZT FAIL
corrupt signed PCZT status -> signed PCZT FAIL
corrupt proven PCZT proof status -> proven PCZT FAIL
mismatched signed/proven pair -> PCZT combine FAIL
raw/private fields in completion package -> rejected
Ironwood malformed output line -> PCZT inspect rejected
unreported change outputs -> modeled as change, not treated as recipient payments
```

## Judge-Proof Impact

This task closes the real PCZT signing boundary for the headless proof kernel. A judge can now verify a public-safe chain from intent binding through real PCZT SIGHASH fingerprint, FROST aggregate signature fingerprint, signed PCZT fingerprint, proven PCZT fingerprint, combined PCZT fingerprint, final binding PASS, and explicit non-broadcast status.

## Public-Safe Evidence Emitted

```text
source PCZT fingerprint
source binding report ref
final binding report ref
SIGHASH fingerprint
aggregate signature fingerprint
signature byte length
signed PCZT fingerprint
proven PCZT fingerprint
combined PCZT fingerprint
txid from offline extract
completion check statuses
broadcast gate status
PCZT_COMBINE ProofEvent v1
```

## Private Material Intentionally Excluded

```text
UFVK and viewing keys
wallet database
FROST participant configs
contact tokens
TLS private keys
signing shares
nonces
randomizers
raw SIGHASH
raw aggregate signature
raw PCZT bodies
raw extracted transaction material
logs with protocol transcript material
```

## Claim Boundary

Allowed: ZecSafe completed a real funded testnet Ironwood PCZT through signing, proving, combining, final binding, and offline extraction, using a live A+B FROST aggregate signature over the PCZT SIGHASH with Eve offline.

Forbidden: ZecSafe has not broadcast this transaction, has not produced a mainnet spend, has not implemented `zecsafe-proof-v1`, and has not implemented the one-command judge verifier.

## Verification

Targeted verification passed:

```bash
node scripts/pczt-inspect-v1.test.mjs
node scripts/pczt-bind-v1.test.mjs
npm run test:pczt-complete
npm run pczt:complete -- --json $HOME/.zecsafe/runs/p0-014-20260711T183213Z/artifacts/completion-package.json --summary
```

Full verification passed after the documentation update:

```bash
npm run check
```

Result:

```text
ZecSafe static verification passed.
ZecSafe intent v1 tests passed.
ZecSafe PCZT inspect v1 tests passed.
ZecSafe Binding Firewall tests passed.
ZecSafe ProofEvent v1 tests passed.
ZecSafe fixed-operation runner tests passed.
ZecSafe signer selection tests passed.
ZecSafe signing-context preparation tests passed.
ZecSafe signer-review tests passed.
ZecSafe FROST session tests passed.
ZecSafe PCZT completion tests passed.
ZecSafe security scan passed.
```

## Acceptance Criteria

- [x] Real funded FROST-controlled Ironwood PCZT created.
- [x] Real shielded PCZT SIGHASH fingerprint extracted from the PCZT signer path.
- [x] A+B FROST session produced a 64-byte aggregate signature over that SIGHASH with Eve offline.
- [x] Mock signature path rejected by completion gate.
- [x] Corrupt signature length rejected.
- [x] Signed PCZT produced by applying the FROST aggregate signature.
- [x] Proven PCZT produced separately.
- [x] Signed and proven PCZTs combined.
- [x] Combined PCZT passed final binding verification.
- [x] Offline extraction produced txid `1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b`.
- [x] Broadcast gate remained `NOT_BROADCAST`.
- [x] Raw shares, nonces, randomizers, raw SIGHASH, raw signature, UFVK, wallet DB, and raw PCZT bytes are excluded from public evidence.
- [x] Dedicated execution doc and `HANDOFF.md` updated.

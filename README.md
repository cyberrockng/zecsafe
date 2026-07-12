# ZecSafe

**ZecSafe is a FROST-native threshold authorization and continuity control plane for shielded Zcash.**

## Lose one key. Not your ZEC.

A 2-of-3 FROST group authorized a real shielded Zcash mainnet transaction **while one participant was unavailable**.

**Live demo:** [https://zecsafe.vercel.app/demo](https://zecsafe.vercel.app/demo)

```text
Network:      main
Txid:         27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527
Chain status: CONFIRMED
Block height: 3409837
Threshold:    2 of 3, with 1 participant unavailable
Run ID:       p0-023-20260712T145358Z
```

That transaction is on Zcash mainnet right now. Look it up in any Zcash explorer.

## Verify it yourself in 60 seconds

No wallet. No funds. No secrets. No need to trust this page.

```bash
git clone https://github.com/cyberrockng/zecsafe.git
cd zecsafe
make judge-proof-mainnet          # VERDICT: VERIFIED RECORDED ZECSAFE PROOF
make judge-proof-mainnet-tamper   # VERDICT: TAMPER DETECTION PASS
```

There are no dependencies to install. ZecSafe runs on the Node standard library.

## The 60-second demo

Hosted:

```text
https://zecsafe.vercel.app/demo
```

Local:

```bash
npm start        # http://127.0.0.1:4173/
```

Four steps, in order, on one page:

1. **Review** — the reviewed transaction intent, bound by a canonical commitment.
2. **Verify** — the Binding Firewall compares intent to PCZT, field by field. Toggle **Mismatch** to watch it block signing.
3. **Authorize** — signer C is unavailable. Signers A and B reach the 2-of-3 threshold anyway.
4. **Prove** — the recorded ProofEvent replay, the mainnet txid, and the downloadable public proof bundle.

## What is actually real

| Component | Status | Notes |
|---|---|---|
| FROST group | **Real** | 2-of-3, **DKG** group setup, `redpallas-rerandomized` ciphersuite |
| Threshold authorization | **Real** | Signers A+B produced a verified 64-byte aggregate signature with C genuinely offline |
| Shielded transaction | **Real** | Orchard PCZT, signed over a PCZT-derived shielded SIGHASH |
| Mainnet broadcast | **Real, human-gated** | Broadcast happened once, after explicit human approval. It is never automatic. |
| Chain confirmation | **Real** | CONFIRMED at height 3409837 per a pre-specified confirmation rule |
| Public proof bundle | **Real** | `zecsafe-proof-v1`, canonical bundle hash, tamper-evident, contains no secret |
| Demo replay | **Recorded** | The app replays the recorded run from tracked fixtures. It is not a live signing session. |
| Recovery | **Not demonstrated** | ZecSafe does not implement share repair, refresh, or group migration. |

The only continuity claim ZecSafe makes is the one it proved: **the 2-of-3 threshold remains usable with one participant unavailable.**

## How it uses Zcash mainnet

The transaction was created from a view-only (UFVK) wallet as an Orchard PCZT, checked by the Binding Firewall, signed by a real FROST ceremony over the PCZT-derived shielded SIGHASH, completed (signed → proven → combined), extracted, and broadcast after human approval.

The txid was **extracted from the combined PCZT before broadcast** and matches the transaction the network accepted. It was not pasted in from an external wallet.

Zcash validates the resulting spend authorization normally. **The chain does not expose a special FROST marker.** FROST provenance is evidenced by the recorded ZecSafe/FROST signing session, not by anything visible on-chain.

## Architecture

```text
intent  →  PCZT  →  Binding Firewall  →  signing context / shielded SIGHASH
        →  FROST session (A+B; C unavailable)  →  aggregate signature
        →  signed PCZT  →  proven PCZT  →  combined PCZT
        →  human approval  →  broadcast  →  txid  →  chain observation
```

Every arrow is backed by an artifact fingerprint recorded in the public proof bundle. ZecSafe implements **no cryptography of its own** — FROST, RedPallas, Orchard proving, and PCZT handling are all delegated to pinned upstream tooling.

| Tool | Pinned commit |
|---|---|
| ZF `frost-tools` | `7d33a95fecc91dacdb1503933e2bee43780d3293` |
| `zcash-devtool` | `1b065594d958d1cad2deafe7cd2e2fcc2774c46c` |
| PCZT signer library (librustzcash) | `8e6864a3c67cab3c64a052dd20f83c553662e8b2` |

## Commands

```bash
npm run check                     # full repository verification (16 suites, syntax, secret scan)
npm run test:proof-data           # public proof data-classification tests
make proof-run-dry                # headless proof kernel, halts at the human broadcast gate
make judge-proof-mainnet          # verify the recorded mainnet proof bundle
make judge-proof-mainnet-tamper   # prove the bundle is tamper-evident
```

## Limitations — read these

- **ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling.** The referenced NCC audit of the ZF FROST repository **did not include rerandomized FROST**. ZecSafe is not audited production custody software.
- The pinned `frost-tools` and `zcash-devtool` both self-describe as work-in-progress and not production-ready.
- Signer review mode is `semantic_pczt_review`: signers check PCZT semantics and compare the prepared pinned-tool SIGHASH fingerprint. They do **not** independently recompute the SIGHASH.
- The Binding Firewall is a **semantic** intent-to-PCZT check. The FROST-group-to-PCZT-authorization-key linkage is established by the pinned signer library verifying the aggregate signature against the action's rerandomized verification key at apply time, and is corroborated by Zcash consensus accepting the shielded spend — **not** by the Binding Firewall itself.
- The three participants ran as separate processes and configurations **on one machine**. They are not independent real-world custodians. ZecSafe claims no geographic or organizational distribution.
- The coordinator can see transaction details. Signers can link the signing operation to a transaction. FROST does not provide network anonymity. The public proof bundle is a redacted projection, **not** a zero-knowledge proof.
- The proof verifier checks the bundle's schema, canonical integrity, and internal consistency. It does not re-execute FROST or regenerate the PCZT.
- **Recovery is not demonstrated.**

Security and privacy boundaries: [`SECURITY.md`](SECURITY.md), [`PRIVACY.md`](PRIVACY.md), [`PROOF_SPEC.md`](PROOF_SPEC.md), [`docs/proof/TRUST_MODEL.md`](docs/proof/TRUST_MODEL.md), [`docs/threat-model.md`](docs/threat-model.md).

## Submission

ZecHub Hackathon 3.0 — FROST track. See [`SUBMISSION.md`](SUBMISSION.md) and [`DEMO.md`](DEMO.md).

## License

MIT. See [`LICENSE`](LICENSE).

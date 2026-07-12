# 18 — Competitive and Public-Vote Position

Dated observations (2026-07-12), not guarantees. The ZecHub 3.0 winner is chosen by public ZecHub DAO vote after the July 15 deadline, across five tracks (Infrastructure, Games, FROST, Zcash Login, Accounting), for a 25 ZEC pool.

## Required memory test

> *A reviewer should describe ZecSafe as: "ZecSafe shows one signer unavailable, two FROST signers authorizing the reviewed shielded transaction, and a proof bundle that can be verified."*
>
> *If the natural description is "a Zcash security dashboard", the positioning failed.*

**Current result: the positioning FAILS — but only at the surface.**

A judge landing on `/` sees a persistent telemetry header (mainnet status, peers, mempool, recovery risk), a 12-item sidebar, a "Security Command Center", a proposal queue, an audit log, and a transparent-address monitor. The honest description of that screen is **"a Zcash security dashboard"** — precisely the failure condition V3 names.

A judge landing on `/demo` sees exactly the sentence the memory test asks for. The correct product *exists*; it is not what the default route presents.

This is the whole audit in one observation: **ZecSafe's positioning problem is a rendering problem, not a substance problem.**

## Differentiation result

```text
Common in field:
  FROST demos that sign an arbitrary message with trusted-dealer keys and stop there;
  wallet dashboards with read-only chain telemetry;
  threshold-signing explainers with no mainnet transaction;
  submissions whose "proof" is a screenshot or a pasted txid from an external wallet.

ZecSafe unique proof:
  A real 2-of-3 rerandomized-FROST (RedPallas) aggregate signature over a PCZT-derived
  *shielded* SIGHASH, produced with one participant genuinely offline, applied to a real
  Orchard PCZT, combined, extracted, human-approved, broadcast, and CONFIRMED on Zcash
  mainnet at height 3,409,837 — with a DKG-generated group, an intent→PCZT Binding Firewall
  that fails closed, and a canonical, tamper-evident public proof bundle that leaks no secret.

Fastest judge verification:
  git clone && make judge-proof-mainnet          → VERIFIED RECORDED ZECSAFE PROOF
  git clone && make judge-proof-mainnet-tamper   → TAMPER DETECTION PASS
  ~60 seconds, no wallet, no funds, no secrets, no trust in the UI.

Technical climax:
  The txid was extracted from the combined PCZT *before* broadcast, and it is the txid the
  network accepted. That single fact is unforgeable by a project that merely pasted in an
  externally broadcast transaction — and it is the exact substitution V3 §7 warns judges to
  look for.

Public memory hook:
  "Lose one key, not your ZEC."   (present, and good)

Remaining competitive weakness:
  The public product still presents the superseded prototype. A voter who never runs a
  command and never scrolls past the fold will conclude ZecSafe is a dashboard whose FROST
  demo has "Not Yet Run" and whose broadcast is "Disabled in Prototype" — because that is
  literally what the header says.
```

## Assessment against V3's competitive questions

| Question | Answer |
|---|---|
| Easier to explain? | **Yes**, via `/demo`. **No**, via `/`. |
| Deeper in FROST proof? | **Yes — substantially.** Shielded SIGHASH + rerandomized RedPallas + DKG + real mainnet spend is well beyond a message-signing demo. |
| More verifiable? | **Yes.** One command, from a fresh clone, no secrets. Few hackathon projects offer this. |
| More transparent about limitations? | **Yes — notably so.** `memo_policy: LIMITED` instead of an inflated MATCH; `semantic_pczt_review` instead of a claimed `independent_sighash`; explicit "the chain does not expose a FROST marker"; explicit "rerandomized FROST was not covered by the NCC audit". This restraint is itself a differentiator and should be *foregrounded*, not buried. |
| Visually clearer? | **No.** 12 nav items, 5 telemetry chips, self-contradicting header. |
| Memorable? | The hook is strong. The surface undermines it. |

## Recommendation

The competitive gap to close is **not** technical. It is that the project is currently hiding its own best work behind the thing it replaced. Deleting the prototype surface is the single highest-leverage action available before the deadline — it costs no new engineering and converts a "dashboard" into "the FROST submission that actually spent shielded ZEC on mainnet with a signer offline."

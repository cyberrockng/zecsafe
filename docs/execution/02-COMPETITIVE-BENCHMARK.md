# ZecSafe Competitive Benchmark

Status: `ZSAFE-W0-003` complete.

Updated UTC: `2026-07-11T03:41:47Z`

## Purpose

This benchmark records what the public ZecHub Hackathon field makes easy for judges to understand, verify, and remember. It is not a product roadmap and does not copy competitor scope. It narrows ZecSafe around the proof-first FROST/mainnet path defined in `docs/execution/00-MISSION.md`.

## Sources Inspected

Primary hackathon and ecosystem sources:

- https://zechub.wiki/hackathon
- https://github.com/ZecHub/zechub/blob/main/site/Start_Here/Developer_Resources.md
- https://github.com/ZecHub/zechub/pulls?q=is%3Apr+is%3Aopen+hackathon+2026
- https://forum.zcashcommunity.com/t/zechub-hackathon/52165/6

Project sources:

- https://github.com/Jubrilabdulazeez/z3-launcher
- https://github.com/Jubrilabdulazeez/z3-launcher/blob/main/z3-node-launcher-implementation-plan.md
- https://github.com/raycre8-g/zecauth
- https://github.com/raycre8-g/zecauth/blob/main/PROTOCOL.md
- https://github.com/EdCryptoFi/zshield
- https://github.com/ZecHub/zechub/tree/main/Hackathon/2025/zec-bounties
- https://github.com/ZecHub/zechub/tree/main/Hackathon/2025/zyberquest
- https://github.com/ZecHub/zechub/tree/main/Hackathon/2025/BananaBetting

## Field Notes

The 2026 hackathon page lists five tracks: Infrastructure, Games, FROST, Zcash Login, and Accounting. It also requires mainnet interaction, setup and usage documentation, open-source licensing, and respect for privacy/security guidelines. A valid submission should include a working prototype, video demo, basic documentation, and an explanation of how it uses the Zcash network.

The visible open PR field inspected on July 11, 2026 included public entries for ZEC Ledger, Zcash Node Launcher, ZEC-OS, Z3 Launcher, ZecAuth, and ZShield. No visible open PR in that inspected list was explicitly FROST-labeled. This is only a public-field observation. It is not evidence that no closed, unpublished, renamed, or later FROST submission exists.

The 2025 result post lists ZEC-Bounties first, ZyberQuest second, and Banana Betting third. Those projects are useful as proof-shape references: they make a Zcash action visible, give judges a concrete story, and expose limitations instead of burying them.

## Z3 Launcher

Project: Z3 Launcher

Track/year: Infrastructure, ZecHub Hackathon 3.0 / 2026.

One-line thesis: Bring up a wallet-usable local Zcash backend around Zebra, Zaino, and optional Zallet in one command.

Fastest proof path: `make serve-regtest`, open the local dashboard, start the stack, toggle Zallet, create a wallet, mine regtest blocks, and run the built-in test.

Main Zcash climax: A wallet-facing Zcash backend becomes usable, with a live stack and a wallet action against that stack rather than only endpoint URLs.

Trust/security posture: The README emphasizes local loopback binding, no telemetry, no key custody, and no consensus/indexer reinvention. The implementation plan also warns about Docker, sync time, pinned image tags, and alpha Zallet status.

Judge-facing documentation pattern: Strong. The project puts a short thesis, track, demo video, 60-second tour, exact command, and "where the impressive parts live" near the top.

What ZecSafe should learn: Make the judge path one command, make the technical payoff visible quickly, and point directly to the files containing the real work. Keep exactly three differentiators and make the control/proof plane testable before UI polish.

What ZecSafe must not copy: Do not compete as another node launcher, endpoint dashboard, or broad Zcash developer control plane. Do not make "observability" the product; for ZecSafe, observability must render proof events.

## ZecAuth

Project: ZecAuth

Track/year: Zcash Login, ZecHub Hackathon 3.0 / 2026.

One-line thesis: A wallet connection protocol for Zcash authentication and capability grants.

Fastest proof path: `cargo run -p zecauth-cli -- demo`, followed by the browser round trip through the reference server if more time is available.

Main Zcash climax: A RedPallas authentication flow derived from Zcash wallet material produces a verifiable login without an on-chain transaction or fee.

Trust/security posture: It separates auth keys from spending keys, uses domain-scoped unlinkable identities, enforces capabilities server-side, and documents the protocol in `PROTOCOL.md` as `v1` / draft.

Judge-facing documentation pattern: Strong. The README states the category, gives a terminal proof command, then links to a formal protocol document and implementation map.

What ZecSafe should learn: Ship a formal proof spec, a schema, and a command-line verifier. State precisely what the proof proves and what it does not prove.

What ZecSafe must not copy: Do not frame ZecSafe as login, off-chain auth, or capability grant infrastructure. ZecSafe's proof must stay tied to a Zcash spend authorization path.

## ZShield

Project: ZShield

Track/year: Zcash Login, ZecHub Hackathon 2026.

One-line thesis: Sign in with Zcash through a W3C DID and OIDC identity provider.

Fastest proof path: Visit the live demo or run the Next.js app locally with required secrets, then exercise challenge/verify/OIDC endpoints.

Main Zcash climax: A challenge-response identity flow maps a Zcash-style address/DID to an OIDC identity, with zero-knowledge-style claims described in the README.

Trust/security posture: The README is explicit that the current implementation uses Ed25519 as a ZIP 304 stand-in and lists a production roadmap to replace it with real ZIP 304 via `librustzcash` WASM.

Judge-facing documentation pattern: Strong at the top of the README: thesis, live demo, video, article, flow table, stack, tests, setup, endpoints, and roadmap.

What ZecSafe should learn: Put live proof links and test status high in the final README. Be blunt when a demo primitive is a stand-in.

What ZecSafe must not copy: Do not rely on a cryptographic stand-in for the final FROST/mainnet claim. If any temporary adapter remains, it must be labeled as such and excluded from the central proof claim.

## ZEC-Bounties

Project: ZEC-Bounties

Track/year: 2025 ZecHub Hackathon, first-place 2025 project.

One-line thesis: A Zcash-powered bounty management platform that reduces the friction of collecting shielded addresses and paying completed work in ZEC.

Fastest proof path: Read the simple five-step user flow and inspect the received-ZEC screenshots included with the project.

Main Zcash climax: Completed bounty work leads to ZEC payout evidence. The README specifically requires shielded Z-address collection and rejects transparent addresses.

Trust/security posture: The public README is product-flow oriented, not a formal security spec. Its best trust signal is visible payment evidence and a constrained workflow.

Judge-facing documentation pattern: Simple and retellable: purpose, core features, user flow, tech stack, block diagram, and payment screenshots.

What ZecSafe should learn: A clear problem and visible evidence beat broad feature lists. The proof path must be easy to retell in one sentence.

What ZecSafe must not copy: Do not drift into generic workflow/payments SaaS. ZecSafe is not a bounty system and should not make manual payment evidence the core proof.

## ZyberQuest

Project: ZyberQuest

Track/year: 2025 ZecHub Hackathon, second-place 2025 project.

One-line thesis: A Zcash-gated game/tournament experience where paying a small ZEC amount with a memo unlocks play.

Fastest proof path: Create a coin code, pay `0.001 ZEC` with the memo, poll status, and see `CONFIRMED` unlock play.

Main Zcash climax: The game state changes only after a Zcash mainnet memo/payment confirmation is observed.

Trust/security posture: The README includes operational robustness notes, debug/inspect routes, refresh fallbacks, and judge quick commands for health, wallet address, balances, coin creation, status, inspect, history, and metrics.

Judge-facing documentation pattern: Strong for verification. It includes API commands, sequence diagrams, status states, and a reproducibility checklist.

What ZecSafe should learn: The Zcash action should be the on-screen climax, not an invisible backend detail. Status words like `CONFIRMED` help judges remember the proof moment.

What ZecSafe must not copy: Do not gate a game or depend on a memo-payment pattern as the central mechanism. ZecSafe's climax must be threshold spend authorization and proof verification.

## Banana Betting

Project: Banana Betting

Track/year: 2025 ZecHub Hackathon, third-place 2025 project.

One-line thesis: A proof-of-concept betting app that uses Zcash transactions in a public/private product flow.

Fastest proof path: Launch the backend/frontend stack, create or enter a betting flow, and inspect the transaction-oriented app screens and documentation.

Main Zcash climax: The product makes Zcash transaction privacy part of the betting/donation flow rather than a passive balance lookup.

Trust/security posture: The README is unusually explicit about proof-of-concept status, legal/gambling risk, non-production use, and user responsibility.

Judge-facing documentation pattern: Narrative-first, with project docs, technical notes, screenshots, launcher script, and blunt limitations.

What ZecSafe should learn: Honest limitation language can increase credibility. Zcash privacy choices need to matter to the product story.

What ZecSafe must not copy: Do not use spectacle or legal-risk narrative as a substitute for a verifiable cryptographic proof path.

## Competitive Synthesis

The public field rewards projects that can be understood fast, verified fast, and remembered in a single line. The common winning pattern is not page volume. It is a concrete Zcash-specific event, evidence placed near the top, and a short proof path that judges can rerun or inspect.

ZecSafe should therefore avoid adding more dashboard breadth before the proof kernel exists. The next work must protect the three differentiators from `00-MISSION.md`:

1. failure-on-screen continuity proof;
2. intent-to-PCZT authorization binding;
3. privacy-preserving proof verification.

The central risk is overclaiming. The current prototype still cannot create a PCZT, bind reviewed intent to it, execute a real Zcash FROST spend, or verify a formal proof bundle. Until those are built, all public copy must stay in future-tense or prototype-truth language.

ZECSAFE COMPETITIVE POSITION

We do not win on:
- page count
- generic dashboards
- generic transaction lookups
- a future FROST roadmap

We compete on:
1. failure-on-screen continuity
2. intent-to-PCZT authorization binding
3. privacy-preserving proof verification

Fastest judge proof:
make judge-proof

Technical climax:
One participant is visibly unavailable; the two selected FROST participants review the spend context; ZecSafe proves the PCZT matches the reviewed intent; the A+B threshold authorization completes; the signed and proven PCZTs are combined; Zcash mainnet accepts the transaction; the redacted proof bundle verifies.

Public memory hook:
Lose one key, not your ZEC.

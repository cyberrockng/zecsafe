# ZecSafe Professional Website Redesign Prompt V4

Date: 2026-07-13
Status: Supersedes the V3 single-page "first-glance" redesign.
Purpose: Give Codex a complete, implementation-ready scope for rebuilding ZecSafe into a professional multi-page product website with a proper landing page, clear routes, stronger visual direction, and a separated proof/demo experience.

## Executive Correction

The current UI direction is wrong for a serious public-facing project website.

The mistake was treating the proof workflow as the homepage. A visitor should not land directly inside a dense proof demo with run IDs, txids, verifier gates, tamper controls, and all core features stacked vertically. That may be useful for judges who already know what they are testing, but it is not how a professional product website introduces itself.

The homepage must first explain what ZecSafe is, who it is for, why it matters, and what proof exists. From that landing page, visitors should be routed into focused sections: product overview, proof/demo, technical architecture, security/trust, documentation, and source links.

## Current UI Criticism

1. The homepage is overloaded.
   It puts Review, Verify, Authorize, Prove, Tamper Lab, proof facts, legal caveats, and evidence panels into one continuous page. This forces the user to understand the internals before understanding the product.

2. The navigation is fake product architecture.
   The current nav items are anchors into one page. A professional website needs real routes or route-like page states with distinct purposes, clear URLs, and focused page layouts.

3. The first impression is too technical.
   The hero currently looks like a proof console. It should feel like a polished security product: strong headline, immediate value proposition, credible visual metaphor, and clear calls to action.

4. The page lacks an emotional/product story.
   "Lose one key, not your ZEC" is strong, but the surrounding page does not build the narrative: key loss risk, multi-party custody, one unavailable signer, transaction safety check, public proof.

5. The visual system is not premium enough.
   The palette leans heavily on dark green, yellow, and flat cards. It feels like an internal dashboard rather than an award-caliber crypto/security site. It needs a more intentional brand system, more whitespace, stronger typography, richer section composition, and a less monotonous color rhythm.

6. Core proof features are exposed too early.
   Txids, timestamps, commitments, fingerprints, and proof gates are essential evidence, but they belong on the Proof page, not in the first viewport of the landing page.

7. The interaction model is narrow.
   The single-page demo has animation, but it does not provide a professional journey: Learn -> See how it works -> Verify proof -> Read security model -> Inspect source.

8. The current arrangement does not match high-end website patterns.
   Award-winning and premium product sites tend to use purposeful navigation, strong visual hierarchy, a memorable hero, section-level storytelling, restrained interactive moments, and focused pages. ZecSafe currently behaves more like a proof artifact viewer than a product website.

## Research Anchors

Use these as directional references, not templates to copy.

- Awwwards surfaces contemporary web design patterns including Sites of the Day, UI design, interaction design, WebGL/3D, scrolling, and business/corporate categories: https://www.awwwards.com/
- The Webby Gallery + Index positions award-winning digital work around discovery, excellence, categories, trends, and talent: https://winners.webbyawards.com/
- The rewrite should adopt the general lesson: premium websites create a clear entry point and then route visitors into deeper content, instead of making the homepage carry every detail.

## Non-Negotiable Product Truths

Do not make false claims.

- ZecSafe is a hackathon proof-of-concept, not audited production custody software.
- It demonstrates a 2-of-3 FROST threshold authorization control plane for shielded Zcash.
- It has a verified recorded mainnet run.
- The hosted UI replays recorded evidence; it is not a live signing session.
- The browser verifier can recompute the public proof bundle hash and tamper checks.
- The public proof does not reveal recipient, amount, memo, keys, shares, or secrets.
- Recovery is not demonstrated.
- The referenced NCC audit of ZF FROST did not include rerandomized FROST.
- Signer review mode is semantic PCZT review with stated limits.

## Target Site Architecture

Build a real multi-page structure. If staying with the existing vanilla JS/server setup, implement route-aware rendering and server fallback for these paths. If using separate static HTML files is simpler and compatible with the build allowlist, use that. Do not add a heavy framework unless absolutely necessary.

Required routes:

1. `/`
   Landing page. Explain ZecSafe as a product and route visitors to deeper sections.

2. `/proof`
   Interactive proof verification page. This is where the current Review -> Verify -> Authorize -> Prove flow belongs.

3. `/how-it-works`
   Plain-language explanation of the 2-of-3 authorization flow, Binding Firewall, FROST signing, PCZT completion, and proof export.

4. `/security`
   Trust model, limitations, privacy boundaries, audit caveats, and what is not demonstrated.

5. `/docs`
   Documentation hub linking README, Proof Spec, Privacy, Security, GitHub source, and verifier commands.

Optional route if time permits:

6. `/demo`
   A guided story route distinct from `/proof`, optimized for judges or demo viewers.

## Landing Page Requirements

The landing page must not be a proof console.

First viewport:

- Brand: ZecSafe.
- H1: "Lose one key, not your ZEC." or a stronger equivalent.
- Supporting copy: one or two sentences explaining that ZecSafe keeps shielded Zcash authorization usable when one signer is unavailable, while checking the transaction before signing and producing a verifiable public proof.
- Primary CTA: "Verify the mainnet proof" -> `/proof`.
- Secondary CTA: "See how it works" -> `/how-it-works`.
- Tertiary trust link: "Read the security model" -> `/security`.
- Visual: a premium, product-specific visual system showing a shielded vault, three signer nodes, one unavailable signer, and a proof trail. Do not use a generic dashboard card wall. Avoid low-effort SVG circuit wallpaper. A generated bitmap hero background or carefully crafted custom visual is acceptable.
- First viewport must hint at the next section on both desktop and mobile.

Landing sections after hero:

1. Problem
   "Single-key failure and coordination failure should not freeze shielded funds."
   Explain the risk in human terms.

2. Product promise
   Three crisp pillars:
   - Availability: 2-of-3 threshold can proceed with one participant unavailable.
   - Safety: Binding Firewall checks reviewed intent against prepared transaction.
   - Proof: recorded mainnet run can be verified without trusting the website.

3. How it works preview
   Four-step visual strip:
   Review intent -> Verify fields -> Authorize with threshold -> Prove the recorded run.
   This section links to `/how-it-works`.

4. Verified evidence
   A restrained evidence band:
   - Zcash mainnet
   - 2-of-3 FROST
   - 1 signer unavailable
   - Proof bundle recorded
   - Browser verifier available
   No full txid or hash wall on the landing page.

5. Interactive demo teaser
   Invite users to verify or tamper with the proof, but route them to `/proof`.

6. Security honesty
   A short high-trust section stating the limits plainly and linking to `/security`.

7. Final CTA
   "Verify the proof" and "Read the docs."

## `/proof` Page Requirements

Move the existing proof workflow here and improve it.

This page may keep the core logic from the current app:

- Load verified proof fixture.
- Replay ProofEvent state.
- Toggle PASS vs Mismatch safety test.
- Verify public proof in browser.
- Tamper Lab presets and JSON editor.
- Download public proof when valid.

But restructure the page:

- Top page intro: "Verify the recorded mainnet proof."
- Keep proof facts grouped in a compact evidence sidebar or top summary.
- The Review/Verify/Authorize/Prove flow should be a stepper for this page only, not the global website nav.
- Tamper Lab should be a dedicated section with clearer explanation and stronger result state.
- Technical caveats should be collapsible or grouped below the proof, not spread as repeated notes.

## `/how-it-works` Page Requirements

This page explains the system without requiring the visitor to inspect raw proof data.

Required sections:

1. The vault model
   Explain 2-of-3 signers and why one unavailable signer does not block authorization.

2. The transaction safety gate
   Explain Binding Firewall in plain language.

3. The threshold authorization
   Explain FROST at a high level without pretending the chain exposes a FROST marker.

4. The proof bundle
   Explain what gets recorded publicly and what stays private.

5. Failure path
   Show that a recipient mismatch blocks signing before FROST begins.

Use diagrams, timelines, or illustrated panels. Avoid dense tables on this page.

## `/security` Page Requirements

This page must be precise and honest.

Required sections:

- What ZecSafe proves.
- What ZecSafe does not prove.
- Public proof privacy boundary.
- Mainnet evidence boundary.
- Rerandomized FROST audit caveat.
- semantic_pczt_review limitation.
- Recovery not demonstrated.
- Hackathon proof-of-concept status.

The tone should be confident but not overstated.

## `/docs` Page Requirements

Create a clean documentation hub:

- README
- PROOF_SPEC
- PRIVACY
- SECURITY
- GitHub source
- Mainnet explorer transaction
- Verifier commands:
  - `make judge-proof-mainnet`
  - `make judge-proof-mainnet-tamper`
  - `npm run check`

This page can be utilitarian but should still match the visual system.

## Visual Direction

Create a more premium security/crypto brand system.

Avoid:

- A UI dominated by one dark green shade.
- Generic dashboard card stacking on the homepage.
- Giant raw hashes in the first viewport.
- Decorative SVG circuit wallpaper as the main art direction.
- Overcrowded cards.
- Marketing fluff that hides limitations.
- Purple/blue gradient SaaS sameness.
- Beige/brown monochrome palettes.

Explore:

- Deep graphite or near-black base.
- Zcash gold as a controlled accent, not the whole identity.
- Cool neutral surfaces: off-white, pale mint-gray, warm gray.
- One secondary accent such as teal or electric green for verified states.
- A danger accent for mismatch states.
- Large editorial typography on the landing page.
- Product-specific visual metaphors: shielded vault, threshold constellation, signer quorum, proof trail, locked transaction envelope.
- Full-width bands and composed sections instead of card nesting.
- Subtle motion that clarifies state transitions.

Suggested palette direction:

- Background light: `#f6f4ee` or `#f4f7f2`
- Ink: `#101815`
- Graphite: `#111817`
- Zcash gold: `#f4b728`
- Verified green: `#20b26b`
- Teal: `#1e7f78`
- Muted text: `#64716b`
- Border: `#d9dfd8`
- Error: `#d95c43`

Codex should test the palette visually and revise if it still feels monotonous.

## Typography and Layout

- Use a strong type hierarchy.
- Landing H1 should be hero-scale only on the landing page.
- Inner pages should use quieter headings.
- Use generous whitespace on the landing page.
- Use denser, functional layouts only on `/proof`.
- Keep card radius 8px or less unless a visual element has a clear reason.
- Avoid nested cards.
- Keep text readable and non-overlapping at 390px, 768px, 1280px, and 1440px widths.
- Do not scale font size directly with viewport width beyond sensible `clamp()` ranges.
- Letter spacing should be 0 except short uppercase labels.

## Navigation Requirements

Global nav:

- Logo -> `/`
- Product -> `/`
- Proof -> `/proof`
- How it works -> `/how-it-works`
- Security -> `/security`
- Docs -> `/docs`
- Primary nav CTA: "Verify Proof" -> `/proof`

Mobile nav:

- Use a compact menu or clean wrapped nav.
- No awkward horizontal scrolling.
- Active route must be visually clear and use `aria-current`.

Internal page steppers:

- The proof page can have Review/Verify/Authorize/Prove as local stepper tabs.
- These must not be confused with global navigation.

## Content Strategy

Landing copy must be plain and confident.

Good direction:

- "A 2-of-3 FROST authorization layer for shielded Zcash."
- "When one signer is unavailable, the vault can still authorize."
- "Before signing, ZecSafe checks that the prepared transaction matches the reviewed intent."
- "After the run, anyone can verify the public proof bundle."

Avoid:

- "Military grade."
- "Production ready."
- "Audited custody."
- "Unhackable."
- "Live mainnet signing" unless it is actually live.
- Any wording that implies the Zcash chain itself proves FROST participation.

## Implementation Scope

Codex should implement, not merely describe:

1. Refactor the frontend into route-aware views.
2. Preserve the existing proof verification logic and fixtures.
3. Move current proof workflow from homepage into `/proof`.
4. Build a new landing page at `/`.
5. Add `/how-it-works`, `/security`, and `/docs`.
6. Update nav and active-route behavior.
7. Update CSS into a coherent design system.
8. Update screenshot capture script to capture:
   - landing desktop
   - landing mobile 390
   - proof page
   - mismatch state
   - how-it-works
   - security
   - docs
9. Update metadata title/description for the new homepage.
10. Ensure existing verification tests still pass.

## Technical Constraints

- Keep the project lightweight.
- Prefer the existing vanilla JS/server architecture unless a strong reason exists.
- Do not add dependencies unless necessary.
- Keep public proof files and verifier behavior unchanged.
- Update `scripts/build-vercel.mjs` if new public files/routes are required.
- Update `server.mjs` route handling if direct route refreshes must serve the app.
- Preserve CSP/security posture.
- Preserve `npm run check`.

## Verification Checklist

Codex must run:

- `npm run check`
- `npm run screenshots`
- `git diff --check`

Codex must visually inspect screenshots at:

- 390px mobile
- 768px tablet
- 1280px desktop
- 1440px desktop

Acceptance criteria:

- A first-time visitor can understand ZecSafe from the homepage without reading a txid, hash, or proof gate.
- The homepage feels like a polished product site, not an internal proof dashboard.
- Proof verification remains available and credible on `/proof`.
- Limitations are not hidden, but they no longer dominate the first impression.
- Navigation is real, clear, and professional.
- No horizontal overflow or text overlap.
- All proof/security claims remain truthful.

## Final Instruction To Codex

Do not perform another small polish pass on the existing single-page UI. Rebuild the site information architecture.

The new design should make ZecSafe feel like a serious security product with a strong landing page, clear routes, and a dedicated proof verifier. Preserve the proof integrity, but stop making the proof console the front door.

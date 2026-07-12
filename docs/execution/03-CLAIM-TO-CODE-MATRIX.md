# Claim-to-Code Matrix

Status vocabulary:

```text
PROVEN
PARTIAL
EXPERIMENTAL
FALSE
UNKNOWN
```

## C-001

Claim: ZecSafe records a 2-of-3 FROST authorization path with one participant unavailable.
Where shown: `/demo`, `fixtures/verified-mainnet-run/proof.json`, `events.public.json`.
Current wording: "2 OF 3 FROST 1 UNAVAILABLE".
Implementation path: `src/app.js`, `src/demo-proof-state.mjs`, `src/frost-session-v1.mjs`.
Evidence: `npm run test:frost-session`, `npm run test:demo-proof-state`, `make judge-proof-mainnet`.
Status: PROVEN for the recorded verified mainnet run.
Allowed final wording: "Recorded verified mainnet run: 2-of-3 FROST completed with one participant unavailable."
Task required: Keep route labeled recorded/replay, not live ceremony.

## C-002

Claim: Binding Firewall blocks mismatched transaction semantics.
Where shown: `/demo` Binding Firewall panel.
Current wording: "SAFETY TEST - NOT A BROADCAST TRANSACTION".
Implementation path: `src/pczt-bind-v1.mjs`, `src/demo-proof-state.mjs`.
Evidence: `npm run test:bind`, `npm run test:demo-proof-state`.
Status: PROVEN for fixture/tested semantic mismatches.
Allowed final wording: "Binding Firewall blocks mismatched recipient, amount, network, memo/fee policy, and unexpected output cases covered by tests."
Task required: Do not imply every possible Zcash wallet policy is covered.

## C-003

Claim: A public proof can be verified offline.
Where shown: `/demo`, `DEMO.md`, `SUBMISSION.md`.
Current wording: "Download Public Proof", "Verify Proof".
Implementation path: `src/zecsafe-proof-v1.mjs`, `scripts/zecsafe.mjs`, `Makefile`.
Evidence: `make judge-proof-mainnet`.
Status: PROVEN.
Allowed final wording: "A judge can verify the recorded public proof offline with one command."
Task required: Do not claim the command re-executes the FROST ceremony or rebroadcasts.

## C-004

Claim: Tampering is detected.
Where shown: `DEMO.md`, `SUBMISSION.md`.
Current wording: "tamper demo".
Implementation path: `scripts/zecsafe.mjs proof tamper-demo`, `src/zecsafe-proof-v1.mjs`.
Evidence: `make judge-proof-mainnet-tamper`, `npm run test:proof`.
Status: PROVEN for the covered semantic mutations.
Allowed final wording: "The verifier rejects covered semantic mutations and bundle-hash changes."
Task required: Keep exact mutation set listed.

## C-005

Claim: Public proof excludes secrets and private transaction details.
Where shown: `PROOF_SPEC.md`, `PRIVACY.md`.
Current wording: "public-safe evidence".
Implementation path: `src/zecsafe-proof-v1.mjs`, `src/proof-event-v1.mjs`, `scripts/proof-data-classification.test.mjs`.
Evidence: `npm run test:proof-data`, `npm run security:scan`.
Status: PROVEN for repository fixtures and scanner patterns.
Allowed final wording: "Public proof excludes policy-excluded secret material and underlying recipient/amount/memo values; field labels are documented exceptions."
Task required: Run classification test before submission.

## C-006

Claim: ZecSafe does not custody funds.
Where shown: README, app boundary panels, SECURITY.md.
Current wording: "ZecSafe does not custody funds."
Implementation path: current app does not collect spending keys or broadcast from UI.
Evidence: `npm run security:scan`, route review, source review.
Status: PARTIAL because production custody is not implemented.
Allowed final wording: "This build does not custody funds or request spending keys."
Task required: Do not imply production custody safety.

## C-007

Claim: ZecSafe protects privacy.
Where shown: privacy/security docs.
Current wording: no privacy-blind coordinator claim allowed.
Implementation path: public proof redaction and data classification.
Evidence: `PRIVACY.md`, `SECURITY.md`, `npm run test:proof-data`.
Status: PARTIAL.
Allowed final wording: "Public proof minimizes disclosed data; coordinator and signers remain trusted for transaction privacy in the ZIP 312 model."
Task required: Do not claim privacy-blind or zero-knowledge coordinator.

## C-008

Claim: Zcash mainnet confirmed the transaction.
Where shown: verified fixture, `/demo` proof route.
Current wording: "Recorded status: CONFIRMED".
Implementation path: `fixtures/verified-mainnet-run/proof.json`, `docs/execution/30-VERIFIED-MAINNET-RUN.md`.
Evidence: txid `27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527`, height `3409837`, 4 confirmations at recording.
Status: PROVEN for recorded time.
Allowed final wording: "The recorded public proof states CONFIRMED at recording time."
Task required: Do not claim the recorded bundle updates to current chain state.

## C-009

Claim: Browser guardian acknowledgements are FROST signatures.
Where shown: legacy proposal/guardian UI must avoid this.
Current wording: browser acknowledgements are local ECDSA proposal-hash signatures.
Implementation path: `src/app.js`.
Evidence: UI copy and README boundary.
Status: FALSE if phrased as FROST.
Allowed final wording: "Browser acknowledgements are local proposal-hash signatures; recorded FROST provenance comes from the ZecSafe/FROST session."
Task required: Keep Intent Review wording.

## C-010

Claim: ZecSafe is audited or production-ready.
Where shown: must not be claimed.
Current wording: hackathon proof-of-concept, not audited production custody.
Implementation path: docs only.
Evidence: `SECURITY.md`, README limitations.
Status: FALSE if claimed.
Allowed final wording: "Not audited production custody software."
Task required: Include rerandomized-FROST audit caveat.

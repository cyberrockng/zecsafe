# Post-Hackathon Production Roadmap

ZecSafe's hackathon submission is a recorded proof-focused application. Turning it into
production custody software requires replacing the recorded demo path with a live,
custody-grade system. This roadmap records the work needed after the hackathon.

## 1. Live Signing Service

Build a real coordinator and signer network:

- Create real signing sessions.
- Connect real signer devices.
- Support live FROST rounds.
- Produce signed Zcash transactions from actual user-approved intents.

## 2. End-to-End Custody Flow

Add the full vault lifecycle:

- Create vaults.
- Add and remove participants.
- Set threshold policy.
- Prepare transactions.
- Review transactions.
- Sign.
- Broadcast.
- Monitor confirmations.
- Export proof.

## 3. Production Key Management

Move from demo fixtures to secure key handling:

- Hardware wallet or secure enclave support.
- Encrypted local signer state.
- Backup and restore flows.
- Key rotation.
- Participant replacement.
- Device loss handling.

## 4. Recovery System

Implement real recovery:

- Replace unavailable signers.
- Rotate threshold shares.
- Support emergency policy changes.
- Define time delays and approval rules.
- Prove recovery actions in an audit log.

## 5. Real Backend Infrastructure

Add backend services:

- Authenticated coordinator API.
- Session persistence.
- Encrypted event storage.
- Zcash RPC or indexer integration.
- Broadcast service.
- Monitoring and alerts.

## 6. Security Hardening

Complete before any mainnet custody launch:

- Threat model review.
- Cryptographic review.
- Penetration testing.
- Supply-chain hardening.
- Reproducible builds.
- Formal audit of coordinator, signer, and proof logic.

## 7. Production Proof System

Keep the proof model, but make it live:

- Generate proof bundles for every signing session.
- Include session transcript commitments.
- Include policy checks.
- Include signer approvals.
- Include transaction status.
- Keep private transaction details redacted.

## 8. User Product

Build the real user experience:

- Vault dashboard.
- Signer onboarding.
- Transaction review.
- Approval requests.
- Recovery flow.
- Audit and proof history.
- Notifications.

## Submission Boundary

The current submission should continue to describe ZecSafe as a proof-focused hackathon
artifact: a web application for inspecting a recorded Zcash threshold-authorization run,
verifying a public proof bundle, testing mismatch rejection, and documenting the security
limits. Production custody claims belong only after the roadmap above is implemented and
audited.

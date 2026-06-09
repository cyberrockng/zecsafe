# Threat Model

ZecSafe is a safety-vault prototype for Zcash users and teams. Its security goal is to reduce single-key and single-device failure without turning the coordinator into a custodian.

## Assets

- ZEC controlled by the future vault.
- Guardian key shares.
- Viewing keys used for read-only sync.
- Transaction proposals and approval metadata.
- Recovery contacts and vault configuration.

## Intended Protections

ZecSafe is designed to protect against:

- A stolen single device being enough to spend funds.
- A lost single device causing permanent loss of access.
- One person controlling a team treasury alone.
- Users approving payments without seeing recipient, amount, memo, and risk warnings.
- Recovery workflows that depend on one fragile backup.

## Recovery Abuse Risks

Recovery is intentionally treated as high risk because it can become a second path for attackers.

Threat actors may try to:

- Social-engineer guardians by impersonating the owner.
- Create fake emergency pressure.
- Use one compromised guardian plus one tricked guardian.
- Collude as malicious insiders in a team setup.
- Swap the new vault address during recovery.
- Exploit weak guardian identity or unclear device labels.
- Abuse instant recovery if there is no waiting period.

Prototype controls:

- Recovery requires a reason and written note.
- Guardians are warned to verify the owner out-of-band.
- New vault structure and removed/added guardian are shown clearly.
- A new vault address and fingerprint are displayed.
- Recovery uses a demo timelock before FROST readiness.
- Suspicious recovery can be flagged.
- Recovery events are written to the audit log.

## Current Prototype Limits

The current prototype does not yet protect real funds.

- Guardian approval acknowledgements are browser-side signatures over the proposal hash, but they are not Zcash spend signatures and are not produced on separate production guardian devices yet.
- Broadcast is simulated.
- FROST threshold signing is not implemented yet.
- The coordinator/server must not be treated as production secure.
- Public transparent address monitoring does not make transparent activity private.
- Viewing-key sync requires a configured local Zcash RPC endpoint.

## Sensitive Data Rules

Users should never paste:

- Seed phrases.
- Spending keys.
- Secret key shares.
- Full wallet backups.

Users may paste, for read-only sync only:

- Full viewing keys such as `uview1`, `uvf1`, or `zviews...`.

Production versions should keep viewing keys local or encrypted at rest.

## Trust Boundaries

Browser:

- Displays vault state, proposal details, and risk checks.
- Must not hold production spending authority alone.

Local server:

- Can proxy read-only Zcash RPC calls.
- Must not store spending keys.
- Must not approve proposals for guardians.

Coordinator:

- May relay encrypted signing messages.
- Must not have enough material to spend funds.
- Should not learn more wallet metadata than necessary.

Guardian device:

- Holds one share.
- Reviews the transaction locally.
- Produces a signature share only after user approval.

## Production Requirements

Before real funds are supported:

- Integrate audited Zcash FROST signing libraries.
- Use wallet libraries that correctly build Zcash transactions.
- Encrypt coordinator messages.
- Store guardian shares securely.
- Add recovery ceremonies with explicit user confirmation.
- Add rate limits and strict input validation on all API routes.
- Add tests for address validation, proposal integrity, and threshold state.
- Complete external security review.
- Use longer production recovery delays, such as 24-72 hours.
- Consider stronger recovery thresholds than normal payments.

## Residual Risks

- A compromised threshold of guardians can still authorize spending.
- A malicious UI could misrepresent proposal details if the guardian device is compromised.
- Viewing keys can reveal wallet activity and should be protected.
- Bugs in transaction construction or signing libraries can put funds at risk.
- Social recovery can be abused if guardian identity and intent are not verified.

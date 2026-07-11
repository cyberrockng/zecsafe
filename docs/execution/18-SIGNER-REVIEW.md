# ZSAFE-P0-012 - Signer Review Command

Status: `ZSAFE-P0-012` complete.

Completed UTC: `2026-07-11T17:39:21Z`.

## Outcome

ZecSafe now has a local selected-signer review gate before FROST authorization. The review command validates a `zecsafe-signer-review-package-v1`, checks the reviewed transaction details against the structured PCZT review and passing Binding Firewall report, links the package to the prepared signing context, compares the expected shielded SIGHASH fingerprint, and requires explicit local confirmation.

The implemented review mode is:

```text
semantic_pczt_review
```

This is intentionally not claimed as independent SIGHASH recomputation. The signer compares the prepared pinned-tool SIGHASH fingerprint from `ZSAFE-P0-011` and records that limitation.

## Files

```text
src/signer-review-v1.mjs
scripts/signer-review.mjs
scripts/signer-review-v1.test.mjs
src/fixed-runner-v1.mjs
src/proof-event-v1.mjs
scripts/verify.mjs
package.json
```

## CLI

```bash
npm run signer:review -- review <review-package.json> --confirm "I REVIEWED AND APPROVE" --summary
```

Exit behavior:

```text
0 = review PASS and FROST session ALLOWED
1 = invalid package, malformed JSON, or CLI misuse
2 = review FAIL or BLOCKED
```

The summary mode prints local signer-facing transaction details. The module, fixed-runner result, and ProofEvent exclude raw recipient, amount, memo text, raw PCZT, randomizers, nonces, private keys, and authorization material.

## Fixed Runner

`src/fixed-runner-v1.mjs` now implements:

```text
signer.review
```

It resolves the review package and PCZT path inside the fixed runner workspace, fingerprints local PCZT bytes, runs the signer-review validator, and emits a `FROST_SESSION` ProofEvent v1 with public-safe data:

```text
signer_review_mode
signer_review_status
reviewer_participant_id
reviewer_public_fingerprint
selected_public_fingerprints
group_fingerprint
pczt_fingerprint
source_fingerprint
binding_report_ref
sighash_fingerprint
check_statuses
limitations
```

## Private Boundary

The public result deliberately excludes signer-facing transaction values. Local CLI summary can show the selected signer what they are reviewing, but ProofEvent and runner evidence emit only statuses, fingerprints, public signer fingerprints, and limitations.

The confirmation phrase is:

```text
I REVIEWED AND APPROVE
```

Without that exact local confirmation, the review is `BLOCKED` and `frost.session.start` stays blocked.

## Negative Coverage

```text
missing explicit confirmation -> BLOCKED
reviewed amount mutation -> FAIL
displayed fee/output-count mutation -> FAIL
expected SIGHASH fingerprint mutation -> FAIL
reviewer not in selected signer set -> FAIL
unsupported independent_sighash claim -> rejected
raw recipient and amount excluded from module/fixed-runner public output
CLI summary prints local transaction review for the signer
fixed-runner signer.review emits public-safe ProofEvent v1
```

## Judge-Proof Impact

This task adds signer-review evidence to the future judge-proof path. The proof bundle can now show that a selected signer reviewed the transaction truth before FROST authorization, while preserving the limitation that review mode is semantic and does not yet independently rerun SIGHASH computation.

## Public-Safe Evidence Emitted

```text
review mode
review PASS/FAIL/BLOCKED status
checked field statuses
reviewer participant ID
reviewer public fingerprint
selected public fingerprints
PCZT fingerprint
source fingerprint
binding report reference
SIGHASH fingerprint
limitation statement
FROST_SESSION ProofEvent v1
```

## Private Material Intentionally Excluded

```text
raw PCZT bytes
recipient value in public evidence
amount value in public evidence
unredacted memo text
randomizer
nonce
private keys
spending keys
viewing keys
FROST secret shares
authorization material
wallet database
```

## Claim Boundary

Allowed: ZecSafe has a local selected-signer review command that validates a review package, requires explicit confirmation, emits public-safe PASS/FAIL/BLOCKED evidence, and blocks FROST start when review fails or is unconfirmed.

Forbidden: ZecSafe has not independently rerun SIGHASH computation inside signer review, started the real A+B FROST signing session, generated signing shares, signed/proved/combined a funded PCZT, broadcast a transaction, created `zecsafe-proof-v1`, or implemented `make judge-proof`.

## Verification

Focused verification passed:

```bash
npm run test:review
npm run test:events
npm run test:runner
npm run check:syntax
npm run verify
```

Full verification:

```text
npm run check
```

Result recorded in `HANDOFF.md`.

## Acceptance Criteria

- [x] `zecsafe-signer review` stack-equivalent implemented as `npm run signer:review -- review <package>`.
- [x] Review package schema validates run ID, group fingerprint, PCZT path, PCZT review, reviewed transaction details, intent commitment, expected SIGHASH fingerprint, and coordinator session reference.
- [x] Recipient, amount, memo policy, fee policy, unexpected output, and change-output checks are enforced through the Binding Firewall report and local displayed values.
- [x] SIGHASH fingerprint is compared to the prepared signing-context report.
- [x] Review mode is truthfully recorded as `semantic_pczt_review`.
- [x] Explicit local confirmation is required.
- [x] Fixed runner implements `signer.review`.
- [x] ProofEvent v1 records public-safe signer-review evidence.
- [x] Negative/tamper tests pass.
- [x] `npm run check` passes.

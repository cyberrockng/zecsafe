# ZecSafe Operator Notepad

Use this as your private runbook during judging. It is intentionally not shown in the main app UI.

## Winning Claim

ZecSafe is a Zcash mainnet safety vault proof-of-concept. It links a payment proposal, guardian cryptographic acknowledgements, real Zcash mainnet transaction proof, local FROST proof, and recovery controls into one exportable proof bundle.

## What To Show First

Start with Evidence Center, not the vault dashboard.

Judges first need to see that ZecSafe uses Zcash mainnet:

1. Live mainnet status.
2. Controlled Mainnet Proof checklist.
3. Transaction proof lookup.
4. Proof Bundle preview/export.

## Demo Flow

1. Open Evidence Center.
2. Show live Zcash mainnet status: block height, mempool, peers, timestamp.
3. Explain Controlled Mainnet Proof:
   - ZecSafe does not broadcast.
   - You broadcast tiny ZEC externally with a trusted wallet.
   - ZecSafe verifies the resulting mainnet txid.
4. Open Proposal Center.
5. Show proposal amount, recipient, memo, and proposal hash.
6. Sign proposal hash with guardians.
7. Show verified guardian signature fingerprints.
8. Return to Evidence Center.
9. Paste/check the externally broadcast mainnet txid.
10. Show confirmations and block height.
11. Run FROST Live Demo.
12. Generate Proof Bundle.
13. Show proposal hash, linked txid, confirmations, FROST status, and guardian signatures.
14. Download Proof Bundle JSON.
15. Open Recovery Center.
16. Show lost-device recovery, timelock, and suspicious flagging.
17. Open Threat Model.
18. Close with the production boundary.

## What To Say

Short pitch:

ZecSafe turns a Zcash mainnet transaction into verifiable security evidence. A proposal is hashed, guardians sign that hash locally, a real mainnet txid is verified and attached, local FROST proof is shown, and the final proof bundle exports the evidence for review.

## Claims To Use

- Mainnet status and transaction proof are real Zcash mainnet reads.
- Guardian acknowledgements are real browser-side signatures over the proposal hash.
- FROST output is real local tooling when the installed tools are available.
- Proof Bundle JSON is generated from the current evidence state.
- Broadcast is external/manual in this build.

## Claims To Avoid

- Do not say ZecSafe spends funds today.
- Do not say ZecSafe controls your wallet.
- Do not say guardian browser signatures are Zcash spend signatures.
- Do not say this is audited custody.
- Do not paste seed phrases, spending keys, wallet passwords, or private keys.

## Final Close

ZecSafe is mainnet-real where it should be safe today: evidence, transaction verification, and proof export. It intentionally keeps spending external until production Zcash transaction construction and FROST signing are integrated.

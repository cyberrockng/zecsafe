# ZecSafe Architecture

## Product goal

ZecSafe is a Zcash safety vault that protects users and teams from single-device or single-key failure. The target production design is a threshold wallet where multiple guardians hold key shares and a configured threshold must approve a spend.

## MVP scope

The hackathon MVP should prove the full user journey:

1. Create a vault with a threshold policy, such as 2-of-3.
2. Register guardian devices or trusted contacts.
3. Receive a small amount of ZEC on mainnet.
4. Create a transaction proposal.
5. Show human-readable review information.
6. Collect threshold approvals.
7. Sign and broadcast the transaction.

## Frontend modules

- Vault dashboard: balance, threshold, approval status, risk level.
- Proposal review: amount, recipient, memo, fee, and status.
- Guardian quorum: participant identity, approval state, last-seen state.
- Recovery flow: guarded migration to a newly created vault.

## Backend services

The production app will need a local or hosted coordinator. The coordinator should not hold enough key material to spend funds alone.

Coordinator responsibilities:

- Store vault metadata.
- Relay encrypted signing-round messages.
- Track proposal approval state.
- Connect to Zcash network services.
- Broadcast completed transactions.

The coordinator must not:

- Store complete spending keys.
- Approve proposals on behalf of guardians.
- Leak private wallet metadata beyond what is necessary for coordination.

## Zcash integration path

Recommended implementation stack:

- `librustzcash` crates for wallet and transaction primitives.
- `zcash_client_backend` for light-client sync and transaction proposal concepts.
- `frost-rerandomized` or current ZF FROST crates for threshold signing.
- lightwalletd, Zaino, or Zebra-backed infrastructure for mainnet access.

Relevant implementation areas:

- Orchard or Sapling spend authorization.
- Unified addresses.
- Viewing keys for balance and transaction display.
- Partially constructed transactions if the available libraries support the needed flow.
- Mainnet fee calculation and broadcast.

## Read-only mainnet status

The current prototype includes a backend Zcash infrastructure adapter. It calls `getblockchaininfo`, `getaddressbalance`, and `getrawtransaction` against Zcash mainnet infrastructure for read-only status, balance, and transaction proof.

The app also includes a local viewing-key balance route that can call `z_getbalanceforviewingkey` against a configured `zcashd` RPC endpoint. This is a narrow read-only bridge, not a complete light-client scanner.

Full shielded/unified sync should use lightwalletd, Zaino, or Zebra-backed compact blocks plus a Zcash scanning library. The browser should not try to infer private shielded balances from public explorer data.

The prototype also adds transaction proof lookup and browser-side guardian acknowledgement signatures. A proposal can be linked to a real mainnet transaction ID, and guardians can sign the stable proposal payload hash locally so the demo shows concrete chain evidence plus verifiable approval acknowledgement without pretending those signatures are Zcash spend signatures.

## Threat model

Intended protections:

- Single stolen guardian device cannot spend alone.
- Single lost guardian device does not destroy recovery options.
- Team treasury activity needs threshold approval.
- Payment details are reviewed before signing.

Current prototype limitations:

- Guardian approval acknowledgements are real browser-side signatures over the proposal payload hash, but not production FROST key-share signatures yet.
- Broadcast is simulated after threshold approval.
- Mainnet monitoring is read-only.
- Viewing-key balance sync requires a configured local Zcash RPC endpoint.
- Real fund protection requires audited FROST signing integration.

## FROST signing flow

High-level threshold signing sequence:

1. Vault setup creates distributed key shares.
2. A proposal defines the transaction intent.
3. Guardians verify the transaction details locally.
4. Selected guardians participate in a FROST signing round.
5. Signature shares are aggregated.
6. The completed transaction is broadcast to Zcash mainnet.

## Risk checks

Initial payment safety checks:

- Recipient address type.
- New or untrusted recipient warning.
- Large amount warning.
- Transparent address warning.
- Missing memo warning for known workflows.
- Threshold policy check.
- Recovery transaction check.

## Privacy model

ZecSafe should reveal as little as possible to the coordinator. Guardian devices should review transaction details locally. Metadata, proposal messages, and signing-round messages should be encrypted where possible.

## Hackathon fallback

If full FROST mainnet signing takes longer than the hackathon window, the fallback prototype should still demonstrate:

- Real mainnet balance reading.
- Real address validation.
- Transaction proposal creation.
- Verifiable local threshold acknowledgement UX.
- Clear documentation of the remaining signing integration.

The strongest submission should include at least one tiny real mainnet transaction.

# Privacy

ZecSafe's public demo and proof route are designed to expose only public-safe evidence.

## Public data

The public proof may include:

- run ID;
- recording timestamp;
- Zcash network;
- public txid;
- chain status;
- block height and confirmation count at recording;
- threshold count;
- unavailable participant count;
- selected signer public fingerprints;
- intent commitment;
- PCZT fingerprints;
- binding status;
- proof bundle hash;
- toolchain commit references;
- explicit limitations.

## Data not included in public proof

The public proof must not include:

- recipient address values;
- payment amount values;
- memo text;
- UFVK/FVK values;
- mnemonic or spending keys;
- FROST secret shares;
- randomizers;
- nonces;
- raw PCZT bodies;
- raw SIGHASH bytes;
- raw signatures;
- wallet databases;
- participant private configs;
- private logs.

`pczt.checks[].field` may contain field labels such as `recipient`, `amount`, and `memo_policy`; those are classification labels, not the underlying recipient, amount, or memo values. This exception is enforced by `npm run test:proof-data`.

## Coordinator privacy

ZecSafe does not claim that the coordinator has no transaction visibility.

In the ZIP 312 model, the coordinator and key-share holders are trusted with transaction privacy and unlinkability. Share holders can link a signing operation to a transaction. Network privacy is outside ZIP 312. ZecSafe does not remove those risks in this proof-of-concept.

## Viewing keys

Viewing-key sync is local infrastructure only. A viewing key can reveal wallet activity; it cannot spend funds, but it is still sensitive. Do not paste seed phrases or spending keys into ZecSafe.

## Browser storage

The frontend may store local proposal drafts and browser-generated acknowledgement state for the prototype. These acknowledgements are not Zcash spend signatures and should not be treated as production guardian devices.

## Mainnet transaction privacy

The recorded public txid is intentionally public for judging. Current chain observation can reveal more confirmations than the recorded bundle because the bundle is a frozen proof of the recording time.

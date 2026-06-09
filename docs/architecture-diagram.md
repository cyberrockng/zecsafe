# Architecture Diagram

```mermaid
flowchart TD
  User["User or team"] --> Vault["ZecSafe vault"]
  Vault --> Proposal["Transaction proposal"]
  Proposal --> Review["Local proposal review"]
  Review --> GuardianA["Guardian 1: Alice Laptop"]
  Review --> GuardianB["Guardian 2: Alice Phone"]
  Review --> GuardianC["Guardian 3: Recovery Contact"]
  GuardianA --> Threshold["2-of-3 threshold approval"]
  GuardianB --> Threshold
  GuardianC --> Threshold
  Threshold --> Frost["Future FROST signing layer"]
  Frost --> SignedTx["Fully signed Zcash transaction"]
  SignedTx --> Mainnet["Zcash mainnet broadcast"]

  Vault --> Monitor["Read-only mainnet monitor"]
  Monitor --> TransparentRpc["getaddressbalance"]
  Monitor --> TxProof["getrawtransaction"]
  Monitor --> ViewingKey["z_getbalanceforviewingkey when configured"]
  TransparentRpc --> Mainnet
  TxProof --> Mainnet
  ViewingKey --> Zcashd["Local zcashd RPC"]
  Zcashd --> Mainnet

  Coordinator["Future coordinator"] -. relays encrypted signing messages .-> GuardianA
  Coordinator -. relays encrypted signing messages .-> GuardianB
  Coordinator -. relays encrypted signing messages .-> GuardianC
  Coordinator -. cannot spend alone .-> Vault
```

## Production Notes

- Guardian devices should review transaction details locally before signing.
- The coordinator should relay messages but never hold enough material to spend.
- Viewing-key sync must stay read-only and should be encrypted or local-first.
- Real fund safety depends on audited Zcash wallet and FROST signing libraries.

# Architecture Diagram

```mermaid
flowchart TD
  Intent["Reviewed intent"] --> Commitment["Canonical intent commitment"]
  Commitment --> PCZT["Orchard PCZT"]
  PCZT --> Firewall["Binding Firewall"]
  Firewall -->|PASS| Sighash["Pinned-tool signing context / shielded SIGHASH"]
  Firewall -->|FAIL| Blocked["Signing blocked before FROST"]

  Sighash --> Frost["2-of-3 FROST session"]
  SignerA["Signer A available"] --> Frost
  SignerB["Signer B available"] --> Frost
  SignerC["Signer C unavailable"] -. not selected .-> Frost

  Frost --> Aggregate["Aggregate RedPallas signature"]
  Aggregate --> SignedPczt["Signed PCZT"]
  SignedPczt --> ProvenPczt["Proven PCZT"]
  ProvenPczt --> CombinedPczt["Combined PCZT"]
  CombinedPczt --> Txid["Txid extracted before broadcast"]
  Txid --> HumanGate["Human broadcast approval"]
  HumanGate --> Mainnet["Zcash mainnet confirmation"]
  Mainnet --> Proof["zecsafe-proof-v1 public bundle"]
  Proof --> CliVerifier["make judge-proof-mainnet"]
  Proof --> BrowserVerifier["Browser verifier / Tamper Lab"]
```

## Notes

- The hosted app replays a recorded mainnet proof; it is not a live wallet.
- The public proof excludes private transaction details, wallet material, signing shares,
  randomizers, UFVK material, and private PCZT internals.
- Zcash consensus validates the spend normally. It does not expose a special FROST marker.
- FROST provenance is evidenced by the recorded ZecSafe/FROST session and artifact
  fingerprints.

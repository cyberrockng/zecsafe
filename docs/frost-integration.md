# FROST Integration

ZecSafe uses FROST as the threshold authorization layer for the recorded shielded
Zcash proof run. It does not implement custom cryptography; FROST, RedPallas,
Orchard PCZT signing, proving, combining, and transaction extraction are delegated
to pinned upstream tools.

## Current Integration

The recorded mainnet run used:

| Component | Value |
|---|---|
| Threshold | 2 of 3 |
| Unavailable participant | C |
| Selected participants | A and B |
| Setup mode | DKG |
| Ciphersuite | `redpallas-rerandomized` |
| Network | Zcash mainnet |
| Txid | `27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527` |

The public verifier proves the recorded evidence is internally consistent and
anchored to the expected bundle hash. It does not rerun the historical FROST
ceremony.

## Pinned Tooling

| Tool | Pinned commit |
|---|---|
| ZF `frost-tools` | `7d33a95fecc91dacdb1503933e2bee43780d3293` |
| `zcash-devtool` | `1b065594d958d1cad2deafe7cd2e2fcc2774c46c` |
| PCZT signer library (librustzcash) | `8e6864a3c67cab3c64a052dd20f83c553662e8b2` |

## Pipeline

```text
reviewed intent
  -> PCZT
  -> Binding Firewall
  -> signing context / shielded SIGHASH
  -> FROST session with A+B, C unavailable
  -> aggregate signature
  -> signed PCZT
  -> proven PCZT
  -> combined PCZT
  -> human-approved broadcast
  -> confirmed Zcash mainnet txid
  -> public proof bundle
```

## Binding Boundary

The Binding Firewall is a semantic intent-to-PCZT check. It verifies the covered
recipient, amount, network, memo/fee policy, unexpected-output, and change-output
semantics before signing. It does not itself prove that the FROST group key is
the PCZT action's spend-authorization key.

That linkage is established by the pinned signer library verifying the aggregate
signature against the action's rerandomized verification key at apply time, and
is corroborated by Zcash consensus accepting the resulting shielded spend.

## Signer Review Mode

The recorded proof uses `semantic_pczt_review`: signers check PCZT semantics and
compare the prepared pinned-tool SIGHASH fingerprint. They do not independently
recompute the SIGHASH.

## Public Verification

Run:

```bash
make judge-proof-mainnet
make judge-proof-mainnet-tamper
```

Expected verdicts:

```text
VERDICT: VERIFIED RECORDED ZECSAFE PROOF
VERDICT: TAMPER DETECTION PASS
```

## Removed Prototype Surfaces

Earlier browser guardian acknowledgements, simulated broadcast, simulated recovery,
and the `/api/frost-demo` route are not part of the current product surface. Historical
references remain only in `docs/history/`.

## Limitations

- ZecSafe is not audited production custody software.
- Re-randomized FROST was not covered by the cited NCC audit of the ZF FROST repository.
- The pinned upstream tools are work-in-progress.
- Recovery, share repair, share refresh, and group migration are not demonstrated.
- The public proof is a redacted evidence bundle, not a zero-knowledge proof.

## References

- [Zcash Foundation FROST tooling](https://github.com/ZcashFoundation/frost-tools)
- [Zcash Foundation FROST book](https://frost.zfnd.org/)
- [ZecHub developer docs](https://zechub.wiki/developers)
- [Windows setup](frost-windows-setup.md)

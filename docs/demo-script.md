# Demo Script

Target length: 2 to 3 minutes.

## Opening

"ZecSafe is a Zcash mainnet safety vault proof-of-concept for reducing single-key failure. It combines live Zcash mainnet evidence, controlled mainnet transaction proof attachment, local threshold-signing proof, browser-side guardian signature acknowledgements, and hardened recovery in one security interface."

## Best Judge Flow

1. Start at the Security Command Center.
2. Point out:
   - Mainnet status.
   - FROST Demo status.
   - Vault Policy: 2-of-3.
   - Recovery Risk.
   - Broadcast disabled in prototype.
3. Open Vault Overview.
4. Say: "This is a 2-of-3 safety vault. ZecSafe does not custody funds; guardian shares stay local."
5. Open Evidence Center.
6. Show Live Mainnet Status:
   - Block height.
   - Mempool size.
   - Connected peers.
   - Last updated.
7. In Address Balance, click `Check Mainnet`.
8. Show:
   - Address type.
   - Balance.
   - Total received.
   - Source.
   - Checked time.
9. In Controlled Mainnet Proof, explain that the tiny ZEC transaction is broadcast externally with a trusted wallet.
10. In Transaction Proof, paste or check the mainnet txid.
11. Show:
   - Transaction found on Zcash mainnet.
   - Confirmation count.
   - Block height.
   - Linked proposal.
12. In FROST Verified Output, click `Run FROST Live Demo`.
13. Show:
   - Active proposal payload hash.
   - Group public key fingerprint.
   - Key-share fingerprints.
   - Commitments.
   - Partial signatures.
   - Aggregated signature.
   - Signature Verified.
14. Click `Generate Proof Bundle`.
15. Show the combined bundle status:
   - Proposal hash.
   - Linked txid.
   - Mainnet block.
   - Transaction confirmations.
   - FROST verified.
   - Guardian signatures.
   - Real-vs-simulated summary.
16. Open Proposal Center.
17. Review:
   - Proposal title.
   - Amount.
   - Recipient.
   - Proposal hash.
   - Recipient fingerprint.
   - Locked amount and memo.
   - Risk level.
   - Approval progress.
   - Guardian timeline.
   - Mainnet evidence badge.
18. Sign the proposal hash with enough guardians.
19. Show the verified local signatures and the status moving to FROST readiness.
20. Open Guardian Center.
21. Run a guardian health check and tick all three checklist items.
22. Show the 2-of-3 guardian model and local-share safety note.
23. Open Recovery Center.
24. Select Alice Phone as the lost device.
25. Enter a recovery reason, note, and out-of-band confirmation.
26. Create the recovery proposal.
27. Show:
   - New vault structure.
   - Removed guardian.
   - Added guardian.
   - New vault address.
   - Fingerprint.
28. Approve recovery with remaining guardians.
29. Show the timelock and final broadcast-disabled state.
30. Open Production Boundary.
31. Say clearly what is not live yet.
32. End at the Audit Log and show recorded events.

## Closing

"ZecSafe proves a mainnet evidence chain: proposal details become a stable hash, guardians sign that hash, a real externally broadcast Zcash mainnet txid is verified and attached, local FROST proof runs against the payload hash, and the final proof bundle exports the evidence. The remaining production work is in-app Zcash transaction construction, real multi-device FROST signing, and audited broadcast."

## Important Disclaimer

Say clearly in the demo:

- "Guardian approvals now create real browser-side signatures over the proposal payload hash."
- "Those guardian signatures are acknowledgement proofs, not Zcash spend signatures."
- "Mainnet monitoring is read-only."
- "The FROST Live Demo proves local threshold-signing output, but it is not yet bound to a Zcash spend transaction."
- "Transaction broadcast is external/manual in this build; ZecSafe verifies and attaches the resulting mainnet txid."
- "Recovery migration is simulated and does not move real funds."
- "Viewing-key balance requires local wallet infrastructure."
- "Never paste seed phrases or spending keys into ZecSafe."
- "Recovery is high-risk and should require independent owner verification."

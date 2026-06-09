# ZecSafe Submission Plan

## One-line pitch

ZecSafe is a FROST-based Zcash safety vault that protects users and teams from stolen keys, lost devices, and unsafe payments.

## Demo script

1. Open the dashboard and show the 2-of-3 vault.
2. Explain that one compromised device cannot spend alone.
3. Open the active payment proposal.
4. Review the amount, recipient, memo, and risk checks.
5. Approve from a second guardian.
6. Show the vault reaching the threshold and becoming ready to sign.
7. Attach a real transaction proof to the active proposal.
8. Run the recovery simulation for a lost guardian.
9. Explain the production path: FROST signing, transaction assembly, and mainnet broadcast.

## Winning angle

The project focuses on security safety instead of only wallet convenience. It addresses three serious user risks:

- Theft: one stolen device is not enough to move funds.
- Loss: one lost device does not destroy access.
- Mistakes: payment proposals are reviewed before signing.

## Final submission checklist

- Working prototype.
- Mainnet interaction.
- README setup instructions.
- Architecture and security notes.
- Open-source license.
- Short video demo.
- Pull request to the ZecHub repository.

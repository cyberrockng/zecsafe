# Discord Submission Post

Post this in the Zcash Global Discord `#zechub` channel for the final public
submission step.

```text
ZecSafe - ZecHub Hackathon 3.0 FROST track

Lose one key. Not your ZEC.

ZecSafe is a 2-of-3 FROST authorization control plane for shielded Zcash. The recorded run authorized a real shielded Zcash mainnet transaction while one signer was unavailable, checked the PCZT against reviewed intent before signing, and exported a public proof bundle judges can verify without a wallet or secret material.

Live site: https://zecsafe.vercel.app/
Proof route: https://zecsafe.vercel.app/proof
Source repo: https://github.com/cyberrockng/zecsafe
ZecHub PR: https://github.com/ZecHub/zechub/pull/1843
Demo video: https://youtu.be/B16fPtEGfnY
Mainnet tx: https://mainnet.zcashexplorer.app/transactions/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527

Judge verification:
git clone https://github.com/cyberrockng/zecsafe.git
cd zecsafe
make judge-proof-mainnet
make judge-proof-mainnet-tamper

Expected:
VERDICT: VERIFIED RECORDED ZECSAFE PROOF
VERDICT: TAMPER DETECTION PASS

Scope: this is a recorded proof-of-concept, not production custody software. Zcash validates the resulting spend authorization normally; the chain does not expose a special FROST marker. FROST provenance is shown by the recorded ZecSafe/FROST signing session and artifact fingerprints.
```

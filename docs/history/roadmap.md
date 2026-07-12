# ZecSafe Improvement Roadmap

```text
ZecSafe Improvement Roadmap
|
|-- STEP 1: Make the demo flow stronger and clearer
|   |
|   |-- 1.1 Fix the mainnet monitor behavior
|   |   |-- If address is typed, show: "Address ready to check"
|   |   |-- After checking, show balance/status clearly
|   |   `-- Avoid showing "No address loaded" when an address is already visible
|   |
|   |-- 1.2 Improve the approval state changes
|   |   |-- Before approval: 1/2 approvals
|   |   |-- After second approval: 2/2 approvals
|   |   |-- Change status to: "Threshold reached"
|   |   `-- Show new button: "Broadcast Transaction"
|   |
|   |-- 1.3 Add a visible audit log
|   |   |-- Proposal created
|   |   |-- Alice Laptop signed
|   |   |-- Alice Phone approved
|   |   |-- Threshold reached
|   |   `-- Broadcast pending / confirmed
|   |
|   `-- 1.4 Add a prototype honesty note
|       |-- Guardian approvals are simulated in this prototype
|       |-- Mainnet monitoring is read-only
|       `-- Production version will use Zcash FROST signing libraries
|
|-- STEP 2: Add stronger Zcash mainnet evidence
|   |
|   |-- 2.1 Confirm what the app can currently do
|   |   |-- Does "Check Mainnet" fetch real data?
|   |   |-- Does it validate a real transparent Zcash address?
|   |   |-- Does it display real balance?
|   |   `-- Does it show error messages if the address/API fails?
|   |
|   |-- 2.2 Improve the mainnet section
|   |   |-- Show address type: transparent / unified / shielded where possible
|   |   |-- Show balance
|   |   |-- Show last checked time
|   |   |-- Show source: explorer/API/node
|   |   `-- Show "Read-only mainnet monitoring" label
|   |
|   |-- 2.3 Add transaction proof field
|   |   |-- User enters a real Zcash transaction ID
|   |   |-- App checks or records the transaction ID
|   |   |-- App connects proposal to mainnet proof
|   |   `-- Demo shows the transaction/proof link
|   |
|   `-- 2.4 Prepare FROST integration explanation
|       |-- Explain current prototype flow
|       |-- Explain where FROST signing fits
|       |-- Mention 2-of-3 threshold authorization
|       `-- Clearly separate simulated approval from future real cryptographic signing
|
|-- STEP 3: Make it submission-ready
|   |
|   |-- 3.1 Create complete README.md
|   |-- 3.2 Add architecture diagram
|   |-- 3.3 Record demo video
|   `-- 3.4 Prepare GitHub pull request
|
`-- STEP 4: Add threat model
    |
    |-- 4.1 Define what ZecSafe protects against
    |   |-- Stolen single device
    |   |-- Lost single device
    |   |-- One-person treasury control
    |   |-- Unsafe payment approval
    |   `-- Accidental transaction mistakes
    |
    |-- 4.2 Define what the prototype does not yet protect
    |   |-- It does not perform real FROST signing yet
    |   |-- It does not custody or secure real funds yet
    |   |-- It does not replace a reviewed wallet implementation
    |   `-- It does not make public transparent activity private
    |
    |-- 4.3 Define sensitive data rules
    |   |-- Never paste seed phrases
    |   |-- Never paste spending keys
    |   |-- Only use viewing keys for read-only sync
    |   `-- Keep guardian shares local and encrypted in production
    |
    `-- 4.4 Define production security requirements
        |-- Use audited Zcash FROST signing libraries
        |-- Encrypt coordinator messages
        |-- Keep coordinator unable to spend
        |-- Require local transaction review before signing
        `-- Add security review before real funds
```

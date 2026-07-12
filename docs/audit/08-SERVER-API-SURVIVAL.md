# 08 — Server / API Truth Audit

Source: `server.mjs` (855 lines). Endpoint dispatch at `server.mjs:747-793`.

## Endpoint inventory

---
```text
Route:            GET /api/health
Consumer:         none (operational)
Actual purpose:   liveness
Data source:      static
Real/recorded/simulated:  REAL_LOCAL
Product relevance: low
Security risk:    none
Decision:         KEEP_CURRENT
Tests:            smoke-tested → 200
```
---
```text
Route:            GET /api/mainnet/status  AND  GET /api/mainnet-status  (duplicate)
Consumer:         Security Command Center (persistent header)
Actual purpose:   getblockchaininfo/getblockcount telemetry
Data source:      remote Zcash RPC (https://docs-demo.zec-mainnet.quiknode.pro/)
Real/recorded/simulated:  REAL_READ_ONLY
Product relevance: LOW — generic chain telemetry is not ZecSafe's proof
Security risk:    outbound RPC to a third-party demo endpoint; hardcoded
Decision:         DEMOTE (remove from first glance) + MERGE (two routes, one purpose)
Replacement:      Chain observation belongs on the proof detail page, clearly separated from
                  the recorded proof.
Tests:            smoke-tested → 200
```
---
```text
Route:            POST /api/mainnet/address-balance
Consumer:         transparent-address monitor UI
Data source:      getaddressbalance on a hardcoded default transparent address
                  (t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd)
Real/recorded/simulated:  REAL_READ_ONLY
Product relevance: NONE. ZecSafe is a *shielded* authorization product. A transparent balance
                  lookup is off-thesis and invites the "generic explorer" reading.
Security risk:    user-supplied address reaches an outbound RPC call (see 13-SECURITY-AUDIT)
Decision:         REMOVE_FROM_UI
```
---
```text
Route:            POST /api/viewing-key-balance
Consumer:         viewing-key balance form
Data source:      local zcashd (absent) → graceful fallback
Real/recorded/simulated:  DEAD / FALLBACK — README:61 concedes "Requires local zcashd"
Product relevance: none in the final stack
Security risk:    accepts a UFVK over HTTP into a server process. UFVKs are sensitive
                  (PRIVACY.md classifies them). A form that invites pasting a viewing key into
                  a locally-bound-but-actually-all-interfaces server is a real privacy hazard.
Decision:         DELETE
```
---
```text
Route:            POST /api/transaction-proof
Consumer:         "Controlled Mainnet Proof" / txid paste workflow
Data source:      local getrawtransaction/getblock, then public explorer fallback
Real/recorded/simulated:  REAL_READ_ONLY
Product relevance: This is the *old* proof story — paste an externally broadcast txid and have
                  ZecSafe verify it. V3 §7 (ZAUD-100) explicitly states this does NOT satisfy
                  the FROST proof.
Decision:         REMOVE_FROM_UI as "proof"; may survive as a chain-observation helper on the
                  proof detail page, clearly labelled as current chain observation and NOT as
                  proof of FROST provenance.
```
---
```text
Route:            POST /api/intent/create
Consumer:         proposal creation
Data source:      src/intent-v1.mjs (canonical intent + commitment)
Real/recorded/simulated:  REAL_LOCAL
Product relevance: CORE — this is the Binding Firewall's input
Decision:         KEEP_CURRENT
```
---
```text
Route:            GET|POST /api/frost-demo
Consumer:         "FROST Live Demo" (#frost-integration)
Data source:      spawns scripts/frost-demo.mjs → trusted-dealer/participant/coordinator over a
                  proposal payload hash
Real/recorded/simulated:  REAL_LOCAL, but over the WRONG message. It is a genuine FROST
                  signature over an application-invented hash, not over a Zcash shielded SIGHASH.
                  It is not spend authorization.
Product relevance: NEGATIVE — it competes with, and is weaker than, the real proof.
Decision:         REMOVE_FROM_UI (retain the script as a local diagnostic only)
```
---
```text
Route:            GET /api/proof-bundle          ***P0***
Consumer:         src/app.js:1592 (Evidence Center export)
Actual purpose:   the prototype's "judge proof"
Data source:      getblockchaininfo + getblockcount + getmempoolinfo + getpeerinfo
                  + getaddressbalance(DEFAULT transparent address)
                  + getTransactionProof(DEFAULT txid b138c395…cc368 — UNRELATED to the FROST run)
                  + a live local frost-demo run over sha256("ZecSafe proof bundle verification")
Real/recorded/simulated:  MIXED, and it says so itself — it emits a hardcoded block:
                      guardianApprovals:      "simulated"
                      transactionBroadcast:   "simulated"
                      recoveryMigration:      "simulated"
Product relevance: MUST NOT REMAIN THE JUDGE-PROOF SOURCE.
Security/privacy risk: reputational — it presents an unrelated default txid inside something
                  called a "proof bundle", and declares broadcast simulated while a real,
                  confirmed mainnet broadcast exists (27d0e850…8527).
Decision:         DELETE
Replacement:      fixtures/verified-mainnet-run/proof.json + events.public.json, already served
                  as static files and already consumed by /demo (src/app.js:153-154, 3514-3515).
Tests:            npm run check must still pass after removal.
```

## Required determination

> *Should the final first-glance product expose these?*

**No.** Of nine endpoints, two are core (`/api/intent/create`, `/api/health`), one is a demotable helper (`/api/transaction-proof` as chain observation only), and six should be removed or deleted from the product surface.

**`/api/proof-bundle` must not remain the judge-proof source.** It still generates the older telemetry/demo bundle. The final UI already uses the `zecsafe-proof-v1` verified fixture on the `/demo` route — the correct source is present and working; the stale one simply has not been removed.

**A default sample txid must never be confused with the verified FROST run.** `DEFAULT_PROOF_TXID = b138c395…cc368` (src/app.js:146, server.mjs) is currently embedded in an endpoint literally named `proof-bundle`. This is the most dangerous single artifact in the server surface.

## Static file serving — FINDING

`server.mjs:809, 832` serve the **entire repository root**. Confirmed reachable at runtime:

```text
GET /.git/HEAD              → 200
GET /.git/config            → 200
GET /server.mjs             → 200
GET /package.json           → 200
GET /HANDOFF.md             → 200
GET /docs/operator-notepad.md → 200
```

Path traversal itself is correctly blocked (`normalize()` + `../` strip; `/../../../etc/passwd` and encoded `..%2f` both → 404). The issue is not traversal — it is that the document root **is** the repository. See 13-SECURITY-AUDIT.md (SEC-002).

## Bind address — FINDING

`server.mjs:853`: `server.listen(port, () => …)` — **no host argument**, so Node binds `::`/`0.0.0.0`. Confirmed: `ss -tlnp` shows `LISTEN *:4890`. The startup log nevertheless prints `ZecSafe listening on http://127.0.0.1:4173`. The server is reachable from the local network while telling the operator it is not. See 13-SECURITY-AUDIT.md (SEC-001).

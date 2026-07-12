# 09 — FROST Group and Participant Security Audit

Evidence level: **B_PRIVILEGED** (external run artifacts, hashed not disclosed) + **A_PUBLIC**.

## ZAUD-600 — Group setup: **PASS**

| Property | Value | Evidence |
|---|---|---|
| Group setup mode | **DKG** (not trusted-dealer) | `HANDOFF.md:146, :544` "group setup mode: DKG"; `docs/execution/09-DKG-FEASIBILITY.md` |
| Ciphersuite | `redpallas-rerandomized` | `proof.json.vault.ciphersuite` |
| Threshold | 2 | `proof.json.vault.threshold` |
| Participants | 3 | `proof.json.vault.participants_total` |
| Group fingerprint | `sha256:bbdab30a…0354` | `proof.json.vault.group_fingerprint`, matches `selection-result.json` and `frost-session-report.json` |
| Secret material outside repo | YES | `/home/dell/.zecsafe/runs/p0-021/configs/*.toml`, gitignored; zero secrets in Git history |

**Note (documentation defect, not implementation defect):** the real mainnet group used **DKG**, which is the stronger claim. But `README.md:55, :251` only ever describes `trusted-dealer` — because it is describing the *old* `frost-zcash-demo` local wrapper. The project is currently under-claiming its own group setup in public documentation while over-claiming elsewhere. Recorded as CLAIM-07 in `05-CLAIM-TO-CODE-MATRIX.md`.

The pinned `frost-tools` README itself warns that trusted-dealer mode "is tests-only and does not preserve all share-validation information" (`docs/execution/05-TOOLCHAIN-PINS.md:64`). The real run correctly avoided it.

## ZAUD-601 — Participant independence: **PASS (with correct scoping)**

Three distinct participant profiles exist as separate configurations and separate processes:

```text
/home/dell/.zecsafe/runs/p0-021-.../configs/{alice,bob,eve}.toml     ← 3 distinct configs
/home/dell/.zecsafe/runs/p0-021-.../contacts/{alice,bob,eve}.contact ← 3 distinct contacts
HANDOFF.md:643 — "frostd + separate Alice/Bob participant processes + coordinator with
                  PCZT-bound Orchard randomizer"
```

Distinct public fingerprints, cryptographically independent:

```text
A: sha256:a0c24753e044d224a7e5a9d7b572f6abb14375693b090e4c24b49cd856c52b0b
B: sha256:533c516a94d7d1dec4192dd46afb1fe02620ce6bbd974736d0cfe7c36ec14cf5
C: sha256:d6400dfe81d098e85cce57fe785b15c2ae5a3916e9b319022af6d14c2e31213c
```

- Shares stored separately, per participant config — **PASS**.
- Hosted web app does not hold shares — **PASS** (`NOT_DEPLOYED`; shares are outside the repo entirely).
- No single ZecSafe process secretly signs as all participants — **PASS**: separate participant processes coordinated over `frostd` with per-run TLS.

**Required honesty scoping (V3 ZAUD-601):** this is *separate participant processes and configurations on one machine*, **not** independent real-world custodians. The audit finds **no claim of geographic or organizational distribution** anywhere in the repository. The project correctly does not overstate this.

## ZAUD-602 — Unavailable participant proof: **PASS — CONFIRMED**

This is Differentiator 1, and it holds.

`p0-021/artifacts/selection-result.json`:

```json
{ "threshold": 2, "participant_total": 3, "available_count": 2, "unavailable_count": 1,
  "participants": [
    { "participant_id": "A", "public_fingerprint": "sha256:a0c24753…", "availability": "AVAILABLE",   "selected": true  },
    { "participant_id": "B", "public_fingerprint": "sha256:533c516a…", "availability": "AVAILABLE",   "selected": true  },
    { "participant_id": "C", "public_fingerprint": "sha256:d6400dfe…", "availability": "UNAVAILABLE", "selected": false }
  ],
  "selected_count": 2 }
```

- C is `UNAVAILABLE` **before** session creation and `selected: false` — **PASS**.
- A and B selected — **PASS**.
- The two `selected_signers` in the **public** `proof.json` are exactly A's and B's fingerprints — **PASS**. C's fingerprint appears nowhere in the selected set.
- Session succeeded with A+B (`THRESHOLD_REACHED`) — **PASS**.
- Session blocks with fewer than threshold — **PASS**, covered by `scripts/signer-selection-v1.test.mjs` and `scripts/frost-session-v1.test.mjs` (both green in `npm run check`); zero/one-signer cases are in the mandatory failure tests (see 17).

C was genuinely offline for the ceremony (`HANDOFF.md:763`, "with Eve offline"). This is not a UI flag — it is reflected in the coordinator's selection input and in the FROST session's selected set.

## ZAUD-603 — FROST round evidence: **PASS**

`p0-021/artifacts/frost-session-report.json`:

```text
schema_version:               zecsafe-frost-session-v1
status:                       THRESHOLD_REACHED
aggregate_signature_status:   AGGREGATE_SIGNATURE_VERIFIED
session_fingerprint:          sha256:cd6d729fcccc48458027b584cbc32363b65c83a9c29e7d2c91e5f1211605d9f8
selected_public_fingerprints: [A, B]   (match above)
unavailable_participant_count: 1
pczt_fingerprint:             sha256:3823d5eb…2931   ← binds session to the reviewed PCZT
sighash_fingerprint:          sha256:cd551487…9928   ← binds session to the shielded SIGHASH
aggregate_signature_fingerprint: sha256:c9b7508c…12ac
signature_byte_length:        64
tool_commit:                  7d33a95fecc91dacdb1503933e2bee43780d3293  (frost-tools, pinned)
blocked_operations:           []
```

Aggregate signature is **64 bytes** — the correct RedPallas/Schnorr signature length, verified against the raw artifact (`stat -c%s aggregate-signature.raw` = 64). Round 1/Round 2 chronology is recorded in the ceremony logs. Raw nonces and shares are correctly **not** disclosed publicly, as V3 permits.

Critically: `session_fingerprint`, `pczt_fingerprint`, `binding_report_ref`, and `sighash_fingerprint` all appear in the **public** `proof.json.frost` block and all match the Level B artifacts byte-for-byte. The session is cryptographically bound to the specific reviewed transaction — it is not a free-floating signature.

## ZAUD-604 — Replay / substitution: **PASS**

Every substitution is rejected. `make judge-proof-mainnet-tamper` (exit 0) mutates and detects:

```text
txid                  REJECTED
threshold             REJECTED
group_fingerprint     REJECTED
selected_signer       REJECTED
intent_commitment     REJECTED
pczt_fingerprint      REJECTED
binding_status        REJECTED
```

An old session cannot be paired with a new PCZT or a new intent: the session report carries `pczt_fingerprint` and `binding_report_ref`, and the canonical bundle hash covers them. Changing the participant set changes `selected_signers`, which is hashed. Wrong group changes `group_fingerprint`, which is hashed. `scripts/frost-session-v1.test.mjs` covers stale-session and wrong-group negatives directly.

## ZAUD-502 — Do-not-rebuild boundary: **PASS**

Searched for custom implementations of FROST nonce generation, secret sharing, signature-share aggregation, RedPallas, PCZT format, Orchard proving, and Zcash consensus validation. **None found.** Every cryptographic operation is delegated to pinned upstream tooling (`frost-tools` `7d33a95f`, `zcash-devtool` `1b065594`, librustzcash `8e6864a3`). ZecSafe's own `src/*.mjs` modules perform intent canonicalization, semantic binding checks, selection logic, event projection, and proof serialization — orchestration and verification, not cryptography. This is the correct architecture and a significant point in the project's favour.

## FROST limitations (must remain disclosed)

- Rerandomized FROST was **not** covered by the NCC audit of the ZF FROST repository. Disclosed in README:7, SUBMISSION.md:89.
- The pinned `frost-tools` and `zcash-devtool` both self-describe as WIP / not production-ready. Disclosed in `05-TOOLCHAIN-PINS.md`.
- Signer review mode is `semantic_pczt_review`, **not** `independent_sighash` — see 10-PCZT-AND-BINDING-AUDIT.md (ZAUD-904).

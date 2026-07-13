> **Historical archive.** This document is part of ZecSafe's development and audit ledger.
> It records the repository state *at the time it was written* and may describe surfaces,
> verdicts, or blockers that have since been removed or resolved. For the current product,
> start at the top-level `README.md`.

# 24 — CLOSE-001 Remediation Retest

## Verdict

```text
CLOSE-001: RESOLVED
REMEDIATION COMMIT: fbecd37de26309c5d2024dcff2b77f26d2ed60b0
RECORDED MAINNET PROOF: UNCHANGED AND VERIFIED
```

The synthetic Binding Firewall mismatch is now a coherent counterfactual failure path. It stops at the failed semantic review, immediately reports `BLOCKED`, never imports the recorded run's later FROST/PCZT/mainnet outcomes into the synthetic state, and cannot be downloaded as the recorded public proof.

This retest closes only CLOSE-001 from `23-CURRENT-COMMIT-CLOSEOUT.md`. R-05 and CLOSE-002 through CLOSE-006 retain their recorded statuses.

## Baseline

| Item | Value |
|---|---|
| Finding commit | `c5d1750941e89a146941a9a55455e736a69c35b2` |
| Audit record commit | `b4aaa64` |
| Remediation commit | `fbecd37de26309c5d2024dcff2b77f26d2ed60b0` |
| Retest environment | clean local clone at the remediation commit |
| Browser | Chrome 149.0.7827.55, clean temporary profile, loopback only |
| Retest UTC | 2026-07-12T23:16:38Z |

## Remediation

1. `createBindingMismatchEvents()` now returns only the two mutated review events. It does not retain the real run's `THRESHOLD_REACHED` or `PCZT_COMBINE PASS` events.
2. The synthetic review marks both `recipient: FAIL` and aggregate `binding: FAIL`; unaffected semantic checks remain PASS.
3. A single pure presentation model owns the aggregate strip, authorization state, flow state, fact panel, verifier availability, and download availability.
4. Synthetic mode immediately renders:

   ```text
   BLOCKED
   FROST: NOT STARTED
   PCZT completion: NOT RUN
   Mainnet: NOT BROADCAST
   Proof: NO EXPORT
   ```

5. The browser download control is disabled in mismatch mode. The export function independently rejects a synthetic-mode call, so bypassing the button cannot produce a mixed proof/event/replay artifact.
6. Verified exports now self-identify as `zecsafe-public-proof-export-v1`, `mode: recorded_verified`, `synthetic: false`.
7. The PASS/Mismatch controls now expose `aria-pressed` state.

## Rendered-browser result

Evidence: [`evidence/close-001-fbecd37/ui-audit.json`](evidence/close-001-fbecd37/ui-audit.json).

| Assertion | Before | After |
|---|---|---|
| Aggregate verdict immediately after selecting mismatch | `PROOF VERIFIED` | `BLOCKED` |
| Recipient check | FAIL | FAIL |
| Aggregate binding row | PASS | FAIL |
| Historical threshold state in synthetic flow | `THRESHOLD_REACHED` | `NOT STARTED — BLOCKED BY BINDING FIREWALL` |
| Historical completion state in synthetic flow | conflicting PASS/FAIL rows | `NOT RUN — SIGNING WAS BLOCKED` |
| Historical mainnet state in synthetic flow | `CONFIRMED` | `NOT BROADCAST — SYNTHETIC SAFETY TEST` |
| Synthetic proof state | original proof hash shown | `NO EXPORT — SYNTHETIC SAFETY TEST` |
| Verify control | enabled until manually clicked | disabled, `Safety Test Blocked` |
| Download control | enabled mixed-artifact export | disabled, plus function-level rejection |

The mobile view places `Binding Firewall: FAIL` and “Signing blocked before FROST” above the field list. Evidence: [`ui-binding-mismatch-390.png`](evidence/close-001-fbecd37/ui-binding-mismatch-390.png). Desktop submission evidence was regenerated at `docs/screenshots/04-binding-mismatch.png`.

The clean-clone browser audit also reconfirmed zero horizontal overflow at 1440, 1280, and 390 pixels; named interactive controls; visible keyboard focus; reduced-motion behavior; and fail-closed missing/malformed fixture states.

## Export-integrity regression coverage

`scripts/demo-presentation.test.mjs` asserts:

- verified mode remains `PROOF VERIFIED` and export-enabled;
- mismatch mode has the exact five-part blocked evidence strip;
- mismatch mode contains no txid or proof bundle hash in its synthetic fact panel;
- later FROST, PCZT, mainnet, and proof states are explicitly absent/not run;
- verified export metadata is explicit and its event log/replay are consistent;
- mismatch export throws before creating an artifact.

`scripts/demo-proof-state.test.mjs` additionally asserts that the mismatch reducer has no threshold-reached, combined-PCZT, txid, broadcast-success, or later-stage check fields.

## Exact clean-clone results

| Command | Result |
|---|---|
| `npm run check` | exit 0, including new presentation/export tests, syntax, and security scan |
| `make judge-proof-mainnet` | exit 0 — `VERDICT: VERIFIED RECORDED ZECSAFE PROOF` |
| `make judge-proof-mainnet-tamper` | exit 0 — 7/7 mutations rejected |
| `make proof-run-dry` | exit 0 — 14 PASS and expected human broadcast WAIT |
| Chromium audit harness | exit 0 — coherent mismatch state and disabled controls observed |

## Proof and screenshot safety

The recorded proof fixture was not modified:

```text
fixtures/verified-mainnet-run/proof.json
sha256:3317b4cecf0cad0b7271a41feb457f4200e65dbc8b240c46d7e1def812033075
```

All seven submission screenshots plus the five retest captures contain no PNG text or EXIF metadata chunks. No stale prototype screenshot filename is present. Machine-readable results are in [`evidence/close-001-fbecd37/retest-summary.json`](evidence/close-001-fbecd37/retest-summary.json) and [`screenshot-safety.json`](evidence/close-001-fbecd37/screenshot-safety.json).

## Release conclusion

CLOSE-001 no longer blocks recording. The product now keeps the immutable successful mainnet proof and the synthetic mismatch demonstration visibly and structurally separate. Hackathon release remains gated by R-05: demo video, ZecHub PR, and Discord-post evidence.

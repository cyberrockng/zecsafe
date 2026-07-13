import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { canonicalizeJson as canonicalizeJsonNode } from "../src/intent-v1.mjs";
import { computeProofBundleHash, verifyZecsafeProofV1 } from "../src/zecsafe-proof-v1.mjs";
import {
  TAMPER_PRESETS,
  canonicalizeJson,
  computeProofBundleHashBrowser,
  verifyProofInBrowser,
} from "../src/verify-browser.mjs";

const proof = JSON.parse(await readFile("fixtures/verified-mainnet-run/proof.json", "utf8"));

function gateSummary(result) {
  return result.checks.map((check) => `${check.name}:${check.status}`);
}

// The browser mirror must canonicalize and hash exactly like the authoritative modules.
assert.equal(canonicalizeJson(proof), canonicalizeJsonNode(proof), "browser canonicalization must match intent-v1");
assert.equal(
  await computeProofBundleHashBrowser(proof),
  computeProofBundleHash(proof),
  "browser bundle hash must match zecsafe-proof-v1",
);

const nodeVerified = verifyZecsafeProofV1(proof);
const browserVerified = await verifyProofInBrowser(proof);
assert.equal(nodeVerified.status, "PASS", "authoritative verifier must pass the recorded fixture");
assert.equal(browserVerified.status, "PASS", "browser verifier must pass the recorded fixture");
assert.equal(browserVerified.verdict, nodeVerified.verdict, "verdict strings must match");
assert.deepEqual(gateSummary(browserVerified), gateSummary(nodeVerified), "gate names and statuses must align on the fixture");

for (const preset of TAMPER_PRESETS) {
  const tampered = structuredClone(proof);
  preset.apply(tampered);

  const nodeResult = verifyZecsafeProofV1(tampered);
  const browserResult = await verifyProofInBrowser(tampered);

  assert.equal(nodeResult.status, "FAIL", `authoritative verifier must reject preset ${preset.id}`);
  assert.equal(browserResult.status, "FAIL", `browser verifier must reject preset ${preset.id}`);
  assert.deepEqual(
    gateSummary(browserResult),
    gateSummary(nodeResult),
    `gate statuses must align for preset ${preset.id}`,
  );
  assert.notEqual(
    browserResult.computed_bundle_hash,
    tampered.bundle_hash,
    `preset ${preset.id} must change the computed bundle hash`,
  );
}

// Free-form structural damage must still be rejected by the browser mirror.
const mangled = structuredClone(proof);
delete mangled.frost;
const mangledResult = await verifyProofInBrowser(mangled);
assert.equal(mangledResult.status, "FAIL", "browser verifier must reject a proof missing sections");

console.log("Browser verifier mirror tests passed.");

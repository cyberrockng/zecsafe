import assert from "node:assert/strict";
import { parseZcashDevtoolPcztInspect, EXPECTED_ZCASH_DEVTOOL_COMMIT } from "../src/pczt-inspect-v1.mjs";

const validInspect = `1 transparent inputs
- 0: 20000 zatoshis, SIGHASH_ALL
  Signatures present: 0
  Pay-to-PubKey-Hash (P2PKH)
1 transparent outputs
- 0: 10000 zatoshis to tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67

TxID: 67c6d3aaca6c67f56ace5a59c279be17b8c65687f464cb1aef0977d70840e1b8
Version: V6`;

const options = {
  network: "test",
  pcztBytes: Buffer.from("fixture pczt bytes"),
  toolIdentity: {
    name: "zcash-devtool",
    commit: EXPECTED_ZCASH_DEVTOOL_COMMIT,
  },
};

function assertRejected(rawInspect, expectedMessage, overrideOptions = {}) {
  assert.throws(() => parseZcashDevtoolPcztInspect(rawInspect, { ...options, ...overrideOptions }), {
    name: "PcztInspectError",
    message: expectedMessage,
  });
}

{
  const review = parseZcashDevtoolPcztInspect(validInspect, options);
  assert.equal(review.network, "test");
  assert.equal(review.source, "zcash-devtool pczt inspect");
  assert.equal(review.recipients.length, 1);
  assert.equal(review.recipients[0], "tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67");
  assert.deepEqual(review.amounts_zatoshis, [10000]);
  assert.equal(review.output_count, 1);
  assert.equal(review.fee_metadata.fee_zatoshis, 10000);
  assert.match(review.source_fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.match(review.pczt_fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(review.transaction_version, "V6");
}

assertRejected(
  validInspect.replace(/\nVersion: V6$/, ""),
  "missing Version.",
);

assertRejected(
  validInspect.replace("- 0: 10000 zatoshis to", "- 0: ten thousand zatoshis to"),
  "malformed transparent output line.",
);

assertRejected(
  `${validInspect}\nUnexpected: field`,
  "unexpected extra inspect output.",
);

assertRejected(validInspect, "unsupported zcash-devtool commit.", {
  toolIdentity: {
    name: "zcash-devtool",
    commit: "0000000000000000000000000000000000000000",
  },
});

console.log("ZecSafe PCZT inspect v1 tests passed.");

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

const validIronwoodInspect = `5 Ironwood actions:
- 0:
  - Spend: 100000000 zatoshis
  - Output: 22493750 zatoshis
- 1:
  - Spend: Zero value (likely a dummy)
  - Output: 22493750 zatoshis
- 2:
  - Spend: Zero value (likely a dummy)
  - Output: 22493750 zatoshis
- 3:
  - Spend: Zero value (likely a dummy)
  - Output: 22493750 zatoshis
- 4:
  - Spend: Zero value (likely a dummy)
  - Output: 10000000 zatoshis to utest12erssr45tfcpehtq3l9fmjug9304k8vs8c0lk702fs2e70q8tpv4ekd6ncfrgnnsymdgwl99eux7t94pzgd6d2ud2k5r3dtsvzm3mkz2rzrewv0qfxsw86up2lj7kg85lnkrggg78aypn7tu35r5ukgkhlxlqjqlu5jgwfc0tl9q5aktm64xv6jq99d9ax72u2yrn9w0cd3rqr5u0v8

TxID: 1e127fa6628a50b0264debc2288e0dee83350031b4576ba698da35d819b2770b
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
  assert.equal(review.pool, "transparent");
  assert.equal(review.recipients.length, 1);
  assert.equal(review.recipients[0], "tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67");
  assert.deepEqual(review.amounts_zatoshis, [10000]);
  assert.equal(review.output_count, 1);
  assert.equal(review.fee_metadata.fee_zatoshis, 10000);
  assert.match(review.source_fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.match(review.pczt_fingerprint, /^sha256:[0-9a-f]{64}$/);
  assert.equal(review.transaction_version, "V6");
}

{
  const review = parseZcashDevtoolPcztInspect(validIronwoodInspect, options);
  assert.equal(review.pool, "ironwood");
  assert.equal(review.output_count, 5);
  assert.equal(review.ironwood_action_count, 5);
  assert.equal(review.outputs.filter((output) => output.role === "change").length, 4);
  assert.equal(review.outputs[4].role, "recipient");
  assert.equal(
    review.outputs[4].recipient,
    "utest12erssr45tfcpehtq3l9fmjug9304k8vs8c0lk702fs2e70q8tpv4ekd6ncfrgnnsymdgwl99eux7t94pzgd6d2ud2k5r3dtsvzm3mkz2rzrewv0qfxsw86up2lj7kg85lnkrggg78aypn7tu35r5ukgkhlxlqjqlu5jgwfc0tl9q5aktm64xv6jq99d9ax72u2yrn9w0cd3rqr5u0v8",
  );
  assert.deepEqual(review.amounts_zatoshis, [10000000]);
  assert.equal(review.fee_metadata.input_total_zatoshis, 100000000);
  assert.equal(review.fee_metadata.output_total_zatoshis, 99975000);
  assert.equal(review.fee_metadata.fee_zatoshis, 25000);
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

assertRejected(
  validIronwoodInspect.replace("  - Output: 22493750 zatoshis", "  - Output: many zatoshis"),
  "malformed Ironwood output line.",
);

assertRejected(validInspect, "unsupported zcash-devtool commit.", {
  toolIdentity: {
    name: "zcash-devtool",
    commit: "0000000000000000000000000000000000000000",
  },
});

console.log("ZecSafe PCZT inspect v1 tests passed.");

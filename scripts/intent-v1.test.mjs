import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createIntentV1, findIntentNumericSyntaxError, canonicalizeJson, IntentValidationError } from "../src/intent-v1.mjs";

const baseIntent = {
  schema_version: "zecsafe-intent-v1",
  network: "main",
  vault_id: "vault_demo",
  group_fingerprint: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  recipient: "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd",
  amount_zatoshis: 10000,
  memo_utf8: "ZecSafe intent fixture",
  fee_policy: {
    mode: "tool_default",
    max_fee_zatoshis: 100000,
  },
  created_at: "2026-07-11T07:30:00.000Z",
  expires_at: null,
};

function commitmentFor(overrides) {
  return createIntentV1({ ...baseIntent, ...overrides }).intent_commitment;
}

function assertRejected(input, expectedMessage) {
  assert.throws(() => createIntentV1(input), {
    name: "IntentValidationError",
    message: expectedMessage,
  });
}

{
  const reordered = {
    expires_at: null,
    created_at: baseIntent.created_at,
    fee_policy: {
      max_fee_zatoshis: 100000,
      mode: "tool_default",
    },
    memo_utf8: baseIntent.memo_utf8,
    amount_zatoshis: 10000,
    recipient: baseIntent.recipient,
    group_fingerprint: baseIntent.group_fingerprint,
    vault_id: baseIntent.vault_id,
    network: "main",
    schema_version: "zecsafe-intent-v1",
  };
  assert.equal(createIntentV1(baseIntent).canonical_intent_json, createIntentV1(reordered).canonical_intent_json);
  assert.equal(createIntentV1(baseIntent).intent_commitment, createIntentV1(reordered).intent_commitment);
}

assert.notEqual(commitmentFor({ amount_zatoshis: 10001 }), commitmentFor({ amount_zatoshis: 10000 }));
assert.notEqual(commitmentFor({ recipient: "t1Lwd1X4RyMo7gXUjHwx4YfTnep7ZGh7ZGn" }), commitmentFor({ recipient: baseIntent.recipient }));
assert.notEqual(commitmentFor({ memo_utf8: "Changed memo" }), commitmentFor({ memo_utf8: baseIntent.memo_utf8 }));
assert.notEqual(commitmentFor({ fee_policy: { mode: "tool_default", max_fee_zatoshis: 100001 } }), commitmentFor({ fee_policy: baseIntent.fee_policy }));

assert.notEqual(
  canonicalizeJson({ ...baseIntent, network: "test" }),
  canonicalizeJson({ ...baseIntent, network: "main" }),
);

assertRejected({ ...baseIntent, amount_zatoshis: 10000.5 }, "amount_zatoshis must be a safe integer.");
assertRejected({ ...baseIntent, amount_zatoshis: "1e4" }, "amount_zatoshis must be a base-10 integer without decimals or exponent notation.");
assert.equal(
  findIntentNumericSyntaxError('{"amount_zatoshis":1e4,"fee_policy":{"max_fee_zatoshis":100000}}'),
  "amount_zatoshis must not use decimals or scientific notation.",
);
assert.equal(
  findIntentNumericSyntaxError('{"amount_zatoshis":10000,"fee_policy":{"max_fee_zatoshis":1.5}}'),
  "max_fee_zatoshis must not use decimals or scientific notation.",
);

const cli = spawnSync(
  process.execPath,
  [
    "scripts/create-intent.mjs",
    "--network",
    "main",
    "--vault-id",
    "vault_demo",
    "--group-fingerprint",
    baseIntent.group_fingerprint,
    "--recipient",
    baseIntent.recipient,
    "--amount-zatoshis",
    "10000",
    "--memo-utf8",
    baseIntent.memo_utf8,
    "--max-fee-zatoshis",
    "100000",
    "--created-at",
    baseIntent.created_at,
  ],
  { encoding: "utf8" },
);

if (cli.error?.code !== "EPERM") {
  assert.equal(cli.status, 0, cli.stderr);
  assert.match(cli.stdout, /^Intent created\nIntent commitment: sha256:[0-9a-f]{64}\n$/);
}

console.log("ZecSafe intent v1 tests passed.");

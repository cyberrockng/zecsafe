#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { createIntentV1, findIntentNumericSyntaxError, IntentValidationError } from "../src/intent-v1.mjs";

function parseNullable(value) {
  if (value === undefined || value === "null") return null;
  return value;
}

async function readInput(options) {
  if (options.json) {
    const rawJson = await readFile(options.json, "utf8");
    const numericSyntaxError = findIntentNumericSyntaxError(rawJson);
    if (numericSyntaxError) throw new IntentValidationError(numericSyntaxError);
    return JSON.parse(rawJson);
  }

  return {
    schema_version: "zecsafe-intent-v1",
    network: options.network,
    vault_id: options["vault-id"],
    group_fingerprint: options["group-fingerprint"],
    recipient: options.recipient,
    amount_zatoshis: options["amount-zatoshis"],
    memo_utf8: options["memo-utf8"] ?? "",
    fee_policy: {
      mode: options["fee-mode"] ?? "tool_default",
      max_fee_zatoshis: options["max-fee-zatoshis"],
    },
    created_at: options["created-at"],
    expires_at: parseNullable(options["expires-at"]),
  };
}

try {
  const { values } = parseArgs({
    options: {
      json: { type: "string" },
      network: { type: "string" },
      "vault-id": { type: "string" },
      "group-fingerprint": { type: "string" },
      recipient: { type: "string" },
      "amount-zatoshis": { type: "string" },
      "memo-utf8": { type: "string" },
      "fee-mode": { type: "string" },
      "max-fee-zatoshis": { type: "string" },
      "created-at": { type: "string" },
      "expires-at": { type: "string" },
      "print-json": { type: "boolean", default: false },
    },
  });

  const result = createIntentV1(await readInput(values));
  console.log("Intent created");
  console.log(`Intent commitment: ${result.intent_commitment}`);
  if (values["print-json"]) {
    console.log(result.canonical_intent_json);
  }
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`Intent rejected: ${message}`);
  process.exit(1);
}

#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { BindingFirewallError, bindIntentToPcztV1 } from "../src/pczt-bind-v1.mjs";
import { findIntentNumericSyntaxError, IntentValidationError } from "../src/intent-v1.mjs";

async function readJson(path, label, { checkIntentNumbers = false } = {}) {
  if (!path) throw new BindingFirewallError(`${label} path is required.`);
  const raw = await readFile(path, "utf8");
  if (checkIntentNumbers) {
    const numericSyntaxError = findIntentNumericSyntaxError(raw);
    if (numericSyntaxError) throw new IntentValidationError(numericSyntaxError);
  }
  return JSON.parse(raw);
}

try {
  const { values } = parseArgs({
    options: {
      intent: { type: "string" },
      review: { type: "string" },
      "run-id": { type: "string" },
      pretty: { type: "boolean", default: false },
      summary: { type: "boolean", default: false },
    },
  });

  const report = bindIntentToPcztV1({
    intent: await readJson(values.intent, "intent", { checkIntentNumbers: true }),
    pcztReview: await readJson(values.review, "review"),
    runId: values["run-id"],
  });

  if (values.summary) {
    console.log(`INTENT ↔ PCZT: ${report.summary.intent_pczt}`);
    console.log(`FROST SESSION: ${report.summary.frost_session}`);
  } else {
    console.log(JSON.stringify(report, null, values.pretty ? 2 : 0));
  }

  if (report.status !== "PASS") process.exit(2);
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`Binding Firewall rejected: ${message}`);
  process.exit(1);
}

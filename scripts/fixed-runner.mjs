#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { FixedRunnerError, runFixedOperation } from "../src/fixed-runner-v1.mjs";
import { findIntentNumericSyntaxError, IntentValidationError } from "../src/intent-v1.mjs";

async function readRequest(values) {
  if (values.request) {
    const raw = await readFile(values.request, "utf8");
    const numericSyntaxError = findIntentNumericSyntaxError(raw);
    if (numericSyntaxError) throw new IntentValidationError(numericSyntaxError);
    return JSON.parse(raw);
  }

  if (!values.operation) throw new FixedRunnerError("operation is required.");
  return {
    operation: values.operation,
    run_id: values["run-id"],
    workspace_root: values.workspace,
    events_path: values["events-path"],
    sequence: values.sequence === undefined ? undefined : Number(values.sequence),
    timeout_ms: values.timeout === undefined ? undefined : Number(values.timeout),
    host: values.host,
    input: {},
  };
}

try {
  const command = process.argv[2];
  if (command !== "run") throw new FixedRunnerError("command must be run.");

  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      request: { type: "string" },
      operation: { type: "string" },
      "run-id": { type: "string" },
      workspace: { type: "string" },
      "events-path": { type: "string" },
      sequence: { type: "string" },
      timeout: { type: "string" },
      host: { type: "string" },
      pretty: { type: "boolean", default: false },
    },
  });

  const result = await runFixedOperation(await readRequest(values));
  process.stdout.write(`${JSON.stringify(result, null, values.pretty ? 2 : 0)}\n`);
  if (["FAIL", "BLOCKED", "NOT_IMPLEMENTED", "UNSATISFIABLE"].includes(result.status)) process.exitCode = 2;
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`Fixed runner rejected: ${message}`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { selectSignersV1, SignerSelectionError } from "../src/signer-selection-v1.mjs";

async function readInput(path) {
  if (!path) throw new SignerSelectionError("json path is required.");
  return JSON.parse(await readFile(path, "utf8"));
}

try {
  const { values } = parseArgs({
    options: {
      json: { type: "string" },
      pretty: { type: "boolean", default: false },
      summary: { type: "boolean", default: false },
    },
  });

  const result = selectSignersV1(await readInput(values.json));

  if (values.summary) {
    console.log(`THRESHOLD: ${result.status === "SATISFIABLE" ? "SATISFIABLE" : "UNSATISFIABLE"}`);
    console.log(`SIGNER SELECTION: ${result.frost_session}`);
    console.log(`SELECTED: ${result.selected_count}/${result.participant_total}`);
  } else {
    console.log(JSON.stringify(result, null, values.pretty ? 2 : 0));
  }

  if (result.status !== "SATISFIABLE") process.exit(2);
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`Signer selection rejected: ${message}`);
  process.exit(1);
}

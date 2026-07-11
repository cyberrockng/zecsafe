#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { FrostSessionError, startFrostSessionV1 } from "../src/frost-session-v1.mjs";

async function readJson(path) {
  if (!path) throw new FrostSessionError("session package path is required.");
  return JSON.parse(await readFile(path, "utf8"));
}

function printSummary(result) {
  console.log(`THRESHOLD: ${result.threshold_status}`);
  console.log(`FROST SESSION: ${result.frost_session}`);
  console.log(`AGGREGATE SIGNATURE: ${result.aggregate_signature_status}`);
  console.log(`SELECTED: ${result.selected_public_fingerprints.length}/${result.participant_total}`);
  console.log(`UNAVAILABLE: ${result.unavailable_participant_count}`);
  if (result.session_fingerprint) console.log(`SESSION: ${result.session_fingerprint}`);
}

try {
  const { values } = parseArgs({
    options: {
      json: { type: "string" },
      pretty: { type: "boolean", default: false },
      summary: { type: "boolean", default: false },
    },
  });

  const result = startFrostSessionV1({ sessionPackage: await readJson(values.json) });

  if (values.summary) {
    printSummary(result);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, values.pretty ? 2 : 0)}\n`);
  }

  if (result.status !== "THRESHOLD_REACHED") process.exitCode = 2;
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`FROST session rejected: ${message}`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import {
  appendProofEventLog,
  projectPublicProofEvents,
  readProofEventLog,
  reduceProofEvents,
} from "../src/proof-event-v1.mjs";

function printJson(value, pretty) {
  console.log(JSON.stringify(value, null, pretty ? 2 : 0));
}

async function readJson(path, label) {
  if (!path) throw new Error(`${label} path is required.`);
  return JSON.parse(await readFile(path, "utf8"));
}

try {
  const command = process.argv[2];
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      events: { type: "string" },
      event: { type: "string" },
      pretty: { type: "boolean", default: false },
      "print-state": { type: "boolean", default: false },
    },
  });

  if (command === "append") {
    const state = await appendProofEventLog(values.events, await readJson(values.event, "event"));
    printJson(values["print-state"] ? state : { status: "appended", run_state_hash: state.run_state_hash }, values.pretty);
  } else if (command === "replay") {
    printJson(reduceProofEvents(await readProofEventLog(values.events)), values.pretty);
  } else if (command === "project") {
    printJson(projectPublicProofEvents(await readProofEventLog(values.events)), values.pretty);
  } else {
    throw new Error("command must be append, replay, or project.");
  }
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`ProofEvent rejected: ${message}`);
  process.exit(1);
}

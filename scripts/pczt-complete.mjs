#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { completePcztV1, PcztCompletionError } from "../src/pczt-completion-v1.mjs";

function usage() {
  console.error("Usage: npm run pczt:complete -- --json completion-package.json [--summary]");
}

function parseArgs(argv) {
  const args = { summary: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--summary") {
      args.summary = true;
    } else if (arg === "--json") {
      args.json = argv[++index];
    } else {
      usage();
      process.exit(1);
    }
  }
  if (!args.json) {
    usage();
    process.exit(1);
  }
  return args;
}

function printSummary(result) {
  console.log(`SIGNED_PCZT                 ${result.signed_pczt_status}`);
  console.log(`PROVEN_PCZT                 ${result.proven_pczt_status}`);
  console.log(`PCZT_COMBINE                ${result.pczt_combine_status}`);
  console.log(`FINAL BINDING               ${result.final_binding_status}`);
  console.log(`BROADCAST                   ${result.broadcast_status}`);
  console.log(`FINAL PCZT                  ${result.final_pczt_fingerprint}`);
}

const args = parseArgs(process.argv.slice(2));

try {
  const completionPackage = JSON.parse(await readFile(args.json, "utf8"));
  const result = completePcztV1({ completionPackage });
  if (args.summary) printSummary(result);
  else console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === "PASS" ? 0 : 2);
} catch (error) {
  if (error instanceof PcztCompletionError || error?.code === "invalid_proof_event") {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

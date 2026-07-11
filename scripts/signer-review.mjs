#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import { SIGNER_REVIEW_CONFIRMATION, SignerReviewError, reviewSignerPackageV1 } from "../src/signer-review-v1.mjs";

async function readJson(path, label) {
  if (!path) throw new SignerReviewError(`${label} path is required.`);
  return JSON.parse(await readFile(path, "utf8"));
}

async function readPcztBytes(packagePath, reviewPackage) {
  if (!reviewPackage.pczt_path) return undefined;
  const base = dirname(resolve(packagePath));
  return readFile(resolve(base, reviewPackage.pczt_path));
}

function printSummary(result, reviewPackage) {
  const reviewed = reviewPackage.reviewed_transaction;
  console.log(`SIGNER REVIEW: ${result.status}`);
  console.log(`FROST SESSION: ${result.frost_session}`);
  console.log(`REVIEW MODE: ${result.signer_review_mode}`);
  console.log(`REVIEWER: ${result.reviewer_participant_id}`);
  console.log(`PCZT: ${result.pczt_fingerprint}`);
  console.log(`SIGHASH: ${result.sighash_fingerprint}`);
  console.log("LOCAL TRANSACTION REVIEW:");
  console.log(`  network: ${reviewed.network}`);
  console.log(`  recipient: ${reviewed.recipient}`);
  console.log(`  amount_zatoshis: ${reviewed.amount_zatoshis}`);
  console.log(`  output_count: ${reviewed.output_count}`);
  console.log(`  fee_zatoshis: ${reviewed.fee_zatoshis ?? "not_reported"}`);
  console.log(`  memo_policy: ${reviewed.memo_policy}`);
  console.log(`CONFIRMATION REQUIRED: ${SIGNER_REVIEW_CONFIRMATION}`);
}

try {
  const command = process.argv[2];
  if (command !== "review") throw new SignerReviewError("command must be review.");

  const { values, positionals } = parseArgs({
    args: process.argv.slice(3),
    allowPositionals: true,
    options: {
      confirm: { type: "string" },
      pretty: { type: "boolean", default: false },
      summary: { type: "boolean", default: false },
    },
  });

  const packagePath = positionals[0];
  const reviewPackage = await readJson(packagePath, "review-package");
  const result = reviewSignerPackageV1({
    reviewPackage,
    confirmation: values.confirm,
    pcztBytes: await readPcztBytes(packagePath, reviewPackage),
  });

  if (values.summary) {
    printSummary(result, reviewPackage);
  } else {
    process.stdout.write(`${JSON.stringify(result, null, values.pretty ? 2 : 0)}\n`);
  }

  if (result.status !== "PASS") process.exitCode = 2;
} catch (error) {
  const message = error instanceof SyntaxError ? "Malformed JSON input." : error.message;
  console.error(`Signer review rejected: ${message}`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  generateZecsafeProofV1,
  verifyZecsafeProofV1,
  ZecsafeProofError,
} from "../src/zecsafe-proof-v1.mjs";
import { buildDryBroadcastProofRun, formatDryBroadcastSummary, ProofRunError } from "../src/proof-run-v1.mjs";

// Private run artifacts live outside the repository. Override with ZECSAFE_RUNS_ROOT or --runs-root.
const DEFAULT_RUNS_ROOT = process.env.ZECSAFE_RUNS_ROOT ?? join(homedir(), ".zecsafe", "runs");
const DEFAULT_PROOF_FIXTURE = "fixtures/proofs/p0-014-zecsafe-proof-v1.json";

function usage() {
  console.error(`Usage:
  zecsafe proof generate <run-id> [--runs-root DIR] [--out proof.json] [--txid TXID] [--chain-status STATUS] [--network main|test] [--recorded-at ISO] [--zecsafe-commit COMMIT] [--signer-review-dir DIR] [--summary]
  zecsafe proof verify <proof.json> [--summary]
  zecsafe proof tamper-demo <proof.json> [--summary]
  zecsafe proof-run --dry-broadcast [--proof proof.json] [--out proof-run.json] [--recorded-at ISO] [--summary]`);
}

function parseFlags(argv, startIndex = 0) {
  const flags = { _: [] };
  for (let index = startIndex; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--summary") {
      flags.summary = true;
    } else if (arg === "--dry-broadcast") {
      flags.dry_broadcast = true;
    } else if (arg.startsWith("--")) {
      const key = arg.slice(2).replaceAll("-", "_");
      const value = argv[++index];
      if (value === undefined) {
        usage();
        process.exit(1);
      }
      flags[key] = value;
    } else {
      flags._.push(arg);
    }
  }
  return flags;
}

// Loads every recorded signer-review result (review-result-*.json) from a run's artifacts.
// Returns undefined when none exist, so older runs still generate a bundle without the field.
async function readSignerReviews(artifactsDir) {
  let names;
  try {
    names = await readdir(artifactsDir);
  } catch {
    return undefined;
  }

  const reviewFiles = names.filter((name) => /^review-result-.+\.json$/.test(name)).sort();
  if (reviewFiles.length === 0) return undefined;

  return Promise.all(reviewFiles.map((name) => readJson(join(artifactsDir, name))));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function currentGitCommit() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: process.cwd(),
    encoding: "utf8",
    shell: false,
  });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function proofSummary(proof, verification) {
  console.log("ZecSafe Proof v1");
  console.log(`Bundle hash                  ${proof.bundle_hash}`);
  console.log(`Network                      ${proof.network}`);
  console.log(`FROST policy                 ${proof.vault.threshold} of ${proof.vault.participants_total}`);
  console.log(`Unavailable participants     ${proof.availability.unavailable}`);
  console.log(`Selected signers             ${proof.frost.selected_signers.length}`);
  console.log(`Intent ↔ PCZT                ${proof.pczt.binding_status}`);
  console.log(`Threshold reached            ${proof.frost.threshold_status === "THRESHOLD_REACHED" ? "PASS" : "FAIL"}`);
  console.log(`Transaction txid             ${proof.transaction.txid ? "PRESENT" : "NOT_PRESENT"}`);
  console.log(`Broadcast status             ${proof.transaction.broadcast_status}`);
  if (verification) console.log(`Verifier                     ${verification.status}`);
}

function verifierSummary(result, proof = null) {
  console.log("ZecSafe Judge Proof v1");
  const status = (name) => result.checks.find((check) => check.name === name)?.status ?? "FAIL";
  console.log(`Schema                       ${status("schema")}`);
  console.log(`Bundle hash                  ${status("bundle_hash")}`);
  if (proof) {
    console.log(`Network                      ${proof.network}`);
    console.log(`FROST policy                 ${proof.vault.threshold} of ${proof.vault.participants_total}`);
    console.log(`Unavailable participants     ${proof.availability.unavailable}`);
    console.log(`Selected signers             ${proof.frost.selected_signers.length}`);
    console.log(`Intent ↔ PCZT                ${proof.pczt.binding_status}`);
    console.log(`Threshold reached            ${status("threshold_reached")}`);
    console.log(`Transaction txid             ${proof.transaction.txid ? "PRESENT" : "NOT_PRESENT"}`);
  }
  console.log(`Recorded run integrity       ${status("recorded_run_integrity")}`);
  console.log("");
  console.log(`VERDICT: ${result.verdict}`);
}

function mutateProof(proof, mutation) {
  const clone = structuredClone(proof);
  if (mutation === "txid") clone.transaction.txid = "0".repeat(64);
  if (mutation === "threshold") clone.vault.threshold += 1;
  if (mutation === "group_fingerprint") clone.vault.group_fingerprint = `sha256:${"9".repeat(64)}`;
  if (mutation === "selected_signer") clone.frost.selected_signers[0] = `sha256:${"8".repeat(64)}`;
  if (mutation === "intent_commitment") clone.intent.commitment = `sha256:${"7".repeat(64)}`;
  if (mutation === "pczt_fingerprint") clone.pczt.source_fingerprint = `sha256:${"6".repeat(64)}`;
  if (mutation === "binding_status") clone.pczt.binding_status = "FAIL";
  return clone;
}

async function commandGenerate(argv) {
  const runId = argv[0];
  if (!runId) {
    usage();
    process.exit(1);
  }
  const flags = parseFlags(argv, 1);
  const runsRoot = resolve(flags.runs_root ?? DEFAULT_RUNS_ROOT);
  const artifactsDir = join(runsRoot, runId, "artifacts");
  const completionPackage = await readJson(join(artifactsDir, "completion-package.json"));
  const intentResult = await readJson(join(artifactsDir, "intent-result.json")).catch(() => null);
  const outputPath = flags.out ? resolve(flags.out) : join(artifactsDir, "zecsafe-proof-v1.json");

  // Signer reviews are recorded by the FROST session run, which may differ from the completion run.
  // --signer-review-dir points at that run's artifacts; the generator re-checks that every review is
  // bound to this session's group, PCZT, binding report, SIGHASH, and intent before recording the mode.
  const signerReviewDir = flags.signer_review_dir ? resolve(flags.signer_review_dir) : artifactsDir;
  const signerReviews = await readSignerReviews(signerReviewDir);

  const proof = generateZecsafeProofV1({
    completionPackage,
    signerReviews,
    network: flags.network ?? intentResult?.intent?.network,
    recorded_at: flags.recorded_at,
    zecsafe_commit: flags.zecsafe_commit ?? currentGitCommit(),
    transaction: {
      txid: flags.txid ?? null,
      chain_status: flags.chain_status ?? "NOT_BROADCAST",
      confirmations_at_recording: flags.confirmations_at_recording ? Number(flags.confirmations_at_recording) : 0,
      observed_block_height: flags.observed_block_height ? Number(flags.observed_block_height) : null,
    },
  });
  await writeJson(outputPath, proof);
  const verification = verifyZecsafeProofV1(proof);
  if (flags.summary) proofSummary(proof, verification);
  else console.log(JSON.stringify({ output_path: outputPath, proof, verification }, null, 2));
  process.exitCode = verification.status === "PASS" ? 0 : 2;
}

async function commandVerify(argv) {
  const proofPath = argv[0];
  if (!proofPath) {
    usage();
    process.exit(1);
  }
  const flags = parseFlags(argv, 1);
  const proof = await readJson(resolve(proofPath));
  const result = verifyZecsafeProofV1(proof);
  if (flags.summary) verifierSummary(result, proof);
  else console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === "PASS" ? 0 : 2;
}

async function commandTamperDemo(argv) {
  const proofPath = argv[0];
  if (!proofPath) {
    usage();
    process.exit(1);
  }
  const flags = parseFlags(argv, 1);
  const proof = await readJson(resolve(proofPath));
  const mutations = ["txid", "threshold", "group_fingerprint", "selected_signer", "intent_commitment", "pczt_fingerprint", "binding_status"];
  const results = mutations.map((mutation) => {
    const result = verifyZecsafeProofV1(mutateProof(proof, mutation));
    return { mutation, status: result.status };
  });
  const passed = results.every((result) => result.status === "FAIL");
  if (flags.summary) {
    console.log("ZecSafe Proof v1 Tamper Demo");
    for (const result of results) console.log(`${result.mutation.padEnd(24)} ${result.status === "FAIL" ? "REJECTED" : "UNEXPECTED_PASS"}`);
    console.log("");
    console.log(`VERDICT: ${passed ? "TAMPER DETECTION PASS" : "TAMPER DETECTION FAIL"}`);
  } else {
    console.log(JSON.stringify({ status: passed ? "PASS" : "FAIL", results }, null, 2));
  }
  process.exitCode = passed ? 0 : 2;
}

async function commandProofRun(argv) {
  const flags = parseFlags(argv, 0);
  if (!flags.dry_broadcast) {
    usage();
    process.exit(1);
  }

  const proofPath = resolve(flags.proof ?? DEFAULT_PROOF_FIXTURE);
  const proof = await readJson(proofPath);
  const result = buildDryBroadcastProofRun({
    proof,
    run_id: flags.run_id,
    recorded_at: flags.recorded_at,
  });

  if (flags.out) await writeJson(resolve(flags.out), result);
  if (flags.summary) console.log(formatDryBroadcastSummary(result));
  else console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.status === "PASS" ? 0 : 2;
}

async function main() {
  const [domain, command, ...rest] = process.argv.slice(2);
  if (domain !== "proof" && domain !== "proof-run") {
    usage();
    process.exit(1);
  }

  try {
    if (domain === "proof-run") await commandProofRun([command, ...rest].filter(Boolean));
    else if (command === "generate") await commandGenerate(rest);
    else if (command === "verify") await commandVerify(rest);
    else if (command === "tamper-demo") await commandTamperDemo(rest);
    else {
      usage();
      process.exit(1);
    }
  } catch (error) {
    if (error instanceof ZecsafeProofError || error instanceof ProofRunError || error?.code === "invalid_pczt_completion") {
      console.error(error.message);
      process.exit(1);
    }
    throw error;
  }
}

await main();

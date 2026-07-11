#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  EXPECTED_ZCASH_DEVTOOL_COMMIT,
  parseZcashDevtoolPcztInspect,
  PcztInspectError,
} from "../src/pczt-inspect-v1.mjs";

const defaultToolRoot = "/home/dell/.zecsafe/toolchain/zcash-devtool";
const defaultRawDir = "/home/dell/.zecsafe/pczt-inspect";

function timestampSlug() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function ensureAbsolutePath(path, label) {
  if (!path) throw new PcztInspectError(`${label} is required.`);
  return isAbsolute(path) ? path : resolve(process.cwd(), path);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: options.encoding ?? "utf8",
    input: options.input,
    cwd: options.cwd,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) throw result.error;
  return result;
}

async function writeRawInspectOutput(rawInspect, requestedPath) {
  const rawPath = requestedPath
    ? ensureAbsolutePath(requestedPath, "raw output path")
    : resolve(process.env.ZECSAFE_PCZT_RAW_DIR ?? defaultRawDir, `inspect-${timestampSlug()}.txt`);
  await mkdir(dirname(rawPath), { recursive: true });
  await writeFile(rawPath, rawInspect);
  return rawPath;
}

try {
  const { values } = parseArgs({
    options: {
      pczt: { type: "string" },
      network: { type: "string" },
      "tool-root": { type: "string" },
      "raw-output": { type: "string" },
      pretty: { type: "boolean", default: false },
    },
  });

  const pcztPath = ensureAbsolutePath(values.pczt, "pczt path");
  const toolRoot = ensureAbsolutePath(values["tool-root"] ?? process.env.ZECSAFE_ZCASH_DEVTOOL_ROOT ?? defaultToolRoot, "tool root");
  const pcztBytes = await readFile(pcztPath);

  const commitResult = run("git", ["-C", toolRoot, "rev-parse", "HEAD"]);
  if (commitResult.status !== 0) {
    throw new PcztInspectError("could not determine zcash-devtool commit.");
  }
  const commit = commitResult.stdout.trim();
  if (commit !== EXPECTED_ZCASH_DEVTOOL_COMMIT) {
    throw new PcztInspectError("unsupported zcash-devtool commit.");
  }

  const inspectResult = run("cargo", ["run", "--locked", "--release", "--", "pczt", "inspect"], {
    cwd: toolRoot,
    input: pcztBytes,
    encoding: "buffer",
  });

  if (inspectResult.status !== 0) {
    const stderr = inspectResult.stderr.toString("utf8").trim();
    throw new PcztInspectError(stderr || "zcash-devtool pczt inspect failed.");
  }

  const rawInspect = inspectResult.stdout.toString("utf8");
  const rawInspectPath = await writeRawInspectOutput(rawInspect, values["raw-output"]);
  const review = parseZcashDevtoolPcztInspect(rawInspect, {
    network: values.network,
    pcztBytes,
    toolIdentity: {
      name: "zcash-devtool",
      commit,
    },
  });

  const output = {
    status: "success",
    message: "PCZT inspect review created",
    raw_inspect_path: rawInspectPath,
    review,
  };
  console.log(JSON.stringify(output, null, values.pretty ? 2 : 0));
} catch (error) {
  const message = error?.message ?? "PCZT inspect failed.";
  console.error(`PCZT inspect rejected: ${message}`);
  process.exit(1);
}

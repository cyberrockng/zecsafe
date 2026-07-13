import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../../../..");
const auditScreenshotRoot = process.env.AUDIT_SCREENSHOT_ROOT ?? here;
const outputFile = process.env.AUDIT_SAFETY_OUTPUT ?? join(auditScreenshotRoot, "screenshot-safety.json");
const targetCommit = process.env.AUDIT_TARGET_COMMIT ?? "c5d1750941e89a146941a9a55455e736a69c35b2";
const roots = [join(repo, "docs/screenshots"), auditScreenshotRoot];
const metadataChunkTypes = new Set(["tEXt", "zTXt", "iTXt", "eXIf"]);

function parsePng(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a") throw new Error("Not a PNG file.");
  const chunks = [];
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    if (offset + 12 + length > buffer.length) throw new Error(`Invalid ${type} chunk length.`);
    chunks.push({ type, length });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  const ihdrOffset = 8;
  const ihdrType = buffer.subarray(ihdrOffset + 4, ihdrOffset + 8).toString("ascii");
  if (ihdrType !== "IHDR") throw new Error("PNG has no leading IHDR chunk.");
  return {
    width: buffer.readUInt32BE(ihdrOffset + 8),
    height: buffer.readUInt32BE(ihdrOffset + 12),
    chunks,
  };
}

const files = [];
for (const root of roots) {
  for (const name of await readdir(root)) {
    if (extname(name).toLowerCase() !== ".png") continue;
    files.push(join(root, name));
  }
}

const results = [];
for (const file of files.sort()) {
  const buffer = await readFile(file);
  const parsed = parsePng(buffer);
  const metadataChunks = parsed.chunks.filter((chunk) => metadataChunkTypes.has(chunk.type));
  results.push({
    file: relative(repo, file),
    width: parsed.width,
    height: parsed.height,
    bytes: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
    chunk_types: [...new Set(parsed.chunks.map((chunk) => chunk.type))],
    metadata_chunks: metadataChunks,
    metadata_chunk_count: metadataChunks.length,
  });
}

const report = {
  generated_at: new Date().toISOString(),
  target_commit: targetCommit,
  files: results,
  summary: {
    count: results.length,
    files_with_metadata_chunks: results.filter((item) => item.metadata_chunk_count > 0).map((item) => basename(item.file)),
    stale_screenshot_names_present: results
      .map((item) => basename(item.file))
      .filter((name) => ["vault-dashboard.png", "mainnet-monitor.png", "transaction-proof.png", "recovery-flow.png"].includes(name)),
  },
};

await writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report.summary, null, 2));

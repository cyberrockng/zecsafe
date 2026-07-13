import { copyFile, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(rootDir, "dist");

const publicFiles = [
  "index.html",
  "src/app.js",
  "src/demo-proof-state.mjs",
  "src/demo-presentation.mjs",
  "src/verify-browser.mjs",
  "src/styles.css",
  "fixtures/verified-mainnet-run/proof.json",
  "fixtures/verified-mainnet-run/events.public.json",
];

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(path)));
    else files.push(relative(outputDir, path).replaceAll("\\", "/"));
  }
  return files;
}

await rm(outputDir, { recursive: true, force: true });

for (const file of publicFiles) {
  const destination = join(outputDir, file);
  await mkdir(dirname(destination), { recursive: true });
  await copyFile(join(rootDir, file), destination);
}

const emittedFiles = (await listFiles(outputDir)).sort();
const expectedFiles = [...publicFiles].sort();
if (JSON.stringify(emittedFiles) !== JSON.stringify(expectedFiles)) {
  throw new Error(`Unexpected Vercel output. Expected ${expectedFiles.join(", ")}; received ${emittedFiles.join(", ")}.`);
}

console.log(`ZecSafe Vercel build emitted ${emittedFiles.length} allowlisted public files.`);
for (const file of emittedFiles) console.log(`  ${file}`);

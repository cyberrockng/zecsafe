import { readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { extname, join } from "node:path";

const ignoredDirectories = new Set([".git", "node_modules"]);
const binaryExtensions = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico", ".pdf", ".mp4", ".mov", ".zip", ".gz", ".tar", ".wasm"]);
const safeAssignedValues = new Set([
  "your-rpc-password",
  "your-rpc-user",
  "changeme",
  "change-me",
  "example",
  "placeholder",
  "redacted",
  "<redacted>",
  "<rpc-password>",
]);

const findings = [];

function normalizePath(file) {
  return file.split("\\").join("/");
}

async function listWorkspaceFiles(directory = ".", prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = normalizePath(join(prefix, entry.name));
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) {
        files.push(...(await listWorkspaceFiles(absolutePath, relativePath)));
      }
      continue;
    }

    if (entry.isFile()) files.push(relativePath);
  }

  return files;
}

function isBinaryPath(file) {
  return binaryExtensions.has(extname(file).toLowerCase());
}

function addFinding(file, message) {
  findings.push(`${file}: ${message}`);
}

function hasSensitivePath(file) {
  const rules = [
    [/^\.env(?:\.|$)|\/\.env(?:\.|$)/, "environment file is present in workspace"],
    [/(^|\/)(alice|bob|eve)\.toml$/i, "participant config is present in workspace"],
    [/(^|\/)(wallet\.dat|wallet\.db|.*\.(?:sqlite|sqlite3|db))$/i, "possible wallet database is present in workspace"],
    [/\.pczt(?:\.json)?$/i, "PCZT artifact is present in workspace"],
    [/\.log$/i, "log artifact is present in workspace"],
    [/(^|\/)(?:\.zecsafe|zecsafe-private|participants|wallets|runs|toolchain)\//i, "private runtime workspace appears inside repository"],
  ];

  return rules.find(([pattern]) => pattern.test(file))?.[1] ?? null;
}

const secretPatterns = [
  [/-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/, "private key block"],
  [/\bAKIA[0-9A-Z]{16}\b/, "AWS access key"],
  [/\bAIza[0-9A-Za-z_-]{20,}\b/, "Google API key"],
  [/\bghp_[0-9A-Za-z]{30,}\b/, "GitHub personal access token"],
  [/\bsk-[A-Za-z0-9]{32,}\b/, "OpenAI-style API key"],
  [/\bxox[baprs]-[0-9A-Za-z-]{20,}\b/, "Slack token"],
  [/\buview1[ac-hj-np-z02-9]{50,}\b/i, "possible unified full viewing key"],
  [/\buvf1[ac-hj-np-z02-9]{50,}\b/i, "possible full viewing key"],
  [/\bzviews[ac-hj-np-z02-9]{40,}\b/i, "possible Sapling viewing key"],
  [/\bsecret-extended-key-(?:main|test)[a-z0-9]{20,}\b/i, "possible Zcash spending key"],
  [/\b(?:mnemonic|seed phrase)\s*[:=]\s*["']?(?:[a-z]+\s+){11,23}[a-z]+["']?/i, "possible mnemonic assignment"],
  [/\b(?:secret_share|signing_share|participant_secret|frost_secret)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/i, "possible FROST secret share"],
  [/\b(?:randomizer|signing_randomizer)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/i, "possible signing randomizer"],
];

function isSafeAssignedValue(value) {
  if (!value) return true;
  const normalized = value.trim();
  const lower = normalized.toLowerCase();

  return (
    normalized.startsWith("$") ||
    normalized.startsWith("process.env.") ||
    normalized.includes("process.env") ||
    normalized.startsWith("<") ||
    safeAssignedValues.has(lower)
  );
}

async function scanFile(file) {
  const pathFinding = hasSensitivePath(file);
  if (pathFinding) addFinding(file, pathFinding);

  if (isBinaryPath(file)) return;

  let text;
  try {
    const buffer = await readFile(file);
    if (buffer.includes(0)) return;
    text = buffer.toString("utf8");
  } catch (error) {
    addFinding(file, `unable to scan file: ${error.code ?? "read-error"}`);
    return;
  }

  if (file === "SUBMISSION.md" && text.includes("[Your name / handle]")) {
    addFinding(file, "submission team placeholder is still present");
  }

  for (const [pattern, label] of secretPatterns) {
    if (pattern.test(text)) addFinding(file, `possible ${label}`);
  }

  for (const line of text.split(/\r?\n/)) {
    const passwordAssignment = line.match(/\b(?:ZEC|ZCASH)_RPC_PASSWORD\s*=\s*["']?([^"'\s#]+)/);
    const assignedValue = passwordAssignment?.[1];

    if (passwordAssignment && !isSafeAssignedValue(assignedValue)) {
      addFinding(file, "possible concrete Zcash RPC password assignment");
    }
  }
}

const gitRoot = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" });
if (gitRoot.status !== 0) {
  console.error(gitRoot.stderr || "Unable to locate git repository.");
  process.exit(1);
}

for (const file of await listWorkspaceFiles()) {
  await scanFile(file);
}

if (findings.length) {
  for (const finding of [...new Set(findings)].sort()) {
    console.error(`Security scan finding: ${finding}`);
  }
  process.exit(1);
}

console.log("ZecSafe security scan passed.");

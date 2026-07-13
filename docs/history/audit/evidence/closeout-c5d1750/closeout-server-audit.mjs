import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { request } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../../../..");
const port = 4192;
const host = "127.0.0.1";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpCase({ method = "GET", path = "/", headers = {}, body = null, timeoutMs = 5_000 }) {
  return new Promise((resolve) => {
    const started = Date.now();
    const req = request({ host, port, method, path, headers }, (response) => {
      let responseBody = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        responseBody += chunk;
      });
      response.on("end", () => {
        resolve({
          method,
          path,
          status: response.statusCode,
          headers: response.headers,
          duration_ms: Date.now() - started,
          body_preview: responseBody.slice(0, 400),
        });
      });
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("client timeout"));
    });
    req.on("error", (error) => {
      resolve({ method, path, error: error.message, duration_ms: Date.now() - started });
    });
    if (body !== null) req.write(body);
    req.end();
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = await httpCase({ path: "/api/health", timeoutMs: 500 });
    if (result.status === 200) return;
    await wait(250);
  }
  throw new Error("Timed out waiting for ZecSafe server.");
}

async function listSymlinks(directory, relative = "") {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === ".git") continue;
    const absolute = join(directory, entry.name);
    const child = join(relative, entry.name);
    const stats = await lstat(absolute);
    if (stats.isSymbolicLink()) found.push(child);
    else if (stats.isDirectory()) found.push(...(await listSymlinks(absolute, child)));
  }
  return found;
}

const validIntent = JSON.stringify({
  schema_version: "zecsafe-intent-v1",
  network: "main",
  vault_id: "vault_closeout_audit",
  group_fingerprint: `sha256:${"a".repeat(64)}`,
  recipient: "t1Lwd1X4RyMo7gXUjHwx4YfTnep7ZGh7ZGn",
  amount_zatoshis: 10000,
  memo_utf8: "bounded local audit fixture",
  fee_policy: { mode: "tool_default", max_fee_zatoshis: 100000 },
  created_at: "2026-07-12T22:30:00.000Z",
  expires_at: null,
});

const serverOutput = [];
const server = spawn(process.execPath, [join(repo, "server.mjs")], {
  cwd: repo,
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString("utf8")));
server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString("utf8")));

const report = {
  generated_at: new Date().toISOString(),
  target_commit: "c5d1750941e89a146941a9a55455e736a69c35b2",
  local_only: true,
  cases: [],
  code_inspection: {},
  symlinks_in_current_tree: [],
  listener: null,
  server_output: serverOutput,
};

try {
  await waitForServer();

  const basicCases = [
    { path: "/" },
    { path: "/demo" },
    { path: "/fixtures/verified-mainnet-run/proof.json" },
    { path: "/fixtures/verified-mainnet-run/events.public.json" },
    { path: "/.git/HEAD" },
    { path: "/.git/config" },
    { path: "/server.mjs" },
    { path: "/package.json" },
    { path: "/docs/history/HANDOFF.md" },
    { path: "/../../../etc/passwd" },
    { path: "/..%2f..%2f..%2fetc%2fpasswd" },
    { path: "/%2e%2e/%2e%2e/etc/passwd" },
    { path: "/src/%00app.js" },
    { path: "/src/does-not-exist.mjs" },
    { path: "/api/health" },
    { method: "POST", path: "/api/health", headers: { "Content-Type": "application/json" }, body: "{}" },
    { method: "GET", path: "/api/intent/create" },
    { method: "OPTIONS", path: "/api/intent/create", headers: { Origin: "https://example.invalid" } },
    { method: "POST", path: "/api/transaction-proof", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ txid: "bad" }) },
  ];

  for (const item of basicCases) report.cases.push(await httpCase(item));

  report.cases.push(
    await httpCase({
      method: "POST",
      path: "/api/intent/create",
      headers: { "Content-Type": "application/json", Origin: "http://127.0.0.1:4192" },
      body: validIntent,
    }),
  );
  report.cases.push(
    await httpCase({
      method: "POST",
      path: "/api/intent/create",
      headers: { "Content-Type": "text/plain", Origin: "https://example.invalid" },
      body: validIntent,
    }),
  );
  report.cases.push(
    await httpCase({
      method: "POST",
      path: "/api/intent/create",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    }),
  );
  report.cases.push(
    await httpCase({
      method: "POST",
      path: "/api/intent/create",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(65_000) }),
    }),
  );
  report.cases.push(
    await httpCase({
      method: "GET",
      path: "/api/health",
      headers: { Host: "attacker.invalid", Origin: "https://example.invalid" },
    }),
  );

  const serverSource = await readFile(join(repo, "server.mjs"), "utf8");
  report.code_inspection = {
    origin_header_checked: /headers\[?["']origin|headers\.origin/i.test(serverSource),
    request_content_type_checked: /content-type/i.test(serverSource.slice(serverSource.indexOf("async function readJsonBody"), serverSource.indexOf("function zcashRpcConfig"))),
    outbound_fetch_abort_signal_present: /fetch\([^)]*\{[\s\S]{0,500}\bsignal\s*:/m.test(serverSource),
    static_realpath_check_present: /realpath/.test(serverSource),
    static_allowlist_present: /STATIC_FILES/.test(serverSource) && /STATIC_PREFIXES/.test(serverSource),
    loopback_default_present: /process\.env\.ZECSAFE_HOST\s*\?\?\s*["']127\.0\.0\.1["']/.test(serverSource),
    request_timeout_ms: Number(serverSource.match(/server\.requestTimeout\s*=\s*([\d_]+)/)?.[1]?.replaceAll("_", "") ?? 0),
    headers_timeout_ms: Number(serverSource.match(/server\.headersTimeout\s*=\s*([\d_]+)/)?.[1]?.replaceAll("_", "") ?? 0),
  };

  report.symlinks_in_current_tree = await listSymlinks(repo);
  const sockets = spawnSync("ss", ["-tlnp"], { encoding: "utf8" });
  report.listener = {
    exit_code: sockets.status,
    matching_line: sockets.stdout.split(/\r?\n/).find((line) => line.includes(`:${port}`)) ?? null,
    stderr: sockets.stderr.trim() || null,
  };

  await writeFile(join(here, "server-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: join(here, "server-audit.json"),
    listener: report.listener,
    code_inspection: report.code_inspection,
    symlinks: report.symlinks_in_current_tree,
    cases: report.cases.map((item) => ({
      method: item.method,
      path: item.path,
      status: item.status,
      error: item.error,
      duration_ms: item.duration_ms,
      content_type: item.headers?.["content-type"],
      allow_origin: item.headers?.["access-control-allow-origin"],
      body_preview: item.body_preview,
    })),
  }, null, 2));
} finally {
  server.kill();
}

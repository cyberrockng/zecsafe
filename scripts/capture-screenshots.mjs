import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { get } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotDir = join(rootDir, "docs", "screenshots");
const edgeCandidates = [
  process.env.EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const edgePath = edgeCandidates.find((candidate) => existsSync(candidate));
if (!edgePath) {
  throw new Error("Microsoft Edge was not found. Set EDGE_PATH to capture screenshots.");
}

const port = 9333;
const userDataDir = join(process.env.TEMP ?? rootDir, `zecsafe-shot-${Date.now()}`);
const baseUrl = process.env.ZECSAFE_URL ?? "http://127.0.0.1:4173/?v=final-screenshots";

const shots = [
  ["vault-dashboard.png", "#vault"],
  ["mainnet-monitor.png", "#evidence-center"],
  ["transaction-proof.png", "#transaction-proof"],
  ["recovery-flow.png", "#recovery"],
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    }).on("error", reject);
  });
}

async function waitForDebugEndpoint() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      return await httpJson(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await wait(250);
    }
  }

  throw new Error("Timed out waiting for Edge remote debugging endpoint.");
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const waiter = pending.get(message.id);
    if (!waiter) return;
    pending.delete(message.id);
    if (message.error) {
      waiter.reject(new Error(message.error.message));
    } else {
      waiter.resolve(message.result);
    }
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}) {
          const commandId = (id += 1);
          socket.send(JSON.stringify({ id: commandId, method, params }));
          return new Promise((cmdResolve, cmdReject) => {
            pending.set(commandId, { resolve: cmdResolve, reject: cmdReject });
          });
        },
        close() {
          socket.close();
        },
      });
    });
    socket.addEventListener("error", reject);
  });
}

await mkdir(screenshotDir, { recursive: true });

const edge = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--hide-scrollbars",
  "--no-first-run",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

try {
  await waitForDebugEndpoint();
  const targets = await httpJson(`http://127.0.0.1:${port}/json/list`);
  const pageTarget = targets.find((target) => target.type === "page");
  if (!pageTarget?.webSocketDebuggerUrl) {
    throw new Error("No debuggable page target found.");
  }
  const cdp = await createCdpClient(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1300,
    deviceScaleFactor: 1,
    mobile: false,
  });

  for (const [fileName, selector] of shots) {
    await cdp.send("Page.navigate", { url: baseUrl });
    await wait(1800);
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(${JSON.stringify(selector)})?.scrollIntoView({ block: "start" })`,
      awaitPromise: true,
    });
    await wait(700);
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    await writeFile(join(screenshotDir, fileName), Buffer.from(screenshot.data, "base64"));
  }

  cdp.close();
} finally {
  edge.kill();
}

console.log("ZecSafe screenshots captured.");

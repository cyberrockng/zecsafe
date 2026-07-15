// Captures the current ZecSafe product screenshots into docs/screenshots/.
//
// Starts the local server itself, drives a headless Chromium/Edge over CDP, and captures the
// four-step proof-first product plus the 390px mobile view. Every shot is taken from the live app
// at the current commit - a screenshot is evidence of what the product does now, not decoration.
//
// Usage:  npm run screenshots
// Browser: auto-discovered, or set BROWSER_PATH / CHROME_PATH / EDGE_PATH.

import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { get } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const screenshotDir = join(rootDir, "docs", "screenshots");

const browserCandidates = [
  process.env.BROWSER_PATH,
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  // Linux / WSL
  `${process.env.HOME}/.cache/ms-playwright/chromium-1228/chrome-linux64/chrome`,
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
  // macOS
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  // Windows
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);

const browserPath = browserCandidates.find((candidate) => existsSync(candidate));
if (!browserPath) {
  throw new Error(
    "No Chromium-based browser found. Set BROWSER_PATH (or CHROME_PATH / EDGE_PATH) to capture screenshots.",
  );
}

const debugPort = Number(process.env.CDP_PORT ?? 9333);
const serverPort = Number(process.env.SCREENSHOT_PORT ?? 4190);
const baseUrl = `http://127.0.0.1:${serverPort}/`;

const DESKTOP = { width: 1440, height: 1000 };
const TABLET = { width: 768, height: 960 };
const MOBILE = { width: 390, height: 844 };

const shots = [
  { file: "01-first-glance.png", viewport: DESKTOP, route: "/", scrollTo: null },
  { file: "02-review.png", viewport: DESKTOP, route: "/proof", scrollTo: "#review" },
  { file: "03-binding-firewall.png", viewport: DESKTOP, route: "/proof", scrollTo: "#verify" },
  {
    file: "04-binding-mismatch.png",
    viewport: DESKTOP,
    route: "/proof",
    scrollTo: "#verify",
    // Prove the Binding Firewall actually blocks signing, not merely that it renders.
    click: '[data-demo-mode="mismatch"]',
  },
  { file: "05-authorize-unavailable.png", viewport: DESKTOP, route: "/proof", scrollTo: "#authorize" },
  { file: "06-proof-detail.png", viewport: DESKTOP, route: "/proof", scrollTo: "#prove" },
  { file: "07-mobile-390.png", viewport: MOBILE, route: "/", scrollTo: null },
  { file: "08-landing-768.png", viewport: TABLET, route: "/", scrollTo: null },
  { file: "09-how-it-works.png", viewport: DESKTOP, route: "/how-it-works", scrollTo: null },
  { file: "10-security.png", viewport: DESKTOP, route: "/security", scrollTo: null },
  { file: "11-docs.png", viewport: DESKTOP, route: "/docs", scrollTo: null },
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

async function waitFor(check, what, attempts = 60) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await check();
    } catch {
      await wait(250);
    }
  }
  throw new Error(`Timed out waiting for ${what}.`);
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
    if (message.error) waiter.reject(new Error(message.error.message));
    else waiter.resolve(message.result);
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

const server = spawn(process.execPath, [join(rootDir, "server.mjs")], {
  cwd: rootDir,
  env: { ...process.env, PORT: String(serverPort) },
  stdio: "ignore",
});

const browser = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${debugPort}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

try {
  await waitFor(() => httpJson(`${baseUrl}api/health`), "the ZecSafe server");
  await waitFor(() => httpJson(`http://127.0.0.1:${debugPort}/json/version`), "the browser debug endpoint");

  const targets = await httpJson(`http://127.0.0.1:${debugPort}/json/list`);
  const pageTarget = targets.find((target) => target.type === "page");
  if (!pageTarget?.webSocketDebuggerUrl) throw new Error("No debuggable page target found.");

  const cdp = await createCdpClient(pageTarget.webSocketDebuggerUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  for (const shot of shots) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: shot.viewport.width,
      height: shot.viewport.height,
      deviceScaleFactor: 1,
      mobile: shot.viewport === MOBILE,
    });

    // Reload for every shot so no earlier interaction leaks into the next capture.
    await cdp.send("Page.navigate", { url: new URL(shot.route ?? "/", baseUrl).toString() });
    await wait(1800);

    if (shot.click) {
      await cdp.send("Runtime.evaluate", {
        expression: `document.querySelector(${JSON.stringify(shot.click)})?.click()`,
        awaitPromise: true,
      });
      await wait(500);
    }

    if (shot.scrollTo) {
      await cdp.send("Runtime.evaluate", {
        expression: `document.querySelector(${JSON.stringify(shot.scrollTo)})?.scrollIntoView({ block: "start" })`,
        awaitPromise: true,
      });
      await wait(500);
    }

    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    await writeFile(join(screenshotDir, shot.file), Buffer.from(screenshot.data, "base64"));
    console.log(`captured ${shot.file}`);
  }

  cdp.close();
} finally {
  browser.kill();
  server.kill();
}

console.log("ZecSafe screenshots captured.");

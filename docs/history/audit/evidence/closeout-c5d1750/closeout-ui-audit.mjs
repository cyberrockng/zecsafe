import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { get } from "node:http";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "../../../..");
const outputDir = process.env.AUDIT_OUTPUT_DIR ?? here;
const targetCommit = process.env.AUDIT_TARGET_COMMIT ?? "c5d1750941e89a146941a9a55455e736a69c35b2";
const serverPort = Number(process.env.AUDIT_SERVER_PORT ?? 4191);
const debugPort = Number(process.env.AUDIT_DEBUG_PORT ?? 9334);
const baseUrl = `http://127.0.0.1:${serverPort}`;

const browserCandidates = [
  process.env.BROWSER_PATH,
  process.env.CHROME_PATH,
  process.env.EDGE_PATH,
  join(homedir(), ".cache/ms-playwright/chromium-1228/chrome-linux64/chrome"),
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/microsoft-edge",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const browserPath = browserCandidates.find((candidate) => existsSync(candidate));
if (!browserPath) throw new Error("No Chromium-based browser was found.");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpJson(url) {
  return new Promise((resolve, reject) => {
    const request = get(url, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        if ((response.statusCode ?? 500) >= 400) {
          reject(new Error(`${url} returned HTTP ${response.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });
    request.on("error", reject);
  });
}

async function waitFor(check, label, attempts = 80) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await check();
    } catch {
      await wait(250);
    }
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let nextId = 1;
  const pending = new Map();
  const events = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const waiter = pending.get(message.id);
      if (!waiter) return;
      pending.delete(message.id);
      if (message.error) waiter.reject(new Error(message.error.message));
      else waiter.resolve(message.result);
      return;
    }
    const waiters = events.get(message.method);
    if (!waiters?.length) return;
    events.delete(message.method);
    for (const resolve of waiters) resolve(message.params);
  });

  return new Promise((resolve, reject) => {
    socket.addEventListener(
      "open",
      () => {
        resolve({
          send(method, params = {}) {
            const id = nextId++;
            return new Promise((resolveCommand, rejectCommand) => {
              pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
              socket.send(JSON.stringify({ id, method, params }));
            });
          },
          once(method) {
            return new Promise((resolveEvent) => {
              const waiters = events.get(method) ?? [];
              waiters.push(resolveEvent);
              events.set(method, waiters);
            });
          },
          close() {
            socket.close();
          },
        });
      },
      { once: true },
    );
    socket.addEventListener("error", reject, { once: true });
  });
}

await mkdir(outputDir, { recursive: true });

const serverOutput = [];
const server = spawn(process.execPath, [join(repo, "server.mjs")], {
  cwd: repo,
  env: { ...process.env, PORT: String(serverPort) },
  stdio: ["ignore", "pipe", "pipe"],
});
server.stdout.on("data", (chunk) => serverOutput.push(chunk.toString("utf8")));
server.stderr.on("data", (chunk) => serverOutput.push(chunk.toString("utf8")));

const browser = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--no-first-run",
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=/tmp/zecsafe-closeout-browser-${process.pid}`,
    "about:blank",
  ],
  { stdio: "ignore" },
);

const report = {
  generated_at: new Date().toISOString(),
  target_commit: targetCommit,
  local_only: true,
  browser: null,
  screenshots: [],
  dom_cases: [],
  pass_state: null,
  mismatch_state: null,
  focus_sequence: [],
  hash_navigation: null,
  reduced_motion: null,
  missing_fixture_state: null,
  malformed_fixture_state: null,
  server_output: serverOutput,
};

let cdp;
try {
  await waitFor(() => httpJson(`${baseUrl}/api/health`), "ZecSafe server");
  const version = await waitFor(() => httpJson(`http://127.0.0.1:${debugPort}/json/version`), "browser debug endpoint");
  report.browser = version.Browser;
  const targets = await httpJson(`http://127.0.0.1:${debugPort}/json/list`);
  const target = targets.find((item) => item.type === "page");
  if (!target?.webSocketDebuggerUrl) throw new Error("No debuggable browser page was found.");
  cdp = await createCdpClient(target.webSocketDebuggerUrl);

  await Promise.all([
    cdp.send("Page.enable"),
    cdp.send("Runtime.enable"),
    cdp.send("Network.enable"),
    cdp.send("Accessibility.enable"),
  ]);

  async function evaluate(expression) {
    const result = await cdp.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    return result.result.value;
  }

  async function setViewport(width, height, mobile = false) {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  }

  async function navigate(url) {
    const loaded = cdp.once("Page.loadEventFired");
    await cdp.send("Page.navigate", { url });
    await loaded;
    await wait(1_250);
  }

  const domExpression = `(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const interactives = [...document.querySelectorAll("a,button,input,select,textarea")].filter(visible);
    const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((node) => ({
      level: Number(node.tagName.slice(1)),
      text: node.textContent.replace(/\\s+/g, " ").trim(),
    }));
    const overflow = [...document.querySelectorAll("body *")].filter(visible).filter((element) => {
      const rect = element.getBoundingClientRect();
      return rect.left < -1 || rect.right > innerWidth + 1;
    }).map((element) => ({ tag: element.tagName, class: String(element.className || "").slice(0, 100) }));
    return {
      url: location.href,
      title: document.title,
      lang: document.documentElement.lang || null,
      viewport: { width: innerWidth, height: innerHeight },
      document_size: {
        client_width: document.documentElement.clientWidth,
        scroll_width: document.documentElement.scrollWidth,
        scroll_height: document.documentElement.scrollHeight,
      },
      horizontal_overflow_pixels: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
      overflowing_elements: overflow,
      headings,
      h1_count: headings.filter((item) => item.level === 1).length,
      landmarks: {
        header: document.querySelectorAll("header,[role=banner]").length,
        nav: document.querySelectorAll("nav,[role=navigation]").length,
        main: document.querySelectorAll("main,[role=main]").length,
        footer: document.querySelectorAll("footer,[role=contentinfo]").length,
      },
      interactive_count: interactives.length,
      unnamed_interactives: interactives.filter((element) => !String(element.getAttribute("aria-label") || element.textContent || element.value || "").trim()).length,
      mode_buttons: [...document.querySelectorAll("[data-demo-mode]")].map((button) => ({
        text: button.textContent.trim(),
        aria_pressed: button.getAttribute("aria-pressed"),
        active_class: button.classList.contains("demo-mode-toggle__active"),
      })),
      first_screen_text: document.body.innerText.replace(/\\s+/g, " ").trim().slice(0, 800),
    };
  })()`;

  const stateExpression = `(() => {
    const rows = Object.fromEntries([...document.querySelectorAll(".binding-check-list li")].map((row) => [
      row.querySelector("strong")?.textContent?.trim(),
      row.querySelector("span")?.textContent?.trim(),
    ]));
    const flow = Object.fromEntries([...document.querySelectorAll(".demo-flow li")].map((row) => [
      row.querySelector("strong")?.textContent?.trim(),
      row.querySelector("p")?.textContent?.replace(/\\s+/g, " ").trim(),
    ]));
    const facts = Object.fromEntries([...document.querySelectorAll(".proof-route-panel__facts > div")].map((row) => [
      row.querySelector("dt")?.textContent?.trim(),
      row.querySelector("dd")?.textContent?.trim(),
    ]));
    return {
      mode: document.querySelector(".demo-mode-toggle__active")?.textContent?.trim() ?? null,
      safety_label: document.querySelector(".safety-test-label")?.textContent?.replace(/\\s+/g, " ").trim() ?? null,
      binding_rows: rows,
      signing_control: document.querySelector(".binding-check-list + button")?.textContent?.replace(/\\s+/g, " ").trim() ?? null,
      evidence_verdict: document.querySelector(".evidence-strip span:last-child")?.textContent?.trim() ?? null,
      verifier_control: {
        text: document.querySelector("#verifyPublicProof")?.textContent?.replace(/\\s+/g, " ").trim() ?? null,
        disabled: document.querySelector("#verifyPublicProof")?.disabled ?? null,
      },
      download_control: {
        text: document.querySelector("#downloadPublicProof")?.textContent?.replace(/\\s+/g, " ").trim() ?? null,
        disabled: document.querySelector("#downloadPublicProof")?.disabled ?? null,
      },
      flow,
      proof_facts: facts,
    };
  })()`;

  async function capture({ file, width, height, mobile = false, click = null, scrollTo = null }) {
    await setViewport(width, height, mobile);
    await navigate(`${baseUrl}/demo?closeout=${encodeURIComponent(file)}`);
    if (click) {
      await evaluate(`document.querySelector(${JSON.stringify(click)})?.click(); true`);
      await wait(250);
    }
    if (scrollTo) {
      await evaluate(`document.querySelector(${JSON.stringify(scrollTo)})?.scrollIntoView({block:"start"}); true`);
      await wait(250);
    }
    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
      fromSurface: true,
    });
    await writeFile(join(outputDir, file), Buffer.from(screenshot.data, "base64"));
    const dom = await evaluate(domExpression);
    const axTree = await cdp.send("Accessibility.getFullAXTree");
    const actionable = new Set(["button", "link", "textbox", "combobox", "checkbox", "radio"]);
    const nameless = axTree.nodes.filter((node) => actionable.has(node.role?.value) && !node.ignored && !String(node.name?.value ?? "").trim());
    report.screenshots.push({ file, width, height, mobile, click, scrollTo });
    report.dom_cases.push({ file, dom, nameless_ax_action_count: nameless.length });
  }

  await capture({ file: "ui-demo-1440.png", width: 1440, height: 900 });
  report.pass_state = await evaluate(stateExpression);
  await capture({ file: "ui-demo-1280.png", width: 1280, height: 800 });
  await capture({ file: "ui-demo-390.png", width: 390, height: 844, mobile: true });
  await capture({
    file: "ui-binding-mismatch-390.png",
    width: 390,
    height: 844,
    mobile: true,
    click: '[data-demo-mode="mismatch"]',
    scrollTo: "#verify",
  });
  report.mismatch_state = await evaluate(stateExpression);
  await evaluate("document.querySelector('#verifyPublicProof')?.click(); true");
  await wait(100);
  report.mismatch_state_after_verify = await evaluate(stateExpression);
  await capture({ file: "ui-proof-detail-1440.png", width: 1440, height: 900, scrollTo: "#prove" });

  await setViewport(1440, 900, false);
  await navigate(`${baseUrl}/demo?closeout=keyboard`);
  for (let index = 0; index < 10; index += 1) {
    await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    await cdp.send("Input.dispatchKeyEvent", { type: "keyUp", key: "Tab", code: "Tab", windowsVirtualKeyCode: 9 });
    report.focus_sequence.push(await evaluate(`(() => {
      const element = document.activeElement;
      const style = getComputedStyle(element);
      return {
        tag: element?.tagName ?? null,
        id: element?.id || null,
        text: element?.textContent?.replace(/\\s+/g, " ").trim().slice(0, 100) || null,
        outline_style: style.outlineStyle,
        outline_width: style.outlineWidth,
        outline_color: style.outlineColor,
        box_shadow: style.boxShadow,
      };
    })()`));
  }

  await navigate(`${baseUrl}/demo?closeout=hash#review`);
  await evaluate("document.querySelector('a[href=\"#verify\"]')?.click(); true");
  await wait(250);
  const afterVerifyHash = await evaluate(`(() => ({
    hash: location.hash,
    active_tag: document.activeElement?.tagName ?? null,
    active_text: document.activeElement?.textContent?.replace(/\\s+/g, " ").trim().slice(0, 80) ?? null,
    target_top: Math.round(document.querySelector("#verify")?.getBoundingClientRect().top ?? -1),
  }))()`);
  await evaluate("document.querySelector('a[href=\"#authorize\"]')?.click(); true");
  await wait(200);
  await evaluate("history.back(); true");
  await wait(300);
  const afterBack = await evaluate(`(() => ({
    hash: location.hash,
    active_tag: document.activeElement?.tagName ?? null,
    active_text: document.activeElement?.textContent?.replace(/\\s+/g, " ").trim().slice(0, 80) ?? null,
    target_top: Math.round(document.querySelector(location.hash)?.getBoundingClientRect().top ?? -1),
  }))()`);
  report.hash_navigation = { after_verify_link: afterVerifyHash, after_back: afterBack };

  await cdp.send("Emulation.setEmulatedMedia", {
    media: "screen",
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await navigate(`${baseUrl}/demo?closeout=reduced-motion`);
  report.reduced_motion = await evaluate(`(() => ({
    media_matches: matchMedia("(prefers-reduced-motion: reduce)").matches,
    animated_visible_elements: [...document.querySelectorAll("body *")].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && rect.width > 0 && rect.height > 0 && style.animationName !== "none" && style.animationDuration !== "0s";
    }).map((element) => ({
      tag: element.tagName,
      class: String(element.className || "").slice(0, 100),
      animation_name: getComputedStyle(element).animationName,
      animation_duration: getComputedStyle(element).animationDuration,
    })),
  }))()`);
  await cdp.send("Emulation.setEmulatedMedia", { media: "screen", features: [] });

  await cdp.send("Network.setBlockedURLs", { urls: ["*fixtures/verified-mainnet-run/proof.json*"] });
  await navigate(`${baseUrl}/demo?closeout=missing-fixture`);
  report.missing_fixture_state = await evaluate(`(() => ({
    error_panel: document.querySelector(".mainnet-empty--error")?.textContent?.replace(/\\s+/g, " ").trim() ?? null,
    body_contains_confirmed: document.body.innerText.includes("CHAIN STATUS CONFIRMED"),
  }))()`);
  await cdp.send("Network.setBlockedURLs", { urls: [] });

  const injected = await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `(() => {
      const originalFetch = window.fetch.bind(window);
      window.fetch = async (...args) => {
        const response = await originalFetch(...args);
        if (!String(args[0]).includes("fixtures/verified-mainnet-run/proof.json")) return response;
        return new Response("{not-json", { status: 200, headers: { "Content-Type": "application/json" } });
      };
    })();`,
  });
  await navigate(`${baseUrl}/demo?closeout=malformed-fixture`);
  report.malformed_fixture_state = await evaluate(`(() => ({
    error_panel: document.querySelector(".mainnet-empty--error")?.textContent?.replace(/\\s+/g, " ").trim() ?? null,
    body_contains_confirmed: document.body.innerText.includes("CHAIN STATUS CONFIRMED"),
  }))()`);
  await cdp.send("Page.removeScriptToEvaluateOnNewDocument", { identifier: injected.identifier });

  await writeFile(join(outputDir, "ui-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    output: join(outputDir, "ui-audit.json"),
    browser: report.browser,
    screenshots: report.screenshots.map((item) => item.file),
    mismatch: report.mismatch_state,
    hash_navigation: report.hash_navigation,
    reduced_motion: report.reduced_motion,
    missing_fixture_state: report.missing_fixture_state,
    malformed_fixture_state: report.malformed_fixture_state,
  }, null, 2));
} finally {
  cdp?.close();
  browser.kill();
  server.kill();
}

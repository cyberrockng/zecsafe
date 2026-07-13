import { writeFile } from "node:fs/promises";

const endpoint = "http://127.0.0.1:9223";
const outputPath = new URL("../evidence/ui/demo-interactions.json", import.meta.url);
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url.startsWith("http://127.0.0.1:4181/demo"))
  ?? targets.find((item) => item.type === "page");

if (!target?.webSocketDebuggerUrl) throw new Error("No debuggable page target was found.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const eventWaiters = new Map();
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
  const waiters = eventWaiters.get(message.method);
  if (!waiters?.length) return;
  eventWaiters.delete(message.method);
  for (const waiter of waiters) waiter(message.params);
});

function send(method, params = {}) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function onceEvent(method) {
  return new Promise((resolve) => {
    const waiters = eventWaiters.get(method) ?? [];
    waiters.push(resolve);
    eventWaiters.set(method, waiters);
  });
}

async function evaluate(expression) {
  const result = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
}

await Promise.all([send("Page.enable"), send("Runtime.enable")]);
await send("Emulation.setDeviceMetricsOverride", {
  width: 1280,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const fakeTxid = "00".repeat(32);
const injected = await send("Page.addScriptToEvaluateOnNewDocument", {
  source: `(() => {
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (!String(args[0]).includes("/fixtures/verified-mainnet-run/proof.json")) return response;
      const proof = await response.clone().json();
      proof.transaction.txid = "${fakeTxid}";
      return new Response(JSON.stringify(proof), {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    };
  })();`,
});

const loaded = onceEvent("Page.loadEventFired");
await send("Page.navigate", { url: "http://127.0.0.1:4181/demo?audit=tampered-proof" });
await loaded;
await new Promise((resolve) => setTimeout(resolve, 1_500));

const snapshotExpression = `(() => {
  const text = (selector) => document.querySelector(selector)?.textContent?.replace(/\\s+/g, " ").trim() ?? null;
  const button = (selector) => {
    const element = document.querySelector(selector);
    return element ? { text: element.textContent.replace(/\\s+/g, " ").trim(), disabled: element.disabled } : null;
  };
  const receipt = Object.fromEntries([...document.querySelectorAll(".verified-demo__receipt div")].map((row) => [
    row.querySelector("dt")?.textContent?.trim(),
    row.querySelector("dd")?.textContent?.trim(),
  ]));
  return {
    receipt,
    verifyButton: button("#verifyPublicProof"),
    evidenceVerdict: text(".evidence-strip span:last-child"),
    routeMessage: text(".proof-route-panel .section-heading > span"),
    signingControl: button(".binding-check-list + button"),
    mismatchLabel: text(".safety-test-label"),
    activeMode: text(".demo-mode-toggle__active"),
    failedBindingChecks: document.querySelectorAll(".binding-check--fail").length,
  };
})()`;

const observations = [];
observations.push({ stage: "tampered_fixture_loaded_before_verification", value: await evaluate(snapshotExpression) });
await evaluate("document.querySelector('#verifyPublicProof').click(); true");
await new Promise((resolve) => setTimeout(resolve, 100));
observations.push({ stage: "tampered_fixture_after_verify_click", value: await evaluate(snapshotExpression) });
await evaluate("document.querySelector('[data-demo-mode=mismatch]').click(); true");
await new Promise((resolve) => setTimeout(resolve, 100));
observations.push({ stage: "mismatch_selected", value: await evaluate(snapshotExpression) });
await evaluate("document.querySelector('#verifyPublicProof').click(); true");
await new Promise((resolve) => setTimeout(resolve, 100));
observations.push({ stage: "mismatch_after_verify_click", value: await evaluate(snapshotExpression) });

const report = {
  generatedAt: new Date().toISOString(),
  test: "Replace the recorded proof txid in transit without changing its bundle hash, then exercise the W4 browser verifier.",
  injectedScriptIdentifier: injected.identifier,
  fakeTxid,
  observations,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify(report, null, 2));
socket.close();

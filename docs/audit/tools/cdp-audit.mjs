import { writeFile } from "node:fs/promises";

const endpoint = "http://127.0.0.1:9223";
const outputPath = new URL("../evidence/ui/dom-audit.json", import.meta.url);
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page" && item.url === "about:blank")
  ?? targets.find((item) => item.type === "page");

if (!target?.webSocketDebuggerUrl) {
  throw new Error("No debuggable Chrome page target was found.");
}

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const eventWaiters = new Map();
let activeRuntime = null;

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

  if (activeRuntime) {
    if (message.method === "Runtime.exceptionThrown") {
      activeRuntime.exceptions.push(message.params.exceptionDetails.text);
    }
    if (message.method === "Log.entryAdded") {
      activeRuntime.console.push({
        level: message.params.entry.level,
        text: message.params.entry.text,
        source: message.params.entry.source,
      });
    }
    if (message.method === "Network.loadingFailed") {
      activeRuntime.networkFailures.push({
        errorText: message.params.errorText,
        type: message.params.type,
        canceled: Boolean(message.params.canceled),
      });
    }
    if (message.method === "Network.responseReceived" && message.params.response.status >= 400) {
      activeRuntime.httpErrors.push({
        status: message.params.response.status,
        url: message.params.response.url,
        type: message.params.type,
      });
    }
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

await Promise.all([
  send("Page.enable"),
  send("Runtime.enable"),
  send("Log.enable"),
  send("Network.enable"),
  send("Accessibility.enable"),
]);

const expression = `(() => {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };
  const describe = (element) => {
    const rect = element.getBoundingClientRect();
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      class: String(element.className || "").slice(0, 120) || null,
      text: String(element.innerText || element.getAttribute("aria-label") || "").replace(/\\s+/g, " ").trim().slice(0, 100),
      bounds: {
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };
  };
  const elements = [...document.querySelectorAll("body *")].filter(visible);
  const overflow = elements.filter((element) => {
    const rect = element.getBoundingClientRect();
    return rect.left < -1 || rect.right > innerWidth + 1;
  });
  const interactives = [...document.querySelectorAll("a, button, input, select, textarea")].filter(visible);
  const unnamedInteractives = interactives.filter((element) => {
    const name = element.getAttribute("aria-label") || element.getAttribute("title") || element.innerText || element.value || element.getAttribute("alt");
    return !String(name || "").trim();
  });
  const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
  const duplicateIds = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  const headings = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(visible).map((element) => ({
    level: Number(element.tagName.slice(1)),
    text: element.innerText.replace(/\\s+/g, " ").trim().slice(0, 140),
  }));
  return {
    url: location.href,
    title: document.title,
    language: document.documentElement.lang || null,
    viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    documentSize: {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      clientHeight: document.documentElement.clientHeight,
      scrollHeight: document.documentElement.scrollHeight,
      bodyScrollWidth: document.body.scrollWidth,
    },
    horizontalOverflowPixels: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    overflowingElementCount: overflow.length,
    overflowingElements: overflow.slice(0, 30).map(describe),
    interactiveCount: interactives.length,
    unnamedInteractives: unnamedInteractives.map(describe),
    duplicateIds,
    h1Count: headings.filter((heading) => heading.level === 1).length,
    headings,
    imageCount: document.images.length,
    imagesMissingAlt: [...document.images].filter((image) => !image.hasAttribute("alt")).map(describe),
    landmarkCounts: {
      main: document.querySelectorAll("main,[role=main]").length,
      nav: document.querySelectorAll("nav,[role=navigation]").length,
      header: document.querySelectorAll("header,[role=banner]").length,
      footer: document.querySelectorAll("footer,[role=contentinfo]").length,
    },
  };
})()`;

const cases = [];
for (const viewport of [
  { width: 1440, height: 1200, mobile: false },
  { width: 1280, height: 900, mobile: false },
  { width: 390, height: 844, mobile: true },
]) {
  activeRuntime = { console: [], exceptions: [], networkFailures: [], httpErrors: [] };
  await send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.mobile,
  });
  const loaded = onceEvent("Page.loadEventFired");
  await send("Page.navigate", { url: `http://127.0.0.1:4181/demo?audit=${viewport.width}` });
  await loaded;
  await new Promise((resolve) => setTimeout(resolve, 1_200));
  const result = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  const axTree = await send("Accessibility.getFullAXTree");
  const actionableRoles = new Set(["button", "link", "textbox", "combobox", "checkbox", "radio"]);
  const actionableNodes = axTree.nodes.filter((node) => actionableRoles.has(node.role?.value) && !node.ignored);
  cases.push({
    requestedViewport: viewport,
    dom: result.result.value,
    accessibility: {
      nodeCount: axTree.nodes.length,
      actionableNodeCount: actionableNodes.length,
      namelessActionableNodes: actionableNodes
        .filter((node) => !String(node.name?.value ?? "").trim())
        .map((node) => ({ role: node.role?.value ?? null, backendDOMNodeId: node.backendDOMNodeId ?? null })),
    },
    runtime: activeRuntime,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  browser: await fetch(`${endpoint}/json/version`).then((response) => response.json()).then((value) => value.Browser),
  cases,
};

await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({
  outputPath: outputPath.pathname,
  summary: cases.map((item) => ({
    viewport: item.requestedViewport,
    documentSize: item.dom.documentSize,
    horizontalOverflowPixels: item.dom.horizontalOverflowPixels,
    overflowingElementCount: item.dom.overflowingElementCount,
    unnamedInteractives: item.dom.unnamedInteractives.length,
    namelessAXActions: item.accessibility.namelessActionableNodes.length,
    consoleEntries: item.runtime.console.length,
    exceptions: item.runtime.exceptions.length,
    networkFailures: item.runtime.networkFailures.length,
    httpErrors: item.runtime.httpErrors.length,
  })),
}, null, 2));

socket.close();

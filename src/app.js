import { createBindingMismatchEvents, proofEventsFromPublicLog, reduceDemoProofEvents } from "./demo-proof-state.mjs";
import { createPublicProofExport, deriveDemoPresentation } from "./demo-presentation.mjs";
import { TAMPER_PRESETS, verifyProofInBrowser } from "./verify-browser.mjs";

const VERIFIED_MAINNET_PROOF_PATH = "fixtures/verified-mainnet-run/proof.json";
const VERIFIED_MAINNET_EVENTS_PATH = "fixtures/verified-mainnet-run/events.public.json";

const routes = [
  { path: "/", label: "Product" },
  { path: "/proof", label: "Proof" },
  { path: "/how-it-works", label: "How it works" },
  { path: "/security", label: "Security" },
  { path: "/docs", label: "Docs" },
];

// Exactly four human proof steps. These are local proof-page anchors, not global navigation.
const proofSteps = [
  { href: "#review", label: "Review" },
  { href: "#verify", label: "Verify" },
  { href: "#authorize", label: "Authorize" },
  { href: "#prove", label: "Prove" },
];

const routeMeta = {
  "/": {
    title: "ZecSafe - Lose one key, not your ZEC.",
    description:
      "A 2-of-3 FROST authorization layer for shielded Zcash with a verified recorded mainnet proof and browser-verifiable evidence.",
  },
  "/proof": {
    title: "Verify the ZecSafe Mainnet Proof",
    description:
      "Replay the recorded ZecSafe mainnet run, verify the public proof bundle in your browser, and test tamper rejection.",
  },
  "/how-it-works": {
    title: "How ZecSafe Works",
    description:
      "Understand ZecSafe's 2-of-3 vault model, Binding Firewall, FROST authorization path, and public proof bundle.",
  },
  "/security": {
    title: "ZecSafe Security Model",
    description:
      "Read what ZecSafe proves, what it does not prove, and the privacy and audit boundaries of the recorded proof.",
  },
  "/docs": {
    title: "ZecSafe Documentation",
    description: "Find ZecSafe proof specs, privacy notes, security docs, source code, and verifier commands.",
  },
};

const state = {
  demo: {
    status: "idle",
    mode: "verified",
    message: "Loading recorded verified mainnet proof and ProofEvent v1 replay...",
    proof: null,
    publicEventLog: null,
    events: [],
    reduced: reduceDemoProofEvents([]),
    verifyStatus: "idle",
    revealCount: Infinity,
  },
  hero: {
    revealCount: Infinity,
  },
  ui: {
    txidExpanded: false,
    txidCopied: false,
    mobileNavOpen: false,
    previewMode: "authorization",
  },
  lab: {
    busy: false,
    editing: false,
    presetId: null,
    proofText: null,
    result: null,
    error: null,
    resultSeq: 0,
    animatedSeq: 0,
  },
};

let replayTimer = null;
let heroTimer = null;
let copiedTimer = null;
const app = document.querySelector("#app");

const HERO_ROW_TOTAL = 5;

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function proofValue(value, fallback = "Unavailable") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

function shortHex(value) {
  if (!value) return "Unavailable";
  return `${String(value).slice(0, 8)}...`;
}

function activeRoute() {
  const pathname = window.location.pathname.replace(/\/$/, "") || "/";
  if (pathname === "/demo") return "/proof";
  return routeMeta[pathname] ? pathname : "/";
}

function updateDocumentMeta(route) {
  const meta = routeMeta[route] ?? routeMeta["/"];
  document.title = meta.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", meta.description);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute("href", `https://zecsafe.vercel.app${route === "/" ? "/" : route}`);
}

function navigateTo(path) {
  const normalized = path === "/demo" ? "/proof" : path;
  if (window.location.pathname !== normalized) {
    window.history.pushState({}, "", normalized);
  }
  state.ui.mobileNavOpen = false;
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
}

function demoProofEventsForMode(mode = state.demo.mode) {
  const events = state.demo.events;
  return mode === "mismatch" ? createBindingMismatchEvents(events) : events;
}

function updateDemoReduction(mode = state.demo.mode) {
  const reduced = reduceDemoProofEvents(demoProofEventsForMode(mode));
  state.demo.mode = mode;
  state.demo.reduced = reduced;
  return reduced;
}

function animateHeroReveal(total = HERO_ROW_TOTAL) {
  if (heroTimer) clearInterval(heroTimer);
  if (prefersReducedMotion()) {
    state.hero.revealCount = Infinity;
    render();
    return;
  }
  state.hero.revealCount = 0;
  render();
  heroTimer = setInterval(() => {
    state.hero.revealCount += 1;
    document.querySelectorAll(".signer-card").forEach((node, index) => {
      if (index < state.hero.revealCount) node.classList.add("signer-card--on");
    });
    if (state.hero.revealCount >= total) {
      state.hero.revealCount = Infinity;
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }, 240);
}

function animateFlowReveal(totalSteps) {
  if (replayTimer) clearInterval(replayTimer);
  state.demo.revealCount = 0;
  replayTimer = setInterval(() => {
    state.demo.revealCount += 1;
    if (state.demo.revealCount >= totalSteps) {
      state.demo.revealCount = Infinity;
      clearInterval(replayTimer);
      replayTimer = null;
    }
    render();
  }, 280);
}

async function loadVerifiedProof(mode = state.demo.mode, { animate = false } = {}) {
  if (state.demo.status === "loading") return;

  state.demo = {
    ...state.demo,
    status: "loading",
    mode,
    message: "Loading recorded verified mainnet proof and ProofEvent v1 replay...",
  };
  render();

  try {
    const [proofResponse, eventsResponse] = await Promise.all([
      fetch(VERIFIED_MAINNET_PROOF_PATH),
      fetch(VERIFIED_MAINNET_EVENTS_PATH),
    ]);

    if (!proofResponse.ok) throw new Error(`Proof fixture returned HTTP ${proofResponse.status}`);
    if (!eventsResponse.ok) throw new Error(`ProofEvent fixture returned HTTP ${eventsResponse.status}`);

    const proof = await proofResponse.json();
    const publicEventLog = await eventsResponse.json();
    const events = proofEventsFromPublicLog(publicEventLog);
    const reduced = reduceDemoProofEvents(mode === "mismatch" ? createBindingMismatchEvents(events) : events);

    state.demo = {
      ...state.demo,
      status: "success",
      mode,
      message: "Recorded verified mainnet proof loaded.",
      proof,
      publicEventLog,
      events,
      reduced,
      verifyStatus: "idle",
    };
    if (animate && mode !== "mismatch") {
      animateFlowReveal(8);
      animateHeroReveal();
    }
  } catch (error) {
    state.demo = {
      ...state.demo,
      status: "error",
      message: error.message,
      reduced: reduceDemoProofEvents([]),
    };
  }

  render();
}

function setDemoMode(mode) {
  if (!state.demo.events.length) {
    loadVerifiedProof(mode);
    return;
  }

  updateDemoReduction(mode);
  state.demo.verifyStatus = "idle";
  state.demo.message =
    mode === "mismatch"
      ? "Mismatch fixture active. The Binding Firewall blocks signing."
      : "Recorded verified mainnet proof loaded.";
  render();
}

async function verifyLoadedPublicProof() {
  const proof = state.demo.proof;
  const replay = state.demo.reduced;
  if (!proof) return;

  // Real verification, not a status echo: the browser verifier recomputes
  // the canonical bundle hash with WebCrypto, then the replay gates are
  // checked against the recorded ProofEvents.
  const browserVerification = await verifyProofInBrowser(proof);

  const replayChecks = [
    proof.network === "main",
    Boolean(proof.run_id),
    Boolean(proof.transaction?.txid),
    replay.readiness.binding_passed,
    replay.readiness.threshold_reached,
    replay.frost.selected_signer_count >= Number(proof.vault?.threshold ?? 0),
  ];
  const pass = state.demo.mode !== "mismatch" && browserVerification.status === "PASS" && replayChecks.every(Boolean);

  state.demo.verifyStatus = pass ? "pass" : "fail";
  state.demo.message = pass
    ? "Bundle hash recomputed in this browser; proof integrity and ProofEvent replay pass."
    : "Proof integrity verification failed or the safety-test mismatch is active.";
  render();
}

async function runLabVerification({ presetId = null, proofText = null } = {}) {
  if (!state.demo.proof || state.lab.busy) return;

  state.lab = { ...state.lab, busy: true, error: null, result: null };
  render();

  try {
    let candidate;
    if (proofText !== null) {
      state.lab.proofText = proofText;
      candidate = JSON.parse(proofText);
    } else if (presetId) {
      const preset = TAMPER_PRESETS.find((item) => item.id === presetId);
      candidate = structuredClone(state.demo.proof);
      preset.apply(candidate);
      state.lab.proofText = JSON.stringify(candidate, null, 2);
    } else {
      candidate = structuredClone(state.demo.proof);
      state.lab.proofText = JSON.stringify(candidate, null, 2);
    }

    const result = await verifyProofInBrowser(candidate);
    state.lab = { ...state.lab, busy: false, presetId, result, error: null, resultSeq: state.lab.resultSeq + 1 };
  } catch (error) {
    state.lab = { ...state.lab, busy: false, presetId, result: null, error: error.message };
  }

  render();
}

function resetLab() {
  state.lab = { ...state.lab, busy: false, editing: false, presetId: null, proofText: null, result: null, error: null };
  render();
}

function downloadPublicProof() {
  if (!state.demo.proof || state.demo.mode !== "verified") return;
  const payload = createPublicProofExport({
    proof: state.demo.proof,
    publicEventLog: state.demo.publicEventLog,
    replay: state.demo.reduced,
    mode: state.demo.mode,
  });
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `zecsafe-public-proof-${state.demo.proof.run_id}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

async function copyTxid() {
  const txid = state.demo.proof?.transaction?.txid;
  if (!txid) return;
  try {
    await navigator.clipboard.writeText(txid);
    state.ui.txidCopied = true;
    render();
    if (copiedTimer) clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      state.ui.txidCopied = false;
      render();
    }, 2000);
  } catch {
    state.ui.txidExpanded = true;
    render();
  }
}

function renderProofFact(label, value) {
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd>${escapeHtml(proofValue(value))}</dd>
    </div>
  `;
}

function renderTxidFact(label, txid) {
  if (!txid || String(txid).length < 16) return renderProofFact(label, txid);
  const value = String(txid);
  const preview = `${value.slice(0, 8)}…${value.slice(-4)}`;
  return `
    <div>
      <dt>${escapeHtml(label)}</dt>
      <dd class="txid-fact">
        <button type="button" class="txid-fact__value" data-action="toggle-txid" title="${state.ui.txidExpanded ? "Collapse" : "Show the full txid"}">
          ${escapeHtml(state.ui.txidExpanded ? value : preview)}
        </button>
        <button type="button" class="txid-fact__copy" data-action="copy-txid">${state.ui.txidCopied ? "Copied" : "Copy"}</button>
        <a class="txid-fact__copy" href="https://mainnet.zcashexplorer.app/transactions/${encodeURIComponent(value)}" target="_blank" rel="noopener noreferrer">Explorer</a>
      </dd>
    </div>
  `;
}

function renderBindingCheck(field, status) {
  const ok = ["PASS", "MATCH", "LIMITED"].includes(status);
  return `
    <li class="${ok ? "binding-check--pass" : "binding-check--fail"}">
      <strong>${escapeHtml(field)}</strong>
      <span>${escapeHtml(status)}</span>
    </li>
  `;
}

function renderFlowStep(label, detail, complete = true, pending = false) {
  const classes = [complete && !pending ? "demo-flow__step--complete" : "", pending ? "demo-flow__step--pending" : ""]
    .filter(Boolean)
    .join(" ");
  return `
    <li class="${classes}">
      <span></span>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${escapeHtml(detail)}</p>
      </div>
    </li>
  `;
}

function renderLabCheck(check, index = 0, animate = false) {
  const ok = check.status === "PASS";
  const classes = [
    ok ? "binding-check--pass" : "binding-check--fail",
    animate ? `lab-gate-in stagger-${Math.min(index + 1, 14)}` : "",
    animate && !ok ? "lab-gate-fail-pulse" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return `
    <li class="${classes}">
      <strong>${escapeHtml(check.name)}</strong>
      <span>${escapeHtml(check.status)}</span>
    </li>
  `;
}

function renderTamperLab() {
  const lab = state.lab;
  if (!state.demo.proof || state.demo.mode === "mismatch") return "";

  const result = lab.result;
  const animate = lab.animatedSeq !== lab.resultSeq && !prefersReducedMotion();
  const verdictBlock = result
    ? `
      <div class="tamper-lab__verdict ${result.status === "PASS" ? "tamper-lab__verdict--pass" : "tamper-lab__verdict--fail"} ${animate ? "lab-verdict-in" : ""}" role="status">
        <strong>${escapeHtml(result.verdict)}</strong>
        <span>Recorded bundle hash: ${escapeHtml(shortHex(result.bundle_hash?.slice("sha256:".length)))}</span>
        <span>Recomputed just now in your browser:
          <span class="${animate ? "hash-fill" : ""}">${escapeHtml(shortHex(result.computed_bundle_hash?.slice("sha256:".length)))}</span>
        </span>
      </div>
      <ul class="binding-check-list binding-check-list--lab">${result.checks.map((check, index) => renderLabCheck(check, index, animate)).join("")}</ul>
    `
    : "";
  const errorBlock = lab.error
    ? `<div class="notice notice--error"><strong>Verifier rejected the input</strong><p>${escapeHtml(lab.error)}</p></div>`
    : "";

  return `
    <section class="proof-card tamper-lab" id="tamper-lab">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Tamper Lab</p>
          <h2>Attack the proof without touching the recorded run.</h2>
        </div>
        <span>${lab.busy ? "Verifying..." : "WebCrypto SHA-256, client-side"}</span>
      </div>
      <p class="section-copy">
        The verifier runs in your browser and recomputes the bundle hash and every gate over a local copy of the
        recorded proof. Attack the copy; the recorded run is immutable. The authoritative verifier is
        make judge-proof-mainnet.
      </p>
      <div class="action-row tamper-lab__actions">
        <button class="button button--secondary" type="button" data-lab-action="verify" ${lab.busy ? "disabled" : ""}>Verify recorded proof</button>
        ${TAMPER_PRESETS.map(
          (preset) => `
            <button class="button button--ghost ${lab.presetId === preset.id ? "tamper-lab__preset--active" : ""}" type="button" data-lab-preset="${preset.id}" ${lab.busy ? "disabled" : ""}>
              ${escapeHtml(preset.label)}
            </button>
          `,
        ).join("")}
        <button class="button button--ghost" type="button" data-lab-action="edit" ${lab.busy ? "disabled" : ""}>${lab.editing ? "Hide JSON editor" : "Edit JSON"}</button>
        <button class="button button--ghost" type="button" data-lab-action="reset" ${lab.busy ? "disabled" : ""}>Reset</button>
      </div>
      ${
        lab.editing
          ? `
            <textarea class="tamper-lab__editor" id="labEditor" rows="14" spellcheck="false" aria-label="Editable proof JSON">${escapeHtml(
              lab.proofText ?? JSON.stringify(state.demo.proof, null, 2),
            )}</textarea>
            <div class="action-row">
              <button class="button button--primary" type="button" data-lab-action="verify-edit" ${lab.busy ? "disabled" : ""}>Verify my edit</button>
            </div>
          `
          : ""
      }
      ${errorBlock}
      ${verdictBlock}
    </section>
  `;
}

function renderStatusBadge(label, tone = "verified") {
  return `<span class="status-badge status-badge--${escapeHtml(tone)}"><i aria-hidden="true"></i>${escapeHtml(label)}</span>`;
}

function renderMetric(label, value, tone = null) {
  return `
    <div class="metric-tile ${tone ? `metric-tile--${escapeHtml(tone)}` : ""}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(proofValue(value))}</strong>
    </div>
  `;
}

function renderHashDisplay(label, value, { full = false } = {}) {
  const text = proofValue(value);
  const display = full || text.length <= 22 ? text : `${text.slice(0, 12)}...${text.slice(-8)}`;
  return `
    <div class="hash-display">
      <span>${escapeHtml(label)}</span>
      <code title="${escapeHtml(text)}">${escapeHtml(display)}</code>
    </div>
  `;
}

function renderHeroAuthorizationPreview({ proof, replay, presentation }) {
  const txid = presentation.recorded.txid;
  const blockHeight = proof?.transaction?.observed_block_height ?? replay?.chain?.observed_block_height;
  const confirmations = proof?.transaction?.confirmations_at_recording ?? replay?.chain?.confirmations;
  const rows = [
    ["Signer A", "Ready", "verified", "Selected signer"],
    ["Signer B", "Ready", "verified", "Selected signer"],
    ["Signer C", "Offline", "blocked", "Unavailable participant"],
  ];
  const checks = [
    ["Intent", proof?.intent?.commitment ? "Bound" : "Loading", proof?.intent?.commitment ? "verified" : "pending"],
    [
      "PCZT",
      replay?.readiness?.binding_passed ? "PASS" : (proof?.pczt?.binding_status ?? replay?.binding?.status),
      replay?.readiness?.binding_passed ? "verified" : "pending",
    ],
    [
      "FROST",
      replay?.readiness?.threshold_reached ? "Reached" : replay?.frost?.threshold_status,
      replay?.readiness?.threshold_reached ? "verified" : "pending",
    ],
    [
      "Mainnet",
      replay?.readiness?.chain_confirmed ? "Confirmed" : presentation.recorded.chainStatus,
      replay?.readiness?.chain_confirmed ? "verified" : "pending",
    ],
  ];

  return `
    <aside class="hero-console" aria-label="ZecSafe recorded authorization preview">
      <div class="hero-console__topline">
        <div>
          <span class="console-kicker">Recorded mainnet session</span>
          <strong>${escapeHtml(proof?.run_id ?? "Loading verified run")}</strong>
        </div>
        ${renderStatusBadge(presentation.recorded.chainStatus ?? "Recorded", replay?.readiness?.chain_confirmed ? "verified" : "pending")}
      </div>

      <div class="threshold-meter">
        <div class="threshold-meter__ring" aria-label="${escapeHtml(`${presentation.threshold} of ${presentation.total} threshold`)}">
          <span>${escapeHtml(`${presentation.threshold}/${presentation.total}`)}</span>
          <small>threshold</small>
        </div>
        <div class="threshold-meter__copy">
          <h2>Threshold reached with one signer unavailable.</h2>
          <p>Two selected signers authorize the recorded shielded spend; the public proof stays checkable without exposing private transaction details.</p>
        </div>
      </div>

      <div class="signer-grid">
        ${rows
          .map(
            ([label, status, tone, detail], index) => `
              <div class="signer-card ${index < state.hero.revealCount ? "signer-card--on" : ""}">
                ${renderStatusBadge(status, tone)}
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(detail)}</span>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="console-checks" aria-label="Recorded verification gates">
        ${checks
          .map(
            ([label, value, tone]) => `
              <div>
                ${renderStatusBadge(value ?? "Pending", tone)}
                <span>${escapeHtml(label)}</span>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="console-evidence">
        ${renderMetric("Network", proof?.network ?? "main", "mainnet")}
        ${renderMetric("Block height", blockHeight)}
        ${renderMetric("Confirmations", confirmations)}
      </div>

      ${renderHashDisplay("Txid", txid)}
      ${renderHashDisplay("Proof bundle hash", proof?.bundle_hash)}
    </aside>
  `;
}

function renderGlobalNav(route) {
  const proofActive = route === "/proof";
  return `
    <header class="site-header">
      <a class="brand" href="/" data-route="/">
        <span class="brand__mark">ZS</span>
        <span>
          <strong>ZecSafe</strong>
          <small>Shielded threshold authorization</small>
        </span>
      </a>
      <button class="nav-toggle" type="button" data-action="toggle-mobile-nav" aria-expanded="${state.ui.mobileNavOpen ? "true" : "false"}" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav ${state.ui.mobileNavOpen ? "site-nav--open" : ""}" aria-label="Primary">
        ${routes
          .map(
            (item) => `
              <a href="${item.path}" data-route="${item.path}" class="${item.path === route ? "site-nav__active" : ""}" ${item.path === route ? 'aria-current="page"' : ""}>
                ${escapeHtml(item.label)}
              </a>
            `,
          )
          .join("")}
        <a class="button button--nav ${proofActive ? "button--nav-active" : ""}" href="/proof" data-route="/proof" ${proofActive ? 'aria-current="page"' : ""}>Verify Proof</a>
      </nav>
    </header>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-brand">
        <a class="brand brand--footer" href="/" data-route="/">
          <span class="brand__mark">ZS</span>
          <span>
            <strong>ZecSafe</strong>
            <small>Shielded threshold authorization</small>
          </span>
        </a>
        <p>
          Hackathon proof-of-concept for Zcash FROST authorization. The recorded proof is verifiable; production
          custody, formal audit status, and recovery guarantees are not claimed. Recovery is not demonstrated.
        </p>
      </div>
      <div class="footer-column">
        <strong>Product</strong>
        <a href="/" data-route="/">Product</a>
        <a href="/proof" data-route="/proof">Proof</a>
        <a href="/how-it-works" data-route="/how-it-works">How it works</a>
      </div>
      <div class="footer-column">
        <strong>Trust</strong>
        <a href="/security" data-route="/security">Security</a>
        <a href="/docs" data-route="/docs">Docs</a>
        <a href="https://github.com/cyberrockng/zecsafe" target="_blank" rel="noopener noreferrer">GitHub</a>
      </div>
      <div class="footer-column footer-column--status">
        <strong>Network evidence</strong>
        ${renderStatusBadge("Zcash mainnet", "mainnet")}
        ${renderStatusBadge("Recorded proof", "verified")}
        ${renderStatusBadge("Prototype", "warning")}
      </div>
    </footer>
  `;
}

function renderEvidenceStrip(items) {
  return `
    <div class="evidence-strip" aria-label="Verified evidence">
      ${items.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
  `;
}

function renderTechnicalTrustStrip({ presentation, proof, replay }) {
  const items = [
    ["Zcash mainnet", proof?.network === "main" ? "Recorded" : "Loading", "mainnet"],
    [`${presentation.threshold}-of-${presentation.total}`, "Threshold policy", "verified"],
    ["Binding Firewall", replay?.readiness?.binding_passed ? "PASS" : "Loading", "verified"],
    ["Human approval", "Broadcast gated", "pending"],
    ["Public proof", proof?.bundle_hash ? "Hash anchored" : "Loading", "verified"],
    ["Production custody", "Not claimed", "warning"],
  ];

  return `
    <section class="trust-strip" aria-label="Technical credibility">
      ${items
        .map(
          ([label, detail, tone]) => `
            <div>
              ${renderStatusBadge(detail, tone)}
              <strong>${escapeHtml(label)}</strong>
            </div>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderThreatControlMatrix() {
  const rows = [
    ["Signer unavailable", "Funds can stall if a single operator is required.", "2-of-3 FROST path remains satisfiable.", "No share repair or migration demo."],
    ["Transaction tampering", "A signer could be asked to approve different semantics.", "Binding Firewall compares reviewed intent to PCZT fields.", "Semantic review, not independent signer SIGHASH recomputation."],
    ["Unproven authorization", "Judges cannot inspect private signing material.", "Public proof records safe fingerprints and replay gates.", "The proof is redacted evidence, not zero-knowledge."],
    ["Overstated custody claim", "A demo can look more mature than it is.", "Limits are visible in product copy and verifier docs.", "Not audited production custody software."],
  ];

  return `
    <section class="section-shell threat-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">Threat and control model</p>
          <h2>Availability without pretending the prototype is custody infrastructure.</h2>
        </div>
        <p class="section-lede">The homepage shows the security posture as controls and limits, not marketing claims.</p>
      </div>
      <div class="threat-matrix">
        ${rows
          .map(
            ([threat, impact, control, limit]) => `
              <article>
                <span>Threat</span>
                <h3>${escapeHtml(threat)}</h3>
                <p><strong>Impact:</strong> ${escapeHtml(impact)}</p>
                <p><strong>ZecSafe control:</strong> ${escapeHtml(control)}</p>
                <p><strong>Limit:</strong> ${escapeHtml(limit)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderWorkflowPreview() {
  const stages = [
    ["Prepare", "Recorded intent", "Create the bounded transaction intent and commit to its private semantics."],
    ["Validate", "Binding Firewall", "Compare the reviewed intent against PCZT-exposed fields before FROST starts."],
    ["Authorize", "2-of-3 FROST", "Select the two available signers while one participant remains unavailable."],
    ["Verify", "Browser and CLI", "Recompute proof integrity and replay the public ProofEvent gates."],
    ["Prove", "Exportable bundle", "Publish a redacted, tamper-evident evidence package for judges."],
  ];

  return `
    <section class="section-shell workflow-preview">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">How ZecSafe works</p>
          <h2>Five visible stages, one recorded mainnet proof.</h2>
        </div>
        <a class="button button--secondary" href="/how-it-works" data-route="/how-it-works">Explore workflow</a>
      </div>
      <ol class="workflow-rail">
        ${stages
          .map(
            ([label, title, body], index) => `
              <li>
                <span>${String(index + 1).padStart(2, "0")}</span>
                <strong>${escapeHtml(label)}</strong>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(body)}</p>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
}

function renderProductPreview({ proof, replay, presentation }) {
  const modes = {
    authorization: {
      label: "Authorization",
      title: "2-of-3 threshold stays available.",
      body: "Signer C is unavailable; signers A and B satisfy the threshold in the recorded run.",
      facts: [
        ["Threshold", `${presentation.threshold}-of-${presentation.total}`],
        ["Unavailable", presentation.unavailable],
        ["Aggregate signature", presentation.authorization.aggregateStatus],
      ],
    },
    proof: {
      label: "Proof verification",
      title: "The browser verifier recomputes the bundle hash.",
      body: "The homepage previews the proof state; the full verifier and Tamper Lab live on /proof.",
      facts: [
        ["Bundle hash", proof?.bundle_hash],
        ["Replay events", replay?.events_seen],
        ["Verifier", presentation.verifier.label],
      ],
    },
    mainnet: {
      label: "Mainnet evidence",
      title: "The transaction is recorded as confirmed.",
      body: "Zcash validates the resulting spend authorization normally; FROST provenance comes from the recorded session.",
      facts: [
        ["Network", proof?.network],
        ["Height", proof?.transaction?.observed_block_height],
        ["Status", presentation.recorded.chainStatus],
      ],
    },
    policy: {
      label: "Policy check",
      title: "A mismatch blocks before signing.",
      body: "The synthetic safety state fails the Binding Firewall and never imports later FROST or broadcast outcomes.",
      facts: [
        ["Recipient check", replay?.binding?.check_statuses?.recipient],
        ["Signing allowed", replay?.binding?.signing_allowed ? "YES" : "NO"],
        ["Mismatch demo", "Available on /proof"],
      ],
    },
  };
  const mode = modes[state.ui.previewMode] ? state.ui.previewMode : "authorization";
  const selected = modes[mode];

  return `
    <section class="section-shell product-preview-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">Product preview</p>
          <h2>Show the security workflow, not just the pitch.</h2>
        </div>
        <a class="button button--primary" href="/proof" data-route="/proof">Open proof application</a>
      </div>
      <div class="product-preview">
        <div class="preview-tabs" role="tablist" aria-label="Homepage product preview mode">
          ${Object.entries(modes)
            .map(
              ([id, item]) => `
                <button type="button" role="tab" aria-selected="${id === mode ? "true" : "false"}" class="${id === mode ? "preview-tab--active" : ""}" data-preview-mode="${id}">
                  ${escapeHtml(item.label)}
                </button>
              `,
            )
            .join("")}
        </div>
        <div class="preview-surface">
          <div>
            ${renderStatusBadge(mode === "policy" ? "Demo safety state" : "Recorded evidence", mode === "policy" ? "demo" : "verified")}
            <h3>${escapeHtml(selected.title)}</h3>
            <p>${escapeHtml(selected.body)}</p>
          </div>
          <dl class="preview-facts">
            ${selected.facts.map(([label, value]) => renderProofFact(label, value)).join("")}
          </dl>
        </div>
      </div>
    </section>
  `;
}

function renderMainnetProofSection({ proof, presentation }) {
  return `
    <section class="mainnet-proof-section">
      <div class="mainnet-proof-section__copy">
        <p class="eyebrow">Mainnet proof</p>
        <h2>The differentiator is inspectable evidence.</h2>
        <p>
          ZecSafe records the mainnet transaction, bundle hash, toolchain commits, and replay gates. It does not ask
          judges to infer FROST from a chain marker that does not exist.
        </p>
        <div class="action-row">
          <a class="button button--primary" href="/proof" data-route="/proof">Verify a proof</a>
          <a class="button button--secondary" href="https://mainnet.zcashexplorer.app/transactions/${encodeURIComponent(
            presentation.recorded.txid ?? "",
          )}" target="_blank" rel="noopener noreferrer">Open explorer</a>
        </div>
      </div>
      <div class="mainnet-evidence-panel">
        ${renderStatusBadge(presentation.recorded.chainStatus ?? "Recorded", "mainnet")}
        ${renderHashDisplay("Transaction ID", presentation.recorded.txid, { full: true })}
        <div class="console-evidence">
          ${renderMetric("Network", proof?.network)}
          ${renderMetric("Block height", proof?.transaction?.observed_block_height)}
          ${renderMetric("Recorded confirmations", proof?.transaction?.confirmations_at_recording)}
        </div>
        ${renderHashDisplay("Bundle hash", proof?.bundle_hash)}
        ${renderHashDisplay("ZecSafe commit at run", proof?.zecsafe_commit)}
      </div>
    </section>
  `;
}

function renderSecurityArchitecturePreview({ showCta = true } = {}) {
  const nodes = [
    ["Intent", "Private semantics committed"],
    ["Binding Firewall", "PCZT field checks"],
    ["FROST A+B", "Threshold reached"],
    ["PCZT complete", "Signed and proven"],
    ["Human gate", "Broadcast approval"],
    ["Public proof", "Redacted evidence"],
  ];
  return `
    <section class="section-shell architecture-preview">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">Security architecture</p>
          <h2>Human approval remains the boundary between proof and broadcast.</h2>
        </div>
        ${showCta ? '<a class="button button--secondary" href="/security" data-route="/security">Review security model</a>' : ""}
      </div>
      <div class="architecture-map" aria-label="ZecSafe security architecture preview">
        ${nodes
          .map(
            ([title, body]) => `
              <article>
                <strong>${escapeHtml(title)}</strong>
                <span>${escapeHtml(body)}</span>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderImplementationStatus() {
  const items = [
    ["Implemented", "Proof verifier, Binding Firewall reducer, proof export, route-aware static app.", "verified"],
    ["Demonstrated", "Recorded 2-of-3 FROST authorization with one unavailable participant.", "mainnet"],
    ["Experimental", "Hackathon proof-of-concept using rerandomized FROST tooling.", "warning"],
    ["Not claimed", "Production custody, formal audit, share repair, refresh, or guaranteed recovery.", "blocked"],
  ];
  return `
    <section class="section-shell implementation-status">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">Implementation status</p>
          <h2>Serious security UX includes visible limits.</h2>
        </div>
      </div>
      <div class="status-grid">
        ${items
          .map(
            ([title, body, tone]) => `
              <article>
                ${renderStatusBadge(title, tone)}
                <p>${escapeHtml(body)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDocsPreview() {
  const items = [
    ["Verify a proof", "Run the judge commands and inspect the public fixture."],
    ["Understand threshold authorization", "Review the recorded FROST path and selected signer evidence."],
    ["Read proof fields", "See what is public, private, or intentionally excluded."],
    ["Review limitations", "Understand prototype boundaries and audit caveats."],
  ];
  return `
    <section class="section-shell docs-preview-section">
      <div class="section-heading section-heading--wide">
        <div>
          <p class="eyebrow">Documentation</p>
          <h2>Everything needed to challenge the claims.</h2>
        </div>
        <a class="button button--secondary" href="/docs" data-route="/docs">Read documentation</a>
      </div>
      <div class="docs-preview-grid">
        ${items
          .map(
            ([title, body]) => `
              <article>
                <h3>${escapeHtml(title)}</h3>
                <p>${escapeHtml(body)}</p>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderFinalCta() {
  return `
    <section class="final-cta">
      <p class="eyebrow">Ready for inspection</p>
      <h2>Authorization should remain available, verifiable, and human-controlled.</h2>
      <div class="action-row">
        <a class="button button--primary" href="/proof" data-route="/proof">Verify Proof</a>
        <a class="button button--secondary" href="/how-it-works" data-route="/how-it-works">See How It Works</a>
        <a class="button button--ghost button--ghost-dark" href="/security" data-route="/security">Review Security</a>
      </div>
    </section>
  `;
}

function renderLandingPage() {
  const proof = state.demo.proof;
  const replay = state.demo.reduced;
  const presentation = deriveDemoPresentation({
    mode: "verified",
    proof,
    replay,
    verifyStatus: state.demo.verifyStatus,
  });

  return `
    <main class="product-home">
      <section class="landing-hero">
        <div class="landing-hero__copy">
          <p class="eyebrow">2-of-3 threshold authorization for shielded Zcash</p>
          <h1>Lose one key, not your ZEC.</h1>
          <p>
            ZecSafe demonstrates a threshold-controlled Zcash authorization path: one signer can be unavailable, the
            prepared PCZT is checked before signing, and the recorded mainnet proof can be verified without secret
            material.
          </p>
          <div class="action-row">
            <a class="button button--primary" href="/proof" data-route="/proof">Verify Mainnet Proof</a>
            <a class="button button--secondary" href="/how-it-works" data-route="/how-it-works">See How It Works</a>
            <a class="text-link text-link--light" href="/security" data-route="/security">Read the Security Model</a>
          </div>
          <div class="hero-proof-summary" aria-label="Recorded proof summary">
            ${renderMetric("Recorded status", presentation.recorded.chainStatus ?? "Loading", "mainnet")}
            ${renderMetric("Threshold", `${presentation.threshold} of ${presentation.total}`)}
            ${renderMetric("Unavailable", `${presentation.unavailable} signer`)}
          </div>
        </div>
        ${renderHeroAuthorizationPreview({ proof, replay, presentation })}
      </section>

      ${renderTechnicalTrustStrip({ presentation, proof, replay })}
      ${renderThreatControlMatrix()}
      ${renderWorkflowPreview()}
      ${renderProductPreview({ proof, replay, presentation })}
      ${renderMainnetProofSection({ proof, presentation })}
      ${renderSecurityArchitecturePreview()}
      ${renderImplementationStatus()}
      ${renderDocsPreview()}
      ${renderFinalCta()}
    </main>
  `;
}

function renderProofStepper() {
  const active = window.location.hash || "#review";
  return `
    <nav class="proof-stepper" aria-label="Proof steps">
      ${proofSteps
        .map(
          (item) => `
            <a class="${item.href === active ? "proof-stepper__active" : ""}" href="${item.href}" ${item.href === active ? 'aria-current="page"' : ""}>
              ${escapeHtml(item.label)}
            </a>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderProofPage() {
  const demo = state.demo;
  const proof = demo.proof;
  const replay = demo.reduced;
  const mismatch = demo.mode === "mismatch";
  const presentation = deriveDemoPresentation({
    mode: demo.mode,
    proof,
    replay,
    verifyStatus: demo.verifyStatus,
  });
  const { threshold, total, unavailable } = presentation;
  const { chainStatus, txid } = presentation.recorded;

  return `
    <main class="proof-page">
      <section class="page-hero page-hero--proof">
        <div>
          <p class="eyebrow">Recorded mainnet proof</p>
          <h1>Verify the recorded ZecSafe run.</h1>
          <p>
            Replay the public ProofEvent state, test the Binding Firewall, recompute the bundle hash in your browser,
            and download the public proof bundle.
          </p>
          <div class="action-row">
            <button class="button button--primary" id="loadVerifiedDemo" type="button">
              ${demo.status === "loading" ? "Loading..." : "Replay recorded run"}
            </button>
            <button class="button button--secondary" id="verifyPublicProof" type="button" ${presentation.verifier.enabled ? "" : "disabled"}>${presentation.verifier.label}</button>
            <button class="button button--ghost" id="downloadPublicProof" type="button" ${presentation.downloadEnabled ? "" : "disabled"}>
              ${mismatch ? "Proof Download Disabled in Safety Test" : "Download Public Proof"}
            </button>
          </div>
        </div>
        <aside class="proof-receipt" aria-label="Recorded proof receipt">
          <dl>
            ${renderProofFact(presentation.recorded.receiptLabel, proof?.run_id)}
            ${renderProofFact("UTC timestamp", proof?.recorded_at)}
            ${renderTxidFact(presentation.recorded.txidLabel, txid)}
            ${renderProofFact(presentation.recorded.chainStatusLabel, chainStatus)}
          </dl>
        </aside>
      </section>

      ${renderProofStepper()}

      ${
        demo.status === "error"
          ? `<div class="notice notice--error"><strong>Verified run did not load</strong><p>${escapeHtml(demo.message)}</p></div>`
          : ""
      }

      <section class="proof-card" id="review">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Step 1 - Review</p>
            <h2>The reviewed transaction intent</h2>
          </div>
          <span>${escapeHtml(demo.message)}</span>
        </div>
        <dl class="fact-grid">
          ${renderProofFact("Intent commitment", proof?.intent?.commitment)}
          ${renderProofFact("PCZT fingerprint", proof?.pczt?.source_fingerprint)}
          ${renderProofFact("Network", proof?.network)}
          ${renderProofFact("Threshold", `${threshold}-of-${total}`)}
        </dl>
        <p class="required-sentence">
          Recipient, amount, and memo are withheld from the public proof bundle and this hosted proof UI. The
          commitment binds them without disclosing them.
        </p>
      </section>

      <section class="proof-card" id="verify">
        <div class="section-heading section-heading--compact">
          <div>
            <p class="eyebrow">Step 2 - Verify</p>
            <h2>Binding Firewall: field-level safety gate</h2>
          </div>
          <div class="demo-mode-toggle" aria-label="Binding proof mode">
            <button type="button" class="${mismatch ? "" : "demo-mode-toggle__active"}" data-demo-mode="verified" aria-pressed="${mismatch ? "false" : "true"}">PASS</button>
            <button type="button" class="${mismatch ? "demo-mode-toggle__active" : ""}" data-demo-mode="mismatch" aria-pressed="${mismatch ? "true" : "false"}">Mismatch</button>
          </div>
        </div>
        ${mismatch ? `<div class="safety-test-label">SAFETY TEST &mdash; NOT A BROADCAST TRANSACTION</div>` : ""}
        ${
          mismatch
            ? `<div class="safety-test-summary" role="status"><strong>Binding Firewall: FAIL</strong><span>Signing blocked before FROST. No completion, broadcast, or proof export.</span></div>`
            : ""
        }
        <ul class="binding-check-list">
          ${Object.entries(replay.binding.check_statuses)
            .map(([field, status]) => renderBindingCheck(field, status))
            .join("")}
        </ul>
        <button class="button button--primary" type="button" disabled>
          ${replay.binding.signing_allowed ? "Signing Control Enabled" : "Signing Control Disabled"}
        </button>
        <p class="required-sentence">
          The Binding Firewall is a semantic intent-to-PCZT check. A mismatch blocks signing before any FROST round begins.
        </p>
      </section>

      <section class="proof-card" id="authorize">
        <div class="section-heading section-heading--compact">
          <div>
            <p class="eyebrow">Step 3 - Authorize</p>
            <h2>${mismatch ? "Authorization blocked before FROST begins" : "Threshold authorization with one participant unavailable"}</h2>
          </div>
          <span>${escapeHtml(`${threshold}-of-${total}`)}</span>
        </div>
        <div class="participant-row">
          ${
            mismatch
              ? `
                <span class="participant-pill participant-pill--unavailable">Signer A not contacted</span>
                <span class="participant-pill participant-pill--unavailable">Signer B not contacted</span>
                <span class="participant-pill participant-pill--unavailable">FROST not started</span>
              `
              : `
                <span class="participant-pill participant-pill--available">Signer A available</span>
                <span class="participant-pill participant-pill--available">Signer B available</span>
                <span class="participant-pill participant-pill--unavailable">Signer C unavailable</span>
              `
          }
        </div>
        <p class="required-sentence">
          ${
            mismatch
              ? "The synthetic recipient mismatch blocks signing before either available signer enters a FROST round."
              : "One participant is unavailable. The 2-of-3 threshold remains satisfiable."
          }
        </p>
        <p class="required-sentence required-sentence--complete">
          ${
            mismatch
              ? "No aggregate signature, completed PCZT, or broadcast exists for this counterfactual safety test."
              : "This mainnet proof run completed without the unavailable participant."
          }
        </p>
        <dl class="fact-grid">
          ${renderProofFact("FROST threshold status", presentation.authorization.thresholdStatus)}
          ${renderProofFact("Aggregate signature", presentation.authorization.aggregateStatus)}
          ${renderProofFact(
            "Selected signer fingerprints",
            mismatch
              ? "NONE - SAFETY TEST BLOCKED"
              : presentation.authorization.selectedSigners.map((value) => shortHex(value)).join(", "),
          )}
          ${renderProofFact("Ciphersuite", proof?.vault?.ciphersuite)}
        </dl>
      </section>

      <section class="proof-card" id="prove">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Step 4 - Prove</p>
            <h2>${mismatch ? "Synthetic safety-test state stops at the failed review" : "Run state is derived from recorded events"}</h2>
          </div>
          <span>${escapeHtml(`${replay.events_seen} ${mismatch ? "synthetic " : ""}events`)}</span>
        </div>
        <ol class="demo-flow">
          ${[
            ["Vault", `${threshold}-of-${total} redpallas-rerandomized FROST group`, Boolean(threshold)],
            [
              "Failure condition",
              mismatch ? "RECIPIENT MISMATCH - SYNTHETIC SAFETY TEST" : `${unavailable} participant unavailable; threshold still satisfiable`,
              !mismatch && replay.frost.unavailable_participant_count !== null,
            ],
            ["Intent", proof?.intent?.commitment ?? "Intent commitment recorded", Boolean(proof?.intent?.commitment)],
            ["Binding Firewall", presentation.flow.binding.detail, presentation.flow.binding.complete],
            ["FROST authorization", presentation.flow.frost.detail, presentation.flow.frost.complete],
            ["PCZT completion", presentation.flow.pczt.detail, presentation.flow.pczt.complete],
            ["Mainnet", presentation.flow.mainnet.detail, presentation.flow.mainnet.complete],
            ["Proof", presentation.flow.proof.detail, presentation.flow.proof.complete],
          ]
            .map(([label, detail, complete], index) =>
              renderFlowStep(label, detail, complete, index >= state.demo.revealCount),
            )
            .join("")}
        </ol>

        <dl class="fact-grid fact-grid--wide">
          ${presentation.proofFacts.map(([label, value]) => renderProofFact(label, value)).join("")}
        </dl>

        ${
          mismatch
            ? `
              <div class="notice">
                <strong>The recorded proof remains unchanged.</strong>
                <p>Return to PASS mode to verify or download the immutable recorded mainnet run. This counterfactual state cannot be exported as that proof.</p>
              </div>
            `
            : ""
        }

        <details class="proof-note" open>
          <summary>Verifier commands and FROST provenance boundary</summary>
          <p>
            make judge-proof-mainnet verifies the recorded bundle. make judge-proof-mainnet-tamper shows tamper
            detection. This page replays a recorded run; it is not a live signing session.
          </p>
          <p>
            Zcash validates the resulting spend authorization normally. FROST provenance is evidenced by the recorded
            ZecSafe/FROST signing session; the chain does not expose a special FROST marker. Signer review mode is
            semantic_pczt_review: signers check PCZT semantics and compare the prepared pinned-tool SIGHASH fingerprint;
            they do not independently recompute the SIGHASH.
          </p>
        </details>
      </section>

      ${renderTamperLab()}
    </main>
  `;
}

function renderHowItWorksPage() {
  const stages = [
    ["01", "Prepare", "Create the reviewed intent and bind private semantics with a canonical commitment."],
    ["02", "Validate", "Inspect the PCZT and compare exposed fields against the reviewed intent before signing."],
    ["03", "Authorize", "Select the available signers and run the recorded 2-of-3 FROST threshold path."],
    ["04", "Complete", "Apply the aggregate signature, prove the PCZT, combine it, and preserve the approval boundary."],
    ["05", "Prove", "Export public-safe evidence, replay gates, and an anchored proof bundle hash."],
  ];
  const artifacts = [
    ["Intent commitment", "Public hash of reviewed private semantics."],
    ["PCZT fingerprint", "Prepared transaction fingerprint used by the Binding Firewall."],
    ["FROST session", "Selected signer fingerprints and threshold status."],
    ["Mainnet receipt", "Recorded txid, confirmation status, and block height."],
    ["Proof bundle", "Schema-bound, tamper-evident public evidence package."],
  ];

  return `
    <main class="route-page route-page--how">
      <section class="page-hero page-hero--split">
        <div>
          <p class="eyebrow">How it works</p>
          <h1>From reviewed intent to public proof.</h1>
          <p>
            ZecSafe separates the human product story from the proof console: review private intent, validate the
            prepared transaction, authorize with enough signers, and publish a bounded proof.
          </p>
          <div class="action-row">
            <a class="button button--primary" href="/proof" data-route="/proof">Open proof application</a>
            <a class="button button--secondary" href="/security" data-route="/security">Review security model</a>
          </div>
        </div>
        <div class="route-summary-panel">
          ${renderMetric("Policy", "2-of-3 FROST")}
          ${renderMetric("Unavailable", "1 signer")}
          ${renderMetric("Proof mode", "Recorded replay")}
        </div>
      </section>

      <section class="route-section">
        <div class="section-heading section-heading--wide">
          <div>
            <p class="eyebrow">Workflow</p>
            <h2>The implemented path has five inspectable stages.</h2>
          </div>
        </div>
        <ol class="timeline-grid">
          ${stages
            .map(
              ([num, title, body]) => `
                <li>
                  <span>${escapeHtml(num)}</span>
                  <h3>${escapeHtml(title)}</h3>
                  <p>${escapeHtml(body)}</p>
                </li>
              `,
            )
            .join("")}
        </ol>
      </section>

      <section class="failure-path">
        <div>
          <p class="eyebrow">Failure path</p>
          <h2>A mismatch stops before signing.</h2>
          <p>
            The synthetic safety test is intentionally counterfactual: it proves the review gate blocks a tampered
            recipient and never imports the recorded run's later FROST, PCZT completion, broadcast, or proof export.
          </p>
          <a class="button button--primary" href="/proof" data-route="/proof">Open mismatch test</a>
        </div>
        <ol class="failure-steps">
          <li><strong>Reviewed intent</strong><span>Original private commitment</span></li>
          <li><strong>Tampered recipient</strong><span>Field-level mismatch</span></li>
          <li><strong>Binding Firewall</strong><span>FAIL</span></li>
          <li><strong>FROST round</strong><span>Not started</span></li>
        </ol>
      </section>

      <section class="route-section artifact-section">
        <div class="section-heading section-heading--wide">
          <div>
            <p class="eyebrow">Evidence artifacts</p>
            <h2>What the proof route and CLI actually inspect.</h2>
          </div>
        </div>
        <div class="artifact-grid">
          ${artifacts
            .map(
              ([title, body]) => `
                <article>
                  ${renderStatusBadge("Public-safe", "verified")}
                  <h3>${escapeHtml(title)}</h3>
                  <p>${escapeHtml(body)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>
    </main>
  `;
}

function renderSecurityPage() {
  const sections = [
    [
      "What ZecSafe proves",
      "The recorded public bundle proves the claimed run shape: mainnet network, 2-of-3 policy, one unavailable participant, selected signers, Binding Firewall PASS, threshold reached, txid present, and bundle integrity.",
    ],
    [
      "What it does not prove",
      "It does not make the hosted site a production wallet, prove live signing, or prove that the chain itself exposes FROST provenance.",
    ],
    [
      "Public proof privacy boundary",
      "Recipient, amount, memo, keys, signing shares, nonces, raw SIGHASH values, and private configs are excluded from public evidence.",
    ],
    [
      "Mainnet evidence boundary",
      "The transaction is confirmed on Zcash mainnet. FROST provenance is evidenced by ZecSafe's recorded signing session and proof bundle.",
    ],
    [
      "Audit caveat",
      "The referenced NCC audit of the ZF FROST repository did not include rerandomized FROST.",
    ],
    [
      "Signer review limitation",
      "The recorded signer review mode is semantic_pczt_review, not an independent recomputation of the SIGHASH by each signer.",
    ],
    [
      "Recovery",
      "Recovery is not demonstrated.",
    ],
    [
      "Production status",
      "ZecSafe is a hackathon proof-of-concept, not audited production custody software.",
    ],
  ];
  const assumptions = [
    ["Coordinator visibility", "The coordinator can see transaction details during preparation."],
    ["Signer review mode", "semantic_pczt_review checks PCZT semantics and pinned-tool SIGHASH fingerprints."],
    ["Mainnet proof", "Consensus validates the spend; FROST provenance is recorded off-chain."],
    ["Hosted app", "Static verifier and fixtures only; no wallet, no secret material."],
  ];

  return `
    <main class="route-page route-page--security">
      <section class="page-hero page-hero--split">
        <div>
          <p class="eyebrow">Security model</p>
          <h1>Precise claims are part of the product.</h1>
          <p>
            ZecSafe's strongest evidence is useful because it is bounded. This page states what the proof shows, what it
            excludes, and which limits remain.
          </p>
          <div class="action-row">
            <a class="button button--primary" href="/proof" data-route="/proof">Verify proof</a>
            <a class="button button--secondary" href="/docs" data-route="/docs">Read docs</a>
          </div>
        </div>
        <div class="route-summary-panel route-summary-panel--dark">
          ${renderStatusBadge("Prototype", "warning")}
          ${renderStatusBadge("Recorded proof", "verified")}
          ${renderStatusBadge("No production custody claim", "blocked")}
        </div>
      </section>

      ${renderSecurityArchitecturePreview({ showCta: false })}

      <section class="route-section">
        <div class="section-heading section-heading--wide">
          <div>
            <p class="eyebrow">Assumptions</p>
            <h2>The proof is strong because its trust boundaries are explicit.</h2>
          </div>
        </div>
        <div class="assumption-grid">
          ${assumptions
            .map(
              ([title, body]) => `
                <article>
                  ${renderStatusBadge("Assumption", "pending")}
                  <h3>${escapeHtml(title)}</h3>
                  <p>${escapeHtml(body)}</p>
                </article>
              `,
            )
            .join("")}
        </div>
      </section>

      <section class="security-grid">
        ${sections
          .map(
            ([title, body]) => `
              <article>
                <h2>${escapeHtml(title)}</h2>
                <p>${escapeHtml(body)}</p>
              </article>
            `,
          )
          .join("")}
      </section>

      <section class="security-band security-band--page">
        <div class="security-band__copy">
          <p class="eyebrow">Verify independently</p>
          <h2>Do not trust the website when the repository can verify the proof.</h2>
          <p>
            Run make judge-proof-mainnet for the recorded proof and make judge-proof-mainnet-tamper for tamper rejection.
          </p>
        </div>
        <div class="security-band__action">
          <a class="button button--primary" href="/docs" data-route="/docs">Open documentation</a>
        </div>
      </section>
    </main>
  `;
}

function renderDocsPage() {
  const repo = "https://github.com/cyberrockng/zecsafe";
  const docs = [
    ["Overview", "Project overview, verified run summary, and setup path.", `${repo}/blob/main/README.md`, "Start here"],
    ["Proof verification", "Public proof schema, bundle hash boundary, and verifier expectations.", `${repo}/blob/main/PROOF_SPEC.md`, "Verifier"],
    ["Privacy boundary", "What public evidence reveals and what remains private.", `${repo}/blob/main/PRIVACY.md`, "Data"],
    ["Security model", "Security policy, trust assumptions, and limitations.", `${repo}/blob/main/SECURITY.md`, "Security"],
    ["Submission package", "Hackathon submission text, video link, and final gate state.", `${repo}/blob/main/SUBMISSION.md`, "Submission"],
    ["GitHub source", "Repository source, tests, fixtures, and documentation.", repo, "Source"],
    [
      "Verified transaction",
      "Confirmed transaction on a public Zcash explorer.",
      "https://mainnet.zcashexplorer.app/transactions/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527",
      "Mainnet",
    ],
  ];

  return `
    <main class="route-page route-page--docs">
      <section class="page-hero page-hero--split">
        <div>
          <p class="eyebrow">Documentation</p>
          <h1>Everything needed to inspect, run, and challenge the proof.</h1>
          <p>
            The website introduces the product, but the repository remains the source of truth for proof verification,
            specs, privacy boundaries, and security caveats.
          </p>
        </div>
        <div class="route-summary-panel">
          ${renderMetric("Verifier", "make judge-proof-mainnet")}
          ${renderMetric("Tamper demo", "make judge-proof-mainnet-tamper")}
          ${renderMetric("Full check", "npm run check")}
        </div>
      </section>

      <section class="docs-grid">
        ${docs
          .map(
            ([title, body, href, label]) => `
              <a href="${escapeHtml(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
                ${renderStatusBadge(label, href.includes("mainnet") ? "mainnet" : "verified")}
                <span>${escapeHtml(title)}</span>
                <p>${escapeHtml(body)}</p>
              </a>
            `,
          )
          .join("")}
      </section>

      <section class="command-panel">
        <div>
          <p class="eyebrow">Verifier commands</p>
          <h2>Run the checks from the repository.</h2>
        </div>
        <pre><code>make judge-proof-mainnet
make judge-proof-mainnet-tamper
npm run check</code></pre>
      </section>

      <section class="route-section docs-faq">
        <div class="section-heading section-heading--wide">
          <div>
            <p class="eyebrow">FAQ</p>
            <h2>Common reviewer questions.</h2>
          </div>
        </div>
        <div class="faq-grid">
          <article>
            <h3>Is this live custody software?</h3>
            <p>No. It is a recorded proof-of-concept and does not claim production custody readiness.</p>
          </article>
          <article>
            <h3>Does the chain show FROST?</h3>
            <p>No. Zcash validates the spend normally. FROST provenance comes from the recorded ZecSafe/FROST session.</p>
          </article>
          <article>
            <h3>Can judges verify without a wallet?</h3>
            <p>Yes. The public verifier uses tracked fixtures and requires no funds, wallet, RPC, or secret material.</p>
          </article>
          <article>
            <h3>What remains private?</h3>
            <p>Recipient, memo, keys, shares, nonces, and private run artifacts are excluded from the public bundle.</p>
          </article>
        </div>
      </section>
    </main>
  `;
}

function renderRoute(route) {
  if (route === "/proof") return renderProofPage();
  if (route === "/how-it-works") return renderHowItWorksPage();
  if (route === "/security") return renderSecurityPage();
  if (route === "/docs") return renderDocsPage();
  return renderLandingPage();
}

function renderApp() {
  const route = activeRoute();
  updateDocumentMeta(route);
  return `
    <div class="shell">
      ${renderGlobalNav(route)}
      ${renderRoute(route)}
      ${renderFooter()}
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-route]").forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      const route = link.dataset.route;
      if (!route || !href || href.startsWith("http")) return;
      event.preventDefault();
      const hash = href.includes("#") ? href.slice(href.indexOf("#")) : "";
      navigateTo(route);
      if (hash) {
        window.history.replaceState({}, "", `${route}${hash}`);
        render();
        document.querySelector(hash)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
      }
    });
  });

  document.querySelector("#loadVerifiedDemo")?.addEventListener("click", () => {
    if (state.demo.status === "success" && state.demo.mode !== "mismatch") {
      animateFlowReveal(8);
      animateHeroReveal();
      return;
    }
    loadVerifiedProof(state.demo.mode, { animate: true });
  });

  document.querySelector("#verifyPublicProof")?.addEventListener("click", () => {
    verifyLoadedPublicProof();
  });

  document.querySelector("#downloadPublicProof")?.addEventListener("click", () => {
    downloadPublicProof();
  });

  document.querySelectorAll("[data-demo-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      setDemoMode(button.dataset.demoMode);
    });
  });

  document.querySelectorAll("[data-preview-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.previewMode = button.dataset.previewMode;
      render();
    });
  });

  document.querySelectorAll("[data-action]").forEach((control) => {
    control.addEventListener("click", () => {
      const action = control.dataset.action;
      if (action === "copy-txid") copyTxid();
      if (action === "toggle-txid") {
        state.ui.txidExpanded = !state.ui.txidExpanded;
        render();
      }
      if (action === "toggle-mobile-nav") {
        state.ui.mobileNavOpen = !state.ui.mobileNavOpen;
        render();
      }
    });
  });

  document.querySelectorAll("[data-lab-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      runLabVerification({ presetId: button.dataset.labPreset });
    });
  });

  document.querySelectorAll("[data-lab-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.labAction;
      if (action === "verify") runLabVerification();
      if (action === "reset") resetLab();
      if (action === "edit") {
        state.lab.editing = !state.lab.editing;
        render();
      }
      if (action === "verify-edit") {
        const editor = document.querySelector("#labEditor");
        if (editor) runLabVerification({ proofText: editor.value });
      }
    });
  });
}

function render() {
  app.innerHTML = renderApp();
  bindEvents();
  state.lab.animatedSeq = state.lab.resultSeq;
}

render();
loadVerifiedProof(state.demo.mode, { animate: true });

window.addEventListener("popstate", () => {
  state.ui.mobileNavOpen = false;
  render();
});

window.addEventListener("hashchange", () => {
  render();
});

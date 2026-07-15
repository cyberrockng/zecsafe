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
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
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
    document.querySelectorAll(".quorum-node").forEach((node, index) => {
      if (index < state.hero.revealCount) node.classList.add("quorum-node--on");
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

function renderQuorumVisual() {
  const rows = [
    ["Signer A", "Ready", "quorum-node--available"],
    ["Signer B", "Ready", "quorum-node--available"],
    ["Signer C", "Unavailable", "quorum-node--offline"],
    ["Binding Firewall", "Verified", "quorum-node--verified"],
    ["Public proof", "Recorded", "quorum-node--verified"],
  ];
  return `
    <div class="quorum-visual" aria-label="2-of-3 vault proof visual">
      <div class="vault-orbit">
        <div class="vault-core">
          <span>ZEC</span>
          <strong>2/3</strong>
        </div>
      </div>
      <div class="quorum-list">
        ${rows
          .map(
            ([label, status, kind], index) => `
              <div class="quorum-node ${kind} ${index < state.hero.revealCount ? "quorum-node--on" : ""}">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(status)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
      <p>One signer unavailable. Two signers authorize. The public proof stays checkable.</p>
    </div>
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
      <div>
        <strong>ZecSafe</strong>
        <p>
          ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling. The referenced NCC audit of the ZF
          FROST repository did not include rerandomized FROST. ZecSafe is not audited production custody software.
          Recovery is not demonstrated.
        </p>
      </div>
      <div class="footer-links">
        <a href="/proof" data-route="/proof">Verify proof</a>
        <a href="/security" data-route="/security">Security model</a>
        <a href="https://github.com/cyberrockng/zecsafe" target="_blank" rel="noopener noreferrer">GitHub</a>
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
    <main>
      <section class="landing-hero">
        <div class="landing-hero__copy">
          <p class="eyebrow">2-of-3 FROST authorization for shielded Zcash</p>
          <h1>Lose one key, not your ZEC.</h1>
          <p>
            ZecSafe keeps a shielded Zcash vault usable when one signer is unavailable, checks the prepared transaction
            before signing, and leaves a public proof anyone can verify.
          </p>
          <div class="action-row">
            <a class="button button--primary" href="/proof" data-route="/proof">Verify the mainnet proof</a>
            <a class="button button--secondary" href="/how-it-works" data-route="/how-it-works">See how it works</a>
            <a class="text-link" href="/security" data-route="/security">Read the security model</a>
          </div>
        </div>
        ${renderQuorumVisual()}
      </section>

      <section class="problem-band">
        <div>
          <p class="eyebrow">The coordination problem</p>
          <h2>Single-key failure and signer downtime should not freeze shielded funds.</h2>
        </div>
        <p>
          ZecSafe is built around a simple product story: a vault needs enough signers to protect funds, but not so many
          that one unavailable participant stops a reviewed transaction from moving.
        </p>
      </section>

      <section class="section-shell">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Product promise</p>
            <h2>Availability, safety, and proof in one authorization path.</h2>
          </div>
        </div>
        <div class="pillar-grid">
          <article>
            <span>01</span>
            <h3>Availability</h3>
            <p>A 2-of-3 threshold can proceed when one participant is unavailable.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Safety</h3>
            <p>The Binding Firewall checks reviewed intent against the prepared PCZT before FROST begins.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Proof</h3>
            <p>The recorded mainnet run exports public evidence that can be checked without trusting this website.</p>
          </article>
        </div>
      </section>

      <section class="section-shell process-preview">
        <div>
          <p class="eyebrow">How the run works</p>
          <h2>Four steps, one recorded mainnet proof.</h2>
        </div>
        <ol class="process-line">
          <li><span>Review</span><strong>Intent commitment</strong><p>Private recipient, amount, and memo stay out of the public proof.</p></li>
          <li><span>Verify</span><strong>Binding Firewall</strong><p>Field-level mismatch blocks signing before any FROST round.</p></li>
          <li><span>Authorize</span><strong>2-of-3 FROST</strong><p>Two available signers satisfy the threshold.</p></li>
          <li><span>Prove</span><strong>Browser-verifiable</strong><p>Proof integrity and replay gates can be recomputed.</p></li>
        </ol>
        <a class="button button--secondary" href="/how-it-works" data-route="/how-it-works">Explore the architecture</a>
      </section>

      <section class="section-shell evidence-section">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Verified evidence</p>
            <h2>Enough proof for the homepage. Details stay on the proof route.</h2>
          </div>
          <a class="button button--primary" href="/proof" data-route="/proof">Open verifier</a>
        </div>
        ${renderEvidenceStrip(presentation.evidenceStrip)}
      </section>

      <section class="demo-teaser">
        <div>
          <p class="eyebrow">Interactive proof</p>
          <h2>Replay the run, then try to break the proof.</h2>
          <p>
            The proof page keeps the dense material where it belongs: verifier gates, mismatch mode, public proof export,
            and the Tamper Lab.
          </p>
        </div>
        <div class="teaser-actions">
          <a class="button button--primary" href="/proof" data-route="/proof">Verify proof</a>
          <a class="button button--ghost" href="/proof#tamper-lab" data-route="/proof">Open Tamper Lab</a>
        </div>
      </section>

      <section class="security-band">
        <div>
          <p class="eyebrow">Honest by design</p>
          <h2>Strong evidence, clearly scoped.</h2>
        </div>
        <p>
          This is a recorded proof-of-concept, not production custody software. The chain validates the spend
          authorization normally; Zcash validates the resulting spend authorization normally. FROST provenance is shown by
          the recorded ZecSafe/FROST session, not by a special chain marker.
        </p>
        <a class="text-link" href="/security" data-route="/security">Read the full trust model</a>
      </section>
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
  return `
    <main>
      <section class="page-hero">
        <div>
          <p class="eyebrow">How it works</p>
          <h1>A threshold authorization path, explained without the hash wall.</h1>
          <p>
            ZecSafe separates the human product story from the proof console: review the private intent, check the
            prepared transaction, authorize with enough signers, then publish a bounded proof.
          </p>
        </div>
      </section>

      <section class="mechanism-grid">
        <article class="mechanism-card mechanism-card--featured">
          <span>01</span>
          <h2>The vault model</h2>
          <p>
            A 2-of-3 FROST policy means two selected signers can authorize while one participant is unavailable. The
            recorded run demonstrates that threshold path with one signer offline.
          </p>
        </article>
        <article class="mechanism-card">
          <span>02</span>
          <h2>The transaction safety gate</h2>
          <p>
            Before signing, the Binding Firewall compares reviewed intent with the prepared PCZT. If the recipient
            differs, signing is blocked before FROST begins.
          </p>
        </article>
        <article class="mechanism-card">
          <span>03</span>
          <h2>The threshold authorization</h2>
          <p>
            The public proof records FROST session provenance and selected signer fingerprints. The Zcash chain does not
            expose a special FROST marker.
          </p>
        </article>
        <article class="mechanism-card">
          <span>04</span>
          <h2>The proof bundle</h2>
          <p>
            The bundle includes public-safe commitments, event replay state, toolchain fingerprints, and the confirmed
            transaction reference. Recipient, amount, memo, keys, shares, and nonces stay private.
          </p>
        </article>
      </section>

      <section class="failure-path">
        <div>
          <p class="eyebrow">Failure path</p>
          <h2>A mismatch stops before signing.</h2>
          <p>
            The synthetic safety test is intentionally counterfactual: it proves the review gate blocks a tampered
            recipient and never imports the recorded run's later FROST, PCZT completion, broadcast, or proof export.
          </p>
          <a class="button button--primary" href="/proof#verify" data-route="/proof">Open mismatch test</a>
        </div>
        <ol class="failure-steps">
          <li><strong>Reviewed intent</strong><span>Original private commitment</span></li>
          <li><strong>Tampered recipient</strong><span>Field-level mismatch</span></li>
          <li><strong>Binding Firewall</strong><span>FAIL</span></li>
          <li><strong>FROST round</strong><span>Not started</span></li>
        </ol>
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

  return `
    <main>
      <section class="page-hero">
        <div>
          <p class="eyebrow">Security model</p>
          <h1>Precise claims are part of the product.</h1>
          <p>
            ZecSafe's strongest evidence is useful because it is bounded. This page states what the proof shows, what it
            excludes, and which limits remain.
          </p>
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
        <div>
          <p class="eyebrow">Verify independently</p>
          <h2>Do not trust the website when the repository can verify the proof.</h2>
        </div>
        <p>
          Run make judge-proof-mainnet for the recorded proof and make judge-proof-mainnet-tamper for tamper rejection.
        </p>
        <a class="button button--primary" href="/docs" data-route="/docs">Open documentation</a>
      </section>
    </main>
  `;
}

function renderDocsPage() {
  const repo = "https://github.com/cyberrockng/zecsafe";
  const docs = [
    ["README", "Project overview, verified run summary, and setup path.", `${repo}/blob/main/README.md`],
    ["Proof Spec", "Public proof schema, bundle hash boundary, and verifier expectations.", `${repo}/blob/main/PROOF_SPEC.md`],
    ["Privacy", "What public evidence reveals and what remains private.", `${repo}/blob/main/PRIVACY.md`],
    ["Security", "Security policy and trust boundaries.", `${repo}/blob/main/SECURITY.md`],
    ["GitHub source", "Repository source and documentation.", repo],
    [
      "Verified transaction",
      "Confirmed transaction on a public Zcash explorer.",
      "https://mainnet.zcashexplorer.app/transactions/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527",
    ],
  ];

  return `
    <main>
      <section class="page-hero">
        <div>
          <p class="eyebrow">Documentation</p>
          <h1>Everything needed to inspect the proof.</h1>
          <p>
            The website introduces the product, but the repository remains the source of truth for proof verification,
            specs, privacy boundaries, and security caveats.
          </p>
        </div>
      </section>

      <section class="docs-grid">
        ${docs
          .map(
            ([title, body, href]) => `
              <a href="${escapeHtml(href)}" ${href.startsWith("http") ? 'target="_blank" rel="noopener noreferrer"' : ""}>
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

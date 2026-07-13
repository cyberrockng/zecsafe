import { createBindingMismatchEvents, proofEventsFromPublicLog, reduceDemoProofEvents } from "./demo-proof-state.mjs";
import { createPublicProofExport, deriveDemoPresentation } from "./demo-presentation.mjs";
import { TAMPER_PRESETS, verifyProofInBrowser } from "./verify-browser.mjs";

const VERIFIED_MAINNET_PROOF_PATH = "fixtures/verified-mainnet-run/proof.json";
const VERIFIED_MAINNET_EVENTS_PATH = "fixtures/verified-mainnet-run/events.public.json";

// Exactly four human steps. Review -> Verify -> Authorize -> Prove.
const navItems = [
  { href: "#review", label: "Review" },
  { href: "#verify", label: "Verify" },
  { href: "#authorize", label: "Authorize" },
  { href: "#prove", label: "Prove" },
];

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
  },
  story: {
    active: false,
    chapter: 0,
    paused: false,
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
let storyTimer = null;
let copiedTimer = null;
let revealObserver = null;
const revealedSections = new Set();

const prefersReducedMotion = () =>
  typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HERO_ROW_TOTAL = 7;

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
    document.querySelectorAll(".hero-panel__row").forEach((row, index) => {
      if (index < state.hero.revealCount) row.classList.add("hero-panel__row--on");
    });
    if (state.hero.revealCount >= total) {
      state.hero.revealCount = Infinity;
      clearInterval(heroTimer);
      heroTimer = null;
    }
  }, 300);
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
  }, 340);
}

const app = document.querySelector("#app");

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

  // Real verification, not a status echo: the full verifier mirror recomputes
  // the canonical bundle hash with WebCrypto in this browser, then the replay
  // gates are checked against the recorded ProofEvents.
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

// The 60-second guided story drives the real page sections; it is
// choreography over recorded evidence and the in-browser verifier,
// never a separate mockup.
const STORY_CHAPTERS = [
  {
    section: "authorize",
    text: "Signer C is unavailable. Signers A and B satisfy the 2-of-3 threshold.",
    enter() {
      if (state.demo.mode !== "verified") setDemoMode("verified");
    },
  },
  {
    section: "verify",
    text: "Before signing, ZecSafe checks the transaction field by field against what was reviewed.",
    enter() {
      if (state.demo.mode !== "verified") setDemoMode("verified");
    },
  },
  {
    section: "verify",
    text: "Now a tampered recipient: signing is blocked before FROST begins. This is a labeled safety test.",
    enter() {
      setDemoMode("mismatch");
    },
  },
  {
    section: "prove",
    text: "The mainnet proof verifies in your browser, right now. Try to break it.",
    enter() {
      if (state.demo.mode !== "verified") setDemoMode("verified");
      runLabVerification();
    },
  },
];

function scrollToSection(id) {
  document.querySelector(`#${id}`)?.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start",
  });
}

function scheduleStoryAdvance() {
  if (storyTimer) clearTimeout(storyTimer);
  storyTimer = null;
  if (!state.story.active || state.story.paused) return;
  if (state.story.chapter >= STORY_CHAPTERS.length - 1) return;
  storyTimer = setTimeout(() => {
    enterStoryChapter(state.story.chapter + 1);
  }, 8000);
}

function enterStoryChapter(index) {
  const chapter = STORY_CHAPTERS[index];
  if (!chapter) return;
  state.story.chapter = index;
  chapter.enter();
  render();
  scrollToSection(chapter.section);
  scheduleStoryAdvance();
}

function startStory() {
  if (!state.demo.proof) return;
  state.story = { active: true, chapter: 0, paused: false };
  enterStoryChapter(0);
}

function pauseStory() {
  if (!state.story.active || state.story.paused) return;
  state.story.paused = true;
  if (storyTimer) clearTimeout(storyTimer);
  storyTimer = null;
  render();
}

function endStory() {
  state.story = { active: false, chapter: 0, paused: false };
  if (storyTimer) clearTimeout(storyTimer);
  storyTimer = null;
  if (state.demo.mode !== "verified") setDemoMode("verified");
  else render();
}

function renderStoryBar() {
  if (!state.story.active) return "";
  const chapter = STORY_CHAPTERS[state.story.chapter];
  const last = state.story.chapter === STORY_CHAPTERS.length - 1;
  return `
    <div class="story-bar" role="region" aria-label="Guided story">
      <div class="story-bar__dots" aria-hidden="true">
        ${STORY_CHAPTERS.map((item, index) => `<span class="${index <= state.story.chapter ? "story-bar__dot--on" : ""}"></span>`).join("")}
      </div>
      <p>${escapeHtml(chapter.text)}</p>
      <div class="story-bar__controls">
        <button type="button" data-story-action="back" ${state.story.chapter === 0 ? "disabled" : ""}>Back</button>
        <button type="button" data-story-action="next" ${last ? "disabled" : ""}>Next</button>
        <button type="button" data-story-action="exit">${last ? "Finish" : "Exit"}</button>
      </div>
    </div>
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
      <ul class="binding-check-list">${result.checks.map((check, index) => renderLabCheck(check, index, animate)).join("")}</ul>
    `
    : "";
  const errorBlock = lab.error
    ? `<div class="mainnet-empty mainnet-empty--error"><strong>Verifier rejected the input</strong><p>${escapeHtml(lab.error)}</p></div>`
    : "";

  return `
    <div class="tamper-lab">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Interactive &mdash; Tamper Lab</p>
          <h3>Attack this proof in your browser</h3>
        </div>
        <span>${lab.busy ? "Verifying..." : "WebCrypto SHA-256, client-side"}</span>
      </div>
      <p class="required-sentence">
        The verifier below runs in your browser and recomputes the bundle hash and every gate over a local copy of the
        recorded proof. Attack the copy; the recorded run is immutable. The authoritative verifier is
        make judge-proof-mainnet.
      </p>
      <div class="verified-demo__actions tamper-lab__actions">
        <button class="secondary-action" type="button" data-lab-action="verify" ${lab.busy ? "disabled" : ""}>Verify recorded proof</button>
        ${TAMPER_PRESETS.map(
          (preset) => `
            <button class="secondary-action ${lab.presetId === preset.id ? "tamper-lab__preset--active" : ""}" type="button" data-lab-preset="${preset.id}" ${lab.busy ? "disabled" : ""}>
              ${escapeHtml(preset.label)}
            </button>
          `,
        ).join("")}
        <button class="secondary-action" type="button" data-lab-action="edit" ${lab.busy ? "disabled" : ""}>${lab.editing ? "Hide JSON editor" : "Edit the JSON yourself"}</button>
        <button class="secondary-action" type="button" data-lab-action="reset" ${lab.busy ? "disabled" : ""}>Reset</button>
      </div>
      ${
        lab.editing
          ? `
            <textarea class="tamper-lab__editor" id="labEditor" rows="14" spellcheck="false" aria-label="Editable proof JSON">${escapeHtml(
              lab.proofText ?? JSON.stringify(state.demo.proof, null, 2),
            )}</textarea>
            <div class="verified-demo__actions">
              <button class="primary-action" type="button" data-lab-action="verify-edit" ${lab.busy ? "disabled" : ""}>Verify my edit</button>
            </div>
          `
          : ""
      }
      ${errorBlock}
      ${verdictBlock}
    </div>
  `;
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

function renderHeroPanel() {
  if (!state.demo.proof || state.demo.mode === "mismatch") return "";
  const rows = [
    ["Signer A", "READY", "hero-panel__row--signer"],
    ["Signer B", "READY", "hero-panel__row--signer"],
    ["Signer C", "UNAVAILABLE", "hero-panel__row--unavailable"],
    ["Transaction check", "VERIFIED", "hero-panel__row--gate"],
    ["FROST authorization", "COMPLETE", "hero-panel__row--gate"],
    ["Zcash mainnet", "CONFIRMED", "hero-panel__row--gate"],
    ["Proof bundle", "VERIFIED", "hero-panel__row--gate"],
  ];
  return `
    <div class="hero-panel" aria-label="Recorded authorization replay">
      <div class="hero-panel__head">
        <strong>ZecSafe Vault</strong>
        <span>2 OF 3 REQUIRED</span>
      </div>
      <ul>
        ${rows
          .map(
            ([label, status, kind], index) => `
              <li class="hero-panel__row ${kind} ${index < state.hero.revealCount ? "hero-panel__row--on" : ""}">
                <strong>${escapeHtml(label)}</strong>
                <span>${escapeHtml(status)}</span>
              </li>
            `,
          )
          .join("")}
      </ul>
      <p class="hero-panel__caption">Replaying the recorded verified mainnet run</p>
    </div>
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

function renderBindingCheck(field, status) {
  const ok = ["PASS", "MATCH", "LIMITED"].includes(status);
  return `
    <li class="${ok ? "binding-check--pass" : "binding-check--fail"}">
      <strong>${escapeHtml(field)}</strong>
      <span>${escapeHtml(status)}</span>
    </li>
  `;
}

function revealClass(key) {
  return revealedSections.has(key) ? "reveal-done" : "reveal";
}

function setupRevealObserver() {
  if (revealObserver) revealObserver.disconnect();
  const targets = document.querySelectorAll("[data-reveal]");
  if (!targets.length) return;
  if (prefersReducedMotion() || typeof IntersectionObserver !== "function") {
    targets.forEach((element) => {
      element.classList.remove("reveal");
      element.classList.add("reveal-done");
      revealedSections.add(element.dataset.reveal);
    });
    return;
  }
  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal--visible");
        revealedSections.add(entry.target.dataset.reveal);
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.15 },
  );
  targets.forEach((element) => {
    if (!revealedSections.has(element.dataset.reveal)) revealObserver.observe(element);
  });
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

function renderNav() {
  const active = window.location.hash || "#review";
  return `
    <nav class="nav" aria-label="Primary">
      ${navItems
        .map(
          (item) => `
            <a class="nav__item ${item.href === active ? "nav__item--active" : ""}" href="${item.href}">
              ${escapeHtml(item.label)}
            </a>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderApp() {
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
    <div class="shell">
      <header class="masthead">
        <div class="brand">
          <span class="brand__mark">ZS</span>
          <div>
            <strong>ZecSafe</strong>
            <span>FROST authorization control plane</span>
          </div>
        </div>
        ${renderNav()}
      </header>

      <main class="workspace">
        <section class="verified-demo">
          <div class="verified-demo__hero">
            <div>
              <p class="eyebrow">FROST authorization for shielded Zcash</p>
              <h1>ZECSAFE</h1>
              <h2>Lose one key, not your ZEC.</h2>
              <p>
                ZecSafe keeps a 2-of-3 shielded wallet usable when one participant is unavailable, verifies the exact
                transaction before signing, and creates a mainnet proof anyone can check.
              </p>
              <div class="verified-demo__actions">
                <button class="primary-action" id="loadVerifiedDemo" type="button">
                  ${demo.status === "loading" ? "Loading..." : "Replay Verified Mainnet Run"}
                </button>
                <button class="secondary-action" id="verifyPublicProof" type="button" ${presentation.verifier.enabled ? "" : "disabled"}>${presentation.verifier.label}</button>
              </div>
              ${
                demo.status === "success" && !mismatch
                  ? `
                    <div class="hero-links">
                      <button type="button" class="link-action" id="startStory">Start the 60-second story</button>
                      <button type="button" class="link-action" id="jumpTamperLab">Try to break the proof &darr;</button>
                    </div>
                  `
                  : ""
              }
              ${
                mismatch
                  ? `<p class="required-sentence"><strong>Counterfactual safety test active.</strong> The receipt beside it is the immutable recorded-run reference; the synthetic path below stops before FROST and does not reuse its later outcomes.</p>`
                  : ""
              }
            </div>
            <div class="verified-demo__side">
              ${renderHeroPanel()}
              <dl class="verified-demo__receipt">
                ${renderProofFact(presentation.recorded.receiptLabel, proof?.run_id)}
                ${renderProofFact("UTC timestamp", proof?.recorded_at)}
                ${renderTxidFact(presentation.recorded.txidLabel, txid)}
                ${renderProofFact(presentation.recorded.chainStatusLabel, chainStatus)}
              </dl>
            </div>
          </div>

          <div class="evidence-strip ${revealClass("strip")}" data-reveal="strip" aria-label="Verified evidence strip">
            ${presentation.evidenceStrip.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>

          ${
            demo.status === "error"
              ? `<div class="mainnet-empty mainnet-empty--error"><strong>Verified run did not load</strong><p>${escapeHtml(demo.message)}</p></div>`
              : ""
          }
        </section>

        <section class="demo-panel ${revealClass("review")}" data-reveal="review" id="review">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Step 1 &mdash; Review</p>
              <h3>The reviewed transaction intent</h3>
            </div>
            <span>${escapeHtml(demo.message)}</span>
          </div>
          <dl class="mainnet-stats">
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

        <section class="demo-panel ${revealClass("verify")}" data-reveal="verify" id="verify">
          <div class="section-heading section-heading--compact">
            <div>
              <p class="eyebrow">Step 2 &mdash; Verify</p>
              <h3>Binding Firewall: field-level safety gate</h3>
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
          <button class="primary-action" type="button" disabled>
            ${replay.binding.signing_allowed ? "Signing Control Enabled" : "Signing Control Disabled"}
          </button>
          <p class="required-sentence">
            The Binding Firewall is a semantic intent-to-PCZT check. A mismatch blocks signing before any FROST round begins.
          </p>
        </section>

        <section class="demo-panel demo-panel--participants ${revealClass("authorize")}" data-reveal="authorize" id="authorize">
          <div class="section-heading section-heading--compact">
            <div>
              <p class="eyebrow">Step 3 &mdash; Authorize</p>
              <h3>${mismatch ? "Authorization blocked before FROST begins" : "Threshold authorization with one participant unavailable"}</h3>
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
          <p class="required-sentence ${mismatch ? "" : "required-sentence--complete"}">
            ${
              mismatch
                ? "No aggregate signature, completed PCZT, or broadcast exists for this counterfactual safety test."
                : "This mainnet proof run completed without the unavailable participant."
            }
          </p>
          <dl class="mainnet-stats">
            ${renderProofFact("FROST threshold status", presentation.authorization.thresholdStatus)}
            ${renderProofFact("Aggregate signature", presentation.authorization.aggregateStatus)}
            ${renderProofFact(
              "Selected signer fingerprints",
              mismatch
                ? "NONE — SAFETY TEST BLOCKED"
                : presentation.authorization.selectedSigners.map((value) => shortHex(value)).join(", "),
            )}
            ${renderProofFact("Ciphersuite", proof?.vault?.ciphersuite)}
          </dl>
        </section>

        <section class="demo-panel ${revealClass("prove")}" data-reveal="prove" id="prove">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Step 4 &mdash; Prove</p>
              <h3>${mismatch ? "Synthetic safety-test state stops at the failed review" : "Run state is derived from recorded events"}</h3>
            </div>
            <span>${escapeHtml(`${replay.events_seen} ${mismatch ? "synthetic " : ""}events`)}</span>
          </div>
          <ol class="demo-flow">
            ${[
              ["Vault", `${threshold}-of-${total} redpallas-rerandomized FROST group`, Boolean(threshold)],
              [
                "Failure condition",
                mismatch ? "RECIPIENT MISMATCH — SYNTHETIC SAFETY TEST" : `${unavailable} participant unavailable; threshold still satisfiable`,
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

          <div class="verified-demo__actions">
            <button class="secondary-action" id="downloadPublicProof" type="button" ${presentation.downloadEnabled ? "" : "disabled"}>
              ${mismatch ? "Proof Download Disabled in Safety Test" : "Download Public Proof"}
            </button>
          </div>

          <dl class="mainnet-stats proof-route-panel__facts">
            ${presentation.proofFacts.map(([label, value]) => renderProofFact(label, value)).join("")}
          </dl>

          ${renderTamperLab()}

          ${
            mismatch
              ? `
                <div class="prototype-note">
                  <strong>The recorded proof remains unchanged.</strong>
                  <p>Return to PASS mode to verify or download the immutable recorded mainnet run. This counterfactual state cannot be exported as that proof.</p>
                </div>
              `
              : ""
          }

          <div class="prototype-note">
            <strong>Verify this yourself, without trusting this page.</strong>
            <p>
              make judge-proof-mainnet &mdash; verifies the recorded bundle.
              make judge-proof-mainnet-tamper &mdash; shows tamper detection.
              This page replays a recorded run; it is not a live signing session.
            </p>
          </div>

          <div class="prototype-note">
            <strong>Zcash validates the resulting spend authorization normally.</strong>
            <p>
              FROST provenance is evidenced by the recorded ZecSafe/FROST signing session; the chain does not expose a
              special FROST marker. Signer review mode is semantic_pczt_review: signers check PCZT semantics and compare
              the prepared pinned-tool SIGHASH fingerprint; they do not independently recompute the SIGHASH.
            </p>
          </div>
        </section>

        <footer class="app-footer">
          <p>
            ZecSafe is a hackathon proof-of-concept using re-randomized FROST tooling. The referenced NCC audit of the ZF
            FROST repository did not include rerandomized FROST. ZecSafe is not audited production custody software.
            Recovery is not demonstrated.
          </p>
          <p>
            <a href="https://github.com/cyberrockng/zecsafe" target="_blank" rel="noopener noreferrer">Source and documentation on GitHub</a>
            &middot;
            <a href="https://mainnet.zcashexplorer.app/transactions/27d0e850202f3f2c37b7de0ded80bdaac1f9fef1fc663c7d6cf107fad55e8527" target="_blank" rel="noopener noreferrer">Verified transaction on a public explorer</a>
          </p>
        </footer>
      </main>
      ${renderStoryBar()}
    </div>
  `;
}

function bindEvents() {
  document.querySelector("#loadVerifiedDemo")?.addEventListener("click", () => {
    if (state.demo.status === "success" && state.demo.mode !== "mismatch") {
      animateFlowReveal(8);
      animateHeroReveal();
      return;
    }
    loadVerifiedProof(state.demo.mode, { animate: true });
  });

  document.querySelector("#startStory")?.addEventListener("click", () => {
    startStory();
  });

  document.querySelector("#jumpTamperLab")?.addEventListener("click", () => {
    document.querySelector(".tamper-lab")?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  });

  document.querySelectorAll("[data-story-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.storyAction;
      state.story.paused = true;
      if (storyTimer) clearTimeout(storyTimer);
      storyTimer = null;
      if (action === "next") enterStoryChapter(state.story.chapter + 1);
      if (action === "back") enterStoryChapter(state.story.chapter - 1);
      if (action === "exit") endStory();
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "copy-txid") copyTxid();
      if (action === "toggle-txid") {
        state.ui.txidExpanded = !state.ui.txidExpanded;
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
}

function render() {
  app.innerHTML = renderApp();
  bindEvents();
  state.lab.animatedSeq = state.lab.resultSeq;
  setupRevealObserver();
}

// Any manual interaction outside the story bar pauses the guided story's
// auto-advance; the visitor keeps control of the page at all times.
app.addEventListener("click", (event) => {
  if (!state.story.active || state.story.paused) return;
  if (event.target.closest(".story-bar")) return;
  pauseStory();
});

render();
loadVerifiedProof(state.demo.mode, { animate: true });

window.addEventListener("hashchange", () => {
  render();
});

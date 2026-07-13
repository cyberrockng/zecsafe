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
  lab: {
    busy: false,
    editing: false,
    presetId: null,
    proofText: null,
    result: null,
    error: null,
  },
};

let replayTimer = null;

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
    if (animate && mode !== "mismatch") animateFlowReveal(8);
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

function verifyLoadedPublicProof() {
  const proof = state.demo.proof;
  const replay = state.demo.reduced;
  if (!proof) return;

  const requiredChecks = [
    proof.schema_version === "zecsafe-proof-v1",
    proof.network === "main",
    Boolean(proof.run_id),
    Boolean(proof.bundle_hash),
    Boolean(proof.transaction?.txid),
    proof.pczt?.binding_status === "PASS",
    replay.readiness.binding_passed,
    replay.readiness.threshold_reached,
    replay.frost.selected_signer_count >= Number(proof.vault?.threshold ?? 0),
  ];
  const pass = state.demo.mode !== "mismatch" && requiredChecks.every(Boolean);

  state.demo.verifyStatus = pass ? "pass" : "fail";
  state.demo.message = pass
    ? "Public proof structure and ProofEvent replay pass the demo gate."
    : "Public proof verification failed or the safety-test mismatch is active.";
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
    state.lab = { ...state.lab, busy: false, presetId, result, error: null };
  } catch (error) {
    state.lab = { ...state.lab, busy: false, presetId, result: null, error: error.message };
  }

  render();
}

function resetLab() {
  state.lab = { busy: false, editing: false, presetId: null, proofText: null, result: null, error: null };
  render();
}

function renderLabCheck(check) {
  const ok = check.status === "PASS";
  return `
    <li class="${ok ? "binding-check--pass" : "binding-check--fail"}">
      <strong>${escapeHtml(check.name)}</strong>
      <span>${escapeHtml(check.status)}</span>
    </li>
  `;
}

function renderTamperLab() {
  const lab = state.lab;
  if (!state.demo.proof || state.demo.mode === "mismatch") return "";

  const result = lab.result;
  const verdictBlock = result
    ? `
      <div class="tamper-lab__verdict ${result.status === "PASS" ? "tamper-lab__verdict--pass" : "tamper-lab__verdict--fail"}" role="status">
        <strong>${escapeHtml(result.verdict)}</strong>
        <span>Recorded bundle hash: ${escapeHtml(shortHex(result.bundle_hash?.slice("sha256:".length)))}</span>
        <span>Recomputed just now in your browser: ${escapeHtml(shortHex(result.computed_bundle_hash?.slice("sha256:".length)))}</span>
      </div>
      <ul class="binding-check-list">${result.checks.map((check) => renderLabCheck(check)).join("")}</ul>
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
              <p class="eyebrow">Recorded Verified Mainnet Run</p>
              <h1>ZECSAFE</h1>
              <h2>Lose one key, not your ZEC.</h2>
              <p>A 2-of-3 FROST authorization control plane for shielded Zcash.</p>
              <div class="verified-demo__actions">
                <button class="primary-action" id="loadVerifiedDemo" type="button">
                  ${demo.status === "loading" ? "Loading..." : "Replay Verified Mainnet Run"}
                </button>
                <button class="secondary-action" id="verifyPublicProof" type="button" ${presentation.verifier.enabled ? "" : "disabled"}>${presentation.verifier.label}</button>
              </div>
              ${
                mismatch
                  ? `<p class="required-sentence"><strong>Counterfactual safety test active.</strong> The receipt beside it is the immutable recorded-run reference; the synthetic path below stops before FROST and does not reuse its later outcomes.</p>`
                  : ""
              }
            </div>
            <dl class="verified-demo__receipt">
              ${renderProofFact(presentation.recorded.receiptLabel, proof?.run_id)}
              ${renderProofFact("UTC timestamp", proof?.recorded_at)}
              ${renderProofFact(presentation.recorded.txidLabel, txid)}
              ${renderProofFact(presentation.recorded.chainStatusLabel, chainStatus)}
            </dl>
          </div>

          <div class="evidence-strip" aria-label="Verified evidence strip">
            ${presentation.evidenceStrip.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>

          ${
            demo.status === "error"
              ? `<div class="mainnet-empty mainnet-empty--error"><strong>Verified run did not load</strong><p>${escapeHtml(demo.message)}</p></div>`
              : ""
          }
        </section>

        <section class="demo-panel" id="review">
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
            Recipient, amount, and memo are withheld from public evidence. The commitment binds them without disclosing them.
          </p>
        </section>

        <section class="demo-panel" id="verify">
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

        <section class="demo-panel demo-panel--participants" id="authorize">
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

        <section class="demo-panel" id="prove">
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
        </footer>
      </main>
    </div>
  `;
}

function bindEvents() {
  document.querySelector("#loadVerifiedDemo")?.addEventListener("click", () => {
    if (state.demo.status === "success" && state.demo.mode !== "mismatch") {
      animateFlowReveal(8);
      return;
    }
    loadVerifiedProof(state.demo.mode, { animate: true });
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
}

render();
loadVerifiedProof(state.demo.mode, { animate: true });

window.addEventListener("hashchange", () => {
  render();
});

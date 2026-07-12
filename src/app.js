import { createBindingMismatchEvents, proofEventsFromPublicLog, reduceDemoProofEvents } from "./demo-proof-state.mjs";

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
  },
};

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

async function loadVerifiedProof(mode = state.demo.mode) {
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

function downloadPublicProof() {
  if (!state.demo.proof) return;
  const payload = {
    proof: state.demo.proof,
    public_event_log: state.demo.publicEventLog,
    replay_state: state.demo.reduced,
    exported_at: new Date().toISOString(),
  };
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

function renderFlowStep(label, detail, complete = true) {
  return `
    <li class="${complete ? "demo-flow__step--complete" : ""}">
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
  const loaded = demo.status === "success" && proof;

  const threshold = proof?.vault?.threshold ?? replay.frost.threshold ?? 2;
  const total = proof?.vault?.participants_total ?? replay.frost.participant_total ?? 3;
  const unavailable = proof?.availability?.unavailable ?? replay.frost.unavailable_participant_count ?? 1;
  const selectedSigners = proof?.frost?.selected_signers ?? replay.frost.selected_public_fingerprints;
  const chainStatus = proof?.transaction?.chain_status ?? replay.chain.status;
  const txid = proof?.transaction?.txid ?? replay.chain.txid;
  const verifyLabel =
    demo.verifyStatus === "pass" ? "Proof Verified" : demo.verifyStatus === "fail" ? "Proof Blocked" : "Verify Proof";

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
                <button class="secondary-action" id="verifyPublicProof" type="button" ${loaded ? "" : "disabled"}>${verifyLabel}</button>
              </div>
            </div>
            <dl class="verified-demo__receipt">
              ${renderProofFact("Run ID", proof?.run_id)}
              ${renderProofFact("UTC timestamp", proof?.recorded_at)}
              ${renderProofFact("Txid", txid)}
              ${renderProofFact("Chain status", chainStatus)}
            </dl>
          </div>

          <div class="evidence-strip" aria-label="Verified evidence strip">
            <span>ZCASH MAINNET</span>
            <span>${escapeHtml(`${threshold} OF ${total}`)}</span>
            <span>FROST</span>
            <span>${escapeHtml(`${unavailable} UNAVAILABLE`)}</span>
            <span>${demo.verifyStatus === "fail" ? "PROOF BLOCKED" : "PROOF VERIFIED"}</span>
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
              <button type="button" class="${mismatch ? "" : "demo-mode-toggle__active"}" data-demo-mode="verified">PASS</button>
              <button type="button" class="${mismatch ? "demo-mode-toggle__active" : ""}" data-demo-mode="mismatch">Mismatch</button>
            </div>
          </div>
          ${mismatch ? `<div class="safety-test-label">SAFETY TEST &mdash; NOT A BROADCAST TRANSACTION</div>` : ""}
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
              <h3>Threshold authorization with one participant unavailable</h3>
            </div>
            <span>${escapeHtml(`${threshold}-of-${total}`)}</span>
          </div>
          <div class="participant-row">
            <span class="participant-pill participant-pill--available">Signer A available</span>
            <span class="participant-pill participant-pill--available">Signer B available</span>
            <span class="participant-pill participant-pill--unavailable">Signer C unavailable</span>
          </div>
          <p class="required-sentence">One participant is unavailable. The 2-of-3 threshold remains satisfiable.</p>
          <p class="required-sentence required-sentence--complete">This mainnet proof run completed without the unavailable participant.</p>
          <dl class="mainnet-stats">
            ${renderProofFact("FROST threshold status", replay.frost.threshold_status)}
            ${renderProofFact("Aggregate signature", proof?.frost?.aggregate_signature_status)}
            ${renderProofFact("Selected signer fingerprints", selectedSigners?.map((value) => shortHex(value)).join(", "))}
            ${renderProofFact("Ciphersuite", proof?.vault?.ciphersuite)}
          </dl>
        </section>

        <section class="demo-panel" id="prove">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Step 4 &mdash; Prove</p>
              <h3>Run state is derived from recorded events</h3>
            </div>
            <span>${escapeHtml(`${replay.events_seen} events`)}</span>
          </div>
          <ol class="demo-flow">
            ${renderFlowStep("Vault", `${threshold}-of-${total} redpallas-rerandomized FROST group`, Boolean(threshold))}
            ${renderFlowStep("Failure condition", `${unavailable} participant unavailable; threshold still satisfiable`, replay.frost.unavailable_participant_count !== null)}
            ${renderFlowStep("Intent", proof?.intent?.commitment ?? "Intent commitment recorded", Boolean(proof?.intent?.commitment))}
            ${renderFlowStep("Binding Firewall", replay.binding.status, replay.readiness.binding_passed)}
            ${renderFlowStep("FROST authorization", replay.frost.threshold_status, replay.readiness.threshold_reached)}
            ${renderFlowStep("PCZT completion", replay.pczt.combine_status, replay.readiness.combined_pczt)}
            ${renderFlowStep("Mainnet", `${chainStatus} / ${proofValue(txid)}`, Boolean(txid))}
            ${renderFlowStep("Proof", proof?.bundle_hash ?? "Bundle hash pending", Boolean(proof?.bundle_hash))}
          </ol>

          <div class="verified-demo__actions">
            <button class="secondary-action" id="downloadPublicProof" type="button" ${loaded ? "" : "disabled"}>Download Public Proof</button>
          </div>

          <dl class="mainnet-stats proof-route-panel__facts">
            ${renderProofFact("Run ID", proof?.run_id)}
            ${renderProofFact("Recorded Verified Mainnet Run", demo.publicEventLog?.label)}
            ${renderProofFact("UTC timestamp", proof?.recorded_at)}
            ${renderProofFact("Txid", txid)}
            ${renderProofFact("Recorded chain status", chainStatus)}
            ${renderProofFact("Block height", proof?.transaction?.observed_block_height)}
            ${renderProofFact("Binding status", mismatch ? replay.binding.status : proof?.pczt?.binding_status)}
            ${renderProofFact("Proof bundle hash", proof?.bundle_hash)}
            ${renderProofFact("Exact ZecSafe commit", proof?.zecsafe_commit)}
            ${renderProofFact("frost-tools commit", proof?.toolchain?.frost_tools_commit)}
            ${renderProofFact("zcash-devtool commit", proof?.toolchain?.zcash_devtool_commit)}
            ${renderProofFact("pczt signer library commit", proof?.toolchain?.pczt_signer_library_commit)}
          </dl>

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
    loadVerifiedProof(state.demo.mode);
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
loadVerifiedProof();

window.addEventListener("hashchange", () => {
  render();
});

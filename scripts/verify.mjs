import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "index.html",
  "LICENSE",
  "package.json",
  "server.mjs",
  "src/app.js",
  "src/styles.css",
  "README.md",
  "SUBMISSION.md",
  "docs/architecture.md",
  "docs/architecture-diagram.md",
  "docs/demo-script.md",
  "docs/frost-integration.md",
  "docs/frost-windows-setup.md",
  "docs/mainnet-integration.md",
  "docs/mainnet-readonly.md",
  "docs/operator-notepad.md",
  "docs/pr-checklist.md",
  "docs/submission-plan.md",
  "docs/threat-model.md",
  "docs/roadmap.md",
  "docs/screenshots/vault-dashboard.png",
  "docs/screenshots/mainnet-monitor.png",
  "docs/screenshots/transaction-proof.png",
  "docs/screenshots/recovery-flow.png",
  "scripts/frost-local-wrapper.mjs",
  "scripts/capture-screenshots.mjs",
];

for (const file of requiredFiles) {
  await access(file);
}

const html = await readFile("index.html", "utf8");
const app = await readFile("src/app.js", "utf8");
const styles = await readFile("src/styles.css", "utf8");

const checks = [
  [html.includes('<div id="app"></div>'), "index.html mounts #app"],
  [html.includes('type="module" src="src/app.js"'), "index.html loads app module"],
  [app.includes("function render()"), "app.js includes render flow"],
  [app.includes("setGuardianStatus"), "app.js includes guardian approval logic"],
  [app.includes("lookupTransparentAddress"), "app.js includes mainnet lookup logic"],
  [app.includes("syncViewingKeyBalance"), "app.js includes viewing key sync logic"],
  [app.includes("checkTransactionProof"), "app.js includes transaction proof logic"],
  [app.includes("FROST Live Demo"), "app.js includes FROST explanation"],
  [app.includes("Security boundaries"), "app.js includes visible threat model"],
  [app.includes("navGroups") && app.includes("Vault Overview") && app.includes("Proposal Center") && app.includes("Guardian Center") && app.includes("FROST Live Demo"), "app.js includes grouped navigation labels"],
  [app.includes("enableStandardTrackpadScroll"), "app.js includes standard trackpad scrolling"],
  [app.includes("Mainnet check successful"), "app.js includes strong mainnet success card"],
  [app.includes("Zcash mainnet infrastructure connected"), "app.js includes chain status card"],
  [app.includes("checkMainnetStatus"), "app.js includes mainnet status check"],
  [app.includes("renderLiveMainnetPanel"), "app.js includes live mainnet dashboard panel"],
  [app.includes("runFrostDemo"), "app.js includes FROST demo runner"],
  [app.includes("canonicalProposalPayload") && app.includes("proposalPayloadHash"), "app.js binds FROST proof to proposal payload hash"],
  [app.includes("signGuardianApproval") && app.includes("guardianSignatureProofsFor"), "app.js includes browser-side guardian signature proofs"],
  [app.includes("Controlled Mainnet Proof") && app.includes("proposalMainnetProofs"), "app.js includes proposal-specific controlled mainnet proof mode"],
  [app.includes("downloadProofBundle"), "app.js includes downloadable proof bundle export"],
  [!app.includes("Start Judge Walkthrough") && !app.includes("renderJudgeMode"), "app.js keeps operator walkthrough out of main product UI"],
  [app.includes("Generate Proof Bundle"), "app.js includes proof bundle UI"],
  [app.includes("audit-badge"), "app.js includes audit badges"],
  [app.includes("Transaction proof found on Zcash mainnet"), "app.js includes strong tx proof card"],
  [app.includes("renderRecoveryResult"), "app.js includes interactive recovery workflow"],
  [app.includes("Recovery Risk: High"), "app.js includes high-risk recovery warning"],
  [app.includes("RECOVERY_NEW_VAULT_FINGERPRINT"), "app.js includes recovery fingerprint"],
  [app.includes("flagRecoverySuspicious"), "app.js includes suspicious recovery flag"],
  [app.includes("Recovery timelock started"), "app.js includes recovery timelock"],
  [app.includes("How ZecSafe works"), "app.js includes in-app architecture flow"],
  [(await readFile("docs/operator-notepad.md", "utf8")).includes("ZecSafe Operator Notepad"), "operator notepad exists outside main app UI"],
  [styles.includes("position: fixed"), "styles.css keeps desktop navigation fixed"],
  [(await readFile("server.mjs", "utf8")).includes("/api/mainnet/status"), "server includes mainnet status route"],
  [(await readFile("server.mjs", "utf8")).includes("/api/mainnet-status"), "server includes combined mainnet status route"],
  [(await readFile("server.mjs", "utf8")).includes("/api/mainnet/address-balance"), "server includes address balance route"],
  [(await readFile("server.mjs", "utf8")).includes("/api/frost-demo"), "server includes FROST demo route"],
  [(await readFile("server.mjs", "utf8")).includes("/api/proof-bundle"), "server includes proof bundle route"],
  [(await readFile("scripts/frost-demo.mjs", "utf8")).includes("frost-local-wrapper.mjs"), "FROST demo runs built-in local wrapper"],
  [(await readFile("scripts/frost-local-wrapper.mjs", "utf8")).includes("trusted-dealer"), "FROST wrapper uses trusted-dealer"],
  [(await readFile("scripts/frost-local-wrapper.mjs", "utf8")).includes("coordinator"), "FROST wrapper uses coordinator"],
  [(await readFile("scripts/frost-local-wrapper.mjs", "utf8")).includes("participant"), "FROST wrapper uses participants"],
  [(await readFile("server.mjs", "utf8")).includes("getmempoolinfo"), "server includes mempool status call"],
  [(await readFile("README.md", "utf8")).includes("How It Uses Zcash Mainnet"), "README includes mainnet usage"],
  [(await readFile("README.md", "utf8")).includes("Real vs Simulated"), "README includes real vs simulated table"],
  [(await readFile("README.md", "utf8")).includes("Guardian approval acknowledgement"), "README documents guardian signature acknowledgements"],
  [(await readFile("README.md", "utf8")).includes("Controlled Mainnet Proof Workflow"), "README documents controlled mainnet proof workflow"],
  [(await readFile("README.md", "utf8")).includes("FROST Library"), "README includes FROST library section"],
  [(await readFile("README.md", "utf8")).includes("docs/threat-model.md"), "README links threat model"],
  [(await readFile("docs/frost-integration.md", "utf8")).includes("frost-local-wrapper.mjs"), "FROST docs include built-in wrapper"],
  [(await readFile("docs/frost-windows-setup.md", "utf8")).includes("Visual Studio C++ Build Tools"), "FROST Windows setup includes MSVC requirement"],
  [(await readFile("docs/mainnet-integration.md", "utf8")).includes("getpeerinfo"), "mainnet docs include peer status call"],
  [(await readFile("SUBMISSION.md", "utf8")).includes("ZecHub Hackathon 2026 Submission"), "submission file exists"],
  [(await readFile("docs/architecture-diagram.md", "utf8")).includes("flowchart TD"), "architecture diagram includes Mermaid"],
  [(await readFile("docs/demo-script.md", "utf8")).includes("Target length"), "demo script exists"],
  [(await readFile("docs/threat-model.md", "utf8")).includes("Sensitive Data Rules"), "threat model includes sensitive data rules"],
  [styles.includes("@media (max-width: 680px)"), "styles.css includes mobile breakpoint"],
];

const failures = checks.filter(([passed]) => !passed);

if (failures.length > 0) {
  for (const [, message] of failures) {
    console.error(`Missing check: ${message}`);
  }
  process.exit(1);
}

console.log("ZecSafe static verification passed.");

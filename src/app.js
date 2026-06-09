const guardians = [
  {
    id: "alice-laptop",
    name: "Alice Laptop",
    role: "Primary",
    deviceLabel: "Owner laptop",
    status: "pending",
    healthStatus: "Healthy",
    location: "Lagos",
    lastChecked: "2026-05-30",
    lastActive: "Active this session",
  },
  {
    id: "alice-phone",
    name: "Alice Phone",
    role: "Backup",
    deviceLabel: "Owner phone",
    status: "pending",
    healthStatus: "Needs Check",
    location: "Mobile",
    lastChecked: "2026-05-30",
    lastActive: "Active this session",
  },
  {
    id: "recovery",
    name: "Recovery Contact",
    role: "Recovery",
    deviceLabel: "Trusted recovery contact",
    status: "pending",
    healthStatus: "Healthy",
    location: "Remote",
    lastChecked: "2026-05-30",
    lastActive: "2026-05-30",
  },
];

const proposals = [
  {
    id: "prop-001",
    title: "Treasury payment to ZecHub contributors",
    amount: 50,
    recipient: "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd",
    memo: "Contributor payout batch after guardian review",
    status: "Needs Approval",
    created: "Today",
    riskLevel: "High",
    usesLiveApprovalState: true,
  },
  {
    id: "prop-002",
    title: "Move funds to new safe address",
    amount: 0.08,
    recipient: "u1zcashrecoveryvault7x4g9q2safeaddress",
    memo: "Emergency recovery test",
    status: "Draft",
    created: "Yesterday",
    riskLevel: "Low",
  },
  {
    id: "prop-003",
    title: "Recovery vault migration dry run",
    amount: 1.284,
    recipient: "u1recoverysafevault92a7kl3pnewguardian",
    memo: "Prepared after lost-device recovery review",
    status: "Needs Approval",
    created: "Prototype start",
    riskLevel: "Medium",
  },
];

const proposalFilters = ["All", "Draft", "Needs Approval", "Threshold Reached", "Ready for FROST", "Broadcast Disabled"];
const PROPOSAL_SAFETY_NOTE =
  "ZecSafe does not custody funds. Guardian shares stay local. Broadcast requires real FROST signing. Mainnet monitoring is read-only.";
const APP_FOOTER_NOTE =
  "ZecSafe does not custody funds. Guardian shares stay local. Mainnet monitoring is read-only. Broadcast requires real FROST signing.";

const riskRules = [
  {
    label: "Unified address detected",
    detail: "Recipient uses a modern Zcash unified address format.",
    level: "safe",
  },
  {
    label: "Threshold policy active",
    detail: "This vault requires 2 guardian signatures before broadcast.",
    level: "safe",
  },
  {
    label: "New recipient",
    detail: "This address is not in the trusted recipient list yet.",
    level: "watch",
  },
  {
    label: "Mainnet confirmation required",
    detail: "Prototype mode shows the flow; final signing must use live mainnet libraries.",
    level: "watch",
  },
];

const navGroups = [
  {
    label: "VAULT",
    items: [
      { href: "#vault", label: "Vault Overview" },
      { href: "#vault-policy", label: "Vault Policy" },
    ],
  },
  {
    label: "PROPOSALS",
    items: [
      { href: "#proposals", label: "Proposal Center" },
      { href: "#audit-log", label: "Audit Log" },
    ],
  },
  {
    label: "GUARDIANS",
    items: [
      { href: "#guardians", label: "Guardian Center" },
      { href: "#recovery", label: "Recovery Center" },
    ],
  },
  {
    label: "EVIDENCE",
    items: [
      { href: "#mainnet-proof-run", label: "Mainnet Proof Run" },
      { href: "#evidence-center", label: "Evidence Center" },
      { href: "#frost-integration", label: "FROST Live Demo" },
    ],
  },
  {
    label: "DOCS",
    items: [
      { href: "#how-it-works", label: "How It Works" },
      { href: "#threat-model", label: "Threat Model" },
    ],
  },
];

const navItems = navGroups.flatMap((group) => group.items);

const MAINNET_RPC_ENDPOINT = "https://docs-demo.zec-mainnet.quiknode.pro/";
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const DEFAULT_TRANSPARENT_ADDRESS = "t3Vz22vK5z2LcKEdg16Yv4FFneEL1zg9ojd";
const DEFAULT_PROOF_TXID = "b138c395dd721c9cee3d5676cfe41dd343aec5e6d2514cbb03b018e1babcc368";
const RECOVERY_DEMO_TIMELOCK_SECONDS = 10;
const RECOVERY_PRODUCTION_TIMELOCK = "24-72 hours";
const RECOVERY_NEW_VAULT_ADDRESS = "u1...newSafeAddress";
const RECOVERY_NEW_VAULT_FINGERPRINT = "ZSAFE-92A7-KL3P";
const PROPOSALS_STORAGE_KEY = "zecsafe_proposals_v1";

let frostSignatureVerified = readFrostVerifiedSession();
const guardianKeyStore = {};

const state = {
  threshold: 2,
  totalShares: 3,
  broadcastStatus: "idle",
  selectedProposalId: proposals[0].id,
  proposalFilter: "All",
  proposalBuilder: {
    open: false,
    step: "details",
    status: "idle",
    message: "Raise a proposal with amount, recipient, memo, and optional expected mainnet txid.",
    draft: {
      title: "",
      amount: "",
      fee: "",
      recipient: "",
      memo: "",
      expectedTxid: "",
    },
    review: null,
  },
  mainnetStatus: {
    status: "idle",
    message: "Zcash mainnet infrastructure status has not been checked yet.",
    result: null,
  },
  addressInput: DEFAULT_TRANSPARENT_ADDRESS,
  mainnetLookup: {
    status: "idle",
    message: "Address ready to check.",
    result: {
      address: DEFAULT_TRANSPARENT_ADDRESS,
      type: "Transparent address",
      isDraft: true,
    },
  },
  shieldedSync: {
    status: "idle",
    message: "Paste a full viewing key to request a local read-only balance sync.",
    result: null,
  },
  transactionProof: {
    txid: DEFAULT_PROOF_TXID,
    status: "idle",
    message: "Enter a Zcash mainnet transaction ID to attach proof to this proposal.",
    result: null,
    linkedProposalId: null,
  },
  frostDemo: {
    status: "idle",
    message: "Run the local FROST tooling check to see whether official Zcash FROST output is configured.",
    result: null,
  },
  proofBundle: {
    status: "idle",
    message: "Generate a combined proof bundle for the judging walkthrough.",
    result: null,
  },
  proposalMainnetProofs: {},
  guardianProofs: {},
  proposalPayloads: {},
  hashingPayloads: false,
  recovery: {
    step: "select",
    lostGuardianId: "",
    reason: "",
    note: "",
    outOfBandConfirmed: false,
    approvals: [],
    broadcastStatus: "idle",
    timelockRemaining: null,
    flagged: false,
  },
  guardianHealthCheck: {
    guardianId: null,
    checks: {
      deviceAccessible: false,
      sharePresent: false,
      commitmentReady: false,
    },
  },
  auditLog: [
    {
      id: "audit-proposal-created",
      label: "Proposal created",
      detail: "Move funds to new safe address",
      time: "Prototype start",
      category: "SIM",
    },
    {
      id: "audit-guardian-signatures-ready",
      label: "Guardian signature proof ready",
      detail: "Local browser signatures will verify approval acknowledgements",
      time: "Prototype start",
      category: "CRYPTO",
    },
  ],
};

restoreStoredProposals();
state.selectedProposalId = proposals[0]?.id ?? state.selectedProposalId;

function approvedCount() {
  return verifiedGuardianSignatureCount(currentProposal());
}

function recoveryRiskLevel() {
  const hasCriticalGuardian = guardians.some((guardian) => ["lost", "compromised"].includes(String(guardian.healthStatus).toLowerCase()));
  return hasCriticalGuardian ? "High" : "Low";
}

function securityDotClass(level) {
  if (level === "good") return "security-command__dot--good";
  if (level === "risk") return "security-command__dot--risk";
  return "security-command__dot--warning";
}

function readFrostVerifiedSession() {
  try {
    return sessionStorage.getItem("zecsafe_frost_verified") === "true";
  } catch {
    return false;
  }
}

function writeFrostVerifiedSession(verified) {
  try {
    if (verified) {
      sessionStorage.setItem("zecsafe_frost_verified", "true");
    }
  } catch {
    // Session storage can be unavailable in hardened browser modes.
  }
}

function proposalStorageRecord(proposal) {
  return {
    id: proposal.id,
    title: proposal.title,
    amount: proposal.amount,
    recipient: proposal.recipient,
    memo: proposal.memo,
    fee: proposal.fee ?? null,
    expectedTxid: proposal.expectedTxid ?? "",
    status: proposal.status,
    created: proposal.created,
    riskLevel: proposal.riskLevel,
    usesLiveApprovalState: proposal.usesLiveApprovalState === true,
  };
}

function restoreStoredProposals() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROPOSALS_STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored) || stored.length === 0) return;

    const sanitized = stored
      .filter((proposal) => proposal && typeof proposal === "object")
      .map((proposal) => ({
        id: String(proposal.id ?? ""),
        title: String(proposal.title ?? "Untitled proposal"),
        amount: Number(proposal.amount ?? 0),
        recipient: String(proposal.recipient ?? ""),
        memo: String(proposal.memo ?? ""),
        fee: proposal.fee === null || proposal.fee === undefined || proposal.fee === "" ? null : Number(proposal.fee),
        expectedTxid: String(proposal.expectedTxid ?? ""),
        status: proposal.status === "Draft" ? "Draft" : "Needs Approval",
        created: String(proposal.created ?? "Restored"),
        riskLevel: ["Low", "Medium", "High"].includes(proposal.riskLevel) ? proposal.riskLevel : "Medium",
        usesLiveApprovalState: proposal.usesLiveApprovalState === true,
      }))
      .filter((proposal) => proposal.id && proposal.amount > 0 && proposal.recipient);

    if (sanitized.length) proposals.splice(0, proposals.length, ...sanitized);
  } catch {
    // Local proposal persistence is best effort.
  }
}

function persistProposals() {
  try {
    localStorage.setItem(PROPOSALS_STORAGE_KEY, JSON.stringify(proposals.map(proposalStorageRecord)));
  } catch {
    // Local proposal persistence is best effort.
  }
}

function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytes(hex) {
  const clean = String(hex).trim();
  const bytes = new Uint8Array(clean.length / 2);
  for (let index = 0; index < clean.length; index += 2) {
    bytes[index / 2] = Number.parseInt(clean.slice(index, index + 2), 16);
  }
  return bytes;
}

function guardianApprovalMessage(proposal, payloadHash) {
  return [
    "ZecSafe guardian approval",
    `network: zcash-mainnet`,
    `proposalId: ${proposal.id}`,
    `payloadHash: ${payloadHash}`,
    `threshold: ${state.threshold}-of-${state.totalShares}`,
  ].join("\n");
}

function guardianProofMap(proposalId) {
  if (!state.guardianProofs[proposalId]) state.guardianProofs[proposalId] = {};
  return state.guardianProofs[proposalId];
}

function guardianSignatureRecord(proposalId, guardianId) {
  return state.guardianProofs[proposalId]?.[guardianId] ?? null;
}

function verifiedGuardianSignatureCount(proposal = currentProposal()) {
  const proofs = state.guardianProofs[proposal.id] ?? {};
  return guardians.filter((guardian) => proofs[guardian.id]?.verified === true).length;
}

function guardianSignatureProofsFor(proposal = currentProposal()) {
  const proofs = state.guardianProofs[proposal.id] ?? {};
  return guardians
    .map((guardian) => {
      const proof = proofs[guardian.id];
      if (!proof) return null;
      return {
        guardianId: guardian.id,
        guardianName: guardian.name,
        role: guardian.role,
        algorithm: proof.algorithm,
        proposalId: proof.proposalId,
        payloadHash: proof.payloadHash,
        publicKeyFingerprint: proof.publicKeyFingerprint,
        publicKeySpki: proof.publicKeySpki,
        signature: proof.signature,
        signedAt: proof.signedAt,
        verified: proof.verified,
      };
    })
    .filter(Boolean);
}

async function ensureGuardianKey(guardian) {
  if (guardianKeyStore[guardian.id]) return guardianKeyStore[guardian.id];

  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign", "verify"],
  );
  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeySpki = bytesToHex(publicKeyBuffer);
  const fingerprint = await sha256HexString(publicKeySpki);

  guardianKeyStore[guardian.id] = {
    ...keyPair,
    publicKeySpki,
    publicKeyFingerprint: fingerprint.slice(0, 16).toUpperCase(),
  };

  return guardianKeyStore[guardian.id];
}

async function signGuardianApproval(id) {
  const guardian = guardians.find((item) => item.id === id);
  if (!guardian) return;
  if (["Lost", "Compromised"].includes(guardian.healthStatus)) {
    addAuditEvent("Guardian signature blocked", `${guardian.name} is marked ${guardian.healthStatus}`, "CRYPTO");
    render();
    return;
  }

  const proposal = currentProposal();
  const payloadRecord = await proposalPayloadRecord(proposal);
  const signingInput = guardianApprovalMessage(proposal, payloadRecord.hash);
  const keyMaterial = await ensureGuardianKey(guardian);
  const encoded = new TextEncoder().encode(signingInput);
  const signatureBuffer = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    keyMaterial.privateKey,
    encoded,
  );
  const verified = await crypto.subtle.verify(
    {
      name: "ECDSA",
      hash: "SHA-256",
    },
    keyMaterial.publicKey,
    signatureBuffer,
    encoded,
  );
  const signaturesBefore = verifiedGuardianSignatureCount(proposal);
  const requiredSignatures = requiredApprovalCount(proposal);

  guardianProofMap(proposal.id)[guardian.id] = {
    proposalId: proposal.id,
    payloadHash: payloadRecord.hash,
    message: signingInput,
    publicKeySpki: keyMaterial.publicKeySpki,
    publicKeyFingerprint: keyMaterial.publicKeyFingerprint,
    signature: bytesToHex(signatureBuffer),
    signatureFingerprint: (await sha256HexString(bytesToHex(signatureBuffer))).slice(0, 16).toUpperCase(),
    algorithm: "ECDSA P-256 / SHA-256 browser proof",
    verified,
    signedAt: auditTime(),
  };
  guardian.status = verified ? "approved" : "pending";

  const signaturesAfter = verifiedGuardianSignatureCount(proposal);
  addAuditEvent(
    verified ? `${guardian.name} cryptographically signed` : `${guardian.name} signature failed verification`,
    verified
      ? `Verified local signature over proposal hash ${payloadRecord.hash.slice(0, 12)}...`
      : `Signature over proposal hash ${payloadRecord.hash.slice(0, 12)}... did not verify`,
    "CRYPTO",
  );

  if (signaturesBefore < requiredSignatures && signaturesAfter >= requiredSignatures) {
    addAuditEvent("Cryptographic threshold reached", `${signaturesAfter}/${requiredSignatures} verified guardian signatures collected`, "CRYPTO");
  }

  render();
}

function currentProposal() {
  return proposals.find((proposal) => proposal.id === state.selectedProposalId) ?? proposals[0];
}

function activePageHash() {
  const hash = window.location.hash || "#vault";
  const validPages = new Set([
    "#vault",
    "#vault-policy",
    "#proposals",
    "#audit-log",
    "#guardians",
    "#recovery",
    "#mainnet-proof-run",
    "#evidence-center",
    "#frost-integration",
    "#how-it-works",
    "#threat-model",
    "#mainnet",
    "#transaction-proof",
    "#shielded-sync",
  ]);
  return validPages.has(hash) ? hash : "#vault";
}

function pageSectionAttrs(hash) {
  return `data-page-section="${hash}" ${activePageHash() === hash ? 'data-active-page="true"' : ""}`;
}

async function setGuardianStatus(id, status) {
  if (status === "approved") {
    await signGuardianApproval(id);
    return;
  }

  const guardian = guardians.find((item) => item.id === id);
  if (!guardian) return;
  if (["Lost", "Compromised"].includes(guardian.healthStatus)) {
    addAuditEvent("Guardian approval blocked", `${guardian.name} is marked ${guardian.healthStatus}`, "SIM");
    render();
    return;
  }
  const approvalsBefore = approvedCount();
  guardian.status = status;
  const approvalsAfter = approvedCount();

  if (status === "approved") {
    addAuditEvent(`${guardian.name} approved`, `${approvalsAfter}/${state.threshold} approvals collected`, "SIM");
  }

  if (approvalsBefore < state.threshold && approvalsAfter >= state.threshold) {
    addAuditEvent("Threshold reached", "Transaction can move to broadcast preparation", "SIM");
  }

  render();
}

function setSelectedProposal(id) {
  state.selectedProposalId = id;
  const proposal = currentProposal();
  const attachedProof = proposalMainnetProof(proposal);
  if (proposal?.expectedTxid && !attachedProof) {
    state.transactionProof = {
      txid: proposal.expectedTxid,
      status: "idle",
      message: "Expected txid loaded from the selected proposal. Click Check Proof to attach confirmations.",
      result: null,
      linkedProposalId: null,
    };
  }
  render();
}

function zatoshisToZec(value) {
  return (Number(value) / 100000000).toLocaleString(undefined, {
    maximumFractionDigits: 8,
    minimumFractionDigits: 0,
  });
}

function auditTime() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function inferAuditCategory(label) {
  const value = label.toLowerCase();
  if (value.includes("signature") || value.includes("cryptographic")) return "CRYPTO";
  if (value.includes("mainnet") || value.includes("chain") || value.includes("proof")) return "MAINNET";
  if (value.includes("frost")) return "FROST";
  return "SIM";
}

function addAuditEvent(label, detail, category = inferAuditCategory(label)) {
  const id = `${label}-${detail}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  if (state.auditLog.some((event) => event.id === id)) return;

  state.auditLog.push({
    id,
    label,
    detail,
    time: auditTime(),
    category,
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function decodeBase58(address) {
  let value = 0n;
  for (const char of address) {
    const index = BASE58_ALPHABET.indexOf(char);
    if (index === -1) return null;
    value = value * 58n + BigInt(index);
  }

  const bytes = [];
  while (value > 0n) {
    bytes.unshift(Number(value % 256n));
    value /= 256n;
  }

  for (const char of address) {
    if (char !== "1") break;
    bytes.unshift(0);
  }

  return bytes;
}

async function sha256(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", new Uint8Array(bytes));
  return [...new Uint8Array(digest)];
}

async function sha256HexString(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function validateTransparentAddress(address) {
  const trimmed = address.trim();
  const decoded = decodeBase58(trimmed);

  if (!decoded || decoded.length !== 26) {
    return { valid: false, type: "unknown", message: "This is not a valid mainnet transparent address." };
  }

  const payload = decoded.slice(0, -4);
  const checksum = decoded.slice(-4);
  const expected = (await sha256(await sha256(payload))).slice(0, 4);
  const checksumMatches = checksum.every((byte, index) => byte === expected[index]);
  const prefix = `${payload[0].toString(16).padStart(2, "0")}${payload[1].toString(16).padStart(2, "0")}`;
  const validPrefix = prefix === "1cb8" || prefix === "1cbd";

  if (!checksumMatches || !validPrefix) {
    return { valid: false, type: "unknown", message: "The address checksum or network prefix is invalid." };
  }

  return {
    valid: true,
    type: prefix === "1cb8" ? "P2PKH transparent" : "P2SH transparent",
    message: "Transparent mainnet address validated locally.",
  };
}

function classifyZcashAddress(address) {
  const trimmed = address.trim();

  if (trimmed.startsWith("u1")) {
    return {
      publiclyReadable: false,
      type: "Unified address",
      message: "Unified and shielded receiver balances are private. Use a viewing-key/lightwalletd flow for read-only sync.",
    };
  }

  if (trimmed.startsWith("zs1") || trimmed.startsWith("zc") || trimmed.startsWith("ztestsapling")) {
    return {
      publiclyReadable: false,
      type: "Shielded address",
      message: "Shielded balances are not available from public explorers. ZecSafe needs a viewing key to sync them safely.",
    };
  }

  if (trimmed.startsWith("t1") || trimmed.startsWith("t3")) {
    return {
      publiclyReadable: true,
      type: "Transparent address",
      message: "Transparent balances are public and can be queried read-only.",
    };
  }

  return {
    publiclyReadable: false,
    type: "Unknown address",
    message: "Enter a Zcash transparent mainnet address starting with t1 or t3.",
  };
}

function classifyViewingKey(viewingKey) {
  const key = viewingKey.trim();
  const lowered = key.toLowerCase();
  const wordCount = key.split(/\s+/).filter(Boolean).length;

  if (!key) {
    return { valid: false, type: "missing", message: "Paste a full viewing key to start sync." };
  }

  if (wordCount >= 12 || lowered.startsWith("secret") || lowered.includes("spending")) {
    return {
      valid: false,
      type: "dangerous-secret",
      message: "This looks like seed or spending-key material. Only use a viewing key.",
    };
  }

  if (lowered.startsWith("uview1") || lowered.startsWith("uvf1")) {
    return { valid: true, type: "Unified full viewing key", message: "Ready for read-only sync." };
  }

  if (lowered.startsWith("zviews")) {
    return { valid: true, type: "Sapling full viewing key", message: "Ready for read-only sync." };
  }

  if (lowered.startsWith("uivk1") || lowered.startsWith("uvi1") || lowered.startsWith("zivks")) {
    return {
      valid: false,
      type: "incoming-viewing-key",
      message: "Incoming viewing keys can detect received funds, but this balance route needs a full viewing key.",
    };
  }

  return {
    valid: false,
    type: "unknown",
    message: "Unsupported viewing key format. Expected uview1, uvf1, or zviews...",
  };
}

async function lookupTransparentAddress(address) {
  const classified = classifyZcashAddress(address);

  if (!classified.publiclyReadable) {
    state.mainnetLookup = {
      status: "blocked",
      message: classified.message,
      result: { address: address.trim(), type: classified.type, isDraft: true },
    };
    render();
    return;
  }

  state.mainnetLookup = {
    status: "loading",
    message: "Validating address and querying Zcash mainnet...",
    result: null,
  };
  render();

  const validation = await validateTransparentAddress(address);
  if (!validation.valid) {
    state.mainnetLookup = {
      status: "error",
      message: validation.message,
      result: null,
    };
    render();
    return;
  }

  try {
    const response = await fetch("/api/mainnet/address-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: address.trim() }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message ?? `Mainnet endpoint returned HTTP ${response.status}`);
    }

    if (payload.status === "unavailable") {
      state.mainnetLookup = {
        status: "unavailable",
        message: payload.message,
        result: null,
      };
      render();
      return;
    }

    state.mainnetLookup = {
      status: "success",
      message: `${validation.message} Balance returned from ZecSafe mainnet infrastructure adapter.`,
      result: {
        address: payload.result.address,
        type: validation.type,
        balance: payload.result.balance,
        received: payload.result.received,
        endpoint: payload.source,
        sourceLabel: "ZecSafe backend adapter -> Zcash mainnet RPC",
        checkedAt: new Date().toLocaleTimeString(),
      },
    };
  } catch (error) {
    state.mainnetLookup = {
      status: "error",
      message: `${error.message} Configure a local zcashd or lightwalletd-backed service for production reliability.`,
      result: null,
    };
  }

  render();
}

function updateAddressDraft(address) {
  state.addressInput = address;

  const trimmed = address.trim();
  if (!trimmed) {
    state.mainnetLookup = {
      status: "idle",
      message: "Enter a transparent Zcash mainnet address to read public balance data.",
      result: null,
    };
  } else {
    const classified = classifyZcashAddress(trimmed);
    state.mainnetLookup = {
      status: "idle",
      message: "Address ready to check.",
      result: {
        address: trimmed,
        type: classified.type,
        isDraft: true,
      },
    };
  }

  const message = document.querySelector("#mainnetMessage");
  const result = document.querySelector("#mainnetResult");
  const status = document.querySelector("#mainnetLookupState");

  if (message) message.textContent = state.mainnetLookup.message;
  if (result) result.innerHTML = renderMainnetResult();
  if (status) {
    status.textContent = state.mainnetLookup.status;
    status.className = `lookup-state lookup-state--${state.mainnetLookup.status}`;
  }
}

async function syncViewingKeyBalance(viewingKey, minConfirmations) {
  const classification = classifyViewingKey(viewingKey);

  if (!classification.valid) {
    state.shieldedSync = {
      status: "blocked",
      message: classification.message,
      result: { keyType: classification.type },
    };
    render();
    return;
  }

  state.shieldedSync = {
    status: "loading",
    message: "Sending the viewing key to the local ZecSafe server for read-only sync...",
    result: null,
  };
  render();

  try {
    const response = await fetch("/api/viewing-key-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        viewingKey: viewingKey.trim(),
        minConfirmations,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message ?? `Sync failed with HTTP ${response.status}`);
    }

    state.shieldedSync = {
      status: payload.status,
      message: payload.message,
      result: {
        keyType: payload.keyType,
        balance: payload.balance ?? null,
        source: payload.source ?? null,
        docsLink: payload.docsLink ?? null,
        pools: payload.result?.pools ?? null,
        requiredEnvironment: payload.requiredEnvironment ?? null,
        commandExample: payload.commandExample ?? null,
      },
    };
  } catch (error) {
    state.shieldedSync = {
      status: "error",
      message: `${error.message} Run the local Node server with zcashd RPC configuration for this phase.`,
      result: null,
    };
  }

  render();
}

async function checkTransactionProof(txid) {
  const trimmed = txid.trim().toLowerCase();
  state.transactionProof = {
    ...state.transactionProof,
    txid: trimmed,
    status: "loading",
    message: "Checking transaction proof on Zcash mainnet...",
  };
  render();

  try {
    const response = await fetch("/api/transaction-proof", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txid: trimmed }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.message ?? `Proof check failed with HTTP ${response.status}`);
    }

    if (payload.status === "unavailable") {
      state.transactionProof = {
        txid: trimmed,
        status: "unavailable",
        message: payload.message,
        result: null,
        linkedProposalId: null,
      };
      render();
      return;
    }

    state.transactionProof = {
      txid: trimmed,
      status: payload.status,
      message: payload.message,
      result: {
        ...payload.result,
        source: payload.source,
        checkedAt: new Date().toLocaleTimeString(),
      },
      linkedProposalId: currentProposal().id,
    };
    state.proposalMainnetProofs[currentProposal().id] = {
      txid: trimmed,
      status: payload.status,
      message: payload.message,
      confirmations: payload.result.confirmations,
      blockHeight: payload.result.height,
      blockhash: payload.result.blockhash,
      checkedAt: new Date().toLocaleTimeString(),
      source: payload.source,
      result: state.transactionProof.result,
    };
    addAuditEvent("Mainnet proof attached", `Tx ${trimmed.slice(0, 10)}... linked to proposal`, "MAINNET");
  } catch (error) {
    state.transactionProof = {
      txid: trimmed,
      status: "error",
      message: error.message,
      result: null,
      linkedProposalId: null,
    };
  }

  render();
}

function vaultStatus() {
  const approvals = approvedCount();
  const required = requiredApprovalCount(currentProposal());
  if (approvals >= required) {
    return {
      label: "Threshold reached",
      description: `${approvals}/${required} verified guardian signatures collected. Ready for FROST signing; broadcast remains disabled in prototype mode.`,
    };
  }

  return {
    label: "Collecting Approvals",
    description: `${required - approvals} more verified guardian signature${required - approvals === 1 ? "" : "s"} needed before this transaction can be signed.`,
  };
}

function proposalApprovalCount(proposal) {
  if (proposal.status === "Draft") return 0;
  return Math.min(verifiedGuardianSignatureCount(proposal), requiredApprovalCount(proposal));
}

function requiredApprovalCount(proposal = currentProposal()) {
  return Number(proposal.amount) > 10 ? state.totalShares : state.threshold;
}

function proposalStatus(proposal) {
  if (proposal.status === "Draft") return "Draft";
  if (state.broadcastStatus === "pending" || state.broadcastStatus === "confirmed") return "Broadcast Disabled";
  if (guardians.some((guardian) => guardian.healthStatus === "Compromised")) return "Needs Approval";
  if (proposalApprovalCount(proposal) >= requiredApprovalCount(proposal)) return "Ready for FROST";
  return "Needs Approval";
}

function statusSlug(status) {
  return status.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function filteredProposals() {
  if (state.proposalFilter === "All") return proposals;
  return proposals.filter((proposal) => proposalStatus(proposal) === state.proposalFilter);
}

function setProposalFilter(filter) {
  if (!proposalFilters.includes(filter)) return;
  state.proposalFilter = filter;
  render();
}

function setProposalBuilder(open, message = state.proposalBuilder.message, status = state.proposalBuilder.status) {
  state.proposalBuilder = {
    ...state.proposalBuilder,
    open,
    step: open ? state.proposalBuilder.step : "details",
    status,
    message,
  };
  render();
}

function proposalReviewStatusClass() {
  return ["error", "success", "loading"].includes(state.proposalBuilder.status)
    ? `proposal-builder__message--${state.proposalBuilder.status}`
    : "";
}

function emptyProposalDraft() {
  return {
    title: "",
    amount: "",
    fee: "",
    recipient: "",
    memo: "",
    expectedTxid: "",
  };
}

function openProposalBuilder(message = "Enter real proposal details, then review the locked security payload before guardians sign.") {
  state.proposalBuilder = {
    open: true,
    step: "details",
    status: "idle",
    message,
    draft: state.proposalBuilder.draft ?? emptyProposalDraft(),
    review: null,
  };
  render();
}

function closeProposalBuilder() {
  state.proposalBuilder = {
    open: false,
    step: "details",
    status: "idle",
    message: "Raise a proposal with amount, recipient, memo, and optional expected mainnet txid.",
    draft: emptyProposalDraft(),
    review: null,
  };
  render();
}

function editProposalDraft() {
  state.proposalBuilder = {
    ...state.proposalBuilder,
    open: true,
    step: "details",
    status: "idle",
    message: "Edit the details, then review the locked security payload again.",
  };
  render();
}

function riskLevelForProposal(amount, recipient, fee) {
  const numericAmount = Number(amount);
  const numericFee = Number(fee ?? 0);
  const classified = classifyZcashAddress(recipient);

  if (numericAmount > 10 || numericFee > 0.02) return "High";
  if (!classified.publiclyReadable || numericAmount >= 1 || numericFee > 0.005) return "Medium";
  return "Low";
}

async function validateProposalInput({ title, amount, recipient, memo, fee, expectedTxid }) {
  const cleanTitle = title.trim();
  const cleanRecipient = recipient.trim();
  const cleanMemo = memo.trim();
  const cleanTxid = expectedTxid.trim().toLowerCase();
  const numericAmount = Number(amount);
  const numericFee = fee === "" ? null : Number(fee);

  if (!cleanTitle) return { valid: false, message: "Enter a proposal title." };
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) return { valid: false, message: "Enter an amount greater than 0 ZEC." };
  if (numericFee !== null && (!Number.isFinite(numericFee) || numericFee < 0)) return { valid: false, message: "Fee must be zero or a positive ZEC amount." };
  if (!cleanRecipient) return { valid: false, message: "Enter a Zcash mainnet recipient address." };
  if (cleanTxid && !/^[0-9a-f]{64}$/.test(cleanTxid)) return { valid: false, message: "Expected txid must be a 64-character hexadecimal Zcash transaction ID." };

  const classified = classifyZcashAddress(cleanRecipient);
  if (classified.publiclyReadable) {
    const validation = await validateTransparentAddress(cleanRecipient);
    if (!validation.valid) return { valid: false, message: validation.message };
  } else if (!cleanRecipient.startsWith("u1") && !cleanRecipient.startsWith("zs1") && !cleanRecipient.startsWith("zc")) {
    return { valid: false, message: "Use a Zcash mainnet transparent, unified, or shielded recipient address." };
  }

  return {
    valid: true,
    proposal: {
      title: cleanTitle,
      amount: numericAmount,
      recipient: cleanRecipient,
      memo: cleanMemo,
      fee: numericFee,
      expectedTxid: cleanTxid,
      riskLevel: riskLevelForProposal(numericAmount, cleanRecipient, numericFee),
    },
  };
}

async function raiseProposalFromForm(form) {
  const formData = new FormData(form);
  const draft = {
    title: String(formData.get("title") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    recipient: String(formData.get("recipient") ?? ""),
    memo: String(formData.get("memo") ?? ""),
    fee: String(formData.get("fee") ?? ""),
    expectedTxid: String(formData.get("expectedTxid") ?? ""),
  };
  state.proposalBuilder = {
    ...state.proposalBuilder,
    open: true,
    status: "loading",
    message: "Validating proposal details and preparing payload hash...",
    draft,
  };
  render();

  const validation = await validateProposalInput({
    title: draft.title,
    amount: draft.amount,
    recipient: draft.recipient,
    memo: draft.memo,
    fee: draft.fee,
    expectedTxid: draft.expectedTxid,
  });

  if (!validation.valid) {
    state.proposalBuilder = {
      ...state.proposalBuilder,
      open: true,
      step: "details",
      status: "error",
      message: validation.message,
      draft,
    };
    render();
    return;
  }

  const nextId = state.proposalBuilder.review?.proposal?.id ?? `prop-${Date.now().toString(36)}`;
  const reviewProposal = {
    id: nextId,
    title: validation.proposal.title,
    amount: validation.proposal.amount,
    recipient: validation.proposal.recipient,
    memo: validation.proposal.memo,
    fee: validation.proposal.fee,
    expectedTxid: validation.proposal.expectedTxid,
    status: "Needs Approval",
    created: new Date().toLocaleString(),
    riskLevel: validation.proposal.riskLevel,
    usesLiveApprovalState: true,
  };
  const payload = canonicalProposalPayload(reviewProposal);
  const payloadJson = JSON.stringify(payload);
  const hash = await sha256HexString(payloadJson);

  state.proposalBuilder = {
    ...state.proposalBuilder,
    open: true,
    step: "review",
    status: "success",
    message: "Review locked proposal details before guardian signatures. If anything is wrong, edit before creating the proposal.",
    draft,
    review: {
      proposal: reviewProposal,
      payload,
      payloadJson,
      hash,
    },
  };
  render();
}

async function confirmReviewedProposal() {
  const review = state.proposalBuilder.review;
  if (!review?.proposal) {
    state.proposalBuilder = {
      ...state.proposalBuilder,
      open: true,
      step: "details",
      status: "error",
      message: "Review data is missing. Re-enter the proposal details.",
    };
    render();
    return;
  }

  const nextProposal = review.proposal;
  const existingIndex = proposals.findIndex((proposal) => proposal.id === nextProposal.id);
  if (existingIndex >= 0) {
    proposals.splice(existingIndex, 1, nextProposal);
  } else {
    proposals.unshift(nextProposal);
  }
  state.selectedProposalId = nextProposal.id;
  state.proposalFilter = "All";
  state.guardianProofs[nextProposal.id] = {};
  state.proposalPayloads[nextProposal.id] = {
    payload: review.payload,
    payloadJson: review.payloadJson,
    hash: review.hash,
  };
  if (nextProposal.expectedTxid) {
    state.transactionProof = {
      txid: nextProposal.expectedTxid,
      status: "idle",
      message: "Expected txid loaded from the active proposal. Click Check Proof to attach confirmations.",
      result: null,
      linkedProposalId: null,
    };
  }
  state.proposalBuilder = {
    open: false,
    step: "details",
    status: "success",
    message: "Proposal locked. Guardians can now sign the reviewed payload hash.",
    draft: emptyProposalDraft(),
    review: null,
  };
  persistProposals();
  addAuditEvent("Proposal locked for guardian review", `${nextProposal.title} / hash ${shortHex(review.hash)}`, "CRYPTO");
  render();
}

function truncateRecipient(recipient) {
  if (recipient.length <= 28) return recipient;
  return `${recipient.slice(0, 12)}...${recipient.slice(-10)}`;
}

function proposalEvidenceAttached(proposal) {
  const proof = state.proposalMainnetProofs[proposal.id];
  return proof?.status === "success" && Boolean(proof.result);
}

function proposalMainnetProof(proposal = currentProposal()) {
  return state.proposalMainnetProofs[proposal.id] ?? null;
}

function proposalReadinessCopy(status) {
  if (status === "Ready for FROST") return "FROST signing required before broadcast";
  if (status === "Broadcast Disabled") return "Broadcast disabled &mdash; prototype";
  if (status === "Threshold Reached") return "Threshold reached; prepare for FROST signing";
  if (status === "Needs Approval") return "Waiting for verified guardian signatures";
  return "Draft proposal; not ready for guardian approval";
}

function proposalTimelineFor(proposal) {
  const status = proposalStatus(proposal);
  const approvals = proposalApprovalCount(proposal);

  return guardians.map((guardian, index) => {
    const signatureProof = guardianSignatureRecord(proposal.id, guardian.id);
    const approved = signatureProof?.verified === true;

    return {
      guardian,
      approved,
      action: approved ? "Signed proposal hash" : "Pending",
      time: approved ? signatureProof?.signedAt ?? "This session" : "Pending",
      fingerprint: signatureProof?.signatureFingerprint ?? null,
    };
  });
}

function broadcastButtonLabel() {
  if (state.broadcastStatus === "confirmed") return "Broadcast Confirmed (Simulated)";
  if (state.broadcastStatus === "pending") return "Broadcast Pending (Simulated)";
  return "Broadcast (Simulated)";
}

function simulateBroadcast() {
  if (approvedCount() < state.threshold || state.broadcastStatus !== "idle") return;

  state.broadcastStatus = "pending";
  addAuditEvent("Broadcast pending", "Prototype broadcast simulation started", "SIM");
  render();

  window.setTimeout(() => {
    state.broadcastStatus = "confirmed";
    addAuditEvent("Broadcast confirmed", "Prototype transaction marked confirmed", "SIM");
    render();
  }, 1200);
}

function lostGuardian() {
  return guardians.find((guardian) => guardian.id === state.recovery.lostGuardianId) ?? null;
}

function recoveryApprovers() {
  return guardians.filter((guardian) => guardian.id !== state.recovery.lostGuardianId);
}

function setLostGuardian(id) {
  state.recovery = {
    step: "selected",
    lostGuardianId: id,
    reason: "",
    note: "Owner verified through saved phone number and pre-agreed security phrase.",
    outOfBandConfirmed: false,
    approvals: [],
    broadcastStatus: "idle",
    timelockRemaining: null,
    flagged: false,
  };
  const lost = guardians.find((guardian) => guardian.id === id);
  addAuditEvent("Lost guardian selected", `${lost?.name ?? "Unknown guardian"} selected for recovery`);
  render();
}

function createRecoveryProposal(formData) {
  const lost = lostGuardian();
  if (!lost) return;

  const reason = String(formData.get("recoveryReason") ?? "");
  const note = String(formData.get("recoveryNote") ?? "").trim();
  const outOfBandConfirmed = formData.get("outOfBandConfirmed") === "on";

  if (!reason || !note || !outOfBandConfirmed) {
    state.recovery.step = "selected";
    state.recovery.reason = reason;
    state.recovery.note = note;
    state.recovery.outOfBandConfirmed = outOfBandConfirmed;
    addAuditEvent("Recovery blocked", "Reason, note, and independent confirmation are required");
    render();
    return;
  }

  state.recovery.step = "proposal";
  state.recovery.reason = reason;
  state.recovery.note = note;
  state.recovery.outOfBandConfirmed = outOfBandConfirmed;
  addAuditEvent("Recovery proposal created", `${lost.name} marked lost`);
  addAuditEvent("Recovery fingerprint generated", RECOVERY_NEW_VAULT_FINGERPRINT);
  render();
}

function approveRecovery(id) {
  if (state.recovery.step !== "proposal") return;
  if (id === state.recovery.lostGuardianId) return;
  if (state.recovery.approvals.includes(id)) return;

  state.recovery.approvals.push(id);
  const guardian = guardians.find((item) => item.id === id);
  addAuditEvent("Recovery guardian approved", `${guardian?.name ?? "Guardian"} approved recovery`);

  if (state.recovery.approvals.length >= state.threshold) {
    startRecoveryTimelock();
  }

  render();
}

function guardianById(id) {
  return guardians.find((guardian) => guardian.id === id) ?? null;
}

function setGuardianHealthStatus(id, healthStatus) {
  const guardian = guardianById(id);
  if (!guardian) return;

  guardian.healthStatus = healthStatus;
  guardian.lastChecked = "2026-05-30";

  if (healthStatus === "Lost" || healthStatus === "Compromised") {
    guardian.status = "pending";
  }

  addAuditEvent("Guardian health updated", `${guardian.name}: ${healthStatus}`, "SIM");
  render();
}

function openGuardianHealthCheck(id) {
  const guardian = guardianById(id);
  if (!guardian) return;

  guardian.healthStatus = "Needs Check";
  state.guardianHealthCheck = {
    guardianId: id,
    checks: {
      deviceAccessible: false,
      sharePresent: false,
      commitmentReady: false,
    },
  };
  addAuditEvent("Guardian health check started", guardian.name, "SIM");
  render();
}

function updateGuardianHealthCheck(key, checked) {
  if (!Object.prototype.hasOwnProperty.call(state.guardianHealthCheck.checks, key)) return;

  state.guardianHealthCheck.checks[key] = checked;
  const guardian = guardianById(state.guardianHealthCheck.guardianId);
  if (!guardian) return;

  const allChecked = Object.values(state.guardianHealthCheck.checks).every(Boolean);
  guardian.healthStatus = allChecked ? "Healthy" : "Needs Check";
  guardian.lastChecked = "2026-05-30";
  render();
}

function closeGuardianHealthCheck() {
  const guardian = guardianById(state.guardianHealthCheck.guardianId);
  if (guardian) {
    const allChecked = Object.values(state.guardianHealthCheck.checks).every(Boolean);
    guardian.healthStatus = allChecked ? "Healthy" : "Needs Check";
    guardian.lastChecked = "2026-05-30";
    addAuditEvent("Guardian health check completed", `${guardian.name}: ${guardian.healthStatus}`, "SIM");
  }

  state.guardianHealthCheck = {
    guardianId: null,
    checks: {
      deviceAccessible: false,
      sharePresent: false,
      commitmentReady: false,
    },
  };
  render();
}

async function checkMainnetStatus() {
  state.mainnetStatus = {
    status: "loading",
    message: "Checking Zcash mainnet chain status...",
    result: null,
  };
  render();

  try {
    const response = await fetch("/api/mainnet-status");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message ?? `Status check failed with HTTP ${response.status}`);
    }

    if (payload.status === "unavailable") {
      state.mainnetStatus = {
        status: "unavailable",
        message: payload.message,
        result: null,
      };
      render();
      return;
    }

    state.mainnetStatus = {
      status: payload.status,
      message: payload.message,
      result: {
        ...payload.result,
        source: payload.source,
        checkedAt: new Date().toLocaleTimeString(),
      },
    };
    addAuditEvent("Mainnet chain status refreshed", `${payload.result.blocks} blocks, ${payload.result.mempoolSize} mempool transactions`, "MAINNET");
  } catch (error) {
    state.mainnetStatus = {
      status: "error",
      message: error.message,
      result: null,
    };
  }

  render();
}

async function runFrostDemo() {
  const proposal = currentProposal();
  const payloadRecord = await proposalPayloadRecord(proposal);
  const signingMessage = `ZecSafe proposal payload hash: ${payloadRecord.hash}`;

  state.frostDemo = {
    status: "loading",
    message: `Checking local Zcash FROST tooling against proposal hash ${payloadRecord.hash.slice(0, 12)}...`,
    result: null,
  };
  render();

  try {
    const response = await fetch("/api/frost-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        proposalId: proposal.id,
        proposalPayload: payloadRecord.payload,
        proposalPayloadHash: payloadRecord.hash,
        message: signingMessage,
      }),
    });
    const payload = await response.json();

    if (!response.ok && !payload.fallback) {
      throw new Error(payload.error ?? `FROST endpoint returned HTTP ${response.status}`);
    }

    state.frostDemo = {
      status: payload.verified ? "success" : payload.fallback ? "blocked" : "error",
      message: payload.message ?? "FROST tooling response received.",
      result: {
        ...payload,
        proposalId: payload.proposalId ?? proposal.id,
        proposalPayload: payload.proposalPayload ?? payloadRecord.payload,
        proposalPayloadHash: payload.proposalPayloadHash ?? payloadRecord.hash,
        signedMessage: payload.signedMessage ?? signingMessage,
      },
    };
    frostSignatureVerified = payload.verified === true;
    writeFrostVerifiedSession(frostSignatureVerified);

    addAuditEvent(
      payload.verified ? "FROST Live Demo verified" : "FROST tooling unavailable",
      payload.verified ? "Threshold signature output returned by local tooling" : "Official FROST tooling must be configured locally",
      "FROST",
    );
  } catch (error) {
    state.frostDemo = {
      status: "error",
      message: error.message,
      result: null,
    };
  }

  render();
}

async function generateProofBundle() {
  state.proofBundle = {
    status: "loading",
    message: "Generating combined mainnet + transaction + FROST + guardian proof bundle...",
    result: null,
  };
  render();

  try {
    if (!state.transactionProof.result && state.transactionProof.txid) {
      await checkTransactionProof(state.transactionProof.txid);
    }

    const response = await fetch("/api/proof-bundle");
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.message ?? `Proof bundle failed with HTTP ${response.status}`);
    }
    const proposal = currentProposal();
    const payloadRecord = await proposalPayloadRecord(proposal);
    const guardianSignatures = guardianSignatureProofsFor(proposal);
    const attachedProof = proposalMainnetProof(proposal);
    const clientTransactionProof = attachedProof?.result
      ? {
          txid: attachedProof.txid,
          linkedProposalId: proposal.id,
          status: attachedProof.status,
          confirmations: attachedProof.confirmations,
          blockHeight: attachedProof.blockHeight,
          blockhash: attachedProof.blockhash,
          checkedAt: attachedProof.checkedAt,
          source: attachedProof.source,
        }
      : null;
    const clientEvidence = {
      projectName: "ZecSafe",
      network: "zcash-mainnet",
      activeProposal: payloadRecord.payload,
      activeProposalPayloadHash: payloadRecord.hash,
      transactionProof: clientTransactionProof,
      guardianSignatureProofs: guardianSignatures,
      verifiedGuardianSignatures: guardianSignatures.filter((proof) => proof.verified).length,
      requiredGuardianSignatures: requiredApprovalCount(proposal),
      policyEnforced: policyReadinessFor(proposal),
      generatedInBrowserAt: new Date().toISOString(),
      securityLimitations: {
        broadcast: "External/manual in this prototype.",
        custody: "ZecSafe does not custody funds or request seed phrases/spending keys.",
        guardianSignatures: "Browser-side acknowledgement signatures are not Zcash spend signatures.",
        productionPath: "Mainnet broadcast requires production Zcash transaction construction and FROST signing.",
      },
      note:
        "Guardian signatures are real browser-side ECDSA acknowledgements over the stable proposal payload hash. They are not Zcash spend signatures. Browser-attached transaction proof is included when public proof-bundle RPC lookup is unavailable.",
    };

    state.proofBundle = {
      status: payload.status === "partial" ? "partial" : "success",
      message:
        payload.status === "partial"
          ? "Proof bundle generated with partial evidence. Some public RPC calls were unavailable."
          : "Proof bundle generated successfully.",
      result: {
        ...payload,
        clientEvidence,
      },
    };
    addAuditEvent(
      payload.status === "partial" ? "Partial proof bundle generated" : "Proof bundle generated",
      payload.status === "partial"
        ? "Available mainnet, transaction, and FROST evidence bundled with RPC caveats"
        : "Mainnet, transaction, and FROST evidence bundled",
      "MAINNET",
    );
  } catch (error) {
    state.proofBundle = {
      status: "error",
      message: error.message,
      result: null,
    };
  }

  render();
}

function policyReadinessFor(proposal = currentProposal()) {
  const verifiedSignatures = verifiedGuardianSignatureCount(proposal);
  const isLargePayment = Number(proposal.amount) > 10;
  const hasCompromisedGuardian = guardians.some((guardian) => guardian.healthStatus === "Compromised");
  const requiredSignatures = isLargePayment ? state.totalShares : state.threshold;
  const thresholdMet = verifiedSignatures >= requiredSignatures;

  return {
    operation: isLargePayment ? "Large payment (>10 ZEC)" : "Normal payment",
    requiredSignatures,
    verifiedSignatures,
    thresholdMet,
    blocked: hasCompromisedGuardian,
    broadcastDisabled: true,
    decision: hasCompromisedGuardian
      ? "Blocked because a guardian is marked compromised."
      : thresholdMet
        ? "Ready for FROST signing; broadcast remains disabled in prototype."
        : `${requiredSignatures - verifiedSignatures} more verified guardian signature${requiredSignatures - verifiedSignatures === 1 ? "" : "s"} required.`,
  };
}

function missionSteps() {
  const proposal = currentProposal();
  const requiredSignatures = requiredApprovalCount(proposal);
  const verifiedSignatures = verifiedGuardianSignatureCount(proposal);
  const attachedProof = proposalMainnetProof(proposal);
  const frostVerified = state.frostDemo.result?.verified === true;
  const proofBundleReady = Boolean(state.proofBundle.result);

  return [
    {
      id: "proposal",
      title: "Create proposal",
      detail: `${proposal.title} / ${proposal.amount.toFixed(8)} ZEC`,
      complete: Boolean(proposal),
      action: "proposal",
      actionLabel: "Raise Proposal",
    },
    {
      id: "signatures",
      title: "Collect guardian signatures",
      detail: `${verifiedSignatures}/${requiredSignatures} verified local signatures`,
      complete: verifiedSignatures >= requiredSignatures,
      action: "sign-next",
      actionLabel: verifiedSignatures >= requiredSignatures ? "Review Signatures" : "Sign Next Guardian",
    },
    {
      id: "tx-proof",
      title: "Verify mainnet tx",
      detail: attachedProof?.result
        ? `${attachedProof.confirmations ?? "0"} confirmations / ${attachedProof.source ?? "mainnet"}`
        : proposal.expectedTxid
          ? `Expected txid ${shortHex(proposal.expectedTxid)} ready`
          : "Paste or load a txid to attach proof",
      complete: attachedProof?.status === "success" && Boolean(attachedProof.result),
      action: "verify-tx",
      actionLabel: "Verify Tx Proof",
    },
    {
      id: "frost",
      title: "Run local FROST proof",
      detail: frostVerified ? "Threshold signature proof verified" : "Bind local FROST output to proposal hash",
      complete: frostVerified,
      action: "run-frost",
      actionLabel: "Run FROST Proof",
    },
    {
      id: "bundle",
      title: "Export judge evidence",
      detail: proofBundleReady ? "Proof bundle ready to download" : "Generate JSON evidence package",
      complete: proofBundleReady,
      action: "proof-bundle",
      actionLabel: proofBundleReady ? "Download Proof Bundle" : "Generate Proof Bundle",
    },
  ];
}

function nextMissionStep() {
  return missionSteps().find((step) => !step.complete) ?? missionSteps().at(-1);
}

function finalMainnetProofReadiness() {
  const proposal = currentProposal();
  const payloadRecord = state.proposalPayloads[proposal.id];
  const attachedProof = proposalMainnetProof(proposal);
  const guardianSignatures = guardianSignatureProofsFor(proposal).filter((proof) => proof.verified);
  const requiredSignatures = requiredApprovalCount(proposal);
  const txConfirmations = Number(attachedProof?.confirmations ?? 0);
  const items = [
    {
      id: "proposal",
      title: "Proposal created and selected",
      detail: proposal ? `${proposal.title} / ${proposal.amount.toFixed(8)} ZEC` : "Create a proposal first",
      complete: Boolean(proposal),
      action: "proposal",
      actionLabel: "Create Secure Proposal",
      category: "App workflow",
    },
    {
      id: "hash",
      title: "Proposal hash locked",
      detail: payloadRecord?.hash ? shortHex(payloadRecord.hash) : "Review gate must lock the payload hash",
      complete: Boolean(payloadRecord?.hash),
      action: "proposal",
      actionLabel: "Open Proposal Center",
      category: "Cryptographic local proof",
    },
    {
      id: "guardians",
      title: "Guardian signatures verified",
      detail: `${guardianSignatures.length}/${requiredSignatures} local signatures verified`,
      complete: guardianSignatures.length >= requiredSignatures,
      action: "sign-required",
      actionLabel: guardianSignatures.length >= requiredSignatures ? "Review Signatures" : "Sign Required Guardians",
      category: "Cryptographic local proof",
    },
    {
      id: "mainnet",
      title: "Live Zcash mainnet status checked",
      detail: state.mainnetStatus.status === "success" ? `Block ${state.mainnetStatus.result?.blocks ?? "unknown"}` : "Check chain status before the demo",
      complete: state.mainnetStatus.status === "success",
      action: "mainnet-status",
      actionLabel: "Check Mainnet Status",
      category: "Real mainnet evidence",
    },
    {
      id: "address",
      title: "Transparent address balance checked",
      detail: state.mainnetLookup.status === "success" ? `${state.mainnetLookup.result?.balanceZec ?? state.mainnetLookup.result?.balance ?? "Balance"} ZEC` : "Check the demo wallet or sample transparent address",
      complete: state.mainnetLookup.status === "success",
      action: "check-address",
      actionLabel: "Check Address Balance",
      category: "Real mainnet evidence",
    },
    {
      id: "txid",
      title: "Tiny ZEC txid attached",
      detail: attachedProof?.txid ? shortHex(attachedProof.txid) : "Broadcast externally, then paste the real mainnet txid",
      complete: Boolean(attachedProof?.txid),
      action: "verify-tx",
      actionLabel: "Verify Tx Proof",
      category: "Real mainnet evidence",
    },
    {
      id: "confirmations",
      title: "Confirmation proof verified",
      detail: txConfirmations > 0 ? `${txConfirmations} confirmations on Zcash mainnet` : "Wait for confirmation, then check proof again",
      complete: txConfirmations > 0,
      action: "verify-tx",
      actionLabel: "Refresh Tx Proof",
      category: "Real mainnet evidence",
    },
    {
      id: "frost",
      title: "Local FROST proof verified",
      detail: state.frostDemo.result?.verified === true ? "Signature Verified" : "Run local FROST demo against the active proposal hash",
      complete: state.frostDemo.result?.verified === true,
      action: "run-frost",
      actionLabel: "Run FROST Proof",
      category: "Local threshold-signing proof",
    },
    {
      id: "bundle",
      title: "Downloadable proof bundle ready",
      detail: state.proofBundle.result ? "JSON export is ready for judges" : "Generate the final evidence JSON",
      complete: Boolean(state.proofBundle.result),
      action: "proof-bundle",
      actionLabel: state.proofBundle.result ? "Download Proof Bundle" : "Generate Proof Bundle",
      category: "Judge-verifiable evidence",
    },
  ];
  const completed = items.filter((item) => item.complete).length;
  const score = Math.round((completed / items.length) * 100);
  const status =
    score === 100
      ? "Final demo ready"
      : score >= 75
        ? "Almost ready"
        : score >= 45
          ? "Evidence build in progress"
          : "Needs mainnet proof";

  return { proposal, payloadRecord, attachedProof, guardianSignatures, requiredSignatures, items, completed, score, status };
}

function firstUnsignedGuardian(proposal = currentProposal()) {
  return guardians.find((guardian) => {
    const proof = guardianSignatureRecord(proposal.id, guardian.id);
    return proof?.verified !== true && !["Lost", "Compromised"].includes(guardian.healthStatus);
  });
}

async function signRequiredGuardiansForFinalRun() {
  const proposal = currentProposal();
  let signatures = verifiedGuardianSignatureCount(proposal);
  const requiredSignatures = requiredApprovalCount(proposal);

  while (signatures < requiredSignatures) {
    const guardian = firstUnsignedGuardian(proposal);
    if (!guardian) break;
    await signGuardianApproval(guardian.id);
    signatures = verifiedGuardianSignatureCount(proposal);
  }

  window.location.hash = "#mainnet-proof-run";
  render();
}

async function runFinalProofAction(action) {
  if (action === "sign-required") {
    await signRequiredGuardiansForFinalRun();
    return;
  }

  if (action === "mainnet-status") {
    await checkMainnetStatus();
    window.location.hash = "#mainnet-proof-run";
    return;
  }

  if (action === "check-address") {
    await lookupTransparentAddress(state.addressInput || DEFAULT_TRANSPARENT_ADDRESS);
    window.location.hash = "#mainnet-proof-run";
    return;
  }

  await runMissionAction(action);
}

async function runMissionAction(action) {
  const proposal = currentProposal();

  if (action === "proposal") {
    window.location.hash = "#proposals";
    openProposalBuilder("Create a real proposal, then ZecSafe will lock the payload hash for signatures.");
    return;
  }

  if (action === "sign-next") {
    const guardian = firstUnsignedGuardian(proposal);
    if (!guardian) {
      window.location.hash = "#proposals";
      render();
      return;
    }

    await signGuardianApproval(guardian.id);
    window.location.hash = "#proposals";
    return;
  }

  if (action === "verify-tx") {
    const txid = proposal.expectedTxid || state.transactionProof.txid;
    window.location.hash = "#transaction-proof";
    if (txid) {
      state.transactionProof.txid = txid;
      await checkTransactionProof(txid);
    } else {
      state.transactionProof = {
        ...state.transactionProof,
        status: "error",
        message: "Add an expected txid to the proposal or paste a txid in Transaction Proof.",
      };
      render();
    }
    return;
  }

  if (action === "run-frost") {
    window.location.hash = "#frost-integration";
    await runFrostDemo();
    return;
  }

  if (action === "proof-bundle") {
    if (state.proofBundle.result) {
      downloadProofBundle();
      return;
    }

    window.location.hash = "#evidence-center";
    await generateProofBundle();
    return;
  }

  if (action === "recovery") {
    window.location.hash = "#recovery";
    render();
  }
}

function downloadProofBundle() {
  const bundle = state.proofBundle.result;
  if (!bundle) return;

  const json = proofBundleJson();
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `zecsafe-proof-bundle-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  addAuditEvent("Proof bundle downloaded", "Judge-ready JSON evidence package exported", "CRYPTO");
  render();
}

function proofBundleJson() {
  return JSON.stringify(state.proofBundle.result ?? {}, null, 2);
}

async function copyProofBundleJson() {
  if (!state.proofBundle.result) return;

  try {
    await navigator.clipboard.writeText(proofBundleJson());
    addAuditEvent("Proof bundle JSON copied", "Judge-ready evidence JSON copied to clipboard", "CRYPTO");
  } catch {
    addAuditEvent("Proof bundle copy unavailable", "Browser clipboard permission blocked copy action", "CRYPTO");
  }

  render();
}

function startRecoveryTimelock() {
  if (state.recovery.step === "timelock" || state.recovery.step === "threshold") return;

  state.recovery.step = "timelock";
  state.recovery.timelockRemaining = RECOVERY_DEMO_TIMELOCK_SECONDS;
  addAuditEvent("Recovery timelock started", `${RECOVERY_DEMO_TIMELOCK_SECONDS}s prototype delay before FROST readiness`);
  render();

  const tick = window.setInterval(() => {
    if (state.recovery.step !== "timelock") {
      window.clearInterval(tick);
      return;
    }

    state.recovery.timelockRemaining -= 1;
    if (state.recovery.timelockRemaining <= 0) {
      window.clearInterval(tick);
      state.recovery.step = "threshold";
      state.recovery.timelockRemaining = 0;
      addAuditEvent("Recovery ready for FROST signing", "Timelock completed");
    }
    render();
  }, 1000);
}

function flagRecoverySuspicious() {
  state.recovery.flagged = true;
  state.recovery.step = state.recovery.step === "select" ? "select" : "flagged";
  state.recovery.broadcastStatus = "idle";
  addAuditEvent("Suspicious recovery flagged", "Recovery proposal requires manual review");
  render();
}

function resetRecovery() {
  state.recovery = {
    step: "select",
    lostGuardianId: "",
    reason: "",
    note: "",
    outOfBandConfirmed: false,
    approvals: [],
    broadcastStatus: "idle",
    timelockRemaining: null,
    flagged: false,
  };
  addAuditEvent("Recovery reset", "Recovery workflow returned to selection");
  render();
}

function simulateRecoveryBroadcast() {
  if (state.recovery.step !== "threshold" || state.recovery.broadcastStatus !== "idle") return;

  state.recovery.broadcastStatus = "pending";
  addAuditEvent("Recovery broadcast pending", "Prototype recovery migration simulation started");
  render();

  window.setTimeout(() => {
    state.recovery.broadcastStatus = "confirmed";
    addAuditEvent("Recovery broadcast confirmed", "Prototype recovery migration marked confirmed");
    render();
  }, 1200);
}

function renderGuardian(guardian) {
  const proof = guardianSignatureRecord(currentProposal().id, guardian.id);
  const approved = proof?.verified === true;
  const healthSlug = statusSlug(guardian.healthStatus);
  return `
    <article class="guardian guardian-card">
      <div class="guardian__identity">
        <span class="guardian__mark guardian__mark--${healthSlug} ${approved ? "guardian__mark--approved" : ""}"></span>
        <div>
          <h3>${escapeHtml(guardian.name)}</h3>
          <p>${escapeHtml(guardian.deviceLabel)}</p>
        </div>
      </div>
      <div class="guardian-card__badges">
        <span class="role-badge role-badge--${guardian.role.toLowerCase()}">${escapeHtml(guardian.role)}</span>
        <span class="health-status health-status--${healthSlug}">
          <span class="health-status__dot health-status__dot--${healthSlug}"></span>
          ${escapeHtml(guardian.healthStatus)}
        </span>
      </div>
      <dl>
        <div>
          <dt>Last checked</dt>
          <dd>${escapeHtml(guardian.lastChecked)}</dd>
        </div>
        <div>
          <dt>Last active</dt>
          <dd>${escapeHtml(guardian.lastActive)}</dd>
        </div>
        <div>
          <dt>Local public key</dt>
          <dd>${proof?.publicKeyFingerprint ? escapeHtml(proof.publicKeyFingerprint) : "Generated on first signature"}</dd>
        </div>
        <div>
          <dt>Signature proof</dt>
          <dd>${proof?.verified ? `Verified ${escapeHtml(proof.signatureFingerprint)}` : "Not signed for active proposal"}</dd>
        </div>
      </dl>
      ${
        approved
          ? `<p class="approval-copy">Local signature verified. In production, this acknowledgement step would be paired with a FROST partial signature from the guardian's key share.</p>`
          : ""
      }
      <div class="guardian-card__actions">
        <button class="icon-button" data-guardian-health="${guardian.id}">Run Guardian Health Check</button>
        <button class="secondary-action" data-guardian-lost="${guardian.id}" ${guardian.healthStatus === "Lost" ? "disabled" : ""}>Mark as Lost</button>
        <button class="secondary-action danger-action" data-guardian-compromised="${guardian.id}" ${guardian.healthStatus === "Compromised" ? "disabled" : ""}>Mark as Compromised</button>
        <button class="icon-button ${approved ? "icon-button--muted" : ""}" data-guardian="${guardian.id}" ${["Lost", "Compromised"].includes(guardian.healthStatus) ? "disabled" : ""}>
          ${approved ? "Verified Signature Recorded" : "Review & Sign Proposal Hash"}
        </button>
      </div>
    </article>
  `;
}

function renderGuardianModel() {
  return `
    <div class="guardian-model" aria-label="2-of-3 guardian model">
      <div class="guardian-model__equation">
        <span>Alice Laptop</span>
        <strong>+</strong>
        <span>Alice Phone</span>
        <strong>+</strong>
        <span>Recovery Contact</span>
        <strong>=</strong>
        <em>any 2 of 3 required to approve a spend</em>
      </div>
      <p>Guardian shares stay local. ZecSafe never transmits key material.</p>
    </div>
  `;
}

function renderGuardianHealthCheckModal() {
  const guardian = guardianById(state.guardianHealthCheck.guardianId);
  if (!guardian) return "";

  const checks = state.guardianHealthCheck.checks;
  const allChecked = Object.values(checks).every(Boolean);

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="health-modal" role="dialog" aria-modal="true" aria-labelledby="healthModalTitle">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Guardian health check</p>
            <h2 id="healthModalTitle">${escapeHtml(guardian.name)}</h2>
          </div>
          <span>${allChecked ? "Healthy" : "Needs Check"}</span>
        </div>
        <p class="health-modal__copy">Confirm this guardian can still participate before relying on it for threshold approval.</p>
        <div class="health-checklist">
          <label>
            <input type="checkbox" data-health-check="deviceAccessible" ${checks.deviceAccessible ? "checked" : ""} />
            <span>Device is accessible</span>
          </label>
          <label>
            <input type="checkbox" data-health-check="sharePresent" ${checks.sharePresent ? "checked" : ""} />
            <span>Key share file is present</span>
          </label>
          <label>
            <input type="checkbox" data-health-check="commitmentReady" ${checks.commitmentReady ? "checked" : ""} />
            <span>Guardian can produce a test commitment</span>
          </label>
        </div>
        <div class="status-actions">
          <button class="primary-action" id="completeGuardianHealthCheck">Complete Health Check</button>
          <button class="secondary-action" id="closeGuardianHealthCheck">Close</button>
        </div>
      </section>
    </div>
  `;
}

function renderProposalFilter(filter) {
  const active = filter === state.proposalFilter;
  const count = filter === "All" ? proposals.length : proposals.filter((proposal) => proposalStatus(proposal) === filter).length;
  return `
    <button class="proposal-filter ${active ? "proposal-filter--active" : ""}" data-proposal-filter="${escapeHtml(filter)}">
      <span>${escapeHtml(filter)}</span>
      <strong>${count}</strong>
    </button>
  `;
}

function renderProposalTimeline(proposal) {
  return proposalTimelineFor(proposal)
    .map(
      (item) => `
        <li class="proposal-timeline__item ${item.approved ? "proposal-timeline__item--approved" : ""}">
          <span class="proposal-timeline__dot"></span>
          <div>
            <strong>${escapeHtml(item.guardian.name)}</strong>
            <p>
              ${escapeHtml(item.action)}
              <span>${escapeHtml(item.time)}</span>
              ${item.fingerprint ? `<span>sig ${escapeHtml(item.fingerprint)}</span>` : ""}
            </p>
          </div>
        </li>
      `,
    )
    .join("");
}

function renderProposalCard(proposal) {
  const active = proposal.id === state.selectedProposalId;
  const status = proposalStatus(proposal);
  const approvals = proposalApprovalCount(proposal);
  const requiredApprovals = requiredApprovalCount(proposal);
  const progress = Math.min((approvals / requiredApprovals) * 100, 100);
  const evidenceAttached = proposalEvidenceAttached(proposal);
  const attachedProof = proposalMainnetProof(proposal);
  const statusClass = statusSlug(status);
  const payloadRecord = state.proposalPayloads[proposal.id];
  const recipientFingerprint = truncateRecipient(proposal.recipient).replace("...", "-");
  const signatureProofs = guardianSignatureProofsFor(proposal);
  const verifiedSignatureCount = signatureProofs.filter((proof) => proof.verified).length;

  return `
    <article class="proposal-card ${active ? "proposal-card--active" : ""}" data-proposal-card="${proposal.id}">
      <div class="proposal-card__header">
        <div>
          <p class="eyebrow">Proposal Center</p>
          <h3>${escapeHtml(proposal.title)}</h3>
        </div>
        <div class="proposal-card__badges">
          <span class="risk-badge risk-badge--${proposal.riskLevel.toLowerCase()}">${escapeHtml(proposal.riskLevel)}</span>
          <span class="proposal-status proposal-status--${statusClass}">${escapeHtml(status)}</span>
        </div>
      </div>

      <div class="proposal-card__body">
        <dl class="proposal-facts">
          <div>
            <dt>Amount</dt>
            <dd>${proposal.amount.toFixed(2)} ZEC</dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd>
              <span class="proposal-recipient" title="${escapeHtml(proposal.recipient)}">${escapeHtml(truncateRecipient(proposal.recipient))}</span>
              <button class="copy-recipient" type="button" data-copy-recipient="${escapeHtml(proposal.recipient)}" aria-label="Copy recipient address">Copy</button>
            </dd>
          </div>
          ${
            proposal.memo
              ? `<div>
                  <dt>Memo</dt>
                  <dd>${escapeHtml(proposal.memo)}</dd>
                </div>`
              : ""
          }
          ${
            proposal.fee !== null && proposal.fee !== undefined
              ? `<div>
                  <dt>Expected fee</dt>
                  <dd>${Number(proposal.fee).toFixed(8)} ZEC</dd>
                </div>`
              : ""
          }
          ${
            proposal.expectedTxid
              ? `<div>
                  <dt>Expected txid</dt>
                  <dd>${escapeHtml(shortHex(proposal.expectedTxid))}</dd>
                </div>`
              : ""
          }
        </dl>

        <div class="proposal-progress" aria-label="${approvals} of ${requiredApprovals} required verified signatures">
          <div class="proposal-progress__label">
            <strong>${approvals} of ${requiredApprovals} verified guardian signatures</strong>
            <span>${escapeHtml(status)}</span>
          </div>
          <div class="proposal-progress__track">
            <span style="width: ${progress}%"></span>
          </div>
        </div>

        <div class="proposal-timeline">
          <p>Guardian approval timeline</p>
          <ol>
            ${renderProposalTimeline(proposal)}
          </ol>
        </div>
      </div>

      <dl class="proposal-integrity">
        <div>
          <dt>Proposal hash</dt>
          <dd>${payloadRecord?.hash ? escapeHtml(shortHex(payloadRecord.hash)) : "Calculating..."}</dd>
        </div>
        <div>
          <dt>Recipient fingerprint</dt>
          <dd>${escapeHtml(recipientFingerprint)}</dd>
        </div>
        <div>
          <dt>Amount locked</dt>
          <dd>${proposal.amount.toFixed(2)} ZEC</dd>
        </div>
        <div>
          <dt>Memo locked</dt>
          <dd>${escapeHtml(proposal.memo || "No memo")}</dd>
        </div>
        <div>
          <dt>Fee locked</dt>
          <dd>${proposal.fee !== null && proposal.fee !== undefined ? `${Number(proposal.fee).toFixed(8)} ZEC` : "Not provided"}</dd>
        </div>
        <div>
          <dt>Mainnet proof</dt>
          <dd>${evidenceAttached ? `${shortHex(attachedProof.txid)} / ${attachedProof.confirmations} confs` : "Not attached"}</dd>
        </div>
        <div>
          <dt>Signing requirement</dt>
          <dd>FROST signing required</dd>
        </div>
      </dl>

      <div class="guardian-signature-proof">
        <div>
          <p class="eyebrow">Cryptographic guardian acknowledgement</p>
          <h4>${verifiedSignatureCount}/${requiredApprovals} verified local signatures</h4>
          <p>Each approval signs the stable proposal payload hash with a browser-generated guardian key. This proves acknowledgement without moving funds or exposing Zcash spending keys.</p>
        </div>
        <ol>
          ${guardians
            .map((guardian) => {
              const proof = guardianSignatureRecord(proposal.id, guardian.id);
              return `
                <li class="${proof?.verified ? "guardian-signature-proof__item--verified" : ""}">
                  <strong>${escapeHtml(guardian.name)}</strong>
                  <span>${proof?.verified ? "Verified" : "Not signed"}</span>
                  <code>${proof?.publicKeyFingerprint ? escapeHtml(proof.publicKeyFingerprint) : "No local proof"}</code>
                </li>
              `;
            })
            .join("")}
        </ol>
      </div>

      <div class="proposal-card__evidence">
        ${
          evidenceAttached
            ? `<a class="mainnet-evidence-badge" href="#transaction-proof">Mainnet evidence attached</a>`
            : `<span class="mainnet-evidence-badge mainnet-evidence-badge--empty">No mainnet evidence attached</span>`
        }
        <span class="proposal-readiness proposal-readiness--${statusClass}">${proposalReadinessCopy(status)}</span>
      </div>

      <footer class="proposal-card__footer">
        ${PROPOSAL_SAFETY_NOTE}
      </footer>
    </article>
  `;
}

function renderRaiseProposalForm() {
  const draft = state.proposalBuilder.draft;

  if (!state.proposalBuilder.open) {
    return `
      <div class="proposal-builder proposal-builder--closed">
        <div>
          <p class="eyebrow">Secure transfer room</p>
          <h3>Create a proposal from real transaction details</h3>
          <p>Enter the recipient, amount, memo, fee, and optional txid. ZecSafe will route you through a review gate before locking the payload hash for guardian signatures.</p>
        </div>
        <button class="primary-action" id="openProposalBuilder" type="button">Create Secure Proposal</button>
      </div>
    `;
  }

  const builderStatusClass = proposalReviewStatusClass();
  const review = state.proposalBuilder.review;

  if (state.proposalBuilder.step === "review" && review?.proposal) {
    const proposal = review.proposal;
    const requiredApprovals = requiredApprovalCount(proposal);
    return `
      <section class="proposal-builder proposal-review-gate">
        <div class="proposal-builder__heading">
          <div>
            <p class="eyebrow">Security review gate</p>
            <h3>Review before guardian signing</h3>
          </div>
          <span>Step 2 of 2</span>
        </div>

        <div class="review-gate__warning">
          <strong>Stop and verify these details before creating the proposal.</strong>
          <p>Guardian signatures will acknowledge this exact payload hash. Only continue if the amount, recipient, fee, memo, and txid match what you verified outside ZecSafe.</p>
        </div>

        <dl class="review-gate__facts">
          <div>
            <dt>Proposal hash</dt>
            <dd><code>${escapeHtml(shortHex(review.hash))}</code></dd>
          </div>
          <div>
            <dt>Title</dt>
            <dd>${escapeHtml(proposal.title)}</dd>
          </div>
          <div>
            <dt>Amount</dt>
            <dd>${proposal.amount.toFixed(8)} ZEC</dd>
          </div>
          <div>
            <dt>Expected fee</dt>
            <dd>${proposal.fee !== null && proposal.fee !== undefined ? `${Number(proposal.fee).toFixed(8)} ZEC` : "Not provided"}</dd>
          </div>
          <div>
            <dt>Recipient</dt>
            <dd title="${escapeHtml(proposal.recipient)}">${escapeHtml(truncateRecipient(proposal.recipient))}</dd>
          </div>
          <div>
            <dt>Recipient fingerprint</dt>
            <dd><code>${escapeHtml(truncateRecipient(proposal.recipient).replace("...", "-"))}</code></dd>
          </div>
          <div>
            <dt>Risk level</dt>
            <dd><span class="risk-badge risk-badge--${proposal.riskLevel.toLowerCase()}">${escapeHtml(proposal.riskLevel)}</span></dd>
          </div>
          <div>
            <dt>Required signatures</dt>
            <dd>${requiredApprovals} of ${state.totalShares}</dd>
          </div>
          <div>
            <dt>Expected txid</dt>
            <dd>${proposal.expectedTxid ? escapeHtml(shortHex(proposal.expectedTxid)) : "Attach after external wallet broadcast"}</dd>
          </div>
          <div>
            <dt>Memo locked</dt>
            <dd>${escapeHtml(proposal.memo || "No memo")}</dd>
          </div>
        </dl>

        <details class="review-gate__payload">
          <summary>View canonical JSON payload</summary>
          <pre>${escapeHtml(review.payloadJson)}</pre>
        </details>

        <div class="review-gate__boundary">
          <strong>ZecSafe will never ask for seed phrases or spending keys.</strong>
          <span>This step locks a proposal hash only. Spending remains external/manual until production Zcash FROST signing is integrated.</span>
        </div>

        <div class="proposal-builder__message ${builderStatusClass}">
          ${escapeHtml(state.proposalBuilder.message)}
        </div>

        <div class="status-actions">
          <button class="primary-action" id="confirmProposalReview" type="button">Create Proposal &amp; Lock Hash</button>
          <button class="secondary-action" id="editProposalDraft" type="button">Edit Details</button>
          <button class="secondary-action" id="cancelProposalBuilder" type="button">Cancel</button>
        </div>
      </section>
    `;
  }

  return `
    <form class="proposal-builder mainnet-form" id="raiseProposalForm">
      <div class="proposal-builder__heading">
        <div>
          <p class="eyebrow">Secure transfer room</p>
          <h3>New Zcash mainnet proposal</h3>
        </div>
        <span>Step 1 of 2</span>
      </div>

      <label for="proposalTitle">Proposal title</label>
      <input id="proposalTitle" name="title" value="${escapeHtml(draft.title)}" placeholder="Tiny demo payment to safe address" autocomplete="off" required />

      <div class="proposal-builder__grid">
        <div>
          <label for="proposalAmount">Amount (ZEC)</label>
          <input id="proposalAmount" name="amount" value="${escapeHtml(draft.amount)}" type="number" min="0.00000001" step="0.00000001" placeholder="0.001" required />
        </div>
        <div>
          <label for="proposalFee">Expected fee (ZEC)</label>
          <input id="proposalFee" name="fee" value="${escapeHtml(draft.fee)}" type="number" min="0" step="0.00000001" placeholder="0.0001" />
        </div>
      </div>

      <label for="proposalRecipient">Recipient address</label>
      <input id="proposalRecipient" name="recipient" value="${escapeHtml(draft.recipient)}" placeholder="t1..., t3..., u1..., or zs1..." spellcheck="false" autocomplete="off" required />

      <label for="proposalMemo">Memo / reason</label>
      <textarea id="proposalMemo" name="memo" placeholder="Why this payment or recovery action is being proposed">${escapeHtml(draft.memo)}</textarea>

      <label for="proposalExpectedTxid">Expected or broadcast txid (optional)</label>
      <input id="proposalExpectedTxid" name="expectedTxid" value="${escapeHtml(draft.expectedTxid)}" placeholder="64-character txid after external wallet broadcast" spellcheck="false" autocomplete="off" />

      <div class="proposal-builder__message ${builderStatusClass}">
        ${escapeHtml(state.proposalBuilder.message)}
      </div>

      <div class="status-actions">
        <button class="primary-action" type="submit">${state.proposalBuilder.status === "loading" ? "Preparing Review..." : "Review Security Details"}</button>
        <button class="secondary-action" id="cancelProposalBuilder" type="button">Cancel</button>
      </div>
    </form>
  `;
}

function renderRiskRule(rule) {
  return `
    <li class="risk risk--${rule.level}">
      <span></span>
      <div>
        <strong>${rule.label}</strong>
        <p>${rule.detail}</p>
      </div>
    </li>
  `;
}

function renderAuditEvent(event) {
  const category = event.category ?? inferAuditCategory(event.label);
  return `
    <li>
      <span>${escapeHtml(event.time)}</span>
      <div>
        <strong><span class="audit-badge audit-badge--${category.toLowerCase()}">[${escapeHtml(category)}]</span> ${escapeHtml(event.label)}</strong>
        <p>${escapeHtml(event.detail)}</p>
      </div>
    </li>
  `;
}

function linkedProposal() {
  if (!state.transactionProof.linkedProposalId) return currentProposal();
  return proposals.find((proposal) => proposal.id === state.transactionProof.linkedProposalId) ?? currentProposal();
}

function canonicalProposalPayload(proposal) {
  return {
    app: "ZecSafe",
    network: "zcash-mainnet",
    proposalId: proposal.id,
    title: proposal.title,
    amountZec: proposal.amount.toFixed(8),
    recipient: proposal.recipient,
    memo: proposal.memo,
    expectedFeeZec: proposal.fee === null || proposal.fee === undefined ? null : Number(proposal.fee).toFixed(8),
    expectedTxid: proposal.expectedTxid || null,
    threshold: `${state.threshold}-of-${state.totalShares}`,
    requestedStatus: proposal.status,
    linkedMainnetTxid: proposalMainnetProof(proposal)?.txid ?? null,
  };
}

async function ensureProposalPayloadHashes() {
  if (state.hashingPayloads) return;
  state.hashingPayloads = true;
  let changed = false;
  const nextPayloads = { ...state.proposalPayloads };

  for (const proposal of proposals) {
    const payload = canonicalProposalPayload(proposal);
    const payloadJson = JSON.stringify(payload);
    const hash = await sha256HexString(payloadJson);
    const current = nextPayloads[proposal.id];
    if (!current || current.payloadJson !== payloadJson || current.hash !== hash) {
      nextPayloads[proposal.id] = { payload, payloadJson, hash };
      changed = true;
    }
  }

  state.proposalPayloads = nextPayloads;
  state.hashingPayloads = false;
  if (changed) render();
}

async function proposalPayloadRecord(proposal) {
  if (!state.proposalPayloads[proposal.id]) {
    const payload = canonicalProposalPayload(proposal);
    const payloadJson = JSON.stringify(payload);
    state.proposalPayloads[proposal.id] = {
      payload,
      payloadJson,
      hash: await sha256HexString(payloadJson),
    };
  }

  return state.proposalPayloads[proposal.id];
}

function renderMainnetResult() {
  const lookup = state.mainnetLookup;

  if (!lookup.result) {
    const unavailable = lookup.status === "unavailable";
    const title = lookup.status === "error"
      ? "Unable to fetch mainnet data"
      : unavailable
        ? "Mainnet RPC unavailable"
        : "No address loaded";
    return `
      <div class="mainnet-empty ${lookup.status === "error" || unavailable ? "mainnet-empty--error" : ""}">
        <strong>${title}</strong>
        <p>${escapeHtml(lookup.message)}</p>
      </div>
    `;
  }

  const result = lookup.result;
  if (result.isDraft) {
    return `
      <div class="mainnet-empty mainnet-empty--ready">
        <strong>Address ready to check</strong>
        <p>${escapeHtml(result.type)} detected. Press Check Mainnet to validate and fetch read-only data.</p>
      </div>
    `;
  }

  const balance = typeof result.balance === "number" ? `${zatoshisToZec(result.balance)} ZEC` : "Private";
  const received = typeof result.received === "number" ? `${zatoshisToZec(result.received)} ZEC` : "Private";

  return `
    <div class="result-card result-card--success">
      <div class="result-card__heading">
        <div>
          <p class="eyebrow">Mainnet check successful</p>
          <h3>Read-only Zcash mainnet data fetched</h3>
        </div>
        <span>Live</span>
      </div>
      <dl class="mainnet-stats">
        <div>
          <dt>Address</dt>
          <dd>${escapeHtml(result.address)}</dd>
        </div>
        <div>
          <dt>Address type</dt>
          <dd>${escapeHtml(result.type)}</dd>
        </div>
        <div>
          <dt>Balance <span class="live-badge">Live</span></dt>
          <dd>${balance}</dd>
        </div>
        <div>
          <dt>Total received</dt>
          <dd>${received}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>${escapeHtml(result.sourceLabel ?? result.endpoint ?? "Zcash mainnet RPC")}</dd>
        </div>
        <div>
          <dt>Last checked</dt>
          <dd>${escapeHtml(result.checkedAt ?? "Not public")}</dd>
        </div>
      </dl>
    </div>
  `;
}

function renderMainnetStatusResult() {
  const status = state.mainnetStatus;

  if (!status.result) {
    const unavailable = status.status === "unavailable";
    return `
      <div class="mainnet-empty ${status.status === "error" || unavailable ? "mainnet-empty--error" : "mainnet-empty--ready"}">
        <strong>${
          status.status === "error"
            ? "Unable to reach Zcash mainnet infrastructure"
            : unavailable
              ? "Mainnet RPC unavailable"
              : "Mainnet status ready to check"
        }</strong>
        <p>${escapeHtml(status.message)}</p>
      </div>
    `;
  }

  const result = status.result;
  const synced =
    result.initialBlockDownloadComplete === true ||
    (Number(result.estimatedheight) > 0 && Number(result.blocks) >= Number(result.estimatedheight) - 10);
  const activeUpgrades = (result.upgrades ?? []).filter((upgrade) => upgrade.status === "active").slice(-4);

  return `
    <div class="result-card result-card--success">
      <div class="result-card__heading">
        <div>
          <p class="eyebrow">Zcash mainnet infrastructure connected</p>
          <h3>Chain status verified through backend adapter</h3>
        </div>
        <span>${synced ? "Synced" : "Syncing"}</span>
      </div>
      <dl class="mainnet-stats">
        <div>
          <dt>Network</dt>
          <dd>${escapeHtml(result.chain)}</dd>
        </div>
        <div>
          <dt>Block height</dt>
          <dd>${escapeHtml(result.blocks)}</dd>
        </div>
        <div>
          <dt>Headers</dt>
          <dd>${escapeHtml(result.headers)}</dd>
        </div>
        <div>
          <dt>Mempool txs</dt>
          <dd>${escapeHtml(result.mempoolSize ?? "Unknown")}</dd>
        </div>
        <div>
          <dt>Connected peers</dt>
          <dd>${escapeHtml(result.connectedPeers ?? "Unknown")}</dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>${escapeHtml(Number(result.difficulty ?? 0).toLocaleString())}</dd>
        </div>
        <div>
          <dt>Best block</dt>
          <dd>${escapeHtml(result.bestblockhash)}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>ZecSafe backend adapter -> Zcash mainnet RPC</dd>
        </div>
        <div>
          <dt>Checked</dt>
          <dd>${escapeHtml(result.checkedAt)}</dd>
        </div>
      </dl>
      <ul class="upgrade-list">
        ${activeUpgrades
          .map((upgrade) => `<li><strong>${escapeHtml(upgrade.name)}</strong><span>active at ${escapeHtml(upgrade.activationheight)}</span></li>`)
          .join("")}
      </ul>
    </div>
  `;
}

function renderLiveMainnetPanel() {
  const result = state.mainnetStatus.result;
  const connected = state.mainnetStatus.status === "success" && result;
  const synced =
    connected &&
    (result.initialBlockDownloadComplete === true ||
      (Number(result.estimatedheight) > 0 && Number(result.blocks) >= Number(result.estimatedheight) - 10));
  const connectionText = connected
    ? synced
      ? "Connected to Zcash Mainnet"
      : "Syncing local Zcash node"
    : "Waiting for mainnet status";

  return `
    <section class="live-mainnet" ${pageSectionAttrs("#vault")} aria-live="polite">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Live mainnet status</p>
          <h2>Zcash network evidence</h2>
        </div>
        <span class="connection-pill ${connected ? "connection-pill--live" : ""}">
          <i></i>${connectionText}
        </span>
      </div>
      <dl class="mainnet-stats">
        <div>
          <dt>Block height <span class="live-badge">Live</span></dt>
          <dd>${connected ? escapeHtml(result.blocks) : "Not checked"}</dd>
        </div>
        <div>
          <dt>Mempool transactions</dt>
          <dd>${connected ? escapeHtml(result.mempoolSize ?? 0) : "Not checked"}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>${connected ? escapeHtml(result.chain) : "Zcash mainnet"}</dd>
        </div>
        <div>
          <dt>Last updated</dt>
          <dd>${connected ? escapeHtml(result.checkedAt) : "Auto-refreshes every 60s"}</dd>
        </div>
        <div>
          <dt>Sync target</dt>
          <dd>${connected ? escapeHtml(result.estimatedheight ?? "Unknown") : "Not checked"}</dd>
        </div>
      </dl>
    </section>
  `;
}

function renderVaultMissionPanel() {
  const proposal = currentProposal();
  const steps = missionSteps();
  const nextStep = nextMissionStep();
  const verifiedSignatures = verifiedGuardianSignatureCount(proposal);
  const requiredSignatures = requiredApprovalCount(proposal);
  const attachedProof = proposalMainnetProof(proposal);
  const completion = Math.round((steps.filter((step) => step.complete).length / steps.length) * 100);

  return `
    <section class="mission-panel" id="vault-mission" ${pageSectionAttrs("#vault")}>
      <div class="mission-panel__hero">
        <div>
          <p class="eyebrow">Secure transfer room</p>
          <h2>Protect a Zcash action before it reaches mainnet.</h2>
          <p>Create a proposal, lock the payload hash, collect guardian signatures, verify real mainnet evidence, then export a judge-verifiable receipt.</p>
        </div>
        <div class="mission-panel__primary">
          <span>${completion}% complete</span>
          <button class="primary-action" data-mission-action="${escapeHtml(nextStep.action)}">${escapeHtml(nextStep.actionLabel)}</button>
        </div>
      </div>

      <div class="secure-room-actions">
        <button class="secure-room-card secure-room-card--primary" type="button" data-mission-action="proposal">
          <span>Create</span>
          <strong>Secure Proposal</strong>
          <em>Amount, recipient, memo, fee, txid, and locked hash review.</em>
        </button>
        <button class="secure-room-card" type="button" data-mission-action="verify-tx">
          <span>Verify</span>
          <strong>Mainnet Transaction</strong>
          <em>Attach a real Zcash txid and confirmation proof.</em>
        </button>
        <button class="secure-room-card" type="button" data-mission-action="recovery">
          <span>Recover</span>
          <strong>Vault Access</strong>
          <em>Run a guarded lost-device recovery workflow.</em>
        </button>
      </div>

      <div class="mission-snapshot">
        <div>
          <span>Active proposal</span>
          <strong>${escapeHtml(proposal.title)}</strong>
        </div>
        <div>
          <span>Amount</span>
          <strong>${proposal.amount.toFixed(8)} ZEC</strong>
        </div>
        <div>
          <span>Guardian signatures</span>
          <strong>${verifiedSignatures}/${requiredSignatures}</strong>
        </div>
        <div>
          <span>Mainnet proof</span>
          <strong>${attachedProof?.status === "success" ? `${escapeHtml(attachedProof.confirmations ?? "0")} confs` : "Not attached"}</strong>
        </div>
      </div>

      <ol class="mission-steps">
        ${steps
          .map(
            (step, index) => `
              <li class="${step.complete ? "mission-steps__item--complete" : ""}">
                <span>${step.complete ? "Done" : `Step ${index + 1}`}</span>
                <div>
                  <strong>${escapeHtml(step.title)}</strong>
                  <p>${escapeHtml(step.detail)}</p>
                </div>
                <button class="secondary-action" data-mission-action="${escapeHtml(step.action)}">${escapeHtml(step.actionLabel)}</button>
              </li>
            `,
          )
          .join("")}
      </ol>

      <div class="mission-panel__safety">
        <strong>Action boundary:</strong>
        <span>ZecSafe signs proposal acknowledgements and verifies mainnet evidence. It does not ask for seed phrases, spending keys, or broadcast funds in this build.</span>
      </div>
    </section>
  `;
}

function renderMainnetProofRun() {
  const readiness = finalMainnetProofReadiness();
  const { proposal, payloadRecord, attachedProof, guardianSignatures, requiredSignatures, score } = readiness;
  const proofBundle = state.proofBundle.result;
  const proofBundleTxid =
    proofBundle?.clientEvidence?.transactionProof?.txid ??
    proofBundle?.transactionProof?.txid ??
    attachedProof?.txid ??
    null;
  const confirmations =
    proofBundle?.clientEvidence?.transactionProof?.confirmations ??
    proofBundle?.transactionProof?.confirmations ??
    attachedProof?.confirmations ??
    "Pending";
  const nextItem = readiness.items.find((item) => !item.complete) ?? readiness.items.at(-1);

  return `
    <section class="final-proof-run" id="mainnet-proof-run" ${pageSectionAttrs("#mainnet-proof-run")}>
      <div class="final-proof-hero">
        <div>
          <p class="eyebrow">Final mainnet proof run</p>
          <h2>Turn ZecSafe into a judge-verifiable mainnet demo.</h2>
          <p>Create a proposal, sign its hash, broadcast a tiny ZEC transaction externally, verify the txid on mainnet, run local FROST proof, then export the final JSON evidence package.</p>
        </div>
        <div class="final-proof-score">
          <strong>${score}%</strong>
          <span>${escapeHtml(readiness.status)}</span>
          <button class="primary-action" type="button" data-final-proof-action="${escapeHtml(nextItem.action)}">${escapeHtml(nextItem.actionLabel)}</button>
        </div>
      </div>

      <div class="final-proof-safety">
        <strong>Mainnet spending boundary</strong>
        <p>ZecSafe does not custody funds, ask for seed phrases, or broadcast this transaction. Use a trusted external wallet for a tiny ZEC transfer, then paste the txid here so ZecSafe can verify and package the evidence.</p>
      </div>

      <div class="final-proof-grid">
        <article class="final-proof-card">
          <p class="eyebrow">Active proposal</p>
          <h3>${escapeHtml(proposal.title)}</h3>
          <dl>
            <div><dt>Amount</dt><dd>${proposal.amount.toFixed(8)} ZEC</dd></div>
            <div><dt>Recipient</dt><dd title="${escapeHtml(proposal.recipient)}">${escapeHtml(truncateRecipient(proposal.recipient))}</dd></div>
            <div><dt>Proposal hash</dt><dd>${payloadRecord?.hash ? escapeHtml(shortHex(payloadRecord.hash)) : "Not locked yet"}</dd></div>
            <div><dt>Guardian signatures</dt><dd>${guardianSignatures.length}/${requiredSignatures} verified</dd></div>
          </dl>
        </article>

        <article class="final-proof-card final-proof-card--operator">
          <p class="eyebrow">Operator action</p>
          <h3>Broadcast outside ZecSafe</h3>
          <ol>
            <li>Open your trusted Zcash wallet.</li>
            <li>Send a very small amount of ZEC that matches this proposal.</li>
            <li>Wait for the wallet to show a mainnet txid.</li>
            <li>Paste that txid below and verify confirmations.</li>
          </ol>
          <p class="final-proof-card__note">Use a dedicated demo wallet and a tiny amount only. Never paste seed phrases, private keys, or spending keys into ZecSafe.</p>
        </article>
      </div>

      <form class="final-proof-tx mainnet-form" id="finalTxProofForm">
        <div>
          <p class="eyebrow">Real mainnet txid</p>
          <h3>Attach the tiny ZEC transaction proof</h3>
          <p>After external broadcast, paste the 64-character Zcash mainnet transaction ID. ZecSafe will verify confirmations and bind it to the active proposal.</p>
        </div>
        <label for="finalTxidInput">Zcash mainnet transaction ID</label>
        <div class="mainnet-form__row">
          <input id="finalTxidInput" name="txid" value="${escapeHtml(state.transactionProof.txid)}" placeholder="64-character txid" spellcheck="false" autocomplete="off" />
          <button class="primary-action" type="submit">Verify &amp; Attach Txid</button>
        </div>
        ${
          attachedProof
            ? `<div class="final-proof-attached">
                <strong>Attached mainnet proof</strong>
                <span>${escapeHtml(shortHex(attachedProof.txid))} / ${escapeHtml(String(attachedProof.confirmations ?? 0))} confirmations / ${escapeHtml(attachedProof.source ?? "mainnet")}</span>
              </div>`
            : `<div class="mainnet-empty mainnet-empty--ready">
                <strong>Waiting for external txid</strong>
                <p>Broadcast with your wallet first, then attach the proof here.</p>
              </div>`
        }
      </form>

      <div class="final-proof-checklist">
        ${readiness.items
          .map(
            (item, index) => `
              <article class="${item.complete ? "final-proof-check final-proof-check--complete" : "final-proof-check"}">
                <span>${item.complete ? "Complete" : `Step ${index + 1}`}</span>
                <div>
                  <strong>${escapeHtml(item.title)}</strong>
                  <p>${escapeHtml(item.detail)}</p>
                  <em>${escapeHtml(item.category)}</em>
                </div>
                <button class="secondary-action" type="button" data-final-proof-action="${escapeHtml(item.action)}">${escapeHtml(item.actionLabel)}</button>
              </article>
            `,
          )
          .join("")}
      </div>

      <div class="final-proof-receipt">
        <div>
          <p class="eyebrow">Final judge artifact</p>
          <h3>${proofBundle ? "Proof bundle ready" : "Generate the proof bundle last"}</h3>
          <p>The final JSON should contain network, proposal details, proposal hash, guardian signature fingerprints, txid, confirmations, FROST status, timestamp, and security limitations.</p>
        </div>
        <dl>
          <div><dt>Network</dt><dd>Zcash mainnet</dd></div>
          <div><dt>Txid</dt><dd>${proofBundleTxid ? escapeHtml(shortHex(proofBundleTxid)) : "Not attached"}</dd></div>
          <div><dt>Confirmations</dt><dd>${escapeHtml(String(confirmations))}</dd></div>
          <div><dt>Guardian signatures</dt><dd>${guardianSignatures.length}/${requiredSignatures}</dd></div>
          <div><dt>FROST local proof</dt><dd>${state.frostDemo.result?.verified === true ? "Verified" : "Not yet run"}</dd></div>
          <div><dt>Bundle</dt><dd>${proofBundle ? "Downloadable JSON ready" : "Not generated"}</dd></div>
        </dl>
        <div class="status-actions">
          <button class="primary-action" type="button" data-final-proof-action="proof-bundle">${proofBundle ? "Download Proof Bundle" : "Generate Proof Bundle"}</button>
          <a class="secondary-action" href="#evidence-center">Open Evidence Center</a>
        </div>
      </div>
    </section>
  `;
}

function renderEvidenceCenter() {
  const mainnet = state.mainnetStatus.result;
  const mainnetConnected = state.mainnetStatus.status === "success" && mainnet;
  const mainnetSynced =
    mainnetConnected &&
    (mainnet.initialBlockDownloadComplete === true ||
      (Number(mainnet.estimatedheight) > 0 && Number(mainnet.blocks) >= Number(mainnet.estimatedheight) - 10));
  const proof = state.transactionProof.result;
  const proofConfirmed = proof && Number(proof.confirmations) > 0;
  const activeProposal = currentProposal();
  const attachedProof = proposalMainnetProof(activeProposal);
  const activePayload = state.proposalPayloads[activeProposal.id];
  const verifiedSignatures = guardianSignatureProofsFor(activeProposal).filter((proofItem) => proofItem.verified).length;
  const requiredSignatures = requiredApprovalCount(activeProposal);
  const frostResult = state.frostDemo.result;
  const frostVerified = frostResult?.verified === true;
  const selectedPayload = activePayload;
  const proofBundle = state.proofBundle.result;
  const proofBundleGenerated = proofBundle?.generatedAt
    ? new Date(proofBundle.generatedAt).toLocaleTimeString()
    : "Unavailable";
  const proofBundleBlock = proofBundle?.mainnet?.blocks ?? "Unavailable";
  const browserTransactionProof = proofBundle?.clientEvidence?.transactionProof;
  const proofBundleConfirmations =
    proofBundle?.transactionProof?.confirmations ??
    browserTransactionProof?.confirmations ??
    "Unavailable";
  const proofBundleConfirmationSource = proofBundle?.transactionProof
    ? "Proof bundle RPC"
    : browserTransactionProof
      ? "Browser-checked Tx Proof"
      : "Unavailable";
  const proofBundleProposalHash = proofBundle?.clientEvidence?.activeProposalPayloadHash ?? activePayload?.hash ?? null;
  const proofBundleTxid = proofBundle?.clientEvidence?.transactionProof?.txid ?? proofBundle?.transactionProof?.txid ?? attachedProof?.txid ?? null;
  const proofBundleFrost = proofBundle?.frost
    ? proofBundle.frost.verified
      ? "Yes"
      : "No"
    : "Unavailable";
  const proofBundleGuardianSignatures =
    proofBundle?.clientEvidence?.verifiedGuardianSignatures ?? guardianSignatureProofsFor(currentProposal()).filter((proofItem) => proofItem.verified).length;
  const proofBundleStatus = proofBundle?.status ?? state.proofBundle.status;

  const cockpit = [
    ["Mainnet connected", mainnetConnected ? "green" : "red", mainnetConnected ? "Live" : "Not ready"],
    ["Address balance checked", state.mainnetLookup.status === "success" ? "green" : "amber", state.mainnetLookup.status === "success" ? "Live" : "Ready"],
    ["Transaction proof attached", proofConfirmed ? "green" : "amber", proofConfirmed ? "Confirmed" : "Ready"],
    ["FROST signature verified", frostVerified ? "green" : "amber", frostVerified ? "Verified" : "Not yet run"],
    ["Broadcast disabled", "amber", "Prototype lock"],
    ["Guardian signatures", proofBundleGuardianSignatures >= requiredSignatures ? "green" : "amber", `${proofBundleGuardianSignatures}/${requiredSignatures} verified`],
  ];
  const controlledProofSteps = [
    ["Proposal selected", true, activeProposal.title],
    ["Proposal hash generated", Boolean(activePayload?.hash), activePayload?.hash ? shortHex(activePayload.hash) : "Calculating"],
    ["Guardian signatures verified", verifiedSignatures >= requiredSignatures, `${verifiedSignatures}/${requiredSignatures}`],
    ["External wallet broadcast completed", Boolean(attachedProof), attachedProof ? "Txid entered" : "Broadcast outside ZecSafe"],
    ["Mainnet confirmations verified", Boolean(attachedProof?.confirmations), attachedProof?.confirmations ? `${attachedProof.confirmations} confirmations` : "Pending tx proof"],
    ["Proof bundle ready", Boolean(proofBundle), proofBundle ? "Export available" : "Generate after proof"],
  ];

  return `
    <section class="evidence-center" id="evidence-center" ${pageSectionAttrs("#evidence-center")}>
      <div class="section-heading">
        <div>
          <p class="eyebrow">Evidence Center</p>
          <h2>Hackathon proof area</h2>
        </div>
        <span>Real + simulated clearly separated</span>
      </div>

      <div class="proof-cockpit">
        ${cockpit
          .map(
            ([label, tone, value]) => `
              <div class="proof-cockpit__item proof-cockpit__item--${tone}">
                <span></span>
                <strong>${escapeHtml(label)}</strong>
                <em>${escapeHtml(value)}</em>
              </div>
            `,
          )
          .join("")}
      </div>

      <div class="controlled-proof-panel">
        <div class="controlled-proof-panel__intro">
          <p class="eyebrow">Controlled Mainnet Proof</p>
          <h3>Real Zcash txid, external broadcast, ZecSafe verification</h3>
          <p>ZecSafe does not broadcast or custody funds in this mode. Broadcast a tiny ZEC transaction with your trusted wallet, then paste the resulting mainnet txid here so ZecSafe can verify confirmations and attach proof to the active proposal.</p>
        </div>
        <ol class="controlled-proof-steps">
          ${controlledProofSteps
            .map(
              ([label, complete, detail]) => `
                <li class="${complete ? "controlled-proof-steps__item--complete" : ""}">
                  <span>${complete ? "Done" : "Next"}</span>
                  <strong>${escapeHtml(label)}</strong>
                  <em>${escapeHtml(detail)}</em>
                </li>
              `,
            )
            .join("")}
        </ol>
        <div class="controlled-proof-warning">
          <strong>No seed phrase. No spending key. No in-app broadcast.</strong>
          <p>This is real mainnet proof attachment, not production custody. Production broadcast requires audited Zcash transaction construction and FROST signing.</p>
        </div>
      </div>

      <div class="evidence-proof-grid">
        <article class="proof-panel">
          <div class="proof-panel__heading">
            <div>
              <p class="eyebrow">Panel 1</p>
              <h3>Live Mainnet Status</h3>
            </div>
            <span class="connection-pill ${mainnetConnected ? "connection-pill--live" : ""}">
              <i></i>${mainnetConnected ? (mainnetSynced ? "Connected" : "Syncing") : "Checking"}
            </span>
          </div>
          <span class="evidence-label evidence-label--real">Zcash mainnet RPC &mdash; read-only</span>
          <dl class="mainnet-stats">
            <div>
              <dt>Block height</dt>
              <dd>${mainnetConnected ? escapeHtml(mainnet.blocks) : "Not checked"}</dd>
            </div>
            <div>
              <dt>Mempool size</dt>
              <dd>${mainnetConnected ? escapeHtml(mainnet.mempoolSize ?? 0) : "Not checked"}</dd>
            </div>
            <div>
              <dt>Connected peers</dt>
              <dd>${mainnetConnected ? escapeHtml(mainnet.connectedPeers ?? "Unknown") : "Not checked"}</dd>
            </div>
            <div>
              <dt>Sync target</dt>
              <dd>${mainnetConnected ? escapeHtml(mainnet.estimatedheight ?? "Unknown") : "Not checked"}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>${mainnetConnected ? escapeHtml(mainnet.checkedAt) : "Auto-refreshes every 60s"}</dd>
            </div>
          </dl>
        </article>

        <article class="proof-panel">
          <div class="proof-panel__heading">
            <div>
              <p class="eyebrow">Panel 2</p>
              <h3>Address Balance</h3>
            </div>
            <span class="evidence-label evidence-label--real">Real &mdash; getaddressbalance via mainnet RPC</span>
          </div>
          <form class="mainnet-form" id="evidenceAddressForm">
            <label for="evidenceAddressInput">Transparent Zcash address</label>
            <div class="mainnet-form__row">
              <input id="evidenceAddressInput" name="address" value="${escapeHtml(state.addressInput)}" spellcheck="false" autocomplete="off" />
              <button class="primary-action" type="submit">Check Mainnet</button>
            </div>
          </form>
          ${renderMainnetResult()}
        </article>

        <article class="proof-panel">
          <div class="proof-panel__heading">
            <div>
              <p class="eyebrow">Panel 3</p>
              <h3>Transaction Proof</h3>
            </div>
            <span class="evidence-label evidence-label--real">Real &mdash; getrawtransaction + getblock via mainnet RPC</span>
          </div>
          <form class="mainnet-form" id="evidenceTxProofForm">
            <label for="evidenceTxidInput">Zcash transaction ID</label>
            <div class="mainnet-form__row">
              <input id="evidenceTxidInput" name="txid" value="${escapeHtml(state.transactionProof.txid)}" spellcheck="false" autocomplete="off" />
              <button class="primary-action" type="submit">Check Proof</button>
            </div>
          </form>
          ${
            proof
              ? `<div class="evidence-confirmation ${proofConfirmed ? "evidence-confirmation--live" : ""}">
                  ${proofConfirmed ? `Confirmed &mdash; ${escapeHtml(proof.confirmations)} confirmations on Zcash mainnet` : "Transaction proof is not confirmed yet"}
                </div>
                ${renderTransactionProofResult()}`
              : `<div class="mainnet-empty mainnet-empty--ready">
                  <strong>Proof ready to check</strong>
                  <p>${escapeHtml(state.transactionProof.message)}</p>
                </div>`
          }
        </article>

        <article class="proof-panel">
          <div class="proof-panel__heading">
            <div>
              <p class="eyebrow">Panel 4</p>
              <h3>FROST Verified Output</h3>
            </div>
            <span class="evidence-label evidence-label--real">Real &mdash; local FROST key generation and threshold signing</span>
          </div>
          ${
            frostVerified
              ? `<div class="frost-verified-badge">Signature Verified</div>
                ${renderFrostDemoResult()}`
              : `<div class="mainnet-empty mainnet-empty--ready">
                  <strong>Run the FROST Live Demo to sign the active proposal payload hash.</strong>
                  <p>Active proposal hash: ${escapeHtml(selectedPayload?.hash ? shortHex(selectedPayload.hash) : "Calculating...")}. The local route returns group public key, share fingerprints, commitments, partial signatures, and a verified aggregate signature when tooling is available.</p>
                </div>
                <button class="primary-action" id="evidenceRunFrostDemo">Run FROST Live Demo</button>`
          }
        </article>
      </div>

      <div class="proof-bundle-panel">
        <div>
          <p class="eyebrow">Proof bundle</p>
          <h3>One-click judge evidence package</h3>
          <p>Generates one combined JSON object containing mainnet status, address balance, transaction proof, local FROST result, timestamp, and real-vs-simulated summary.</p>
        </div>
        <button class="primary-action" id="generateProofBundle" ${state.proofBundle.status === "loading" ? "disabled" : ""}>
          ${state.proofBundle.status === "loading" ? "Generating..." : "Generate Proof Bundle"}
        </button>
        ${
          proofBundle
            ? `<dl class="mainnet-stats">
                <div><dt>Status</dt><dd>${escapeHtml(proofBundleStatus)}</dd></div>
                <div><dt>Generated</dt><dd>${escapeHtml(proofBundleGenerated)}</dd></div>
                <div><dt>Proposal hash</dt><dd>${escapeHtml(proofBundleProposalHash ? shortHex(proofBundleProposalHash) : "Unavailable")}</dd></div>
                <div><dt>Linked txid</dt><dd>${escapeHtml(proofBundleTxid ? shortHex(proofBundleTxid) : "Unavailable")}</dd></div>
                <div><dt>Mainnet block</dt><dd>${escapeHtml(proofBundleBlock)}</dd></div>
                <div><dt>Tx confirmations</dt><dd>${escapeHtml(proofBundleConfirmations)}</dd></div>
                <div><dt>Tx proof source</dt><dd>${escapeHtml(proofBundleConfirmationSource)}</dd></div>
                <div><dt>FROST verified</dt><dd>${escapeHtml(proofBundleFrost)}</dd></div>
                <div><dt>Guardian signatures</dt><dd>${escapeHtml(`${proofBundleGuardianSignatures}/${requiredApprovalCount(currentProposal())}`)}</dd></div>
              </dl>
              <div class="proof-receipt">
                <div>
                  <p class="eyebrow">ZecSafe proof receipt</p>
                  <h4>${escapeHtml(activeProposal.title)}</h4>
                  <p>Judge-readable summary of the exported JSON bundle.</p>
                </div>
                <ul>
                  <li><strong>Network</strong><span>Zcash mainnet</span></li>
                  <li><strong>Proposal hash</strong><span>${escapeHtml(proofBundleProposalHash ? shortHex(proofBundleProposalHash) : "Unavailable")}</span></li>
                  <li><strong>Linked txid</strong><span>${escapeHtml(proofBundleTxid ? shortHex(proofBundleTxid) : "Not attached")}</span></li>
                  <li><strong>Confirmations</strong><span>${escapeHtml(String(proofBundleConfirmations))}</span></li>
                  <li><strong>Guardian signatures</strong><span>${escapeHtml(`${proofBundleGuardianSignatures}/${requiredApprovalCount(currentProposal())} verified`)}</span></li>
                  <li><strong>Local FROST proof</strong><span>${escapeHtml(proofBundleFrost)}</span></li>
                  <li><strong>Broadcast path</strong><span>External/manual in this build</span></li>
                  <li><strong>Seed phrase requested</strong><span>Never</span></li>
                </ul>
              </div>`
            : `<p class="proof-bundle-panel__message">${escapeHtml(state.proofBundle.message)}</p>`
        }
        ${
          proofBundle?.errors?.length
            ? `<p class="proof-bundle-panel__message proof-bundle-panel__message--warning">
                Some public RPC calls were unavailable, so ZecSafe preserved a partial bundle and used browser-checked proof when available.
              </p>`
            : ""
        }
        ${
          proofBundle
            ? `<div class="proof-bundle-panel__actions">
                <button class="secondary-action" id="downloadProofBundle">Download Proof Bundle JSON</button>
                <button class="secondary-action" id="copyProofBundleJson">Copy JSON</button>
              </div>`
            : ""
        }
      </div>

      <div class="real-sim-table-wrap">
        <table class="real-sim-table">
          <thead>
            <tr>
              <th scope="col">Component</th>
              <th scope="col">Status</th>
              <th scope="col">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Mainnet RPC reads</td><td><span class="status-chip status-chip--real">Real</span></td><td>Read-only</td></tr>
            <tr><td>Address balance</td><td><span class="status-chip status-chip--real">Real</span></td><td>getaddressbalance</td></tr>
            <tr><td>Transaction proof</td><td><span class="status-chip status-chip--real">Real</span></td><td>getrawtransaction</td></tr>
            <tr><td>FROST key generation</td><td><span class="status-chip status-chip--local">Real (local)</span></td><td>frost-zcash-demo</td></tr>
            <tr><td>Guardian approval acknowledgement</td><td><span class="status-chip status-chip--local">Real (local)</span></td><td>Browser signatures over proposal hash</td></tr>
            <tr><td>Transaction broadcast</td><td><span class="status-chip status-chip--sim">Simulated</span></td><td>No real spend</td></tr>
            <tr><td>Recovery migration</td><td><span class="status-chip status-chip--sim">Simulated</span></td><td>No real fund movement</td></tr>
            <tr><td>Viewing-key balance</td><td><span class="status-chip status-chip--needs">Needs zcashd</span></td><td>Fallback shown</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderShieldedSyncResult() {
  const sync = state.shieldedSync;

  if (!sync.result) {
    return `
      <div class="mainnet-empty">
        <strong>No viewing key synced</strong>
        <p>${escapeHtml(sync.message)}</p>
      </div>
    `;
  }

  if (sync.result.source === "public-rpc-unavailable") {
    return `
      <div class="sync-callout">
        <strong>Viewing-key balance needs local wallet infrastructure</strong>
        <p>${escapeHtml(sync.message)}</p>
        <p>Transparent address monitoring is fully live on mainnet via the Mainnet Monitor tab.</p>
        <code>${escapeHtml((sync.result.requiredEnvironment ?? ["ZEC_RPC_URL", "ZEC_RPC_USER", "ZEC_RPC_PASSWORD"]).join(", "))}</code>
        <a href="${escapeHtml(sync.result.docsLink ?? "https://zechub.wiki/developers")}" target="_blank" rel="noreferrer">Open ZecHub developer docs</a>
      </div>
    `;
  }

  if (sync.result.requiredEnvironment) {
    return `
      <div class="sync-callout">
        <strong>${escapeHtml(sync.result.keyType)}</strong>
        <p>${escapeHtml(sync.message)}</p>
        <code>${escapeHtml(sync.result.requiredEnvironment.join(", "))}</code>
        <code>${escapeHtml(sync.result.commandExample)}</code>
      </div>
    `;
  }

  if (!sync.result.pools) {
    return `
      <div class="mainnet-empty">
        <strong>${escapeHtml(sync.result.keyType)}</strong>
        <p>${escapeHtml(sync.message)}</p>
      </div>
    `;
  }

  const poolEntries = Object.entries(sync.result.pools);

  return `
    <dl class="mainnet-stats mainnet-stats--pools">
      ${poolEntries
        .map(([pool, value]) => {
          const zatoshis = value?.valueZat ?? 0;
          return `
            <div>
              <dt>${escapeHtml(pool)}</dt>
              <dd>${zatoshisToZec(zatoshis)} ZEC</dd>
            </div>
          `;
        })
        .join("")}
    </dl>
  `;
}

function renderCapabilityCheck(label, detail, stateLabel) {
  return `
    <li>
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(detail)}</p>
      <span>${escapeHtml(stateLabel)}</span>
    </li>
  `;
}

function renderThreatItem(label, detail) {
  return `
    <li>
      <strong>${escapeHtml(label)}</strong>
      <p>${escapeHtml(detail)}</p>
    </li>
  `;
}

function renderNavItem(item) {
  const currentHash = window.location.hash || "#vault";
  const active = currentHash === item.href;

  return `
    <a class="nav__item ${active ? "nav__item--active" : ""}" href="${item.href}">
      ${escapeHtml(item.label)}
    </a>
  `;
}

function renderNavGroup(group) {
  return `
    <div class="nav__group">
      <span class="nav__group-label">${escapeHtml(group.label)}</span>
      ${group.items.map(renderNavItem).join("")}
    </div>
  `;
}

function renderAppFooter() {
  return `
    <footer class="app-footer">
      ${APP_FOOTER_NOTE}
    </footer>
  `;
}

function renderSecurityIndicator(label, value, level, options = {}) {
  const tooltip = options.tooltip ? ` data-tooltip="${escapeHtml(options.tooltip)}"` : "";
  return `
    <div class="security-command__item"${tooltip}>
      <span class="security-command__dot ${securityDotClass(level)}" aria-hidden="true"></span>
      <span class="security-command__text">
        <strong>${escapeHtml(label)}:</strong>
        <span>${options.lock ? '<span class="lock-icon" aria-hidden="true"></span>' : ""}${escapeHtml(value)}</span>
      </span>
    </div>
  `;
}

function renderSecurityCommandCenter() {
  const mainnetConnected = state.mainnetStatus.status === "success";
  const frostStatus = frostSignatureVerified ? "Signature Verified" : "Not Yet Run";
  const risk = recoveryRiskLevel();

  return `
    <section class="security-command" aria-label="Security Command Center">
      ${renderSecurityIndicator("Mainnet", "Connected", mainnetConnected ? "good" : "risk")}
      ${renderSecurityIndicator("FROST Demo", frostStatus, frostSignatureVerified ? "good" : "warning", {
        tooltip: frostSignatureVerified
          ? "Real FROST threshold signature verified this session. Visit FROST Live Demo to re-run."
          : "Visit FROST Live Demo to run real local key generation and threshold signing.",
      })}
      ${renderSecurityIndicator("Vault Policy", "2-of-3", "good")}
      ${renderSecurityIndicator("Recovery Risk", risk, risk === "High" ? "risk" : risk === "Medium" ? "warning" : "good")}
      ${renderSecurityIndicator("Broadcast", "Disabled in Prototype", "warning", { lock: true })}
    </section>
  `;
}

function renderFlowStep(label, detail) {
  return `
    <li>
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(detail)}</span>
    </li>
  `;
}

function renderVaultPolicySection() {
  const rows = [
    ["Normal payment", "2-of-3", "&mdash;"],
    ["Large payment (&gt;10 ZEC)", "3-of-3", "&mdash;"],
    ["Recovery migration", "2-of-3", "+ Timelock (24&ndash;72 hr)"],
    ["Guardian replacement", "3-of-3", "&mdash;"],
    ["Broadcast", "Any", "Requires FROST signature"],
  ];

  return `
    <section class="vault-policy-panel" id="vault-policy" ${pageSectionAttrs("#vault-policy")}>
      <div class="section-heading">
        <div>
          <p class="eyebrow">Policy Engine</p>
          <h2>Vault Policy</h2>
        </div>
        <span>${state.threshold}-of-${state.totalShares}</span>
      </div>

      <div class="policy-table-wrap">
        <table class="policy-table">
          <thead>
            <tr>
              <th scope="col">Operation</th>
              <th scope="col">Threshold</th>
              <th scope="col">Additional requirement</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                ([operation, threshold, requirement]) => `
                  <tr>
                    <td>${operation}</td>
                    <td><strong>${threshold}</strong></td>
                    <td>${requirement}</td>
                  </tr>
                `,
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <p class="vault-policy-note">Broadcast is disabled in this prototype. Production deployment requires audited Zcash FROST signing integration.</p>
    </section>
  `;
}

function updateActiveNav(activeHash = window.location.hash || "#vault") {
  document.querySelectorAll(".nav__item").forEach((item) => {
    item.classList.toggle("nav__item--active", item.getAttribute("href") === activeHash);
  });
}

function enableStandardTrackpadScroll() {
  const workspace = document.querySelector(".workspace");
  if (!workspace) return;

  workspace.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey) return;
      if (event.target.closest("input, textarea, select")) return;
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const lineHeight = 16;
      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * lineHeight
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      event.preventDefault();
      window.scrollBy(0, delta);
    },
    { passive: false },
  );
}

function renderTransactionProofResult() {
  const proof = state.transactionProof;

  if (!proof.result) {
    const error = proof.status === "error";
    const unavailable = proof.status === "unavailable";
    return `
      <div class="mainnet-empty ${error || unavailable ? "mainnet-empty--error" : "mainnet-empty--ready"}">
        <strong>${error ? "Transaction not found" : unavailable ? "Transaction proof RPC unavailable" : "Proof ready to check"}</strong>
        <p>${escapeHtml(proof.message)}</p>
      </div>
    `;
  }

  const result = proof.result;
  return `
    <div class="result-card result-card--success">
      <div class="result-card__heading">
        <div>
          <p class="eyebrow">Transaction proof found on Zcash mainnet</p>
          <h3>Mainnet proof attached</h3>
        </div>
        <span>Confirmed</span>
      </div>
      <dl class="mainnet-stats">
        <div>
          <dt>Tx ID</dt>
          <dd>${escapeHtml(result.txid)}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>${Number(result.confirmations) > 0 ? `Confirmed &mdash; ${escapeHtml(result.confirmations)} confirmations on Zcash mainnet` : "Unconfirmed"}</dd>
        </div>
        <div>
          <dt>Network</dt>
          <dd>Zcash mainnet</dd>
        </div>
        <div>
          <dt>Linked proposal</dt>
          <dd>${escapeHtml(linkedProposal().title)}</dd>
        </div>
        <div>
          <dt>Confirmations</dt>
          <dd>${escapeHtml(result.confirmations)}</dd>
        </div>
        <div>
          <dt>Block height</dt>
          <dd>${escapeHtml(result.height)}</dd>
        </div>
        <div>
          <dt>Output total</dt>
          <dd>${zatoshisToZec(result.transparentOutputTotal)} ZEC</dd>
        </div>
        <div>
          <dt>Proof source</dt>
          <dd>${escapeHtml(result.source ?? "Zcash mainnet RPC")}</dd>
        </div>
        ${
          result.fallback
            ? `<div>
                <dt>Fallback note</dt>
                <dd>Local node is still syncing; proof was fetched from a public read-only explorer API.</dd>
              </div>`
            : ""
        }
        <div>
          <dt>Checked</dt>
          <dd>${escapeHtml(result.checkedAt)}</dd>
        </div>
      </dl>
    </div>
  `;
}

function shortHex(value) {
  if (!value) return "Unavailable";
  return `${String(value).slice(0, 8)}...`;
}

function renderFrostDemoResult() {
  const demo = state.frostDemo;

  if (!demo.result) {
    return `
      <div class="mainnet-empty mainnet-empty--ready">
        <strong>FROST tooling ready to check</strong>
        <p>${escapeHtml(demo.message)}</p>
      </div>
    `;
  }

  const result = demo.result;
  const shares = result.keyShares ?? [];
  const round1 = Object.entries(result.signingRound1 ?? {});
  const round2 = Object.entries(result.signingRound2 ?? {});

  if (result.fallback) {
    const prerequisites = result.prerequisites ?? {};
    const prereqRows = [
      ["Rust Cargo", prerequisites.cargoInstalled],
      ["Rust compiler", prerequisites.rustcInstalled],
      ["MSVC linker", prerequisites.linkerInstalled],
      ["Windows SDK libs", prerequisites.windowsSdkLibrariesInstalled],
      ["frost-client", prerequisites.frostClientInstalled],
      ["zcash-sign", prerequisites.zcashSignInstalled],
    ];

    return `
      <div class="sync-callout">
        <strong>Official FROST tooling is not fully configured locally</strong>
        <p>${escapeHtml(result.message)}</p>
        <dl class="prereq-list">
          ${prereqRows
            .map(
              ([label, installed]) => `
                <div>
                  <dt>${escapeHtml(label)}</dt>
                  <dd>${installed ? "Detected" : "Missing"}</dd>
                </div>
              `,
            )
            .join("")}
        </dl>
        <p>This section is wired to run real local Zcash Foundation FROST output once the official tools and FROST_DEMO_COMMAND wrapper are configured. It does not fake key generation or threshold signatures.</p>
        <a href="${escapeHtml(result.repo ?? "https://github.com/ZcashFoundation/frost-tools")}" target="_blank" rel="noreferrer">Open Zcash Foundation FROST tooling</a>
      </div>
    `;
  }

  return `
    <div class="result-card result-card--success">
      <div class="result-card__heading">
        <div>
          <p class="eyebrow">FROST Live Demo</p>
          <h3>Local threshold-signing output returned <span class="live-badge live-badge--verified">Verified</span></h3>
        </div>
        <span>${result.verified ? "Signature Verified" : "Not verified"}</span>
      </div>
      <dl class="mainnet-stats">
        <div>
          <dt>Library</dt>
          <dd>${escapeHtml(result.library ?? "Zcash FROST tooling")}</dd>
        </div>
        <div>
          <dt>Group public key</dt>
          <dd>${escapeHtml(shortHex(result.groupPublicKey))}</dd>
        </div>
        <div>
          <dt>Key share fingerprints</dt>
          <dd>${shares.length ? shares.map(shortHex).map(escapeHtml).join(", ") : "Unavailable"}</dd>
        </div>
        <div>
          <dt>Round 1 commitments</dt>
          <dd>${round1.length ? round1.map(([name, value]) => `${escapeHtml(name)}: ${escapeHtml(shortHex(value))}`).join(", ") : "Unavailable"}</dd>
        </div>
        <div>
          <dt>Round 2 partial sigs</dt>
          <dd>${round2.length ? round2.map(([name, value]) => `${escapeHtml(name)}: ${escapeHtml(shortHex(value))}`).join(", ") : "Unavailable"}</dd>
        </div>
        <div>
          <dt>Signed message hash</dt>
          <dd>${escapeHtml(shortHex(result.messageHash))}</dd>
        </div>
        <div>
          <dt>Proposal payload hash</dt>
          <dd>${escapeHtml(shortHex(result.proposalPayloadHash))}</dd>
        </div>
        <div>
          <dt>Bound proposal</dt>
          <dd>${escapeHtml(result.proposalId ?? "Standalone FROST proof")}</dd>
        </div>
        <div>
          <dt>Aggregated signature</dt>
          <dd>${escapeHtml(shortHex(result.aggregatedSignature))}</dd>
        </div>
      </dl>
    </div>
  `;
}

function renderRecoveryGuardianCard(guardian) {
  const lost = guardian.id === state.recovery.lostGuardianId;
  const approved = state.recovery.approvals.includes(guardian.id);
  const proposalCreated =
    state.recovery.step === "proposal" ||
    state.recovery.step === "timelock" ||
    state.recovery.step === "threshold";

  return `
    <article class="guardian recovery-guardian ${lost ? "recovery-guardian--lost" : ""}">
      <div class="guardian__identity">
        <span class="guardian__mark ${approved ? "guardian__mark--approved" : ""}"></span>
        <div>
          <h3>${escapeHtml(guardian.name)}</h3>
          <p>${lost ? "Lost device" : guardian.role}</p>
        </div>
      </div>
      <button
        class="icon-button ${approved ? "icon-button--muted" : ""}"
        data-recovery-approval="${guardian.id}"
        ${lost || approved || !proposalCreated || state.recovery.step === "threshold" ? "disabled" : ""}
      >
        ${lost ? "Disabled / Lost" : approved ? "Recovery Approved" : "Approve Recovery (Simulated)"}
      </button>
    </article>
  `;
}

function renderRecoveryReasonOptions() {
  const options = [
    "Lost phone",
    "Stolen laptop",
    "Compromised device",
    "Guardian replacement",
    "Team treasury migration",
  ];

  return options
    .map(
      (option) => `
        <label class="radio-option">
          <input type="radio" name="recoveryReason" value="${escapeHtml(option)}" ${state.recovery.reason === option ? "checked" : ""} />
          <span>${escapeHtml(option)}</span>
        </label>
      `,
    )
    .join("");
}

const recoveryStepperSteps = [
  {
    title: "Select Lost Device",
    description: "Choose which guardian device can no longer participate.",
  },
  {
    title: "State Recovery Reason",
    description: "Record the reason, evidence note, and independent owner confirmation.",
  },
  {
    title: "Prepare New Vault",
    description: "Review the new vault structure, replacement guardian, address, and fingerprint.",
  },
  {
    title: "Guardian Approval (2-of-3)",
    description: "Collect approval from two available guardians before recovery can continue.",
  },
  {
    title: "Timelock Active",
    description: "Delay recovery execution so suspicious attempts can be noticed and stopped.",
  },
  {
    title: "Ready for FROST Signing",
    description: "Prepare the recovery migration for production threshold signing.",
  },
  {
    title: "Broadcast Disabled (Prototype)",
    description:
      "Broadcast is disabled in this prototype. In production, the aggregated FROST signature would authorise the recovery transaction on Zcash mainnet.",
  },
];

function recoveryStepCompletions() {
  const lost = Boolean(state.recovery.lostGuardianId);
  const reasonReady = Boolean(state.recovery.reason && state.recovery.note && state.recovery.outOfBandConfirmed);
  const proposalReady = ["proposal", "timelock", "threshold"].includes(state.recovery.step);
  const approvalsReady = state.recovery.approvals.length >= state.threshold;
  const timelockDone = state.recovery.step === "threshold";
  const frostReady = state.recovery.step === "threshold";

  return [
    lost,
    reasonReady,
    proposalReady,
    approvalsReady,
    timelockDone,
    frostReady,
    frostReady,
  ];
}

function renderRecoveryStepper() {
  const completed = recoveryStepCompletions();
  const firstOpenIndex = completed.findIndex((item) => !item);
  const activeIndex = firstOpenIndex === -1 ? recoveryStepperSteps.length - 1 : firstOpenIndex;

  return `
    <ol class="recovery-stepper" aria-label="Recovery workflow steps">
      ${recoveryStepperSteps
        .map((step, index) => {
          const locked = index > 0 && !completed[index - 1];
          const done = completed[index];
          const active = !done && !locked && index === activeIndex;

          return `
            <li class="recovery-step ${done ? "recovery-step--complete" : ""} ${active ? "recovery-step--active" : ""} ${locked ? "recovery-step--locked" : ""}">
              <span class="recovery-step__number">${done ? "✓" : index + 1}</span>
              <div>
                <strong>Step ${index + 1}: ${escapeHtml(step.title)}</strong>
                <p>${escapeHtml(step.description)}</p>
              </div>
            </li>
          `;
        })
        .join("")}
    </ol>
  `;
}

function renderRecoverySummary() {
  const lost = lostGuardian();
  const newGuardian = lost?.id === "alice-phone" ? "New Alice Device" : "Replacement Guardian";

  return `
    <div class="recovery-summary">
      <div><dt>Lost guardian</dt><dd>${escapeHtml(lost?.name ?? "Not selected")}</dd></div>
      <div><dt>New guardian</dt><dd>${escapeHtml(lost ? newGuardian : "Locked")}</dd></div>
      <div><dt>New vault fingerprint</dt><dd>${lost ? RECOVERY_NEW_VAULT_FINGERPRINT : "Locked"}</dd></div>
      <div><dt>Required approvals</dt><dd>${state.threshold}-of-${state.totalShares}</dd></div>
      <div><dt>Timelock</dt><dd>${RECOVERY_PRODUCTION_TIMELOCK}</dd></div>
      <div><dt>Broadcast</dt><dd>Disabled in prototype</dd></div>
    </div>
  `;
}

function renderRecoveryResult() {
  const lost = lostGuardian();

  if (state.recovery.step === "select") {
    return `
      <div class="recovery-workflow">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Recovery Center</p>
            <h2>Replace lost guardian</h2>
          </div>
          <span>Recovery Risk: High</span>
        </div>
        ${renderRecoveryStepper()}
        ${renderRecoverySummary()}
        <div class="danger-callout">
          <strong>Recovery can move all vault funds.</strong>
          <p>Only approve recovery after verifying the owner through an independent channel. Do not approve under pressure.</p>
        </div>
        <p class="recovery-copy">Choose the lost guardian/device. ZecSafe will create a recovery proposal that removes the lost guardian from a new vault.</p>
        <div class="recovery-choice-grid">
          ${guardians
            .map(
              (guardian) => `
                <button class="recovery-choice" data-lost-guardian="${guardian.id}">
                  <strong>${escapeHtml(guardian.name)}</strong>
                  <span>${escapeHtml(guardian.role)}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
    `;
  }

  const approvals = state.recovery.approvals.length;
  const newGuardian = lost?.id === "alice-phone" ? "New Alice Device" : "Replacement Guardian";
  const ready = state.recovery.step === "threshold";
  const flagged = state.recovery.step === "flagged";

  return `
    <div class="recovery-workflow">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Recovery Center</p>
          <h2>Replace lost guardian</h2>
        </div>
        <span>${
          flagged
            ? "Flagged as suspicious"
            : ready
              ? "Recovery ready for FROST signing"
              : state.recovery.step === "timelock"
                ? "Timelock active"
                : "Recovery Risk: High"
        }</span>
      </div>

      ${renderRecoveryStepper()}
      ${renderRecoverySummary()}

      <div class="danger-callout">
        <strong>High-risk action: recovery migration can move all vault funds.</strong>
        <p>Before approving, call the owner, verify a pre-agreed phrase, confirm from a second known device, or use a trusted team meeting. Do not rely only on Discord, Telegram, WhatsApp, or email.</p>
      </div>

      <div class="prototype-note">
        <strong>Lost device selected: ${escapeHtml(lost?.name ?? "Unknown guardian")}</strong>
        <p>This recovery will create a proposal to migrate funds into a new vault. The lost guardian will be removed from the new vault.</p>
      </div>

      <div class="policy-strip">
        <span>Recovery policy: 2-of-3 approvals + ${RECOVERY_PRODUCTION_TIMELOCK} timelock</span>
        <span>Prototype timelock: ${RECOVERY_DEMO_TIMELOCK_SECONDS} seconds</span>
      </div>

      ${
        state.recovery.step === "selected"
          ? `
            <form class="recovery-form" id="recoveryProposalForm">
              <fieldset>
                <legend>Reason for recovery</legend>
                <div class="radio-grid">
                  ${renderRecoveryReasonOptions()}
                </div>
              </fieldset>

              <label for="recoveryNote">Explain why recovery is needed</label>
              <textarea id="recoveryNote" name="recoveryNote" placeholder="Example: Alice Phone was stolen and the owner confirmed from their saved phone number.">${escapeHtml(state.recovery.note)}</textarea>

              <label class="confirm-option">
                <input type="checkbox" name="outOfBandConfirmed" ${state.recovery.outOfBandConfirmed ? "checked" : ""} />
                <span>I verified the owner through an independent channel.</span>
              </label>

              <div class="prototype-note">
                <strong>ZecSafe will never ask for your seed phrase or spending key.</strong>
                <p>Recovery uses guardian approval and future FROST signing, not seed phrase collection.</p>
              </div>

              <div class="status-actions">
                <button class="primary-action" type="submit">Create Recovery Proposal (Simulated)</button>
                <button class="secondary-action" type="button" id="flagRecoverySuspicious">Flag as Suspicious</button>
              </div>
            </form>
          `
          : `
            <dl class="mainnet-stats">
              <div>
                <dt>Old vault</dt>
                <dd>2-of-3 Alice Laptop, Alice Phone, Recovery Contact</dd>
              </div>
              <div>
                <dt>New vault</dt>
                <dd>2-of-3 Alice Laptop, ${escapeHtml(newGuardian)}, Recovery Contact</dd>
              </div>
              <div>
                <dt>Removed guardian</dt>
                <dd>${escapeHtml(lost?.name ?? "Unknown")}</dd>
              </div>
              <div>
                <dt>New guardian</dt>
                <dd>${escapeHtml(newGuardian)}</dd>
              </div>
              <div>
                <dt>New vault address</dt>
                <dd>${RECOVERY_NEW_VAULT_ADDRESS}</dd>
              </div>
              <div>
                <dt>Address fingerprint</dt>
                <dd>${RECOVERY_NEW_VAULT_FINGERPRINT}</dd>
              </div>
              <div>
                <dt>Recovery reason</dt>
                <dd>${escapeHtml(state.recovery.reason)}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>${
                  flagged
                    ? "Flagged for manual review"
                    : ready
                      ? "Ready for FROST signing"
                      : state.recovery.step === "timelock"
                        ? `Timelock active: ${state.recovery.timelockRemaining}s remaining`
                        : `Waiting for ${state.threshold - approvals} approvals`
                }</dd>
              </div>
            </dl>

            <div class="fingerprint-callout">
              <strong>All guardians must verify the same fingerprint: ${RECOVERY_NEW_VAULT_FINGERPRINT}</strong>
              <p>New vault address has never been used before. Verify this address carefully before approving recovery.</p>
            </div>

            <div class="guardian-grid recovery-grid">
              ${guardians.map(renderRecoveryGuardianCard).join("")}
            </div>

            ${
              ready
                ? `<div class="status-actions">
                    <button class="primary-action" id="broadcastRecoveryTransaction" disabled>
                      Broadcast Recovery Transaction (Simulated)
                    </button>
                  </div>
                  <div class="prototype-note">
                    <strong>Ready to migrate funds to new safe vault.</strong>
                    <p>Broadcast is disabled in this prototype. In production, the aggregated FROST signature would authorise the recovery transaction on Zcash mainnet.</p>
                  </div>`
                : ""
            }
            <div class="prototype-note">
              <strong>Broadcast Disabled (Prototype)</strong>
              <p>Broadcast is disabled in this prototype. In production, the aggregated FROST signature would authorise the recovery transaction on Zcash mainnet.</p>
            </div>
            <div class="status-actions">
              <button class="secondary-action" id="flagRecoverySuspicious" ${flagged ? "disabled" : ""}>Flag as Suspicious</button>
              <button class="secondary-action" id="resetRecovery">Reset Recovery (Simulated)</button>
            </div>
          `
      }
    </div>
  `;
}

function render() {
  const approvals = approvedCount();
  const status = vaultStatus();
  const requiredApprovals = requiredApprovalCount(currentProposal());
  const progress = Math.min((approvals / requiredApprovals) * 100, 100);

  document.querySelector("#app").innerHTML = `
    <main class="shell" data-route="${escapeHtml(activePageHash())}">
      ${renderSecurityCommandCenter()}
      <aside class="sidebar">
        <a class="brand" href="#" aria-label="ZecSafe home">
          <span class="brand__logo">ZS</span>
          <span>
            <strong>ZecSafe</strong>
            <small>FROST safety vault</small>
          </span>
        </a>

        <nav class="nav nav-group-ready" aria-label="Main navigation">
          ${navGroups.map(renderNavGroup).join("")}
        </nav>

        <section class="network">
          <span class="network__dot"></span>
          <div>
            <strong>Mainnet safety vault</strong>
            <p>Live read-only Zcash evidence is connected. Broadcast stays locked until FROST signing is production-ready.</p>
          </div>
        </section>
      </aside>

      <section class="workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">Security vault</p>
            <h1>Protect ZEC from single-key failure.</h1>
            <p class="identity-statement">A Zcash FROST safety vault for threshold approval, mainnet evidence, and guardian-protected recovery.</p>
          </div>
          <div class="topbar-actions">
            <button class="secondary-action" id="newProposal">Raise Proposal</button>
          </div>
        </header>

        ${renderVaultMissionPanel()}

        ${renderLiveMainnetPanel()}

        <section class="vault-grid" id="vault" ${pageSectionAttrs("#vault")}>
          <article class="summary-panel">
            <div class="summary-panel__heading">
              <div>
                <p class="eyebrow">Vault balance</p>
                <h2>1.284 ZEC</h2>
              </div>
              <span>${state.threshold}-of-${state.totalShares}</span>
            </div>
            <div class="approval-meter" aria-label="${approvals} verified signatures out of ${requiredApprovals}">
              <span style="width: ${progress}%"></span>
            </div>
            <p>${status.description}</p>
            <div class="summary-stats">
              <div>
                <strong>${approvals}/${requiredApprovals}</strong>
                <span>Verified signatures</span>
              </div>
              <div>
                <strong>3</strong>
                <span>Guardians</span>
              </div>
              <div>
                <strong>Low</strong>
                <span>Vault risk</span>
              </div>
            </div>
          </article>

          <article class="status-panel">
            <p class="eyebrow">Current state</p>
            <h2>${status.label}</h2>
            <p>ZecSafe keeps spending authority split between guardian shares. A compromised device cannot move funds alone.</p>
            ${
              approvals >= requiredApprovals
                ? `<div class="prototype-note prototype-note--dark">
                    <strong>Ready for FROST signing</strong>
                    <p>Broadcast is disabled in prototype mode. Production broadcast requires real Zcash FROST threshold signing.</p>
                  </div>`
                : ""
            }
            <div class="status-actions">
              <button class="secondary-action" id="resetApprovals">Reset Guardian Signatures</button>
              ${
                approvals >= requiredApprovals
                  ? `<button class="primary-action" id="broadcastTransaction" ${state.broadcastStatus !== "idle" ? "disabled" : ""}>${broadcastButtonLabel()}</button>`
                  : ""
              }
            </div>
          </article>
        </section>

        ${renderVaultPolicySection()}

        ${renderMainnetProofRun()}

        ${renderEvidenceCenter()}

        <section class="mainnet-panel" id="mainnet" ${pageSectionAttrs("#mainnet")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Zcash infrastructure</p>
              <h2>Mainnet status and address monitor</h2>
            </div>
            <div class="section-badges">
              <span class="lookup-state lookup-state--success">Read-only mainnet monitoring</span>
              <span class="lookup-state lookup-state--${state.mainnetLookup.status}" id="mainnetLookupState">${state.mainnetLookup.status}</span>
            </div>
          </div>

          <div class="infrastructure-grid">
            <div>
              <div class="section-heading section-heading--compact">
                <div>
                  <p class="eyebrow">Node status</p>
                  <h3>Zcash mainnet RPC</h3>
                </div>
                <span class="lookup-state lookup-state--${state.mainnetStatus.status}">${state.mainnetStatus.status}</span>
              </div>
              <button class="secondary-action" id="checkMainnetStatus">Check Chain Status</button>
            </div>
            <div>
              ${renderMainnetStatusResult()}
            </div>
          </div>

          <form class="mainnet-form" id="mainnetLookupForm">
            <label for="addressInput">Zcash address</label>
            <div class="mainnet-form__row">
              <input id="addressInput" name="address" value="${escapeHtml(state.addressInput)}" spellcheck="false" autocomplete="off" />
              <button class="primary-action" type="submit">Check Mainnet</button>
            </div>
            <p id="mainnetMessage">${state.mainnetLookup.message}</p>
          </form>

          <div id="mainnetResult">${renderMainnetResult()}</div>
        </section>

        <section class="evidence-panel" ${pageSectionAttrs("#evidence-center")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Mainnet evidence</p>
              <h2>What this app can prove now</h2>
            </div>
            <span>STEP 2</span>
          </div>
          <ul class="capability-list">
            ${renderCapabilityCheck("Check Mainnet fetches real data", "The monitor calls a Zcash mainnet RPC endpoint and returns live public transparent-address data.", "Working")}
            ${renderCapabilityCheck("Transparent address validation", "The app validates mainnet t1/t3 addresses locally before querying.", "Working")}
            ${renderCapabilityCheck("Balance display", "The dashboard shows balance, total received, source, and last checked time.", "Working")}
            ${renderCapabilityCheck("Network status evidence", "The dashboard calls getblockchaininfo, getblockcount, getmempoolinfo, and getpeerinfo.", "Working")}
          </ul>
        </section>

        <section class="mainnet-panel" id="transaction-proof" ${pageSectionAttrs("#transaction-proof")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Transaction proof</p>
              <h2>Attach proposal to mainnet</h2>
            </div>
            <span class="lookup-state lookup-state--${state.transactionProof.status}">${state.transactionProof.status}</span>
          </div>

          <form class="mainnet-form" id="transactionProofForm">
            <label for="txidInput">Zcash transaction ID</label>
            <div class="mainnet-form__row">
              <input id="txidInput" name="txid" value="${escapeHtml(state.transactionProof.txid)}" spellcheck="false" autocomplete="off" />
              <button class="primary-action" type="submit">Check Proof</button>
            </div>
            <p>${escapeHtml(state.transactionProof.message)}</p>
          </form>

          ${renderTransactionProofResult()}
        </section>

        <section class="mainnet-panel" id="shielded-sync" ${pageSectionAttrs("#shielded-sync")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Shielded read-only</p>
              <h2>Viewing key sync</h2>
            </div>
            <span class="lookup-state lookup-state--${state.shieldedSync.status}">${state.shieldedSync.status}</span>
          </div>

          <form class="mainnet-form" id="viewingKeySyncForm">
            <label for="viewingKeyInput">Full viewing key</label>
            <textarea id="viewingKeyInput" name="viewingKey" spellcheck="false" autocomplete="off" placeholder="uview1..., uvf1..., or zviews..."></textarea>
            <div class="mainnet-form__row mainnet-form__row--compact">
              <label class="inline-field" for="minConfirmationsInput">
                <span>Min confirmations</span>
                <input id="minConfirmationsInput" name="minConfirmations" type="number" min="1" value="1" />
              </label>
              <button class="primary-action" type="submit">Sync Read-only</button>
            </div>
            <p>Shielded sync requires a user-provided viewing key. ZecSafe never asks for seed phrases or spending keys.</p>
          </form>

          <details class="viewing-key-explainer">
            <summary>What is a viewing key?</summary>
            <p>A viewing key is read-only wallet permission. It can reveal wallet activity that the key is allowed to see, but it cannot spend funds. ZecSafe never asks for seed phrases or spending keys.</p>
          </details>

          <div class="prototype-note">
            <strong>Never paste seed phrases into ZecSafe.</strong>
            <p>Shielded balance lookup requires a local zcashd wallet RPC with z_getbalanceforviewingkey support. Transparent address monitoring is fully live on mainnet through the Mainnet tab.</p>
          </div>

          ${renderShieldedSyncResult()}
        </section>

        <section class="flow-panel" id="how-it-works" ${pageSectionAttrs("#how-it-works")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">How ZecSafe works</p>
              <h2>Safety flow</h2>
            </div>
            <span>Prototype architecture</span>
          </div>
          <ol class="flow-steps">
            ${renderFlowStep("Vault created", "A 2-of-3 Zcash safety vault is configured.")}
            ${renderFlowStep("3 guardian shares", "Alice Laptop, Alice Phone, and Recovery Contact represent approval shares.")}
            ${renderFlowStep("Payment proposal", "A spend request captures amount, recipient, memo, and risk checks.")}
            ${renderFlowStep("2-of-3 signature acknowledgement", "Two guardians must sign the proposal hash before the proposal can proceed.")}
            ${renderFlowStep("FROST signing layer", "Production will pair guardian acknowledgement with real threshold signature shares.")}
            ${renderFlowStep("Zcash mainnet broadcast", "Only a fully signed transaction should be broadcast to mainnet.")}
          </ol>
        </section>

        <section class="proposal-center" id="proposals" ${pageSectionAttrs("#proposals")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Proposal Center</p>
              <h2>Transaction queue</h2>
            </div>
            <span>${filteredProposals().length} visible</span>
          </div>

          <p class="proposal-center__note">${PROPOSAL_SAFETY_NOTE}</p>

          ${renderRaiseProposalForm()}

          <div class="proposal-filter-bar" aria-label="Filter proposals">
            ${proposalFilters.map(renderProposalFilter).join("")}
          </div>

          <div class="prototype-note">
            <strong>Guardian approvals now create local cryptographic acknowledgement proofs.</strong>
            <p>Each guardian signs the stable proposal payload hash in the browser. Real FROST threshold signatures are demonstrated separately in the FROST Live Demo section.</p>
          </div>

          <div class="proposal-queue">
            ${
              filteredProposals().length
                ? filteredProposals().map(renderProposalCard).join("")
                : `<div class="proposal-empty">
                    <strong>No proposals match this filter.</strong>
                    <p>Switch to All to review the full queue.</p>
                  </div>`
            }
          </div>
        </section>

        <section class="audit-panel" id="audit-log" ${pageSectionAttrs("#audit-log")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Audit log</p>
              <h2>Vault activity</h2>
            </div>
            <span>${state.auditLog.length} events</span>
          </div>
          <ol class="audit-list">
            ${state.auditLog.map(renderAuditEvent).join("")}
          </ol>
        </section>

        <section class="honesty-panel" ${pageSectionAttrs("#how-it-works")}>
          <div>
            <p class="eyebrow">Live vs simulated</p>
            <h2>What is live today</h2>
          </div>
          <div class="truth-grid">
            <article>
              <h3>Working now</h3>
              <ul>
                <li><span>Live</span> Read-only Zcash mainnet address check</li>
                <li><span>Live</span> Transaction proof attachment</li>
                <li><span>Live</span> Chain, mempool, and peer status</li>
                <li><span>Prototype</span> Proposal review</li>
                <li><span>Local crypto</span> Guardian proposal-hash signatures</li>
                <li><span>Simulated</span> Recovery workflow</li>
              </ul>
            </article>
            <article>
              <h3>Not live yet</h3>
              <ul>
                <li><span>Local</span> FROST tooling runs on this machine</li>
                <li><span>Planned</span> Real Zcash transaction signing with guardian devices</li>
                <li><span>Planned</span> Real shielded transaction broadcast</li>
                <li><span>Planned</span> Real recovery migration</li>
              </ul>
            </article>
          </div>
        </section>

        <section class="boundary-panel" ${pageSectionAttrs("#threat-model")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Production boundary</p>
              <h2>What judges should not over-credit</h2>
            </div>
            <span>Honest scope</span>
          </div>
          <div class="boundary-grid">
            <article>
              <strong>Real Zcash transaction signing</strong>
              <p>Not implemented yet. The app demonstrates the workflow and local FROST proof, but it does not build or sign a real Zcash spend transaction.</p>
            </article>
            <article>
              <strong>Separate guardian devices</strong>
              <p>Not live yet. This prototype generates local browser keys in one app session; production guardians would review the payload on separate devices and produce FROST partial signatures.</p>
            </article>
            <article>
              <strong>Real Zcash transaction payload binding</strong>
              <p>Not connected yet. The FROST Live Demo and guardian signatures bind to the proposal payload hash, not a real Zcash spend transaction.</p>
            </article>
            <article>
              <strong>Shielded viewing-key scanning</strong>
              <p>Requires local wallet infrastructure. ZecSafe never asks for seed phrases or spending keys and shows a safe fallback when zcashd is unavailable.</p>
            </article>
          </div>
        </section>

        <section class="frost-panel" id="frost-integration" ${pageSectionAttrs("#frost-integration")}>
          <div>
            <p class="eyebrow">FROST Live Demo</p>
            <h2>Local threshold tooling check</h2>
            <p class="frost-copy">This route runs scripts/frost-demo.mjs. It executes official local Zcash Foundation FROST tooling through the built-in wrapper when the tools are installed, and otherwise shows a safe unavailable state.</p>
            <button class="primary-action" id="runFrostDemo">Run FROST Key Generation</button>
          </div>
          <div>
            ${renderFrostDemoResult()}
            <ol>
              <li><strong>Today:</strong> the dashboard verifies browser-side guardian signatures over the proposal hash and runs local FROST tooling for threshold-signing evidence.</li>
              <li><strong>Local tooling:</strong> trusted-dealer, participant, and coordinator return group public key, share fingerprints, commitments, partial signatures, and verified aggregate signature.</li>
              <li><strong>Production:</strong> guardian devices create FROST signature shares for real Zcash transaction payloads.</li>
              <li><strong>Broadcast:</strong> only a fully signed transaction is submitted to Zcash mainnet.</li>
            </ol>
          </div>
        </section>

        <section class="threat-panel" id="threat-model" ${pageSectionAttrs("#threat-model")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Threat model</p>
              <h2>Security boundaries</h2>
            </div>
            <span>Review before real funds</span>
          </div>

          <div class="threat-grid">
            <article>
              <h3>Designed to reduce</h3>
              <ul>
                ${renderThreatItem("Stolen single device", "One compromised guardian should not be enough to spend from the future vault.")}
                ${renderThreatItem("Lost single device", "A 2-of-3 vault can preserve recovery options when one device disappears.")}
                ${renderThreatItem("One-person treasury control", "Teams can require multiple approvals before a payment moves forward.")}
                ${renderThreatItem("Unsafe payment approval", "Guardians review amount, recipient, memo, and risk signals before signing.")}
              </ul>
            </article>

            <article>
              <h3>Not protected yet</h3>
              <ul>
                ${renderThreatItem("Real fund safety", "This prototype does not implement real FROST signing or custody real funds.")}
                ${renderThreatItem("Transparent privacy", "Public transparent address monitoring does not make transparent activity private.")}
                ${renderThreatItem("Compromised viewing keys", "Viewing keys can reveal wallet activity and must be protected.")}
                ${renderThreatItem("Unreviewed production use", "Real funds require audited wallet and signing libraries plus security review.")}
              </ul>
            </article>

            <article>
              <h3>Sensitive data rules</h3>
              <ul>
                ${renderThreatItem("Never paste seed phrases", "Seed phrases and full wallet backups must stay out of this prototype.")}
                ${renderThreatItem("Never paste spending keys", "The app only needs viewing keys for read-only sync experiments.")}
                ${renderThreatItem("Keep shares local", "Guardian shares should be local, encrypted, and never available to the coordinator alone.")}
                ${renderThreatItem("Review locally", "Production guardian devices should verify transaction details before producing signature shares.")}
              </ul>
            </article>
          </div>
        </section>

        <section class="guardians" id="guardians" ${pageSectionAttrs("#guardians")}>
          <div class="section-heading">
            <div>
              <p class="eyebrow">Guardian Center</p>
              <h2>Device health and quorum</h2>
            </div>
            <span>${approvals} verified signature${approvals === 1 ? "" : "s"}</span>
          </div>
          <div class="prototype-note">
            <strong>Guardian Center tracks health, local share readiness, and signature proof state.</strong>
            <p>Health checks are interactive app state. Proposal approval now creates a real browser signature; production test commitments would be produced by the guardian's local FROST key share.</p>
          </div>
          <div class="guardian-grid">
            ${guardians.map(renderGuardian).join("")}
          </div>
          ${renderGuardianModel()}
        </section>

        ${renderGuardianHealthCheckModal()}

        <section class="recovery-panel" id="recovery" ${pageSectionAttrs("#recovery")}>
          ${renderRecoveryResult()}
        </section>

        ${renderAppFooter()}
      </section>
    </main>
  `;

  document.querySelectorAll("[data-guardian]").forEach((button) => {
    button.addEventListener("click", async () => {
      const guardianId = button.dataset.guardian;
      const proof = guardianSignatureRecord(currentProposal().id, guardianId);
      if (proof?.verified) {
        delete guardianProofMap(currentProposal().id)[guardianId];
        const guardian = guardians.find((item) => item.id === guardianId);
        if (guardian) guardian.status = "pending";
        addAuditEvent("Guardian signature removed", `${guardian?.name ?? "Guardian"} local proof cleared`, "CRYPTO");
        render();
        return;
      }

      await setGuardianStatus(guardianId, "approved");
    });
  });

  document.querySelectorAll("[data-guardian-health]").forEach((button) => {
    button.addEventListener("click", () => openGuardianHealthCheck(button.dataset.guardianHealth));
  });

  document.querySelectorAll("[data-guardian-lost]").forEach((button) => {
    button.addEventListener("click", () => setGuardianHealthStatus(button.dataset.guardianLost, "Lost"));
  });

  document.querySelectorAll("[data-guardian-compromised]").forEach((button) => {
    button.addEventListener("click", () => setGuardianHealthStatus(button.dataset.guardianCompromised, "Compromised"));
  });

  document.querySelectorAll("[data-health-check]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => updateGuardianHealthCheck(checkbox.dataset.healthCheck, checkbox.checked));
  });

  document.querySelector("#completeGuardianHealthCheck")?.addEventListener("click", () => {
    closeGuardianHealthCheck();
  });

  document.querySelector("#closeGuardianHealthCheck")?.addEventListener("click", () => {
    closeGuardianHealthCheck();
  });

  document.querySelectorAll("[data-proposal-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, a")) return;
      setSelectedProposal(card.dataset.proposalCard);
    });
  });

  document.querySelectorAll("[data-proposal-filter]").forEach((button) => {
    button.addEventListener("click", () => setProposalFilter(button.dataset.proposalFilter));
  });

  document.querySelectorAll("[data-copy-recipient]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard?.writeText(button.dataset.copyRecipient ?? "");
        button.textContent = "Copied";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 900);
      } catch {
        button.textContent = "Copy failed";
        window.setTimeout(() => {
          button.textContent = "Copy";
        }, 900);
      }
    });
  });

  document.querySelector("#resetApprovals").addEventListener("click", () => {
    guardians.forEach((guardian) => {
      guardian.status = "pending";
    });
    state.guardianProofs[currentProposal().id] = {};
    addAuditEvent("Guardian signatures reset", "Local approval proofs cleared for active proposal", "CRYPTO");
    render();
  });

  document.querySelector("#broadcastTransaction")?.addEventListener("click", () => {
    simulateBroadcast();
  });

  document.querySelector("#newProposal").addEventListener("click", () => {
    window.location.hash = "#proposals";
    openProposalBuilder("Enter real proposal details, then review the locked payload hash before guardians sign.");
  });

  document.querySelector("#openProposalBuilder")?.addEventListener("click", () => {
    openProposalBuilder("Enter real proposal details, then review the locked payload hash before guardians sign.");
  });

  document.querySelector("#cancelProposalBuilder")?.addEventListener("click", () => {
    closeProposalBuilder();
  });

  document.querySelector("#editProposalDraft")?.addEventListener("click", () => {
    editProposalDraft();
  });

  document.querySelector("#confirmProposalReview")?.addEventListener("click", () => {
    confirmReviewedProposal();
  });

  document.querySelector("#raiseProposalForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    raiseProposalFromForm(event.currentTarget);
  });

  document.querySelector("#mainnetLookupForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.addressInput = String(formData.get("address") ?? "").trim();
    lookupTransparentAddress(state.addressInput);
  });

  document.querySelector("#evidenceAddressForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.addressInput = String(formData.get("address") ?? "").trim();
    lookupTransparentAddress(state.addressInput);
  });

  document.querySelector("#checkMainnetStatus").addEventListener("click", () => {
    checkMainnetStatus();
  });

  document.querySelector("#runFrostDemo")?.addEventListener("click", () => {
    runFrostDemo();
  });

  document.querySelector("#evidenceRunFrostDemo")?.addEventListener("click", () => {
    runFrostDemo();
  });

  document.querySelector("#generateProofBundle")?.addEventListener("click", () => {
    generateProofBundle();
  });

  document.querySelector("#downloadProofBundle")?.addEventListener("click", () => {
    downloadProofBundle();
  });

  document.querySelector("#copyProofBundleJson")?.addEventListener("click", () => {
    copyProofBundleJson();
  });

  document.querySelectorAll("[data-mission-action]").forEach((button) => {
    button.addEventListener("click", () => {
      runMissionAction(button.dataset.missionAction);
    });
  });

  document.querySelectorAll("[data-final-proof-action]").forEach((button) => {
    button.addEventListener("click", () => {
      runFinalProofAction(button.dataset.finalProofAction);
    });
  });

  document.querySelector("#addressInput").addEventListener("input", (event) => {
    updateAddressDraft(event.currentTarget.value);
  });

  document.querySelector("#evidenceAddressInput")?.addEventListener("input", (event) => {
    updateAddressDraft(event.currentTarget.value);
  });

  document.querySelector("#viewingKeySyncForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const viewingKey = String(formData.get("viewingKey") ?? "");
    const minConfirmations = Number(formData.get("minConfirmations") ?? 1);
    syncViewingKeyBalance(viewingKey, minConfirmations);
  });

  document.querySelector("#transactionProofForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.transactionProof.txid = String(formData.get("txid") ?? "");
    checkTransactionProof(state.transactionProof.txid);
  });

  document.querySelector("#evidenceTxProofForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.transactionProof.txid = String(formData.get("txid") ?? "");
    checkTransactionProof(state.transactionProof.txid);
  });

  document.querySelector("#finalTxProofForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    state.transactionProof.txid = String(formData.get("txid") ?? "");
    checkTransactionProof(state.transactionProof.txid);
  });

  enableStandardTrackpadScroll();

  document.querySelectorAll("[data-lost-guardian]").forEach((button) => {
    button.addEventListener("click", () => setLostGuardian(button.dataset.lostGuardian));
  });

  document.querySelector("#recoveryProposalForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    createRecoveryProposal(new FormData(event.currentTarget));
  });

  document.querySelectorAll("[data-recovery-approval]").forEach((button) => {
    button.addEventListener("click", () => approveRecovery(button.dataset.recoveryApproval));
  });

  document.querySelector("#broadcastRecoveryTransaction")?.addEventListener("click", () => {
    simulateRecoveryBroadcast();
  });

  document.querySelectorAll("#flagRecoverySuspicious").forEach((button) => {
    button.addEventListener("click", () => flagRecoverySuspicious());
  });

  document.querySelector("#resetRecovery")?.addEventListener("click", () => {
    resetRecovery();
  });

  ensureProposalPayloadHashes();
}

render();
checkMainnetStatus();
window.setInterval(checkMainnetStatus, 60_000);

window.addEventListener("hashchange", () => {
  window.scrollTo({ top: 0, behavior: "auto" });
  render();
  updateActiveNav();
});

window.addEventListener("scroll", () => {
  updateActiveNav(activePageHash());
});

// Browser mirror of the zecsafe-proof-v1 verifier. The authoritative
// implementation is src/zecsafe-proof-v1.mjs, which needs node:crypto and so
// cannot load in a page; this module reimplements the same canonicalization,
// bundle hashing (WebCrypto SHA-256), and gate checks for in-browser use.
// scripts/verify-browser.test.mjs asserts the two implementations agree on the
// recorded fixture and on every tamper preset — change them together.

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const NETWORKS = new Set(["main", "test"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function canonicalizeJson(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new Error("Canonical numbers must be safe integers.");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`).join(",")}}`;
  }
  throw new Error("Canonical JSON cannot encode undefined, functions, symbols, or bigint values.");
}

export async function sha256Canonical(value) {
  const bytes = new TextEncoder().encode(canonicalizeJson(value));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const hex = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256:${hex}`;
}

export async function computeProofBundleHashBrowser(proof) {
  if (!isPlainObject(proof)) throw new Error("proof must be an object.");
  const { bundle_hash: omitted, ...payload } = proof;
  void omitted;
  return sha256Canonical(payload);
}

function liteShapeReason(proof) {
  if (!isPlainObject(proof)) return "proof must be an object.";
  if (proof.schema_version !== "zecsafe-proof-v1") return "schema_version must be zecsafe-proof-v1.";
  for (const section of ["vault", "availability", "intent", "pczt", "frost", "transaction", "evidence", "toolchain"]) {
    if (!isPlainObject(proof[section])) return `${section} must be an object.`;
  }
  if (typeof proof.bundle_hash !== "string" || !HASH_PATTERN.test(proof.bundle_hash)) {
    return "bundle_hash must be sha256:<64 hex>.";
  }
  return null;
}

// Same gate names, in the same order, as verifyZecsafeProofV1. A check whose
// expression throws (missing or malformed field) is reported as FAIL.
export async function verifyProofInBrowser(proof) {
  const shapeReason = liteShapeReason(proof);
  if (shapeReason) {
    return {
      schema_version: "zecsafe-proof-browser-verifier-v1",
      status: "FAIL",
      bundle_hash: isPlainObject(proof) ? (proof.bundle_hash ?? null) : null,
      computed_bundle_hash: null,
      checks: [{ name: "schema", status: "FAIL", reason: shapeReason }],
      verdict: "REJECTED ZECSAFE PROOF",
    };
  }

  let computedHash = null;
  let hashError = null;
  try {
    computedHash = await computeProofBundleHashBrowser(proof);
  } catch (error) {
    hashError = error.message;
  }

  const checks = [];
  const gate = (name, reason, evaluate) => {
    let passed = false;
    let failReason = reason;
    try {
      passed = Boolean(evaluate());
    } catch (error) {
      failReason = `${reason} (${error.message})`;
    }
    checks.push({ name, status: passed ? "PASS" : "FAIL", reason: failReason });
  };

  gate("schema", "Proof shape matches zecsafe-proof-v1.", () => true);
  gate("bundle_hash", "Bundle hash equals SHA-256 of canonical proof without bundle_hash.", () =>
    hashError === null && proof.bundle_hash === computedHash,
  );
  gate("network", `Proof network is ${proof.network}.`, () => NETWORKS.has(proof.network));
  gate("frost_policy", "Vault threshold is satisfiable by the participant total.", () =>
    proof.vault.threshold > 0 && proof.vault.threshold <= proof.vault.participants_total,
  );
  gate("availability", "Availability count matches selected signers and satisfies threshold.", () =>
    proof.availability.available === proof.frost.selected_signers.length &&
    proof.availability.unavailable === proof.frost.unavailable_participants &&
    proof.availability.available >= proof.vault.threshold,
  );
  gate("group_fingerprint", "Vault and FROST session group fingerprints match.", () =>
    proof.vault.group_fingerprint === proof.frost.group_fingerprint,
  );
  gate("selected_signers", "Selected signer set is unique and exactly satisfies the threshold proof run.", () =>
    new Set(proof.frost.selected_signers).size === proof.frost.selected_signers.length &&
    proof.frost.selected_signers.length === proof.vault.threshold,
  );
  gate("intent_pczt", "Binding status and redacted field checks allow the recorded intent-to-PCZT claim.", () =>
    proof.pczt.binding_status === "PASS" &&
    proof.pczt.checks.every((check) => ["PASS", "MATCH", "LIMITED"].includes(check.status)) &&
    proof.intent.commitment.length === "sha256:".length + 64,
  );
  gate(
    "pczt_fingerprint",
    "FROST session references the source PCZT and completion produced distinct signed/proven/final fingerprints.",
    () =>
      proof.pczt.source_fingerprint === proof.frost.pczt_fingerprint &&
      proof.pczt.signed_fingerprint !== proof.pczt.source_fingerprint &&
      proof.pczt.proven_fingerprint !== proof.pczt.source_fingerprint &&
      proof.pczt.final_fingerprint !== proof.pczt.source_fingerprint,
  );
  gate("pczt_completion", "Signed, proven, and combined PCZT statuses passed.", () =>
    proof.pczt.signed_pczt_status === "PASS" && proof.pczt.proven_pczt_status === "PASS" && proof.pczt.combine_status === "PASS",
  );
  gate("threshold_reached", "FROST session reached threshold and recorded a verified 64-byte aggregate signature.", () =>
    proof.frost.threshold_status === "THRESHOLD_REACHED" &&
    proof.frost.aggregate_signature_status === "AGGREGATE_SIGNATURE_VERIFIED" &&
    proof.frost.signature_byte_length === 64,
  );
  gate("transaction_status", "Transaction status is consistent with the recorded broadcast gate.", () =>
    proof.transaction.broadcast_status === "NOT_BROADCAST"
      ? proof.transaction.chain_status === "NOT_BROADCAST"
      : ["SUBMITTED", "OBSERVED", "MINED", "CONFIRMED"].includes(proof.transaction.chain_status),
  );
  gate("recorded_run_integrity", "Evidence references match the PCZT binding report references.", () =>
    proof.evidence.source_binding_report_ref === proof.pczt.source_binding_report_ref &&
    proof.evidence.final_binding_report_ref === proof.pczt.final_binding_report_ref,
  );

  const status = checks.every((check) => check.status === "PASS") ? "PASS" : "FAIL";
  return {
    schema_version: "zecsafe-proof-browser-verifier-v1",
    status,
    bundle_hash: proof.bundle_hash,
    computed_bundle_hash: computedHash,
    checks,
    verdict: status === "PASS" ? "VERIFIED RECORDED ZECSAFE PROOF" : "REJECTED ZECSAFE PROOF",
  };
}

function flipHexTail(value) {
  const last = value.slice(-1);
  return value.slice(0, -1) + (last === "0" ? "1" : "0");
}

// Shape-preserving attacks: each keeps zecsafe-proof-v1 field patterns valid so
// the authoritative verifier reports the same per-gate verdicts as the browser
// mirror (asserted by scripts/verify-browser.test.mjs).
export const TAMPER_PRESETS = [
  {
    id: "txid",
    label: "Alter the txid",
    description: "Flips one hex character of the recorded transaction id.",
    apply(proof) {
      proof.transaction.txid = flipHexTail(proof.transaction.txid);
    },
  },
  {
    id: "signer",
    label: "Swap a signer fingerprint",
    description: "Flips one hex character of the first selected signer fingerprint.",
    apply(proof) {
      proof.frost.selected_signers[0] = flipHexTail(proof.frost.selected_signers[0]);
    },
  },
  {
    id: "threshold",
    label: "Claim a 3-of-3 threshold",
    description: "Raises the recorded vault threshold from 2 to 3.",
    apply(proof) {
      proof.vault.threshold = 3;
    },
  },
  {
    id: "intent",
    label: "Alter the intent commitment",
    description: "Flips one hex character of the reviewed-intent commitment.",
    apply(proof) {
      proof.intent.commitment = flipHexTail(proof.intent.commitment);
    },
  },
];

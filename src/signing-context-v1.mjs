import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { EXPECTED_ZCASH_DEVTOOL_COMMIT } from "./pczt-inspect-v1.mjs";

export const SIGNING_CONTEXT_SCHEMA_VERSION = "zecsafe-signing-context-v1";
export const SIGNING_CONTEXT_SOURCE = "zcash-devtool pczt inspect";

const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const SIGHASH_LINE_PATTERN = /^Sighash for shielded components: ([0-9a-f]{64})$/gm;

export class SigningContextError extends Error {
  constructor(message, code = "invalid_signing_context") {
    super(message);
    this.name = "SigningContextError";
    this.code = code;
    this.statusCode = 400;
  }
}

function fail(message, code) {
  throw new SigningContextError(message, code);
}

function fingerprint(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function canonicalFingerprint(value) {
  return fingerprint(canonicalizeJson(value));
}

function requireHash(value, label) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) fail(`${label} must be sha256:<64 hex>.`);
  return value;
}

function normalizeNow(now) {
  const value = now ?? new Date();
  const parsed = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(parsed.getTime())) fail("now must be a valid timestamp.");
  return parsed;
}

function assertBinding(bindingReport, pcztFingerprint) {
  if (!bindingReport || typeof bindingReport !== "object") fail("binding_report is required.");
  if (bindingReport.status !== "PASS") fail("binding_report must have PASS status.", "binding_not_passed");
  if (requireHash(bindingReport.pczt_fingerprint, "binding_report.pczt_fingerprint") !== pcztFingerprint) {
    fail("actual PCZT fingerprint does not match binding_report.pczt_fingerprint.", "pczt_linkage_mismatch");
  }
}

function assertNotExpired(intent, now) {
  if (!intent || typeof intent !== "object") fail("intent is required.");
  if (intent.expires_at === null || intent.expires_at === undefined) return "NOT_EXPIRING";
  const expiry = Date.parse(intent.expires_at);
  if (!Number.isFinite(expiry)) fail("intent.expires_at must be null or a valid timestamp.");
  if (expiry <= now.getTime()) fail("signing context is expired.", "signing_context_expired");
  return "VALID";
}

function extractShieldedSighash(rawInspect) {
  if (typeof rawInspect !== "string") fail("pinned tool output must be text.", "pinned_tool_failure");
  const matches = [...rawInspect.matchAll(SIGHASH_LINE_PATTERN)];
  if (matches.length !== 1) {
    fail("pinned tool output must contain exactly one shielded SIGHASH.", "pinned_tool_failure");
  }
  return Buffer.from(matches[0][1], "hex");
}

export function prepareSigningContextV1({ pcztBytes, bindingReport, intent, toolResult, now, toolCommit }) {
  if (!Buffer.isBuffer(pcztBytes) && !(pcztBytes instanceof Uint8Array)) fail("actual PCZT bytes are required.");
  if (pcztBytes.byteLength === 0) fail("actual PCZT bytes are required.");
  if (toolCommit !== EXPECTED_ZCASH_DEVTOOL_COMMIT) fail("unsupported zcash-devtool commit.", "pinned_tool_failure");

  const pcztFingerprint = fingerprint(pcztBytes);
  assertBinding(bindingReport, pcztFingerprint);
  const expiryStatus = assertNotExpired(intent, normalizeNow(now));

  if (!toolResult || toolResult.exit_status !== 0 || toolResult.timed_out) {
    fail("pinned zcash-devtool failed to prepare the signing context.", "pinned_tool_failure");
  }

  const sighash = extractShieldedSighash(toolResult.stdout);
  const report = {
    schema_version: SIGNING_CONTEXT_SCHEMA_VERSION,
    status: "PASS",
    source: SIGNING_CONTEXT_SOURCE,
    tool_commit: toolCommit,
    pczt_fingerprint: pcztFingerprint,
    binding_report_ref: canonicalFingerprint(bindingReport),
    sighash_fingerprint: fingerprint(sighash),
    expiry_status: expiryStatus,
    signing_context_status: "READY",
    limitations: [
      "Only the shielded SIGHASH fingerprint is public; signing context and authorization material remain local and ephemeral.",
    ],
  };

  return { report, sighash };
}

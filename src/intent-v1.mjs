import { createHash } from "node:crypto";

export const INTENT_SCHEMA_VERSION = "zecsafe-intent-v1";
export const INTENT_MAX_SAFE_ZATOSHIS = Number.MAX_SAFE_INTEGER;

const INTENT_KEY_ORDER = [
  "schema_version",
  "network",
  "vault_id",
  "group_fingerprint",
  "recipient",
  "amount_zatoshis",
  "memo_utf8",
  "fee_policy",
  "created_at",
  "expires_at",
];

const FEE_POLICY_KEY_ORDER = ["mode", "max_fee_zatoshis"];
const INTEGER_DECIMAL_PATTERN = /^(0|[1-9][0-9]*)$/;
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const NETWORKS = new Set(["main", "test"]);

export class IntentValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "IntentValidationError";
    this.code = "invalid_intent";
    this.statusCode = 400;
  }
}

function invalidIntent(message) {
  throw new IntentValidationError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeRequiredString(value, fieldName) {
  if (typeof value !== "string") invalidIntent(`${fieldName} must be a string.`);
  const trimmed = value.trim();
  if (!trimmed) invalidIntent(`${fieldName} is required.`);
  return trimmed;
}

function normalizeOptionalString(value, fieldName) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") invalidIntent(`${fieldName} must be a string.`);
  return value;
}

function assertNoLoneSurrogates(value, fieldName) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) invalidIntent(`${fieldName} contains invalid UTF-16.`);
      index += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      invalidIntent(`${fieldName} contains invalid UTF-16.`);
    }
  }
}

function normalizeMemo(value) {
  const memo = normalizeOptionalString(value, "memo_utf8");
  assertNoLoneSurrogates(memo, "memo_utf8");
  const byteLength = Buffer.byteLength(memo, "utf8");
  if (byteLength > 512) invalidIntent("memo_utf8 must be at most 512 UTF-8 bytes.");
  return memo;
}

function normalizeIsoUtc(value, fieldName) {
  if (typeof value !== "string" || !ISO_UTC_PATTERN.test(value)) {
    invalidIntent(`${fieldName} must be an ISO-8601 UTC timestamp.`);
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) invalidIntent(`${fieldName} must be a valid timestamp.`);
  return new Date(parsed).toISOString();
}

function normalizeExpiresAt(value, createdAt) {
  if (value === undefined || value === null) return null;
  const expiresAt = normalizeIsoUtc(value, "expires_at");
  if (Date.parse(expiresAt) <= Date.parse(createdAt)) {
    invalidIntent("expires_at must be after created_at.");
  }
  return expiresAt;
}

function normalizeZatoshis(value, fieldName, { minimum }) {
  let numberValue;

  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) invalidIntent(`${fieldName} must be a safe integer.`);
    numberValue = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (!INTEGER_DECIMAL_PATTERN.test(trimmed)) {
      invalidIntent(`${fieldName} must be a base-10 integer without decimals or exponent notation.`);
    }
    const bigintValue = BigInt(trimmed);
    if (bigintValue > BigInt(INTENT_MAX_SAFE_ZATOSHIS)) {
      invalidIntent(`${fieldName} exceeds the safe integer limit.`);
    }
    numberValue = Number(bigintValue);
  } else {
    invalidIntent(`${fieldName} must be an integer zatoshi value.`);
  }

  if (numberValue < minimum) invalidIntent(`${fieldName} must be at least ${minimum}.`);
  return numberValue;
}

function validateNetwork(network) {
  const normalized = normalizeRequiredString(network, "network");
  if (!NETWORKS.has(normalized)) invalidIntent("network must be one of: main, test.");
  return normalized;
}

function validateVaultId(vaultId) {
  const normalized = normalizeRequiredString(vaultId, "vault_id");
  if (!/^vault_[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(normalized)) {
    invalidIntent("vault_id must start with vault_ and contain only letters, numbers, underscores, or hyphens.");
  }
  return normalized;
}

function validateGroupFingerprint(groupFingerprint) {
  const normalized = normalizeRequiredString(groupFingerprint, "group_fingerprint").toLowerCase();
  if (!/^sha256:[0-9a-f]{64}$/.test(normalized)) {
    invalidIntent("group_fingerprint must be sha256:<64 lowercase hex characters>.");
  }
  return normalized;
}

function isMainnetAddress(address) {
  return (
    /^t[13][1-9A-HJ-NP-Za-km-z]{20,}$/.test(address) ||
    /^u1[ac-hj-np-z02-9]{20,}$/i.test(address) ||
    /^zs1[ac-hj-np-z02-9]{20,}$/i.test(address) ||
    /^zc[1-9A-HJ-NP-Za-km-z]{20,}$/.test(address)
  );
}

function isTestnetAddress(address) {
  return (
    /^(tm|t2)[1-9A-HJ-NP-Za-km-z]{20,}$/.test(address) ||
    /^utest1[ac-hj-np-z02-9]{20,}$/i.test(address) ||
    /^ztestsapling1[ac-hj-np-z02-9]{20,}$/i.test(address) ||
    /^textest1[ac-hj-np-z02-9]{20,}$/i.test(address)
  );
}

function validateRecipient(recipient, network) {
  const normalized = normalizeRequiredString(recipient, "recipient");
  const valid = network === "main" ? isMainnetAddress(normalized) : isTestnetAddress(normalized);
  if (!valid) invalidIntent(`recipient is not a recognized Zcash ${network} address.`);
  return normalized;
}

function normalizeFeePolicy(feePolicy) {
  if (!isPlainObject(feePolicy)) invalidIntent("fee_policy must be an object.");
  const mode = normalizeRequiredString(feePolicy.mode, "fee_policy.mode");
  if (mode !== "tool_default") invalidIntent("fee_policy.mode must be tool_default.");
  const maxFeeZatoshis = normalizeZatoshis(feePolicy.max_fee_zatoshis, "fee_policy.max_fee_zatoshis", {
    minimum: 0,
  });
  return orderObject({ mode, max_fee_zatoshis: maxFeeZatoshis }, FEE_POLICY_KEY_ORDER);
}

function orderObject(value, keyOrder) {
  const ordered = {};
  for (const key of keyOrder) ordered[key] = value[key];
  return ordered;
}

export function createIntentV1(input) {
  if (!isPlainObject(input)) invalidIntent("Intent input must be an object.");

  const schemaVersion = input.schema_version ?? INTENT_SCHEMA_VERSION;
  if (schemaVersion !== INTENT_SCHEMA_VERSION) {
    invalidIntent(`schema_version must be ${INTENT_SCHEMA_VERSION}.`);
  }

  const network = validateNetwork(input.network);
  const createdAt = normalizeIsoUtc(input.created_at, "created_at");
  const intent = orderObject(
    {
      schema_version: INTENT_SCHEMA_VERSION,
      network,
      vault_id: validateVaultId(input.vault_id),
      group_fingerprint: validateGroupFingerprint(input.group_fingerprint),
      recipient: validateRecipient(input.recipient, network),
      amount_zatoshis: normalizeZatoshis(input.amount_zatoshis, "amount_zatoshis", { minimum: 1 }),
      memo_utf8: normalizeMemo(input.memo_utf8),
      fee_policy: normalizeFeePolicy(input.fee_policy),
      created_at: createdAt,
      expires_at: normalizeExpiresAt(input.expires_at, createdAt),
    },
    INTENT_KEY_ORDER,
  );

  const canonicalIntentJson = canonicalizeJson(intent);
  return {
    intent,
    canonical_intent_json: canonicalIntentJson,
    intent_commitment: `sha256:${createHash("sha256").update(canonicalIntentJson).digest("hex")}`,
  };
}

export function canonicalizeJson(value) {
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) invalidIntent("Canonical numbers must be safe integers.");
    return String(value);
  }
  if (Array.isArray(value)) return `[${value.map((item) => canonicalizeJson(item)).join(",")}]`;
  if (isPlainObject(value)) {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`).join(",")}}`;
  }
  invalidIntent("Canonical JSON cannot encode undefined, functions, symbols, or bigint values.");
}

export function findIntentNumericSyntaxError(rawJson) {
  if (typeof rawJson !== "string" || rawJson.length === 0) return null;
  const numericTokenPattern =
    /"(amount_zatoshis|max_fee_zatoshis)"\s*:\s*(-?(?:(?:0|[1-9][0-9]*)(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?)/g;

  for (const match of rawJson.matchAll(numericTokenPattern)) {
    const [, fieldName, token] = match;
    if (/[.eE]/.test(token)) {
      return `${fieldName} must not use decimals or scientific notation.`;
    }
  }
  return null;
}

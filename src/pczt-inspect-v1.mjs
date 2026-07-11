import { createHash } from "node:crypto";

export const EXPECTED_ZCASH_DEVTOOL_COMMIT = "1b065594d958d1cad2deafe7cd2e2fcc2774c46c";
export const PCZT_INSPECT_SOURCE = "zcash-devtool pczt inspect";

const NETWORKS = new Set(["main", "test"]);
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const HEX_64_PATTERN = /^[0-9a-f]{64}$/;

export class PcztInspectError extends Error {
  constructor(message) {
    super(message);
    this.name = "PcztInspectError";
    this.code = "invalid_pczt_review";
    this.statusCode = 400;
  }
}

function invalidPcztReview(message) {
  throw new PcztInspectError(message);
}

function sha256Fingerprint(bufferOrText) {
  return `sha256:${createHash("sha256").update(bufferOrText).digest("hex")}`;
}

function assertNetwork(network) {
  if (!NETWORKS.has(network)) invalidPcztReview("network must be one of: main, test.");
  return network;
}

function assertToolIdentity(toolIdentity) {
  if (!toolIdentity || typeof toolIdentity !== "object") {
    invalidPcztReview("tool identity is required.");
  }
  if (toolIdentity.name !== "zcash-devtool") {
    invalidPcztReview("tool identity name must be zcash-devtool.");
  }
  if (toolIdentity.commit !== EXPECTED_ZCASH_DEVTOOL_COMMIT) {
    invalidPcztReview("unsupported zcash-devtool commit.");
  }
}

function assertFingerprint(value, fieldName) {
  if (typeof value !== "string" || !HASH_PATTERN.test(value)) {
    invalidPcztReview(`${fieldName} must be sha256:<64 hex>.`);
  }
  return value;
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

function assertRecipientNetwork(recipient, network) {
  const valid = network === "main" ? isMainnetAddress(recipient) : isTestnetAddress(recipient);
  if (!valid) invalidPcztReview("recipient does not match the declared network.");
}

function parseHeader(line, label) {
  const match = line.match(new RegExp(`^(\\d+) ${label}$`));
  if (!match) invalidPcztReview(`missing ${label} header.`);
  return Number(match[1]);
}

function requireLine(lines, index, label) {
  const line = lines[index];
  if (line === undefined) invalidPcztReview(`missing ${label}.`);
  return line;
}

function parseTransparentInputs(lines, cursor) {
  const count = parseHeader(requireLine(lines, cursor, "transparent inputs header"), "transparent inputs");
  cursor += 1;
  let total = 0;
  const inputs = [];

  for (let expectedIndex = 0; expectedIndex < count; expectedIndex += 1) {
    const inputLine = requireLine(lines, cursor, "transparent input");
    const inputMatch = inputLine.match(/^- (\d+): (\d+) zatoshis, SIGHASH_ALL$/);
    if (!inputMatch) invalidPcztReview("malformed transparent input line.");
    const index = Number(inputMatch[1]);
    const amount = Number(inputMatch[2]);
    if (index !== expectedIndex) invalidPcztReview("transparent input indexes must be contiguous.");
    if (!Number.isSafeInteger(amount)) invalidPcztReview("transparent input amount is not a safe integer.");
    cursor += 1;

    const signaturesLine = requireLine(lines, cursor, "transparent signature count");
    const signaturesMatch = signaturesLine.match(/^  Signatures present: (\d+)$/);
    if (!signaturesMatch) invalidPcztReview("missing transparent signature count.");
    const signaturesPresent = Number(signaturesMatch[1]);
    cursor += 1;

    const scriptLine = requireLine(lines, cursor, "transparent script type");
    const scriptMatch = scriptLine.match(/^  (Pay-to-PubKey-Hash \(P2PKH\)|Pay-to-Script-Hash \(P2SH\))$/);
    if (!scriptMatch) invalidPcztReview("unsupported transparent input script type.");
    cursor += 1;

    total += amount;
    inputs.push({
      index,
      amount_zatoshis: amount,
      sighash: "SIGHASH_ALL",
      signatures_present: signaturesPresent,
      script_type: scriptMatch[1],
    });
  }

  return { cursor, inputs, total };
}

function parseTransparentOutputs(lines, cursor, network) {
  const count = parseHeader(requireLine(lines, cursor, "transparent outputs header"), "transparent outputs");
  cursor += 1;
  let total = 0;
  const outputs = [];

  for (let expectedIndex = 0; expectedIndex < count; expectedIndex += 1) {
    const outputLine = requireLine(lines, cursor, "transparent output");
    const outputMatch = outputLine.match(/^- (\d+): (\d+) zatoshis to ([^\s]+)$/);
    if (!outputMatch) invalidPcztReview("malformed transparent output line.");
    const index = Number(outputMatch[1]);
    const amount = Number(outputMatch[2]);
    const recipient = outputMatch[3];
    if (index !== expectedIndex) invalidPcztReview("transparent output indexes must be contiguous.");
    if (!Number.isSafeInteger(amount)) invalidPcztReview("transparent output amount is not a safe integer.");
    assertRecipientNetwork(recipient, network);
    cursor += 1;

    total += amount;
    outputs.push({
      index,
      amount_zatoshis: amount,
      recipient,
      pool: "transparent",
    });
  }

  return { cursor, outputs, total };
}

function skipBlankLines(lines, cursor) {
  while (lines[cursor] === "") cursor += 1;
  return cursor;
}

export function parseZcashDevtoolPcztInspect(rawInspect, options = {}) {
  const {
    network,
    pcztBytes,
    pcztFingerprint,
    toolIdentity = { name: "zcash-devtool", commit: EXPECTED_ZCASH_DEVTOOL_COMMIT },
  } = options;

  assertToolIdentity(toolIdentity);
  const normalizedNetwork = assertNetwork(network);

  if (typeof rawInspect !== "string" || rawInspect.trim() === "") {
    invalidPcztReview("raw inspect output is required.");
  }

  const fingerprint =
    pcztBytes === undefined ? assertFingerprint(pcztFingerprint, "pczt_fingerprint") : sha256Fingerprint(pcztBytes);
  const lines = rawInspect.replace(/\r\n/g, "\n").trimEnd().split("\n");
  let cursor = 0;

  const inputResult = parseTransparentInputs(lines, cursor);
  cursor = skipBlankLines(lines, inputResult.cursor);
  const outputResult = parseTransparentOutputs(lines, cursor, normalizedNetwork);
  cursor = skipBlankLines(lines, outputResult.cursor);

  const txidLine = requireLine(lines, cursor, "TxID");
  const txidMatch = txidLine.match(/^TxID: ([0-9a-f]{64})$/);
  if (!txidMatch) invalidPcztReview("missing TxID.");
  const transactionId = txidMatch[1];
  cursor += 1;

  const versionLine = requireLine(lines, cursor, "Version");
  const versionMatch = versionLine.match(/^Version: (V\d+)$/);
  if (!versionMatch) invalidPcztReview("missing transaction version.");
  const transactionVersion = versionMatch[1];
  cursor += 1;
  cursor = skipBlankLines(lines, cursor);

  if (cursor !== lines.length) invalidPcztReview("unexpected extra inspect output.");
  if (outputResult.outputs.length === 0) invalidPcztReview("at least one output is required.");
  if (!HEX_64_PATTERN.test(transactionId)) invalidPcztReview("transaction id must be 64 lowercase hex characters.");

  const fee = inputResult.total - outputResult.total;
  if (!Number.isSafeInteger(fee) || fee < 0) invalidPcztReview("computed fee is invalid.");

  return {
    network: normalizedNetwork,
    source_fingerprint: sha256Fingerprint(rawInspect),
    source: PCZT_INSPECT_SOURCE,
    tool_commit: toolIdentity.commit,
    recipients: outputResult.outputs.map((output) => output.recipient),
    amounts_zatoshis: outputResult.outputs.map((output) => output.amount_zatoshis),
    memo_metadata: {
      status: "not_reported_by_zcash_devtool_inspect",
    },
    fee_metadata: {
      status: "computed_from_transparent_values",
      input_total_zatoshis: inputResult.total,
      output_total_zatoshis: outputResult.total,
      fee_zatoshis: fee,
    },
    output_count: outputResult.outputs.length,
    pczt_fingerprint: fingerprint,
    transaction_id: transactionId,
    transaction_version: transactionVersion,
  };
}

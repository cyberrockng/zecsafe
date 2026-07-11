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

function parseColonHeader(line, label) {
  const match = line.match(new RegExp(`^(\\d+) ${label}:$`));
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

function parseFooter(lines, cursor) {
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
  if (!HEX_64_PATTERN.test(transactionId)) invalidPcztReview("transaction id must be 64 lowercase hex characters.");

  return { transactionId, transactionVersion };
}

function parseTransparentReview(lines, network) {
  let cursor = 0;
  const inputResult = parseTransparentInputs(lines, cursor);
  cursor = skipBlankLines(lines, inputResult.cursor);
  const outputResult = parseTransparentOutputs(lines, cursor, network);
  cursor = skipBlankLines(lines, outputResult.cursor);
  const footer = parseFooter(lines, cursor);

  if (outputResult.outputs.length === 0) invalidPcztReview("at least one output is required.");
  const fee = inputResult.total - outputResult.total;
  if (!Number.isSafeInteger(fee) || fee < 0) invalidPcztReview("computed fee is invalid.");

  return {
    pool: "transparent",
    recipients: outputResult.outputs.map((output) => output.recipient),
    amounts_zatoshis: outputResult.outputs.map((output) => output.amount_zatoshis),
    fee_metadata: {
      status: "computed_from_transparent_values",
      input_total_zatoshis: inputResult.total,
      output_total_zatoshis: outputResult.total,
      fee_zatoshis: fee,
    },
    output_count: outputResult.outputs.length,
    transaction_id: footer.transactionId,
    transaction_version: footer.transactionVersion,
  };
}

function parseIronwoodSpend(line) {
  if (line === "  - Spend: Zero value (likely a dummy)") return 0;
  const match = line.match(/^  - Spend: (\d+) zatoshis$/);
  if (!match) invalidPcztReview("malformed Ironwood spend line.");
  const amount = Number(match[1]);
  if (!Number.isSafeInteger(amount)) invalidPcztReview("Ironwood spend amount is not a safe integer.");
  return amount;
}

function parseIronwoodOutput(line, network, index) {
  const match = line.match(/^  - Output: (\d+) zatoshis(?: to ([^\s]+))?$/);
  if (!match) invalidPcztReview("malformed Ironwood output line.");
  const amount = Number(match[1]);
  const recipient = match[2] ?? null;
  if (!Number.isSafeInteger(amount)) invalidPcztReview("Ironwood output amount is not a safe integer.");
  if (recipient) assertRecipientNetwork(recipient, network);

  return {
    index,
    amount_zatoshis: amount,
    recipient,
    pool: "ironwood",
    role: recipient ? "recipient" : "change",
    recipient_status: recipient ? "reported_by_zcash_devtool_inspect" : "not_reported_by_zcash_devtool_inspect",
  };
}

function parseIronwoodReview(lines, network) {
  let cursor = 0;
  const count = parseColonHeader(requireLine(lines, cursor, "Ironwood actions header"), "Ironwood actions");
  cursor += 1;

  let inputTotal = 0;
  let outputTotal = 0;
  const actions = [];
  const outputs = [];

  for (let expectedIndex = 0; expectedIndex < count; expectedIndex += 1) {
    const actionLine = requireLine(lines, cursor, "Ironwood action");
    const actionMatch = actionLine.match(/^- (\d+):$/);
    if (!actionMatch) invalidPcztReview("malformed Ironwood action line.");
    const index = Number(actionMatch[1]);
    if (index !== expectedIndex) invalidPcztReview("Ironwood action indexes must be contiguous.");
    cursor += 1;

    const spend = parseIronwoodSpend(requireLine(lines, cursor, "Ironwood spend"));
    cursor += 1;

    const output = parseIronwoodOutput(requireLine(lines, cursor, "Ironwood output"), network, index);
    cursor += 1;

    inputTotal += spend;
    outputTotal += output.amount_zatoshis;
    actions.push({
      index,
      spend_zatoshis: spend,
      output_zatoshis: output.amount_zatoshis,
      output_role: output.role,
    });
    outputs.push(output);
  }

  cursor = skipBlankLines(lines, cursor);
  const footer = parseFooter(lines, cursor);
  if (outputs.length === 0) invalidPcztReview("at least one output is required.");

  const fee = inputTotal - outputTotal;
  if (!Number.isSafeInteger(fee) || fee < 0) invalidPcztReview("computed fee is invalid.");

  const reportedOutputs = outputs.filter((output) => output.recipient);
  return {
    pool: "ironwood",
    ironwood_action_count: count,
    ironwood_actions: actions,
    outputs,
    recipients: reportedOutputs.map((output) => output.recipient),
    amounts_zatoshis: reportedOutputs.map((output) => output.amount_zatoshis),
    fee_metadata: {
      status: "computed_from_ironwood_action_values",
      input_total_zatoshis: inputTotal,
      output_total_zatoshis: outputTotal,
      fee_zatoshis: fee,
    },
    output_count: outputs.length,
    transaction_id: footer.transactionId,
    transaction_version: footer.transactionVersion,
  };
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
  const parsed = lines[0]?.endsWith(" Ironwood actions:")
    ? parseIronwoodReview(lines, normalizedNetwork)
    : parseTransparentReview(lines, normalizedNetwork);

  return {
    network: normalizedNetwork,
    source_fingerprint: sha256Fingerprint(rawInspect),
    source: PCZT_INSPECT_SOURCE,
    tool_commit: toolIdentity.commit,
    pool: parsed.pool,
    recipients: parsed.recipients,
    amounts_zatoshis: parsed.amounts_zatoshis,
    memo_metadata: {
      status: "not_reported_by_zcash_devtool_inspect",
    },
    fee_metadata: parsed.fee_metadata,
    output_count: parsed.output_count,
    pczt_fingerprint: fingerprint,
    transaction_id: parsed.transaction_id,
    transaction_version: parsed.transaction_version,
    ...(parsed.outputs ? { outputs: parsed.outputs } : {}),
    ...(parsed.ironwood_action_count === undefined
      ? {}
      : {
          ironwood_action_count: parsed.ironwood_action_count,
          ironwood_actions: parsed.ironwood_actions,
        }),
  };
}

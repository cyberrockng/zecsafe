import { createHash } from "node:crypto";
import { canonicalizeJson } from "./intent-v1.mjs";
import { validateProofEventV1 } from "./proof-event-v1.mjs";

export const SIGNER_SELECTION_SCHEMA_VERSION = "zecsafe-signer-selection-v1";

const AVAILABILITY = new Set(["AVAILABLE", "UNAVAILABLE", "UNKNOWN"]);
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const PARTICIPANT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const BLOCKED_OPERATIONS = ["signing.prepare", "frost.session.start"];

export class SignerSelectionError extends Error {
  constructor(message) {
    super(message);
    this.name = "SignerSelectionError";
    this.code = "invalid_signer_selection";
    this.statusCode = 400;
  }
}

function invalidSelection(message) {
  throw new SignerSelectionError(message);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sha256Canonical(value) {
  return `sha256:${createHash("sha256").update(canonicalizeJson(value)).digest("hex")}`;
}

function normalizeRunId(runId) {
  const value = runId ?? "local-signer-selection";
  if (typeof value !== "string" || !RUN_ID_PATTERN.test(value)) {
    invalidSelection("run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.");
  }
  return value;
}

function normalizeThreshold(threshold) {
  if (!Number.isSafeInteger(threshold) || threshold < 1) invalidSelection("threshold must be a positive safe integer.");
  return threshold;
}

function normalizeGroupFingerprint(groupFingerprint) {
  if (groupFingerprint === undefined || groupFingerprint === null || groupFingerprint === "") return null;
  if (typeof groupFingerprint !== "string" || !HASH_PATTERN.test(groupFingerprint)) {
    invalidSelection("group_fingerprint must be sha256:<64 hex> when provided.");
  }
  return groupFingerprint;
}

function normalizeParticipant(participant, index) {
  if (!isPlainObject(participant)) invalidSelection(`participants[${index}] must be an object.`);
  const participantId = participant.participant_id;
  if (typeof participantId !== "string" || !PARTICIPANT_ID_PATTERN.test(participantId)) {
    invalidSelection(`participants[${index}].participant_id is invalid.`);
  }
  const publicFingerprint = participant.public_fingerprint;
  if (typeof publicFingerprint !== "string" || !HASH_PATTERN.test(publicFingerprint)) {
    invalidSelection(`participants[${index}].public_fingerprint must be sha256:<64 hex>.`);
  }
  const availability = participant.availability;
  if (!AVAILABILITY.has(availability)) {
    invalidSelection(`participants[${index}].availability must be AVAILABLE, UNAVAILABLE, or UNKNOWN.`);
  }

  return {
    participant_id: participantId,
    public_fingerprint: publicFingerprint,
    availability,
    selected: participant.selected === true,
  };
}

function normalizeParticipants(participants) {
  if (!Array.isArray(participants) || participants.length === 0) invalidSelection("participants must be a non-empty array.");

  const normalized = participants.map((participant, index) => normalizeParticipant(participant, index));
  const ids = new Set();
  const fingerprints = new Set();

  for (const participant of normalized) {
    if (ids.has(participant.participant_id)) invalidSelection("participant_id values must be unique.");
    if (fingerprints.has(participant.public_fingerprint)) invalidSelection("public_fingerprint values must be unique.");
    ids.add(participant.participant_id);
    fingerprints.add(participant.public_fingerprint);
  }

  return normalized;
}

function selectedIdsFromInput(participants, selectedParticipantIds) {
  if (selectedParticipantIds !== undefined) {
    if (!Array.isArray(selectedParticipantIds)) invalidSelection("selected_participant_ids must be an array when provided.");
    const ids = selectedParticipantIds.map((id, index) => {
      if (typeof id !== "string" || !PARTICIPANT_ID_PATTERN.test(id)) {
        invalidSelection(`selected_participant_ids[${index}] is invalid.`);
      }
      return id;
    });
    if (new Set(ids).size !== ids.length) invalidSelection("selected_participant_ids values must be unique.");
    return { ids, explicit: true };
  }

  const explicitSelected = participants.filter((participant) => participant.selected).map((participant) => participant.participant_id);
  if (explicitSelected.length > 0) return { ids: explicitSelected, explicit: true };

  return { ids: [], explicit: false };
}

function autoSelectIfNeeded(participants, threshold, requestedSelection) {
  if (requestedSelection.explicit) return requestedSelection.ids;
  return participants
    .filter((participant) => participant.availability === "AVAILABLE")
    .slice(0, threshold)
    .map((participant) => participant.participant_id);
}

function selectionReason({ selectedCount, threshold, availableCount, unavailableSelected, unknownSelected }) {
  if (unavailableSelected.length > 0) return "Selected participants include unavailable signers.";
  if (unknownSelected.length > 0) return "Selected participants include unknown-availability signers.";
  if (selectedCount < threshold) return "Selected signer count is below threshold.";
  if (availableCount < threshold) return "Available signer count is below threshold.";
  return "Selected available participants satisfy threshold.";
}

export function selectSignersV1(input = {}) {
  if (!isPlainObject(input)) invalidSelection("signer selection input must be an object.");

  const runId = normalizeRunId(input.run_id);
  const threshold = normalizeThreshold(input.threshold);
  const groupFingerprint = normalizeGroupFingerprint(input.group_fingerprint);
  const participants = normalizeParticipants(input.participants);

  if (threshold > participants.length) invalidSelection("threshold cannot exceed participant count.");

  const requestedSelectedIds = autoSelectIfNeeded(participants, threshold, selectedIdsFromInput(participants, input.selected_participant_ids));
  const participantById = new Map(participants.map((participant) => [participant.participant_id, participant]));
  const selected = [];

  for (const selectedId of requestedSelectedIds) {
    const participant = participantById.get(selectedId);
    if (!participant) invalidSelection(`selected participant does not exist: ${selectedId}.`);
    if (!selected.includes(participant)) selected.push(participant);
  }

  const available = participants.filter((participant) => participant.availability === "AVAILABLE");
  const unavailable = participants.filter((participant) => participant.availability === "UNAVAILABLE");
  const unknown = participants.filter((participant) => participant.availability === "UNKNOWN");
  const unavailableSelected = selected.filter((participant) => participant.availability === "UNAVAILABLE");
  const unknownSelected = selected.filter((participant) => participant.availability === "UNKNOWN");

  let status = "SATISFIABLE";
  if (available.length < threshold || selected.length < threshold) status = "UNSATISFIABLE";
  if (unavailableSelected.length > 0 || unknownSelected.length > 0) status = "BLOCKED";

  const result = {
    schema_version: SIGNER_SELECTION_SCHEMA_VERSION,
    run_id: runId,
    group_fingerprint: groupFingerprint,
    threshold,
    participant_total: participants.length,
    available_count: available.length,
    unavailable_count: unavailable.length,
    unknown_count: unknown.length,
    participants: participants.map((participant) => ({
      participant_id: participant.participant_id,
      public_fingerprint: participant.public_fingerprint,
      availability: participant.availability,
      selected: selected.includes(participant),
    })),
    selected_count: selected.length,
    selected_participant_ids: selected.map((participant) => participant.participant_id),
    selected_public_fingerprints: selected.map((participant) => participant.public_fingerprint),
    unavailable_participant_ids: unavailable.map((participant) => participant.participant_id),
    unavailable_public_fingerprints: unavailable.map((participant) => participant.public_fingerprint),
    status,
    frost_session: status === "SATISFIABLE" ? "ALLOWED" : "BLOCKED",
    blocked_operations: status === "SATISFIABLE" ? [] : [...BLOCKED_OPERATIONS],
    reason: selectionReason({
      selectedCount: selected.length,
      threshold,
      availableCount: available.length,
      unavailableSelected,
      unknownSelected,
    }),
    warnings: [],
    limitations: [
      "Signer selection proves threshold satisfiability only; later FROST tasks must prove selected participants completed signing shares.",
    ],
  };

  if (unknown.length > 0) {
    result.warnings.push("UNKNOWN participants are not counted as available for threshold satisfaction.");
  }
  if (status === "BLOCKED") {
    result.warnings.push("FROST session must not start with selected unavailable or unknown-availability participants.");
  }

  result.selection_ref = sha256Canonical({
    schema_version: result.schema_version,
    run_id: result.run_id,
    group_fingerprint: result.group_fingerprint,
    threshold: result.threshold,
    participant_total: result.participant_total,
    selected_public_fingerprints: result.selected_public_fingerprints,
    status: result.status,
  });

  result.proof_event = signerSelectionProofEvent(result);
  return result;
}

export function signerSelectionProofEvent(selection, options = {}) {
  const occurredAt = options.occurred_at ?? new Date().toISOString();
  const sequence = options.sequence ?? 1;
  return validateProofEventV1({
    schema_version: "proof-event-v1",
    sequence,
    run_id: selection.run_id,
    occurred_at: occurredAt,
    stage: "FROST_SESSION",
    status: selection.status === "BLOCKED" ? "BLOCKED" : selection.status,
    evidence_ref: selection.selection_ref,
    public_message:
      selection.status === "SATISFIABLE"
        ? "Selected available participants satisfy the threshold."
        : "Signer availability does not allow a FROST session.",
    data: {
      threshold: selection.threshold,
      participant_total: selection.participant_total,
      unavailable_participant_count: selection.unavailable_count,
      selected_public_fingerprints: selection.selected_public_fingerprints,
      threshold_status: selection.status === "BLOCKED" ? "UNSATISFIABLE" : selection.status,
      frost_status: selection.status === "BLOCKED" ? "UNSATISFIABLE" : selection.status,
      group_fingerprint: selection.group_fingerprint,
      limitations: selection.limitations,
    },
  });
}

const PASS_VALUES = new Set(["PASS", "MATCH", "LIMITED"]);

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

function eventTime(event) {
  const time = Date.parse(event?.occurred_at ?? "");
  return Number.isFinite(time) ? time : 0;
}

function sortedEvents(events) {
  return [...events].sort((left, right) => eventTime(left) - eventTime(right));
}

export function proofEventsFromPublicLog(publicLog) {
  if (!publicLog || !Array.isArray(publicLog.entries)) return [];
  return publicLog.entries.map((entry) => entry.event).filter(Boolean);
}

export function createBindingMismatchEvents(events) {
  const cloned = copy(events);
  const review = cloned.find((event) => event?.data?.check_statuses?.recipient);
  if (review) {
    review.status = "FAIL";
    review.public_message = "SAFETY TEST - recipient mismatch blocked signing.";
    review.data.check_statuses.recipient = "FAIL";
    review.data.signer_review_status = "FAIL";
  }

  const combine = cloned.find((event) => event?.stage === "PCZT_COMBINE");
  if (combine) {
    combine.status = "FAIL";
    combine.public_message = "SAFETY TEST - final binding mismatch blocked completion.";
    combine.data.final_binding_status = "FAIL";
    combine.data.pczt_combine_status = "FAIL";
    combine.data.broadcast_status = "NOT_BROADCAST";
  }

  return cloned;
}

export function reduceDemoProofEvents(events) {
  const reduced = {
    schema_version: "zecsafe-demo-proof-state-v1",
    replay_label: "Recorded Verified Mainnet Run",
    events_seen: 0,
    started_at: null,
    last_event_at: null,
    binding: {
      status: "UNKNOWN",
      check_statuses: {},
      signing_allowed: false,
    },
    frost: {
      threshold: null,
      participant_total: null,
      unavailable_participant_count: null,
      selected_public_fingerprints: [],
      selected_signer_count: 0,
      threshold_status: "UNKNOWN",
      aggregate_signature_status: "UNKNOWN",
    },
    pczt: {
      signed_status: "UNKNOWN",
      proven_status: "UNKNOWN",
      combine_status: "UNKNOWN",
      final_binding_status: "UNKNOWN",
    },
    chain: {
      txid: null,
      status: "NOT_BROADCAST",
      broadcast_status: "NOT_BROADCAST",
      observed_block_height: null,
      confirmations: 0,
    },
    readiness: {
      binding_passed: false,
      signing_allowed: false,
      threshold_reached: false,
      signed_pczt: false,
      proven_pczt: false,
      combined_pczt: false,
      has_txid: false,
      chain_observed: false,
      chain_confirmed: false,
      broadcast_success: false,
    },
  };

  const normalized = sortedEvents(Array.isArray(events) ? events.filter(Boolean) : []);
  reduced.events_seen = normalized.length;
  reduced.started_at = normalized[0]?.occurred_at ?? null;
  reduced.last_event_at = normalized.at(-1)?.occurred_at ?? null;

  for (const event of normalized) {
    const data = event.data ?? {};

    if (data.check_statuses) {
      reduced.binding.check_statuses = {
        ...reduced.binding.check_statuses,
        ...data.check_statuses,
      };
    }

    const checkValues = Object.values(reduced.binding.check_statuses);
    const hasFailedCheck = checkValues.some((value) => !PASS_VALUES.has(value));
    if (data.binding_status) reduced.binding.status = data.binding_status;
    if (data.final_binding_status) reduced.pczt.final_binding_status = data.final_binding_status;
    if (event.status === "FAIL" || hasFailedCheck || data.final_binding_status === "FAIL") {
      reduced.binding.status = "FAIL";
    } else if (checkValues.length > 0 && checkValues.every((value) => PASS_VALUES.has(value))) {
      reduced.binding.status = "PASS";
    }

    if (data.threshold) reduced.frost.threshold = data.threshold;
    if (data.participant_total) reduced.frost.participant_total = data.participant_total;
    if (Number.isSafeInteger(data.unavailable_participant_count)) {
      reduced.frost.unavailable_participant_count = data.unavailable_participant_count;
    }
    if (Array.isArray(data.selected_public_fingerprints)) {
      reduced.frost.selected_public_fingerprints = [...new Set(data.selected_public_fingerprints)];
      reduced.frost.selected_signer_count = reduced.frost.selected_public_fingerprints.length;
    }
    if (data.threshold_status) reduced.frost.threshold_status = data.threshold_status;
    if (data.aggregate_signature_status) reduced.frost.aggregate_signature_status = data.aggregate_signature_status;

    if (data.signed_pczt_status) reduced.pczt.signed_status = data.signed_pczt_status;
    if (data.proven_pczt_status) reduced.pczt.proven_status = data.proven_pczt_status;
    if (data.pczt_combine_status) reduced.pczt.combine_status = data.pczt_combine_status;

    if (data.txid) reduced.chain.txid = data.txid;
    if (data.chain_status) reduced.chain.status = data.chain_status;
    if (data.broadcast_status) reduced.chain.broadcast_status = data.broadcast_status;
    if (Number.isSafeInteger(data.block_height)) reduced.chain.observed_block_height = data.block_height;
    if (Number.isSafeInteger(data.confirmation_count)) reduced.chain.confirmations = data.confirmation_count;
  }

  reduced.readiness.binding_passed = reduced.binding.status === "PASS";
  reduced.readiness.signing_allowed = reduced.readiness.binding_passed;
  reduced.binding.signing_allowed = reduced.readiness.signing_allowed;
  reduced.readiness.threshold_reached = reduced.frost.threshold_status === "THRESHOLD_REACHED";
  reduced.readiness.signed_pczt = ["PASS", "SIGNED_PCZT"].includes(reduced.pczt.signed_status);
  reduced.readiness.proven_pczt = reduced.pczt.proven_status === "PASS";
  reduced.readiness.combined_pczt = reduced.pczt.combine_status === "PASS" && reduced.pczt.final_binding_status !== "FAIL";
  reduced.readiness.has_txid = Boolean(reduced.chain.txid);
  reduced.readiness.chain_observed = ["OBSERVED", "MINED", "CONFIRMED"].includes(reduced.chain.status);
  reduced.readiness.chain_confirmed = reduced.chain.status === "CONFIRMED" && reduced.chain.confirmations > 0;
  reduced.readiness.broadcast_success =
    reduced.readiness.has_txid &&
    reduced.readiness.chain_observed &&
    reduced.readiness.chain_confirmed &&
    reduced.chain.broadcast_status === "CONFIRMED";

  return reduced;
}

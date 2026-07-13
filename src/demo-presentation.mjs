function valueOr(value, fallback = "Unavailable") {
  return value === null || value === undefined || value === "" ? fallback : value;
}

export function deriveDemoPresentation({ mode = "verified", proof = null, replay, verifyStatus = "idle" }) {
  const mismatch = mode === "mismatch";
  const threshold = proof?.vault?.threshold ?? replay?.frost?.threshold ?? 2;
  const total = proof?.vault?.participants_total ?? replay?.frost?.participant_total ?? 3;
  const unavailable = proof?.availability?.unavailable ?? replay?.frost?.unavailable_participant_count ?? 1;
  const recordedChainStatus = proof?.transaction?.chain_status ?? replay?.chain?.status;
  const recordedTxid = proof?.transaction?.txid ?? replay?.chain?.txid;

  const verifierLabel = mismatch
    ? "Safety Test Blocked"
    : verifyStatus === "pass"
      ? "Proof Verified"
      : verifyStatus === "fail"
        ? "Proof Blocked"
        : "Verify Proof";

  const evidenceStrip = mismatch
    ? ["SYNTHETIC SAFETY TEST", "RECIPIENT MISMATCH", "FROST NOT STARTED", "NOT BROADCAST", "BLOCKED"]
    : [
        "ZCASH MAINNET",
        `${threshold} OF ${total}`,
        "FROST",
        `${unavailable} UNAVAILABLE`,
        // The strip only claims verification after the visitor actually runs it.
        verifyStatus === "fail" ? "PROOF BLOCKED" : verifyStatus === "pass" ? "PROOF VERIFIED" : "PROOF RECORDED",
      ];

  const proofFacts = mismatch
    ? [
        ["Mode", "SYNTHETIC SAFETY TEST"],
        ["Binding status", replay?.binding?.status],
        ["Signing", "BLOCKED BEFORE FROST"],
        ["FROST authorization", "NOT STARTED"],
        ["PCZT completion", "NOT RUN"],
        ["Broadcast", "NOT ATTEMPTED"],
        ["Proof download", "DISABLED FOR SYNTHETIC MODE"],
      ]
    : [
        ["Run ID", proof?.run_id],
        ["Recorded Verified Mainnet Run", "Recorded Verified Mainnet Run"],
        ["UTC timestamp", proof?.recorded_at],
        ["Txid", recordedTxid],
        ["Recorded chain status", recordedChainStatus],
        ["Block height", proof?.transaction?.observed_block_height],
        ["Binding status", proof?.pczt?.binding_status],
        ["Proof bundle hash", proof?.bundle_hash],
        ["Exact ZecSafe commit", proof?.zecsafe_commit],
        ["frost-tools commit", proof?.toolchain?.frost_tools_commit],
        ["zcash-devtool commit", proof?.toolchain?.zcash_devtool_commit],
        ["pczt signer library commit", proof?.toolchain?.pczt_signer_library_commit],
      ];

  return {
    mismatch,
    threshold,
    total,
    unavailable,
    recorded: {
      chainStatus: recordedChainStatus,
      txid: recordedTxid,
      receiptLabel: mismatch ? "Recorded run ID — immutable reference" : "Run ID",
      txidLabel: mismatch ? "Recorded txid" : "Txid",
      chainStatusLabel: mismatch ? "Recorded chain status" : "Chain status",
    },
    verifier: {
      label: verifierLabel,
      enabled: Boolean(proof) && !mismatch,
    },
    evidenceStrip,
    downloadEnabled: Boolean(proof) && !mismatch,
    authorization: {
      thresholdStatus: mismatch ? "NOT STARTED — BLOCKED BY BINDING FIREWALL" : replay?.frost?.threshold_status,
      aggregateStatus: mismatch ? "NOT CREATED — SYNTHETIC SAFETY TEST" : proof?.frost?.aggregate_signature_status,
      selectedSigners: mismatch ? [] : (proof?.frost?.selected_signers ?? replay?.frost?.selected_public_fingerprints ?? []),
    },
    flow: {
      binding: {
        detail: valueOr(replay?.binding?.status),
        complete: Boolean(replay?.readiness?.binding_passed),
      },
      frost: {
        detail: mismatch ? "NOT STARTED — BLOCKED BY BINDING FIREWALL" : valueOr(replay?.frost?.threshold_status),
        complete: !mismatch && Boolean(replay?.readiness?.threshold_reached),
      },
      pczt: {
        detail: mismatch ? "NOT RUN — SIGNING WAS BLOCKED" : valueOr(replay?.pczt?.combine_status),
        complete: !mismatch && Boolean(replay?.readiness?.combined_pczt),
      },
      mainnet: {
        detail: mismatch
          ? "NOT BROADCAST — SYNTHETIC SAFETY TEST"
          : `${valueOr(recordedChainStatus)} / ${valueOr(recordedTxid)}`,
        complete: !mismatch && Boolean(recordedTxid),
      },
      proof: {
        detail: mismatch ? "NO EXPORT — SYNTHETIC SAFETY TEST" : valueOr(proof?.bundle_hash, "Bundle hash pending"),
        complete: !mismatch && Boolean(proof?.bundle_hash),
      },
    },
    proofFacts,
  };
}

export function createPublicProofExport({ proof, publicEventLog, replay, mode = "verified", exportedAt }) {
  if (mode !== "verified") {
    throw new Error("Synthetic safety-test replays cannot be exported as a recorded public proof.");
  }
  if (!proof || !publicEventLog || !replay) {
    throw new Error("A loaded recorded proof, event log, and replay are required for export.");
  }

  return {
    schema_version: "zecsafe-public-proof-export-v1",
    mode: "recorded_verified",
    synthetic: false,
    proof,
    public_event_log: publicEventLog,
    replay_state: replay,
    exported_at: exportedAt ?? new Date().toISOString(),
  };
}

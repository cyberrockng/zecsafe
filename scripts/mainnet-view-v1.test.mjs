import assert from "node:assert/strict";
import {
  buildMainnetViewPreflight,
  extractJsonObject,
  formatMainnetViewSummary,
  MAINNET_VIEW_PREFLIGHT_SCHEMA_VERSION,
  parseAccountList,
  parseAddressInspect,
  parseBalanceCommand,
  parseMainnetInfo,
  sanitizeSyncFailure,
} from "../src/mainnet-view-v1.mjs";

const env = {
  task_id: "ZSAFE-P0-017",
  run_id: "p0-017-20260711T231314Z",
  network: "main",
  wallet: {
    type: "view-only",
    address_type: "orchard-only unified address",
    orchard_address: "u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0",
  },
  toolchain: {
    zcash_devtool_commit: "1b065594d958d1cad2deafe7cd2e2fcc2774c46c",
    frost_tools_commit: "7d33a95fecc91dacdb1503933e2bee43780d3293",
    zcash_devtool_runtime: {
      mode: "p0-018-pre-ironwood-compat",
      base_commit: "1b065594d958d1cad2deafe7cd2e2fcc2774c46c",
      compatibility_patch_ref: "sha256:4a44cfc533dec72fb4e93bcbf81406260d4b3f6e77344b53035426ab297c7d8e",
      binary_ref: "sha256:8e8e2110e80bb5ea92924e7300ddcf57cb58e7e4f2a0439404b5b59f836ba0b9",
    },
  },
};

const accountOutput = `Account 9b81aa0f-5216-4007-977d-f8e95ac0ace9 (birthday height 3408981)
     Name: ZecSafeP017View
     UIVK: uivk1private
     UFVK: uview1private
     Source: imported
       Purpose: view-only`;

const inspectOutput = `Zcash address
 - Network: main
 - Kind: Unified Address
 - Receivers:
   - Orchard (u1y3untlvq77ntuw7f5g93nhtugwajggf4ta47zqcuy3z09y3sz9s336e0xmaxktzpt9fkt5sxeppa3s7q663dtuwa0m9p0wh95u2tz6a0)`;

{
  const parsed = extractJsonObject("INFO connecting\n{\"chain_name\":\"main\",\"chain_tip_height\":3409081,\"server_uri\":\"https://zec.rocks:443\"}\n");
  assert.equal(parsed.chain_name, "main");
}

{
  const account = parseAccountList(accountOutput);
  assert.equal(account.account_id, "9b81aa0f-5216-4007-977d-f8e95ac0ace9");
  assert.equal(account.birthday_height, 3408981);
  assert.equal(account.purpose, "view-only");
  assert.equal(JSON.stringify(account).includes("uview"), false);
}

{
  const info = parseMainnetInfo('{"chain_name":"main","chain_tip_height":3409081,"server_uri":"https://zec.rocks:443"}');
  assert.equal(info.chain_name, "main");
  assert.equal(info.chain_tip_height, 3409081);
}

{
  const inspect = parseAddressInspect(inspectOutput);
  assert.equal(inspect.network, "main");
  assert.equal(inspect.kind, "Unified Address");
  assert.deepEqual(inspect.receivers, ["Orchard"]);
}

{
  const waitBalance = parseBalanceCommand({
    status: 1,
    stderr: "Error: Insufficient information to build a wallet summary.",
  });
  assert.equal(waitBalance.command_status, "WAIT");
  assert.equal(waitBalance.available, false);
}

{
  const fundedBalance = parseBalanceCommand({
    status: 0,
    stdout: '{"total":10000,"sapling_spendable":0,"orchard_spendable":10000,"ironwood_spendable":0,"transparent_spendable":0,"chain_tip_height":3409099}\n',
  });
  assert.equal(fundedBalance.available, true);
  assert.equal(fundedBalance.total_zatoshis, 10000);
}

{
  assert.equal(
    sanitizeSyncFailure({
      status: 1,
      stderr: 'Error: code: "Unknown error", message: "unrecognized shielded protocol"',
    }),
    "unrecognized_shielded_protocol",
  );
  assert.equal(
    sanitizeSyncFailure({
      status: 1,
      stderr: "transport error\nfailed to lookup address information",
    }),
    "dns_error",
  );
}

{
  const report = buildMainnetViewPreflight({
    env,
    account: parseAccountList(accountOutput),
    mainnet_info: parseMainnetInfo('{"chain_name":"main","chain_tip_height":3409081,"server_uri":"https://zec.rocks:443"}'),
    address_inspect: parseAddressInspect(inspectOutput),
    balance: parseBalanceCommand({
      status: 1,
      stderr: "Error: Insufficient information to build a wallet summary.",
    }),
    coordinator_workspace_scan: {
      spend_key_absent: true,
      participant_share_absent: true,
    },
    sync: {
      attempted: true,
      status: "SYNC_COMMAND_FAILED",
      exit_status: 1,
      failure_reason: "unrecognized_shielded_protocol",
    },
    recorded_at: "2026-07-12T00:20:00.000Z",
  });
  assert.equal(report.schema_version, MAINNET_VIEW_PREFLIGHT_SCHEMA_VERSION);
  assert.equal(report.status, "WAIT_FUNDING");
  assert.equal(report.balance.funded_value_observed, false);
  assert.equal(report.sync.failure_reason, "unrecognized_shielded_protocol");
  assert.match(formatMainnetViewSummary(report), /\[WAIT\] funded_value_observed/);
  assert.match(formatMainnetViewSummary(report), /Sync failure reason: unrecognized_shielded_protocol/);
}

{
  const report = buildMainnetViewPreflight({
    env,
    account: parseAccountList(accountOutput),
    mainnet_info: parseMainnetInfo('{"chain_name":"main","chain_tip_height":3409081,"server_uri":"https://zec.rocks:443"}'),
    address_inspect: parseAddressInspect(inspectOutput),
    balance: parseBalanceCommand({
      status: 0,
      stdout: '{"total":10000,"sapling_spendable":0,"orchard_spendable":10000,"ironwood_spendable":0,"transparent_spendable":0,"chain_tip_height":3409099}\n',
    }),
    coordinator_workspace_scan: {
      spend_key_absent: true,
      participant_share_absent: true,
    },
    recorded_at: "2026-07-12T00:20:00.000Z",
  });
  assert.equal(report.status, "PASS");
  assert.equal(report.balance.funded_value_observed, true);
  assert.equal(report.toolchain.zcash_devtool_runtime.mode, "p0-018-pre-ironwood-compat");
  assert.match(report.limitations[0], /Funded value was observed/);
}

console.log("ZecSafe mainnet view preflight tests passed.");

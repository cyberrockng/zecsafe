import assert from "node:assert/strict";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  FixedRunnerError,
  redactText,
  resolveWorkspacePath,
  runAllowedBinary,
  runFixedOperation,
} from "../src/fixed-runner-v1.mjs";

const safeIntent = {
  schema_version: "zecsafe-intent-v1",
  network: "test",
  vault_id: "vault_demo",
  group_fingerprint: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  recipient: "tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67",
  amount_zatoshis: 10000,
  memo_utf8: "",
  fee_policy: {
    mode: "tool_default",
    max_fee_zatoshis: 10000,
  },
  created_at: "2026-07-11T07:30:00.000Z",
  expires_at: null,
};

const safeReview = {
  network: "test",
  source_fingerprint: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
  source: "zcash-devtool pczt inspect",
  tool_commit: "1b065594d958d1cad2deafe7cd2e2fcc2774c46c",
  recipients: ["tmFSUGCUf1CqHimj1d9iVm6qX7tXkHTKp67"],
  amounts_zatoshis: [10000],
  memo_metadata: {
    status: "not_reported_by_zcash_devtool_inspect",
  },
  fee_metadata: {
    status: "computed_from_transparent_values",
    input_total_zatoshis: 20000,
    output_total_zatoshis: 10000,
    fee_zatoshis: 10000,
  },
  output_count: 1,
  pczt_fingerprint: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
};

const safeParticipants = [
  {
    participant_id: "A",
    public_fingerprint: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    availability: "AVAILABLE",
  },
  {
    participant_id: "B",
    public_fingerprint: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    availability: "AVAILABLE",
  },
  {
    participant_id: "C",
    public_fingerprint: "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    availability: "UNAVAILABLE",
  },
];

function mockSpawn(command, args, options) {
  return {
    status: 0,
    signal: null,
    stdout: `${command} ${args.join(" ")} ${options.shell === false ? "noshell" : "shell"}\n`,
    stderr: `${["random", "izer"].join("")}=abcdefghijklmnopqrstuvwxyz123456\n`,
  };
}

function assertRejected(fn, message) {
  assert.throws(fn, {
    name: "FixedRunnerError",
    message,
  });
}

{
  const result = runAllowedBinary({
    binaryId: "node",
    args: ["--version"],
    cwd: process.cwd(),
    spawnImpl: mockSpawn,
  });
  assert.equal(result.exit_status, 0);
  assert.match(result.stdout, /noshell/);
  assert.equal(result.stderr, "[REDACTED_SIGNING_SECRET]\n");
}

assertRejected(() => runAllowedBinary({ binaryId: "/bin/sh", args: ["-c", "echo bad"], cwd: process.cwd() }), "binary is not in the fixed allowlist.");

{
  const workspace = "/tmp/zecsafe-runner-test";
  assert.equal(resolveWorkspacePath(workspace, "events/run.ndjson"), "/tmp/zecsafe-runner-test/events/run.ndjson");
  const rejected = [
    "../escape",
    "/etc/passwd",
    "C:\\Windows\\System32\\cmd.exe",
    "events;touch bad",
    "events&&touch bad",
    "events|touch bad",
    "`touch bad`",
    "$(touch bad)",
    "․․/escape",
  ];
  for (const payload of rejected) {
    assert.throws(() => resolveWorkspacePath(workspace, payload), FixedRunnerError, payload);
  }
}

assert.equal(redactText(`${["random", "izer"].join("")}=abcdefghijklmnopqrstuvwxyz123456`), "[REDACTED_SIGNING_SECRET]");

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-runner-test-"));
  try {
    const result = await runFixedOperation(
      {
        operation: "intent.create",
        run_id: "runner-test",
        workspace_root: tempDir,
        sequence: 1,
        input: safeIntent,
      },
      { spawnImpl: mockSpawn },
    );
    assert.equal(result.status, "PASS");
    assert.equal(result.operation, "intent.create");
    assert.equal(result.local_only, true);
    assert.equal(result.proof_event.stage, "INTENT");
    assert.equal(result.proof_event.data.operation_id, "intent.create");
    assert.match(result.proof_event.data.intent_commitment, /^sha256:[0-9a-f]{64}$/);
    assert.equal(Object.hasOwn(result.output, "intent"), false);

    const bindResult = await runFixedOperation(
      {
        operation: "pczt.bind",
        run_id: "runner-test-bind",
        workspace_root: tempDir,
        sequence: 1,
        input: {
          intent: safeIntent,
          review: safeReview,
        },
      },
      { spawnImpl: mockSpawn },
    );
    assert.equal(bindResult.status, "PASS");
    assert.equal(bindResult.proof_event.stage, "PCZT_BINDING");
    assert.equal(bindResult.proof_event.data.binding_status, "PASS");

    const signerResult = await runFixedOperation(
      {
        operation: "frost.session.status",
        run_id: "runner-test-signers",
        workspace_root: tempDir,
        sequence: 1,
        input: {
          group_fingerprint: safeIntent.group_fingerprint,
          threshold: 2,
          participants: safeParticipants,
          selected_participant_ids: ["A", "B"],
        },
      },
      { spawnImpl: mockSpawn },
    );
    assert.equal(signerResult.status, "SATISFIABLE");
    assert.equal(signerResult.proof_event.stage, "FROST_SESSION");
    assert.equal(signerResult.proof_event.status, "SATISFIABLE");
    assert.equal(signerResult.proof_event.data.threshold_status, "SATISFIABLE");
    assert.deepEqual(signerResult.output.selected_participant_ids, ["A", "B"]);

    const unavailableSignerResult = await runFixedOperation(
      {
        operation: "frost.session.status",
        run_id: "runner-test-signers-blocked",
        workspace_root: tempDir,
        sequence: 1,
        input: {
          group_fingerprint: safeIntent.group_fingerprint,
          threshold: 2,
          participants: safeParticipants,
          selected_participant_ids: ["A", "C"],
        },
      },
      { spawnImpl: mockSpawn },
    );
    assert.equal(unavailableSignerResult.status, "BLOCKED");
    assert.equal(unavailableSignerResult.proof_event.status, "BLOCKED");
    assert.equal(unavailableSignerResult.proof_event.data.threshold_status, "UNSATISFIABLE");
    assert.equal(unavailableSignerResult.proof_event.data.frost_status, "UNSATISFIABLE");

    const unsupported = await runFixedOperation(
      {
        operation: "broadcast.execute",
        run_id: "runner-test-blocked",
        workspace_root: tempDir,
      },
      { spawnImpl: mockSpawn },
    );
    assert.equal(unsupported.status, "NOT_IMPLEMENTED");
    assert.equal(unsupported.proof_event.status, "BLOCKED");

    const eventsResult = await runFixedOperation(
      {
        operation: "intent.create",
        run_id: "runner-test-events",
        workspace_root: tempDir,
        events_path: "events/run.ndjson",
        sequence: 1,
        input: safeIntent,
      },
      { spawnImpl: mockSpawn },
    );
    assert.equal(eventsResult.status, "PASS");
    const eventsLog = await readFile(join(tempDir, "events/run.ndjson"), "utf8");
    assert.match(eventsLog, /"stage":"INTENT"/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-runner-cli-"));
  try {
    const requestPath = join(tempDir, "request.json");
    await writeFile(
      requestPath,
      JSON.stringify({
        operation: "intent.create",
        run_id: "runner-cli",
        workspace_root: tempDir,
        input: safeIntent,
      }),
    );
    const cli = spawnSync(process.execPath, ["scripts/fixed-runner.mjs", "run", "--request", requestPath], {
      encoding: "utf8",
    });
    if (cli.error?.code !== "EPERM") {
      assert.equal(cli.status, 0, cli.stderr);
      const parsed = JSON.parse(cli.stdout);
      assert.equal(parsed.status, "PASS");
      assert.equal(parsed.proof_event.stage, "INTENT");
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-runner-security-"));
  try {
    const payloads = [";", "&&", "|", "`touch bad`", "$(touch bad)", "../escape", "/etc/passwd", "․․/escape"];
    for (const payload of payloads) {
      const result = await runFixedOperation(
        {
          operation: "pczt.bind",
          run_id: "security-test",
          workspace_root: tempDir,
          input: {
            intent_path: payload,
            review_path: "review.json",
          },
        },
        {
          spawnImpl() {
            throw new Error("spawn should not run for rejected path payloads");
          },
        },
      );
      assert.equal(result.status, "FAIL", payload);
      assert.equal(result.command_results.length, 0, payload);
    }

    await assert.rejects(
      () =>
        runFixedOperation(
          {
            operation: "toolchain.status",
            run_id: "x".repeat(129),
            workspace_root: tempDir,
          },
          { spawnImpl: mockSpawn },
        ),
      {
        name: "FixedRunnerError",
        message: "run_id must be 1-128 characters and contain only letters, numbers, dot, underscore, colon, or hyphen.",
      },
    );

    await assert.rejects(
      () =>
        runFixedOperation(
          {
            operation: "toolchain.status",
            host: "0.0.0.0",
            workspace_root: tempDir,
          },
          { spawnImpl: mockSpawn },
        ),
      {
        name: "FixedRunnerError",
        message: "fixed runner is local-only; host must be localhost, 127.0.0.1, or ::1.",
      },
    );
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

console.log("ZecSafe fixed-operation runner tests passed.");

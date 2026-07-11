import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { selectSignersV1 } from "../src/signer-selection-v1.mjs";

function fp(char) {
  return `sha256:${char.repeat(64)}`;
}

const alice = {
  participant_id: "A",
  public_fingerprint: fp("a"),
  availability: "AVAILABLE",
};

const bob = {
  participant_id: "B",
  public_fingerprint: fp("b"),
  availability: "AVAILABLE",
};

const carolUnavailable = {
  participant_id: "C",
  public_fingerprint: fp("c"),
  availability: "UNAVAILABLE",
};

const carolUnknown = {
  participant_id: "C",
  public_fingerprint: fp("c"),
  availability: "UNKNOWN",
};

function select(overrides = {}) {
  return selectSignersV1({
    run_id: "run_selection_test",
    group_fingerprint: fp("d"),
    threshold: 2,
    participants: [alice, bob, carolUnavailable],
    selected_participant_ids: ["A", "B"],
    ...overrides,
  });
}

{
  const result = select();
  assert.equal(result.schema_version, "zecsafe-signer-selection-v1");
  assert.equal(result.status, "SATISFIABLE");
  assert.equal(result.frost_session, "ALLOWED");
  assert.equal(result.selected_count, 2);
  assert.deepEqual(
    result.participants.map((participant) => ({
      id: participant.participant_id,
      availability: participant.availability,
      selected: participant.selected,
    })),
    [
      { id: "A", availability: "AVAILABLE", selected: true },
      { id: "B", availability: "AVAILABLE", selected: true },
      { id: "C", availability: "UNAVAILABLE", selected: false },
    ],
  );
  assert.deepEqual(result.selected_participant_ids, ["A", "B"]);
  assert.equal(result.unavailable_count, 1);
  assert.deepEqual(result.blocked_operations, []);
  assert.match(result.selection_ref, /^sha256:[0-9a-f]{64}$/);
  assert.equal(result.proof_event.stage, "FROST_SESSION");
  assert.equal(result.proof_event.status, "SATISFIABLE");
  assert.equal(result.proof_event.data.threshold, 2);
  assert.deepEqual(result.proof_event.data.selected_public_fingerprints, [fp("a"), fp("b")]);
}

assert.equal(
  select({
    participants: [
      { ...alice, availability: "UNAVAILABLE" },
      { ...bob, availability: "UNAVAILABLE" },
      carolUnavailable,
    ],
    selected_participant_ids: [],
  }).status,
  "UNSATISFIABLE",
);

assert.equal(
  select({
    participants: [{ ...alice }, { ...bob, availability: "UNAVAILABLE" }, carolUnavailable],
    selected_participant_ids: ["A"],
  }).status,
  "UNSATISFIABLE",
);

assert.equal(
  select({
    participants: [alice, bob, { ...carolUnavailable, availability: "AVAILABLE" }],
    selected_participant_ids: [],
  }).status,
  "UNSATISFIABLE",
);

assert.equal(
  select({
    participants: [alice, bob, carolUnavailable],
    selected_participant_ids: ["A", "B"],
  }).status,
  "SATISFIABLE",
);

assert.equal(
  select({
    participants: [alice, bob, { ...carolUnavailable, availability: "AVAILABLE" }],
    selected_participant_ids: ["A", "B"],
  }).status,
  "SATISFIABLE",
);

{
  const result = select({ selected_participant_ids: ["A"] });
  assert.equal(result.status, "UNSATISFIABLE");
  assert.equal(result.frost_session, "BLOCKED");
  assert.ok(result.blocked_operations.includes("frost.session.start"));
}

{
  const result = select({ selected_participant_ids: ["A", "C"] });
  assert.equal(result.status, "BLOCKED");
  assert.equal(result.frost_session, "BLOCKED");
  assert.ok(result.warnings.some((warning) => warning.includes("unavailable")));
}

{
  const result = select({
    participants: [alice, bob, carolUnknown],
    selected_participant_ids: ["A", "C"],
  });
  assert.equal(result.status, "BLOCKED");
  assert.ok(result.warnings.some((warning) => warning.includes("UNKNOWN")));
}

{
  const result = select({
    participants: [alice, bob, carolUnavailable],
    selected_participant_ids: undefined,
  });
  assert.equal(result.status, "SATISFIABLE");
  assert.deepEqual(result.selected_participant_ids, ["A", "B"]);
}

assert.throws(
  () =>
    select({
      threshold: 4,
    }),
  {
    name: "SignerSelectionError",
    message: "threshold cannot exceed participant count.",
  },
);

assert.throws(
  () =>
    select({
      participants: [alice, { ...bob, participant_id: "A" }, carolUnavailable],
    }),
  {
    name: "SignerSelectionError",
    message: "participant_id values must be unique.",
  },
);

assert.throws(
  () =>
    select({
      selected_participant_ids: ["A", "A"],
    }),
  {
    name: "SignerSelectionError",
    message: "selected_participant_ids values must be unique.",
  },
);

{
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-selection-test-"));
  try {
    const inputPath = join(tempDir, "selection.json");
    await writeFile(
      inputPath,
      JSON.stringify({
        run_id: "run_selection_cli",
        threshold: 2,
        participants: [alice, bob, carolUnavailable],
        selected_participant_ids: ["A", "C"],
      }),
    );

    const cli = spawnSync(process.execPath, ["scripts/signer-selection.mjs", "--json", inputPath, "--summary"], {
      encoding: "utf8",
    });

    if (cli.error?.code !== "EPERM") {
      assert.equal(cli.status, 2, cli.stderr);
      assert.equal(cli.stdout, "THRESHOLD: UNSATISFIABLE\nSIGNER SELECTION: BLOCKED\nSELECTED: 2/3\n");
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

console.log("ZecSafe signer selection tests passed.");

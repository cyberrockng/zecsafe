import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { tmpdir } from "node:os";

const demoRepo = "https://github.com/ZcashFoundation/frost-zcash-demo";
const participantIds = [
  "0100000000000000000000000000000000000000000000000000000000000000",
  "0200000000000000000000000000000000000000000000000000000000000000",
  "0300000000000000000000000000000000000000000000000000000000000000",
];

function cargoBin(command) {
  const home = process.env.CARGO_HOME ?? join(process.env.USERPROFILE ?? process.env.HOME ?? "", ".cargo");
  return join(home, "bin", process.platform === "win32" ? `${command}.exe` : command);
}

function sha256Hex(value) {
  return createHash("sha256").update(value).digest("hex");
}

function startProcess(command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    windowsHide: true,
    shell: false,
    stdio: ["pipe", "pipe", "pipe"],
  });
  let output = "";

  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });

  child.done = new Promise((resolve) => {
    child.on("error", (error) => resolve({ code: 1, output, error }));
    child.on("close", (code) => resolve({ code, output }));
  });
  child.output = () => output;
  child.writeLine = (line) => child.stdin.write(`${line}\n`);

  return child;
}

async function waitFor(child, needle, timeoutMs = 8_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (child.output().includes(needle)) return;
    const done = await Promise.race([
      child.done.then((result) => ({ done: true, result })),
      new Promise((resolve) => setTimeout(() => resolve({ done: false }), 80)),
    ]);
    if (done.done) {
      if (done.result.output.includes(needle)) return;
      throw new Error(`Process exited before "${needle}". Output:\n${done.result.output}`);
    }
  }
  throw new Error(`Timed out waiting for "${needle}". Output:\n${child.output()}`);
}

function extractJsonAfter(output, label) {
  const lines = output.split(/\r?\n/);
  const labelIndex = lines.findIndex((line) => line.trim() === label || line.trim().startsWith(label));
  if (labelIndex === -1) {
    throw new Error(`Could not find ${label} in output:\n${output}`);
  }

  const jsonLine = lines.slice(labelIndex + 1).find((line) => line.trim().startsWith("{"));
  if (!jsonLine) {
    throw new Error(`Could not find JSON after ${label} in output:\n${output}`);
  }

  return JSON.parse(jsonLine.trim());
}

function extractSignature(output) {
  const lines = output.split(/\r?\n/);
  const labelIndex = lines.findIndex((line) => line.trim() === "Signature:");
  if (labelIndex === -1) {
    throw new Error(`Could not find aggregate signature in coordinator output:\n${output}`);
  }
  const signature = lines[labelIndex + 1]?.trim();
  if (!/^[0-9a-f]+$/i.test(signature ?? "")) {
    throw new Error(`Invalid aggregate signature from coordinator:\n${output}`);
  }
  return signature;
}

async function finish(child, name) {
  if (!child.stdin.destroyed) child.stdin.end();
  const result = await child.done;
  if (result.code !== 0) {
    throw new Error(`${name} exited with code ${result.code}.\n${result.output}`);
  }
  return result.output;
}

async function main() {
  const tempDir = await mkdtemp(join(tmpdir(), "zecsafe-frost-"));
  const trustedDealer = cargoBin("trusted-dealer");
  const coordinatorBin = cargoBin("coordinator");
  const participantBin = cargoBin("participant");
  const signingMessage = process.env.ZECSAFE_FROST_MESSAGE || "ZecSafe 2-of-3 FROST threshold signing demo";
  const proposalPayloadHash = process.env.ZECSAFE_PROPOSAL_PAYLOAD_HASH || "";
  const proposalId = process.env.ZECSAFE_PROPOSAL_ID || "";
  const proposalPayload = process.env.ZECSAFE_PROPOSAL_PAYLOAD || "";

  try {
    const dealer = startProcess(
      trustedDealer,
      [
        "--threshold",
        "2",
        "--num-signers",
        "3",
        "--public-key-package",
        "public-key-package.json",
        "--key-package",
        "key-package-{}.json",
      ],
      tempDir,
    );
    await finish(dealer, "trusted-dealer");

    const publicKeyPackage = JSON.parse(await readFile(join(tempDir, "public-key-package.json"), "utf8"));
    const keyPackages = await Promise.all(
      [1, 2, 3].map((index) => readFile(join(tempDir, `key-package-${index}.json`), "utf8").then(JSON.parse)),
    );

    const signer1 = startProcess(participantBin, ["--cli", "--key-package", "key-package-1.json"], tempDir);
    const signer2 = startProcess(participantBin, ["--cli", "--key-package", "key-package-2.json"], tempDir);
    await Promise.all([
      waitFor(signer1, "Enter the JSON-encoded SigningPackage:"),
      waitFor(signer2, "Enter the JSON-encoded SigningPackage:"),
    ]);

    const commitment1 = extractJsonAfter(signer1.output(), "SigningCommitments:");
    const commitment2 = extractJsonAfter(signer2.output(), "SigningCommitments:");

    const messagePath = join(tempDir, "message.bin");
    await writeFile(messagePath, signingMessage);
    const coordinator = startProcess(
      coordinatorBin,
      [
        "--cli",
        "--num-signers",
        "2",
        "--public-key-package",
        "public-key-package.json",
        "--message",
        messagePath,
      ],
      tempDir,
    );

    await waitFor(coordinator, "Identifier for participant 1");
    coordinator.writeLine(participantIds[0]);
    await waitFor(coordinator, `commitments for participant ${participantIds[0]}`);
    coordinator.writeLine(JSON.stringify(commitment1));

    await waitFor(coordinator, "Identifier for participant 2");
    coordinator.writeLine(participantIds[1]);
    await waitFor(coordinator, `commitments for participant ${participantIds[1]}`);
    coordinator.writeLine(JSON.stringify(commitment2));

    await waitFor(coordinator, "Signing Package:");
    const signingPackage = extractJsonAfter(coordinator.output(), "Signing Package:");

    signer1.writeLine(JSON.stringify(signingPackage));
    signer2.writeLine(JSON.stringify(signingPackage));
    await Promise.all([
      waitFor(signer1, "Do you want to sign it?"),
      waitFor(signer2, "Do you want to sign it?"),
    ]);
    signer1.writeLine("y");
    signer2.writeLine("y");

    await Promise.all([waitFor(signer1, "SignatureShare:"), waitFor(signer2, "SignatureShare:")]);
    const signatureShare1 = extractJsonAfter(signer1.output(), "SignatureShare:");
    const signatureShare2 = extractJsonAfter(signer2.output(), "SignatureShare:");

    await waitFor(coordinator, `signature shares for participant ${participantIds[0]}`);
    coordinator.writeLine(JSON.stringify(signatureShare1));
    await waitFor(coordinator, `signature shares for participant ${participantIds[1]}`);
    coordinator.writeLine(JSON.stringify(signatureShare2));

    await waitFor(coordinator, "Signature:");
    const aggregatedSignature = extractSignature(coordinator.output());

    await Promise.all([finish(signer1, "participant 1"), finish(signer2, "participant 2"), finish(coordinator, "coordinator")]);

    process.stdout.write(
      `${JSON.stringify(
        {
          library: "ZcashFoundation/frost-zcash-demo",
          repo: demoRepo,
          groupPublicKey: publicKeyPackage.verifying_key,
          keyShares: keyPackages.map((keyPackage) => sha256Hex(keyPackage.signing_share)),
          signingRound1: {
            participant1: `${commitment1.hiding}${commitment1.binding}`,
            participant2: `${commitment2.hiding}${commitment2.binding}`,
          },
          signingRound2: {
            participant1: signatureShare1.share,
            participant2: signatureShare2.share,
          },
          aggregatedSignature,
          verified: true,
          signedMessage: signingMessage,
          messageHash: sha256Hex(signingMessage),
          proposalId,
          proposalPayloadHash,
          proposalPayload: proposalPayload ? JSON.parse(proposalPayload) : null,
          threshold: "2-of-3",
          ciphersuite: publicKeyPackage.header?.ciphersuite ?? "FROST-ED25519-SHA512-v1",
          note: "Generated locally with trusted-dealer, participant, and coordinator from ZcashFoundation/frost-zcash-demo.",
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    try {
      await rm(tempDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // Windows can briefly hold handles to child-process working directories.
    }
  }
}

await main();

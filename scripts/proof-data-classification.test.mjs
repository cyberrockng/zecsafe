import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const proof = JSON.parse(await readFile("fixtures/verified-mainnet-run/proof.json", "utf8"));
const events = JSON.parse(await readFile("fixtures/verified-mainnet-run/events.public.json", "utf8"));

const bannedExactKeys = new Set([
  "amount_zatoshis",
  "memo_utf8",
  "ufvk",
  "fvk",
  "mnemonic",
  "secret_share",
  "randomizer",
  "nonce",
]);

const bannedKeyPatterns = [
  /^recipient$/i,
  /spending/i,
  /private/i,
  /participant_secret/i,
  /frost_secret/i,
  /signing_share/i,
  /raw_pczt/i,
  /raw_sighash/i,
  /raw_signature/i,
  /wallet_db/i,
  /wallet_path/i,
  /viewing_key/i,
];

const bannedValuePatterns = [
  /\bu1[ac-hj-np-z02-9]{50,}\b/i,
  /\butest1[ac-hj-np-z02-9]{50,}\b/i,
  /\bzs1[ac-hj-np-z02-9]{40,}\b/i,
  /\bztestsapling1[ac-hj-np-z02-9]{40,}\b/i,
  /\buview1[ac-hj-np-z02-9]{50,}\b/i,
  /\buvf1[ac-hj-np-z02-9]{50,}\b/i,
  /\bzviews[ac-hj-np-z02-9]{40,}\b/i,
  /\bsecret-extended-key-(?:main|test)[a-z0-9]{20,}\b/i,
  /\b(?:mnemonic|seed phrase)\s*[:=]\s*(?:[a-z]+\s+){11,23}[a-z]+/i,
  /\b(?:secret_share|signing_share|participant_secret|frost_secret)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/i,
  /\b(?:randomizer|signing_randomizer|nonce)\s*[:=]\s*["']?[A-Za-z0-9+/=_-]{16,}/i,
];

function allowedClassificationLabel(path, key, value) {
  if (key === "field" && path.includes(".pczt.checks[")) {
    return ["recipient", "amount", "memo_policy"].includes(value);
  }
  if (path.endsWith(".data.check_statuses") && ["recipient", "amount"].includes(key)) {
    return true;
  }
  if (key === "public_message" && /recipient|amount|memo/i.test(String(value))) {
    return true;
  }
  if (path.includes(".limitations[") && /recipient|amount|memo|randomizer|nonce|UFVK|FROST shares/i.test(String(value))) {
    return true;
  }
  if (key === "note" && /randomizers|shares|PCZT bodies/i.test(String(value))) {
    return true;
  }
  return false;
}

function scan(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => scan(item, `${path}[${index}]`));
    return;
  }

  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      if (!allowedClassificationLabel(path, key, child)) {
        assert.equal(bannedExactKeys.has(key), false, `${childPath} uses banned public proof key`);
        assert.equal(bannedKeyPatterns.some((pattern) => pattern.test(key)), false, `${childPath} uses banned public proof key`);
      }
      scan(child, childPath);
    }
    return;
  }

  if (typeof value === "string" && !allowedClassificationLabel(path.replace(/\.[^.]+$/, ""), path.split(".").at(-1), value)) {
    assert.equal(bannedValuePatterns.some((pattern) => pattern.test(value)), false, `${path} contains policy-excluded public value`);
  }
}

scan(proof);
scan(events);

console.log("ZecSafe public proof data-classification tests passed.");

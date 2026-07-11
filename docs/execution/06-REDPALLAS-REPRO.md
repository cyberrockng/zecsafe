# ZSAFE-P0-002 - RedPallas 2-of-3 Reproduction

Status: `COMPLETED`

Updated UTC: `2026-07-11T04:30:50Z`

Purpose: reproduce a pinned frost-tools 2-of-3 RedPallas signing flow outside the repository before building any ZecSafe proof runner.

## External Workspace

Run directory:

```text
/home/dell/.zecsafe/runs/p0-002-20260711T041846Z
```

Pinned toolchain:

```text
Repository: https://github.com/ZcashFoundation/frost-tools
Commit: 7d33a95fecc91dacdb1503933e2bee43780d3293
Binaries used: frostd, frost-client
```

No generated config, key package, TLS key, log, signature file, or other run artifact was copied into the repository.

## Result

The current `frost-client` plus `frostd` path successfully produced a RedPallas group signature with:

```text
threshold: 2
participant count: 3
selected signers: Alice and Bob
offline signer: Eve
ciphersuite selector: redpallas
```

Public group key:

```text
faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28
```

Selected signer communication public keys:

```text
Alice: 00c8aa42673fa3a78265ec6e04fc7acdca310eb2f91e7043cbb943239650c50b
Bob:   ba6d22b5c90aecb0d388f178ad130fd65d6bca40b78cb9fa6657b8aa52e8e12c
```

Eve's config was created by the trusted-dealer step but was not used in the signing session.

## Evidence Hashes

Message file:

```text
path: /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/message.txt
bytes: 56
sha256: 85c3ce7ed93397093231ae7e34c9f7b05f245263983b21da2bee1a7d4a26d3a1
```

Public key package:

```text
path: /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/public-key-package.json
bytes: 573
sha256: c84c62b61edd13d104f0bc568c8c33a6a174cfdc5253f35f0bebd76ef7f6f331
```

Generated signature:

```text
path: /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/signature-attempt2.raw
bytes: 64
sha256: 70ce85e40b7bf1987e0c5af7104dc26ba76f312a58f96969ae38bcbdcc138e94
```

The signature bytes themselves are not stored in this repository.

## Commands

Transport setup:

```bash
openssl genrsa -out /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.key.pem 2048
openssl req -x509 -new -nodes -key /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.key.pem -sha256 -days 1 -subj '/CN=ZecSafe P0-002 Local CA' -out /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.cert.pem -addext 'basicConstraints=critical,CA:TRUE' -addext 'keyUsage=critical,keyCertSign,cRLSign'
openssl genrsa -out /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.key.pem 2048
openssl req -new -key /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.key.pem -subj '/CN=localhost' -out /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.csr.pem -addext 'subjectAltName=IP:127.0.0.1,DNS:localhost'
openssl x509 -req -in /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.csr.pem -CA /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.cert.pem -CAkey /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.key.pem -CAcreateserial -out /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.cert.pem -days 1 -sha256 -extfile /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.ext
```

Config and group setup:

```bash
cargo run --locked -p frost-client -- init -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/alice.toml
cargo run --locked -p frost-client -- init -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/bob.toml
cargo run --locked -p frost-client -- init -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/eve.toml
cargo run --locked -p frost-client -- trusted-dealer -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/alice.toml -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/bob.toml -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/eve.toml -d 'ZecSafe P0-002 RedPallas 2-of-3' -N Alice,Bob,Eve -s 127.0.0.1:2746 -C redpallas -t 2 -n 3
```

Signing run:

```bash
cargo run --locked -p frostd -- --ip 127.0.0.1 --port 2746 --tls-cert /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.cert.pem --tls-key /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/server.key.pem
SSL_CERT_FILE=/home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.cert.pem cargo run --locked -p frost-client -- coordinator -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/alice.toml -g faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28 -S 00c8aa42673fa3a78265ec6e04fc7acdca310eb2f91e7043cbb943239650c50b,ba6d22b5c90aecb0d388f178ad130fd65d6bca40b78cb9fa6657b8aa52e8e12c -m /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/message.txt -o /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/signature-attempt2.raw
printf 'y\n' | SSL_CERT_FILE=/home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.cert.pem cargo run --locked -p frost-client -- participant -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/alice.toml -g faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28
printf 'y\n' | SSL_CERT_FILE=/home/dell/.zecsafe/runs/p0-002-20260711T041846Z/tls/ca.cert.pem cargo run --locked -p frost-client -- participant -c /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/configs/bob.toml -g faa9ced198abf00043ab8fc7e2092f9311076c4f4cd0108e06a276b20302ad28
```

Local network commands required sandbox escalation because the managed sandbox blocked both binding and connecting to `127.0.0.1`.

## Sanitized Log Proof

Server:

```text
server running
starting HTTPS server at 127.0.0.1:2746
```

Coordinator:

```text
Logging in...
Creating signing session...
Waiting for participants to send their commitments
Sending SigningPackage to participants...
Waiting for participants to send their SignatureShares...
Raw signature written to /home/dell/.zecsafe/runs/p0-002-20260711T041846Z/signature-attempt2.raw
```

Alice participant:

```text
Logging in...
Joining signing session...
Sending commitments to coordinator...
Signing package received
Do you want to sign it? (y/n)
Done
```

Bob participant:

```text
Logging in...
Joining signing session...
Sending commitments to coordinator...
Signing package received
Do you want to sign it? (y/n)
Done
```

## Findings

The lower-level `trusted-dealer`, `coordinator`, and `participant` binaries are not the right production path for this gate. The current `coordinator` binary routes through CLI comms, and the CLI comms path does not support rerandomized RedPallas signing. The successful route is the current high-level `frost-client` with `frostd`.

The current `frost-client` requires HTTPS and normal certificate validation. For local reproduction, a temporary local CA was generated and supplied only through `SSL_CERT_FILE` for the client processes.

The participant flow requires explicit signer confirmation after showing the message hex. The first attempt with empty stdin reached the review prompt and cancelled. The successful attempt provided `y` for Alice and Bob only.

## Security Boundary

Private or sensitive external files produced during this task:

```text
configs/alice.toml
configs/bob.toml
configs/eve.toml
key-package-1.json
key-package-2.json
key-package-3.json
tls/ca.key.pem
tls/server.key.pem
participant and coordinator logs
```

These files remain outside the repository under `/home/dell/.zecsafe/runs/p0-002-20260711T041846Z`.

No wallet database was created.

No PCZT was created.

No Zcash viewing key or spending key was used.

No mainnet wallet was funded.

No transaction was broadcast.

## Limitations

This is a trusted-dealer test reproduction, not DKG.

The trusted-dealer command itself warns that it is tests-only and does not preserve all share-validation information needed by real participants.

This is RedPallas arbitrary-message signing through frost-tools. It is not yet Zcash PCZT signing, SIGHASH signing, transaction authorization, or mainnet evidence.

The coordinator generated the RedPallas rerandomization internally. This task did not create a standalone verifier artifact that can re-verify the signature from only the sanitized hashes above. The future proof runner must persist or derive the verification context explicitly.

## Acceptance Criteria

- [x] Used pinned frost-tools commit `7d33a95fecc91dacdb1503933e2bee43780d3293`.
- [x] Created a 2-of-3 RedPallas group.
- [x] Selected two signers and left the third signer offline.
- [x] Alice participant reviewed and approved the message.
- [x] Bob participant reviewed and approved the message.
- [x] Coordinator produced a 64-byte signature file.
- [x] Private configs, key packages, TLS keys, logs, and signature file stayed outside the repository.
- [x] No wallet, PCZT, mainnet funding, or broadcast occurred.

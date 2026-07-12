.PHONY: judge-proof judge-proof-tamper judge-proof-mainnet judge-proof-mainnet-tamper proof-run-dry mainnet-preflight mainnet-watch

judge-proof:
	npm run proof:verify -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary

judge-proof-tamper:
	npm run proof:tamper -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary

judge-proof-mainnet:
	npm run proof:verify -- fixtures/verified-mainnet-run/proof.json --summary

judge-proof-mainnet-tamper:
	npm run proof:tamper -- fixtures/verified-mainnet-run/proof.json --summary

proof-run-dry:
	npm run proof:run -- --dry-broadcast --summary

mainnet-preflight:
	npm run mainnet:preflight -- --summary

mainnet-watch:
	npm run mainnet:watch -- --sync --summary --max-attempts 30 --interval-ms 60000

.PHONY: judge-proof judge-proof-tamper proof-run-dry

judge-proof:
	npm run proof:verify -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary

judge-proof-tamper:
	npm run proof:tamper -- fixtures/proofs/p0-014-zecsafe-proof-v1.json --summary

proof-run-dry:
	npm run proof:run -- --dry-broadcast --summary

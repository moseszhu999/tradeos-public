# Public source focused profiles v1

This public controller change adds four fixed, reviewed and non-parameterized validation profiles:

- `public-market-ted-source`
- `public-market-world-bank-source`
- `public-market-source-registry`
- `public-market-source-sanitization`

Each profile pins canonical private files and exact commands. Carrier requests cannot provide commands, test paths, URLs, environment variables, credentials, database actions, deployments or network probes.

The profiles run clean dependency installation, one exact focused Vitest file, full typecheck and production build. TED and World Bank profiles also run a fixed collector `node --check`. Private output remains sealed and deleted.

Controller-local validation before merge:

```text
node --check scripts/run-private-profile.mjs: PASS
node --test test/public-source-focused-profiles.test.mjs: 3 / 3 PASS
unresolved review threads: 0
```

GitHub Actions remains the merge gate. Local validation does not replace the public workflow result.

This controller change does not contain private source code or logs and does not authorize a live network probe, deployment, database migration, persistence, Supplier/RFQ/SourcingProject/Case creation, external send, financing, payment, token, RWA or chain action.

# tradeOS Public CI

This repository is the public, isolated CI control plane for the private tradeOS application repository.

## System of record

The private repository `moseszhu999/chaintrace-app` remains the product and source-of-truth repository. This public repository is not a deployment source, product fork, package mirror, or place to publish private implementation details.

TrainingOS may be inspected read-only as a proven architecture reference. This repository performs no TrainingOS implementation, CI execution, database work, pull-request work, or product work.

## Purpose

- validate an exact lowercase 40-character private commit SHA;
- verify its exact merge base and changed-file scope;
- run fixed, reviewed validation profiles on GitHub-hosted runners;
- produce only sanitized counts, stage names, SHAs, and closed verdicts;
- provide public CI evidence for release and integration gates, including real Codex and WorkBuddy client integration profiles.

## Security boundary

This repository must never contain or expose:

- private source snapshots or private Git history;
- customer, trade, counterparty, shipment, finance, identity, wallet, or production records;
- production URLs, keys, tokens, project references, database rows, or raw logs;
- migration bodies or sensitive command output;
- artifacts containing private repository content;
- deployment credentials or production-write capability.

Private checkout must be read-only, pinned to an exact SHA, use `persist-credentials: false`, and keep raw output in mode-restricted runner-local files. Every run must delete the private checkout and sealed logs. No artifact upload, production deployment, production database write, chain submission, payment, settlement, token movement, or external business action is permitted.

## CI model

The public controller accepts only fixed validation profiles. Inputs may provide exact SHAs, counts, booleans, and approved profile names; they may not provide shell commands or executable expressions.

```text
bounded-runtime
agent-client-contract
codex-integration
workbuddy-integration
web-product
main-release
```

`main-release` independently verifies that the requested SHA still equals the live private `main` head. It also requires the shared tradeOS MCP core and at least one dedicated executable Codex or WorkBuddy integration contract. A stale SHA or documentation-only client claim cannot pass.

Detailed contracts:

- [Public exact-head CI](docs/public-exact-head-ci.md)
- [tradeOS MCP reference architecture](docs/tradeos-mcp-reference-architecture.md)

## Verdict vocabulary

```text
PASS
FAIL
BASELINE_FAILURE
INFRASTRUCTURE_BLOCKED
NOT_RUN
```

`NOT_RUN` is never a release approval.

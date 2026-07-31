# tradeOS public exact-head CI

`moseszhu999/tradeos-public` is the public hosted validation controller for the private product repository `moseszhu999/chaintrace-app`.

TrainingOS may be inspected read-only as a proven architectural reference. No TrainingOS code, workflow, database, pull request, or product task is owned or changed by this repository.

## Immutable target lock

Every run is bound to:

- one lowercase 40-character private head SHA;
- one exact merge-base SHA;
- one exact changed-file count;
- one fixed validation profile.

For `main-release`, the requested private SHA, expected base SHA, expected main SHA, and independently checked live private `main` SHA must all be identical. A moved or stale main cannot pass.

## Fixed profiles

```text
bounded-runtime
agent-client-contract
codex-integration
workbuddy-integration
web-product
main-release
```

Inputs cannot supply shell commands, executable arguments, SQL, or dynamic expressions. Commands and evidence contracts are owned by the public controller.

- `bounded-runtime` runs clean install, unit/contract tests, and TypeScript typecheck.
- `agent-client-contract` requires the canonical tradeOS MCP entrypoint, shared authenticated context, composable server, client-identity boundary, and MCP contract tests.
- `codex-integration` adds a fixed Codex client acceptance contract and production build.
- `workbuddy-integration` adds a fixed WorkBuddy client acceptance contract and production build.
- `web-product` runs tests, typecheck, and the production Next.js build.
- `main-release` requires the canonical MCP core plus at least one real Codex or WorkBuddy integration contract, then runs application tests, typecheck, production build, Hardhat compile, and contract tests.

The existence of documentation or a string mentioning a client is not sufficient. Client profiles require canonical implementation paths and dedicated executable acceptance contracts.

## Controlled request carrier

The controller is dispatched from a reviewed same-repository pull request rather than by copying private source or exposing a general command input.

The carrier must:

- use a branch beginning with `ci/exact-head-request/`;
- come from `moseszhu999/tradeos-public`, never a fork;
- change exactly one file: `.github/exact-head-request.json`;
- provide exactly the approved request keys;
- use lowercase 40-character SHAs and one fixed profile;
- contain no command, executable argument, SQL, path override, environment override, or deployment instruction.

The request driver validates the carrier against public `main`, then dispatches `.github/workflows/tradeos-public-exact-head.yml` on public `main`. The carrier cannot modify the controller used for its own run and cannot weaken profile contracts. A later private commit invalidates the exact-head evidence.

## Private checkout boundary

- private checkout uses `PRIVATE_REPO_READ_TOKEN` only;
- checkout is pinned to the exact SHA;
- `persist-credentials: false` is mandatory;
- raw output is redirected to mode-restricted runner-local files;
- public output is limited to exact SHAs, counts, fixed stage names, failure labels, and a closed verdict;
- no artifact is uploaded;
- cleanup removes private checkouts and sealed logs on every run;
- no deployment, production database write, external business write, chain submission, payment, settlement, or token movement is permitted.

## Verdict vocabulary

```text
PASS
FAIL
BASELINE_FAILURE
INFRASTRUCTURE_BLOCKED
NOT_RUN
```

`NOT_RUN` is never approval. An exact current-main deterministic failure is `BASELINE_FAILURE`; an unavailable credential or runner dependency is `INFRASTRUCTURE_BLOCKED`, not PASS.

## Required repository secret

The public repository requires one narrowly scoped secret:

```text
PRIVATE_REPO_READ_TOKEN
```

It must have read-only access to `moseszhu999/chaintrace-app`. It must not have write, Actions administration, deployment, package publication, database, or organization-management authority.

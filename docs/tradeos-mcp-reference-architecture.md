# tradeOS MCP reference architecture

This document defines the tradeOS MCP architecture contract. TrainingOS is a read-only reference for proven composition and safety patterns only; tradeOS owns its own names, domain model, Runtime, routes, tests, and release decisions.

## Product position

Codex and WorkBuddy are external Agent clients, not tradeOS owners.

```text
Codex / WorkBuddy / compatible MCP client
→ tradeOS MCP Gateway
→ server-derived identity and client context
→ role and organization authorization
→ bounded tool layer
→ canonical tradeOS Runtime owner
→ confirmation boundary when required
→ immutable audit evidence
```

No client may connect directly to Supabase, use `service_role`, select another actor identity, bypass canonical Runtime owners, or convert an Agent proposal into a formal business decision.

## Canonical deployment shape

The initial Next.js implementation paths are fixed to:

```text
app/api/integrations/agents/mcp/route.ts
lib/tradeos-agent-gateway/context.ts
lib/tradeos-agent-gateway/client-identity.ts
lib/tradeos-agent-gateway/mcp-server.ts
tests/tradeos-agent-gateway/mcp-contract.test.ts
```

Client-specific acceptance contracts are fixed to:

```text
tests/tradeos-agent-gateway/codex-integration.test.ts
tests/tradeos-agent-gateway/workbuddy-integration.test.ts
```

There is one shared MCP endpoint. Client integrations must not create a second server, second identity context, second audit stream, or client-owned business workflow.

## Composition rule

Each domain capability is an additive MCP layer around a base server:

```text
base protocol server
→ evidence and source layer
→ review workspace layer
→ role task and confirmation layer
→ audit and handoff layer
→ future bounded tradeOS layers
```

Every outer layer must:

- preserve all inner tools and resources;
- preserve inner role filters;
- delegate unknown methods and tools to the base server;
- share one authenticated context provider;
- add no parallel canonical owner;
- keep protected actions bound to the original Runtime confirmation boundary.

## Protocol surface

The endpoint supports the MCP JSON-RPC lifecycle needed by real clients:

```text
initialize
tools/list
tools/call
```

It also exposes OAuth protected-resource metadata and an appropriate `WWW-Authenticate` challenge when authentication is missing or invalid.

The server must fail closed for malformed JSON, unsupported methods, disallowed origins, expired credentials, wrong organization, wrong role, stale versions, stale digests, disabled tools, and client/device mismatch.

## Identity model

The Gateway derives the human identity, organization, role, and authority from the authenticated bearer. Client metadata is additional provenance only.

```text
human identity
organization membership
role and authority
client family: codex | workbuddy | compatible | unknown
client version
installation or device identity when available
request and execution correlation
```

Client family never grants a tradeOS role. A Codex or WorkBuddy session cannot become exporter, buyer, reviewer, funder, operator, or administrator merely by naming that role in input.

## Tool contract

Every tool declares bounded semantics and annotations:

```text
readOnlyHint
destructiveHint
idempotentHint
openWorldHint
```

Tools must use explicit schemas, reject additional identity selectors, and return structured content suitable for both human review and client rendering.

Formal and high-risk actions require exact object/version/digest binding plus an idempotency key. Agent preparation and human confirmation are separate operations.

## Required acceptance evidence

A client profile cannot pass because a document mentions Codex or WorkBuddy. The dedicated executable contract must prove at least:

- live MCP `initialize`;
- role-filtered `tools/list`;
- one bounded read tool call;
- one draft/preparation tool call where applicable;
- ordinary-user bearer use;
- missing/expired bearer denial;
- wrong-role denial;
- cross-organization denial;
- client identity recorded without authority elevation;
- no direct Supabase or `service_role` client path;
- protected action remains unperformed before explicit human confirmation;
- stale version or digest denial;
- idempotent replay and conflict behavior;
- immutable execution/audit correlation;
- cleanup with no production write.

## Release gate

tradeOS `main-release` cannot pass until the shared MCP core exists and at least one dedicated real-client contract is present and executable:

```text
Codex integration PASS
or
WorkBuddy integration PASS
```

The second client remains a required follow-on compatibility target, but the first real client is a release-blocking product requirement.

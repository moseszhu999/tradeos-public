import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/ted-live-source-probe.yml', 'utf8');
const script = readFileSync('scripts/ted-live-source-probe.mjs', 'utf8');

test('TED live workflow is path-scoped, read-only and executes the trusted base script', () => {
  assert.match(workflow, /paths:\s*\n\s*- \.github\/ted-live-source-probe-request\.json/);
  assert.match(workflow, /permissions:\s*\n\s*contents: read/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(workflow, /path: trusted/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /path: request/);
  assert.match(workflow, /git diff --name-only/);
  assert.match(workflow, /test "\$\{changed\[0\]\}" = "\.github\/ted-live-source-probe-request\.json"/);
  assert.match(workflow, /node trusted\/scripts\/ted-live-source-probe\.mjs/);
  assert.doesNotMatch(workflow, /pull_request_target|contents: write|issues: write|pull-requests: write/);
});

test('TED live probe has one fixed official endpoint and no secret or product-write dependencies', () => {
  assert.match(script, /https:\/\/api\.ted\.europa\.eu\/v3\/notices\/search/);
  assert.match(script, /publication-number = 151703-2026/);
  assert.match(script, /TED_LIVE_SCOPE = 'ALL'/);
  assert.match(script, /TED_LIVE_LIMIT = 1/);
  assert.match(script, /contactValuesCopied:\s*false/);
  assert.match(script, /rawRowsLogged:\s*false/);
  assert.match(script, /databaseWritePerformed:\s*false/);
  assert.match(script, /supplierCreated:\s*false/);
  assert.match(script, /sourcingProjectCreated:\s*false/);
  assert.match(script, /rfqIssued:\s*false/);
  assert.match(script, /externalSendPerformed:\s*false/);
  assert.doesNotMatch(script, /process\.env|GITHUB_TOKEN|DATABASE_URL|service_role|Authorization|Bearer|POSTGRES|NEON_/i);
});

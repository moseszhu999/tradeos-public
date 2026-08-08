import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  TARGETS,
  shellPlan,
  validateRequest,
} from '../scripts/public-market-visible-focused-profile.mjs';

const workflow = readFileSync('.github/workflows/public-market-visible-focused.yml', 'utf8');

const baseRequest = {
  requestId: 'visible-focused-test',
  target: 'market-watch-visible',
  privateExactSha: '1'.repeat(40),
  expectedBaseSha: '2'.repeat(40),
  expectedChangedFileCount: 3,
};

test('locks visible adapter targets to the two owned focused test files', () => {
  assert.deepEqual(Object.keys(TARGETS).sort(), ['evidence-feedback-visible', 'market-watch-visible']);
  assert.equal(TARGETS['market-watch-visible'].testFile, 'tests/trade-public-market-market-watch-visible-adapter.test.ts');
  assert.equal(TARGETS['evidence-feedback-visible'].testFile, 'tests/trade-public-market-evidence-feedback-visible-adapter.test.ts');
});

test('accepts only exact request fields and bounded exact scope', () => {
  const request = validateRequest(baseRequest);
  assert.equal(request.expectedChangedFileCount, 3);
  assert.throws(() => validateRequest({ ...baseRequest, target: 'web-product' }), /target_invalid/);
  assert.throws(() => validateRequest({ ...baseRequest, privateExactSha: 'abc' }), /private_sha_invalid/);
  assert.throws(() => validateRequest({ ...baseRequest, expectedChangedFileCount: 0 }), /changed_file_count_invalid/);
  assert.throws(() => validateRequest({ ...baseRequest, extra: true }), /shape_invalid/);
});

test('fixed shell plan runs install, one focused test, typecheck and build only', () => {
  const request = validateRequest(baseRequest);
  assert.deepEqual(shellPlan(request), [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-public-market-market-watch-visible-adapter.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

test('workflow is path-scoped, trusted-base driven, read-only private checkout and sealed', () => {
  assert.match(workflow, /paths:\s*\n\s*- \.github\/public-market-visible-focused-request\.json/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.base\.sha \}\}/);
  assert.match(workflow, /path: trusted/);
  assert.match(workflow, /repository: moseszhu999\/chaintrace-app/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /PRIVATE_REPO_READ_TOKEN/);
  assert.match(workflow, /git merge-base HEAD \"\$BASE_SHA\"/);
  assert.match(workflow, /npm test -- \"\$TEST_FILE\"/);
  assert.match(workflow, /npm run typecheck/);
  assert.match(workflow, /npm run build/);
  assert.match(workflow, /rm -rf private-repo/);
  assert.doesNotMatch(workflow, /actions\/upload-artifact/);
  assert.doesNotMatch(workflow, /supabase|neonctl|vercel deploy|netlify deploy|curl .*POST/i);
});

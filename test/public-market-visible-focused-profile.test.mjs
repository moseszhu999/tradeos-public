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

test('locks focused targets to explicitly owned private test files', () => {
  assert.deepEqual(Object.keys(TARGETS).sort(), [
    'bottom-up-cockpit',
    'business-channel-contracts',
    'evidence-feedback-visible',
    'group-work-inbox',
    'market-shared-case-proposal',
    'market-watch-visible',
    'neon-business-empty-success',
    'vercel-release-decoupling',
  ]);
  assert.equal(TARGETS['market-watch-visible'].testFile, 'tests/trade-public-market-market-watch-visible-adapter.test.ts');
  assert.equal(TARGETS['evidence-feedback-visible'].testFile, 'tests/trade-public-market-evidence-feedback-visible-adapter.test.ts');
  assert.equal(TARGETS['market-shared-case-proposal'].testFile, 'tests/trade-neon-market-shared-case-proposal-contract.test.ts');
  assert.equal(TARGETS['neon-business-empty-success'].testFile, 'tests/trade-neon-business-data-api-empty-success.test.ts');
  assert.equal(TARGETS['business-channel-contracts'].testFile, 'tests/business-channel-contracts.test.ts');
  assert.equal(TARGETS['bottom-up-cockpit'].testFile, 'tests/trade-bottom-up-cockpit.test.ts');
  assert.equal(TARGETS['vercel-release-decoupling'].testFile, 'tests/vercel-production-deploy-decoupling.test.ts');
  assert.equal(TARGETS['group-work-inbox'].testFile, 'tests/group-work-entry-work-inbox.test.ts');
});

test('accepts only exact request fields and bounded exact scope', () => {
  const request = validateRequest(baseRequest);
  assert.equal(request.expectedChangedFileCount, 3);
  const proposal = validateRequest({
    ...baseRequest,
    target: 'market-shared-case-proposal',
    expectedChangedFileCount: 6,
  });
  assert.equal(proposal.testFile, 'tests/trade-neon-market-shared-case-proposal-contract.test.ts');
  const emptySuccess = validateRequest({
    ...baseRequest,
    target: 'neon-business-empty-success',
    expectedChangedFileCount: 3,
  });
  assert.equal(emptySuccess.testFile, 'tests/trade-neon-business-data-api-empty-success.test.ts');
  const businessChannel = validateRequest({
    ...baseRequest,
    target: 'business-channel-contracts',
    expectedChangedFileCount: 4,
  });
  assert.equal(businessChannel.testFile, 'tests/business-channel-contracts.test.ts');
  assert.equal(businessChannel.expectedChangedFileCount, 4);
  const cockpit = validateRequest({
    ...baseRequest,
    target: 'bottom-up-cockpit',
    expectedChangedFileCount: 2,
  });
  assert.equal(cockpit.testFile, 'tests/trade-bottom-up-cockpit.test.ts');
  assert.equal(cockpit.expectedChangedFileCount, 2);
  const releaseDecoupling = validateRequest({
    ...baseRequest,
    target: 'vercel-release-decoupling',
    expectedChangedFileCount: 2,
  });
  assert.equal(releaseDecoupling.testFile, 'tests/vercel-production-deploy-decoupling.test.ts');
  assert.equal(releaseDecoupling.expectedChangedFileCount, 2);
  const workInbox = validateRequest({
    ...baseRequest,
    target: 'group-work-inbox',
    expectedChangedFileCount: 3,
  });
  assert.equal(workInbox.testFile, 'tests/group-work-entry-work-inbox.test.ts');
  assert.equal(workInbox.expectedChangedFileCount, 3);
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

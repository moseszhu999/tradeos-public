import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { TARGETS, shellPlan, validateRequest } from '../scripts/public-market-visible-focused-profile.mjs';

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
    'first-principles-proof-core',
    'first-principles-proof-pack',
    'group-work-inbox',
    'group-work-provider-transport',
    'market-shared-case-proposal',
    'market-watch-visible',
    'n2-specification-sourcing-conversion',
    'n3-a0-rfq-shared-case-preparation',
    'neon-business-empty-success',
    'tradeos-n2-work-source',
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
  assert.equal(TARGETS['group-work-provider-transport'].testFile, 'tests/group-work-entry-provider-transport.test.ts');
  assert.equal(TARGETS['tradeos-n2-work-source'].testFile, 'tests/group-work-entry-tradeos-proposal-work-source.test.ts');
  assert.equal(TARGETS['n2-specification-sourcing-conversion'].testFile, 'tests/trade-neon-sourcing-conversion');
  assert.equal(TARGETS['n3-a0-rfq-shared-case-preparation'].testFile, 'tests/trade-neon-rfq-shared-case-preparation');
  assert.equal(TARGETS['first-principles-proof-core'].testFile, 'tests/first-principles-proof-contracts.test.ts');
  assert.equal(TARGETS['first-principles-proof-pack'].testFile, 'tests/first-principles-proof-pack.test.ts');
});

test('accepts only exact request fields and bounded exact scope', () => {
  const request = validateRequest(baseRequest);
  assert.equal(request.expectedChangedFileCount, 3);
  const targets = [
    ['market-shared-case-proposal', 6, 'tests/trade-neon-market-shared-case-proposal-contract.test.ts'],
    ['neon-business-empty-success', 3, 'tests/trade-neon-business-data-api-empty-success.test.ts'],
    ['business-channel-contracts', 4, 'tests/business-channel-contracts.test.ts'],
    ['bottom-up-cockpit', 2, 'tests/trade-bottom-up-cockpit.test.ts'],
    ['vercel-release-decoupling', 2, 'tests/vercel-production-deploy-decoupling.test.ts'],
    ['group-work-inbox', 3, 'tests/group-work-entry-work-inbox.test.ts'],
    ['group-work-provider-transport', 3, 'tests/group-work-entry-provider-transport.test.ts'],
    ['tradeos-n2-work-source', 6, 'tests/group-work-entry-tradeos-proposal-work-source.test.ts'],
    ['n2-specification-sourcing-conversion', 9, 'tests/trade-neon-sourcing-conversion'],
    ['n3-a0-rfq-shared-case-preparation', 8, 'tests/trade-neon-rfq-shared-case-preparation'],
    ['first-principles-proof-core', 6, 'tests/first-principles-proof-contracts.test.ts'],
    ['first-principles-proof-pack', 4, 'tests/first-principles-proof-pack.test.ts'],
  ];
  for (const [target, count, testFile] of targets) {
    const parsed = validateRequest({ ...baseRequest, target, expectedChangedFileCount: count });
    assert.equal(parsed.testFile, testFile);
    assert.equal(parsed.expectedChangedFileCount, count);
  }
  assert.throws(() => validateRequest({ ...baseRequest, target: 'web-product' }), /target_invalid/);
  assert.throws(() => validateRequest({ ...baseRequest, privateExactSha: 'abc' }), /private_sha_invalid/);
  assert.throws(() => validateRequest({ ...baseRequest, expectedChangedFileCount: 0 }), /changed_file_count_invalid/);
  assert.throws(() => validateRequest({ ...baseRequest, extra: true }), /shape_invalid/);
});

test('fixed shell plan runs install, one focused test filter, typecheck and build only', () => {
  const request = validateRequest(baseRequest);
  assert.deepEqual(shellPlan(request), [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-public-market-market-watch-visible-adapter.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
  const proofPack = validateRequest({ ...baseRequest, target: 'first-principles-proof-pack', expectedChangedFileCount: 4 });
  assert.deepEqual(shellPlan(proofPack)[1], ['npm', ['test', '--', 'tests/first-principles-proof-pack.test.ts']]);
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

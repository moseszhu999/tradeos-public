import test from 'node:test';
import assert from 'node:assert/strict';

import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';
import { validateExactHeadRequest } from '../scripts/validate-exact-head-request.mjs';

const sha = (digit) => digit.repeat(40);
const request = (validationProfile, expectedChangedFileCount) => ({
  requestId: `tradeos-${validationProfile}`,
  privateExactSha: sha('a'),
  expectedBaseSha: sha('b'),
  expectedMainSha: '',
  validationProfile,
  expectedChangedFileCount,
});

const cases = [
  {
    profile: 'public-market-ted-source',
    count: 5,
    files: [
      'lib/trade-public-market/opportunity-import/from-ted-search-api.ts',
      'lib/trade-public-market/opportunity-import/index.ts',
      'tests/trade-public-market-ted-search-api-source-adapter.test.ts',
      'scripts/tradeos-ted-search-opportunities.mjs',
      'docs/waterfall/04-testing/m1-ted-search-api-source-adapter-v1-audit.md',
    ],
    commands: [
      ['npm', ['ci', '--no-audit', '--no-fund']],
      ['node', ['--check', 'scripts/tradeos-ted-search-opportunities.mjs']],
      ['npm', ['test', '--', 'tests/trade-public-market-ted-search-api-source-adapter.test.ts']],
      ['npm', ['run', 'typecheck']],
      ['npm', ['run', 'build']],
    ],
  },
  {
    profile: 'public-market-world-bank-source',
    count: 4,
    files: [
      'lib/trade-public-market/opportunity-import/from-world-bank-procurement.ts',
      'tests/trade-public-market-world-bank-procurement-source-adapter.test.ts',
      'scripts/tradeos-world-bank-procurement-opportunities.mjs',
      'docs/waterfall/04-testing/m1-world-bank-procurement-source-adapter-v1-audit.md',
    ],
    commands: [
      ['npm', ['ci', '--no-audit', '--no-fund']],
      ['node', ['--check', 'scripts/tradeos-world-bank-procurement-opportunities.mjs']],
      ['npm', ['test', '--', 'tests/trade-public-market-world-bank-procurement-source-adapter.test.ts']],
      ['npm', ['run', 'typecheck']],
      ['npm', ['run', 'build']],
    ],
  },
  {
    profile: 'public-market-source-registry',
    count: 3,
    files: [
      'lib/trade-public-market/source-registry/index.ts',
      'tests/trade-public-market-source-registry.test.ts',
      'docs/waterfall/04-testing/m1-public-market-source-registry-v1-audit.md',
    ],
    commands: [
      ['npm', ['ci', '--no-audit', '--no-fund']],
      ['npm', ['test', '--', 'tests/trade-public-market-source-registry.test.ts']],
      ['npm', ['run', 'typecheck']],
      ['npm', ['run', 'build']],
    ],
  },
  {
    profile: 'public-market-source-sanitization',
    count: 3,
    files: [
      'lib/trade-public-market/source-sanitization/index.ts',
      'tests/trade-public-market-source-sanitization.test.ts',
      'docs/waterfall/04-testing/m1-public-source-sanitization-core-v1-audit.md',
    ],
    commands: [
      ['npm', ['ci', '--no-audit', '--no-fund']],
      ['npm', ['test', '--', 'tests/trade-public-market-source-sanitization.test.ts']],
      ['npm', ['run', 'typecheck']],
      ['npm', ['run', 'build']],
    ],
  },
];

test('accepts only the four reviewed public-source profile names', () => {
  for (const item of cases) {
    assert.equal(
      validateExactHeadRequest(request(item.profile, item.count)).validationProfile,
      item.profile,
    );
  }
  assert.throws(() => validateExactHeadRequest(request('public-market-user-command', 1)));
});

test('locks canonical evidence and commands for each public-source profile', () => {
  for (const item of cases) {
    const definition = PROFILE_DEFINITIONS[item.profile];
    assert.ok(definition);
    assert.deepEqual(definition.evidence.requiredFiles, item.files);
    assert.deepEqual(definition.commands, item.commands);
  }
});

test('keeps carrier-controlled commands and network probes impossible', () => {
  for (const item of cases) {
    const serialized = JSON.stringify(PROFILE_DEFINITIONS[item.profile].commands);
    assert.doesNotMatch(serialized, /curl|wget|fetch|http|https|database|deploy|migration/i);
  }
});

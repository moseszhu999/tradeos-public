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

test('accepts only the named Public Market focused profiles through the fixed request schema', () => {
  assert.equal(
    validateExactHeadRequest(request('public-market-opportunity-import', 11)).validationProfile,
    'public-market-opportunity-import',
  );
  assert.equal(
    validateExactHeadRequest(request('public-market-explainable-match', 3)).validationProfile,
    'public-market-explainable-match',
  );
  assert.throws(() => validateExactHeadRequest(request('public-market-custom-command', 1)));
});

test('Opportunity Import profile fixes evidence, focused tests, typecheck, and build', () => {
  const profile = PROFILE_DEFINITIONS['public-market-opportunity-import'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/trade-public-market/opportunity-import/index.ts',
    'tests/trade-public-market-opportunity-import-core.test.ts',
    'tests/trade-public-market-opportunity-import-validation.test.ts',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', [
      'test',
      '--',
      'tests/trade-public-market-opportunity-import-core.test.ts',
      'tests/trade-public-market-opportunity-import-validation.test.ts',
    ]],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

test('Explainable Match profile fixes evidence, one focused test, typecheck, and build', () => {
  const profile = PROFILE_DEFINITIONS['public-market-explainable-match'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/trade-public-market/market-match/index.ts',
    'tests/trade-public-market-market-match-core.test.ts',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-public-market-market-match-core.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

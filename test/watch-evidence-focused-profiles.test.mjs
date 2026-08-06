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

test('accepts only the fixed Watch and Evidence profile names', () => {
  assert.equal(
    validateExactHeadRequest(request('public-market-watch-subscribe', 3)).validationProfile,
    'public-market-watch-subscribe',
  );
  assert.equal(
    validateExactHeadRequest(request('public-market-evidence-feedback', 3)).validationProfile,
    'public-market-evidence-feedback',
  );
  assert.throws(() => validateExactHeadRequest(request('public-market-custom-watch-command', 1)));
});

test('Watch profile fixes evidence, one focused test, typecheck, and build', () => {
  const profile = PROFILE_DEFINITIONS['public-market-watch-subscribe'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/trade-public-market/market-watch/index.ts',
    'tests/trade-public-market-market-watch-core.test.ts',
    'docs/waterfall/04-testing/m2-public-market-watch-subscribe-core-v1-audit.md',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-public-market-market-watch-core.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

test('Evidence feedback profile fixes evidence, one focused test, typecheck, and build', () => {
  const profile = PROFILE_DEFINITIONS['public-market-evidence-feedback'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/trade-public-market/evidence-feedback/index.ts',
    'tests/trade-public-market-evidence-feedback-core.test.ts',
    'docs/waterfall/04-testing/public-market-evidence-feedback-core-v1-audit.md',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-public-market-evidence-feedback-core.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

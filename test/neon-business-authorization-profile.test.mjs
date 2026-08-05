import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';
import { validateExactHeadRequest } from '../scripts/validate-exact-head-request.mjs';

const request = {
  requestId: 'n1-neon-authorization-foundation',
  privateExactSha: 'a'.repeat(40),
  expectedBaseSha: 'b'.repeat(40),
  expectedMainSha: '',
  validationProfile: 'neon-business-authorization-foundation',
  expectedChangedFileCount: 5,
};

test('accepts only the fixed Neon authorization profile name', () => {
  assert.equal(validateExactHeadRequest(request).validationProfile, 'neon-business-authorization-foundation');
  assert.throws(() => validateExactHeadRequest({ ...request, validationProfile: 'neon-custom-sql' }));
});

test('fixes N1 evidence, one focused test, typecheck, and build', () => {
  const profile = PROFILE_DEFINITIONS['neon-business-authorization-foundation'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'database/neon/20260804210000_tradeos_business_authorization_foundation.sql',
    'lib/neon-business/server.ts',
    'tests/trade-neon-business-authorization-foundation.test.ts',
    'docs/waterfall/04-testing/tradeos-neon-business-authorization-foundation-v1.md',
    'docs/waterfall/04-testing/tradeos-current-progress.html',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-neon-business-authorization-foundation.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

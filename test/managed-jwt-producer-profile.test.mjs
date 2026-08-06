import test from 'node:test';
import assert from 'node:assert/strict';

import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';
import { validateExactHeadRequest } from '../scripts/validate-exact-head-request.mjs';

const request = {
  requestId: 'n1-managed-data-api-jwt-producer',
  privateExactSha: 'a'.repeat(40),
  expectedBaseSha: 'b'.repeat(40),
  expectedMainSha: '',
  validationProfile: 'neon-managed-data-api-jwt-producer',
  expectedChangedFileCount: 5,
};

test('accepts only the fixed managed Data API JWT producer profile', () => {
  assert.equal(
    validateExactHeadRequest(request).validationProfile,
    'neon-managed-data-api-jwt-producer',
  );
  assert.throws(() => validateExactHeadRequest({
    ...request,
    validationProfile: 'neon-managed-jwt-custom-command',
  }));
});

test('fixes official SDK evidence, focused test, typecheck and build', () => {
  const profile = PROFILE_DEFINITIONS['neon-managed-data-api-jwt-producer'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'package.json',
    'lib/neon-auth/managed-data-api-jwt.ts',
    'lib/neon-auth/managed-data-api-jwt-claims.ts',
    'tests/trade-neon-auth-managed-data-api-jwt.test.ts',
    'docs/waterfall/04-testing/n1-managed-data-api-jwt-producer-current-main-v2-audit.md',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-neon-auth-managed-data-api-jwt.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

test('requires official Neon Auth package, server token endpoint and source metadata', () => {
  const patterns = PROFILE_DEFINITIONS['neon-managed-data-api-jwt-producer'].evidence.filePatterns;
  assert.equal(patterns.length, 4);
  assert.equal(patterns[0][0], 'package.json');
  assert.equal(patterns[1][0], 'lib/neon-auth/managed-data-api-jwt.ts');
  assert.equal(patterns[2][0], 'lib/neon-auth/managed-data-api-jwt.ts');
  assert.equal(patterns[3][0], 'lib/neon-auth/managed-data-api-jwt.ts');
});

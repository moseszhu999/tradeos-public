import test from 'node:test';
import assert from 'node:assert/strict';

import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';
import { validateExactHeadRequest } from '../scripts/validate-exact-head-request.mjs';

const request = {
  requestId: 'n1-neon-auth-session-boundary',
  privateExactSha: 'a'.repeat(40),
  expectedBaseSha: 'b'.repeat(40),
  expectedMainSha: '',
  validationProfile: 'neon-auth-session-boundary',
  expectedChangedFileCount: 3,
};

test('accepts only the fixed Neon Auth session-boundary profile', () => {
  assert.equal(
    validateExactHeadRequest(request).validationProfile,
    'neon-auth-session-boundary',
  );
  assert.throws(() => validateExactHeadRequest({
    ...request,
    validationProfile: 'neon-auth-custom-session-command',
  }));
});

test('fixes session evidence, one focused test, typecheck and build', () => {
  const profile = PROFILE_DEFINITIONS['neon-auth-session-boundary'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/neon-auth/server.ts',
    'lib/neon-auth/session.ts',
    'tests/trade-neon-auth-session-boundary.test.ts',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['test', '--', 'tests/trade-neon-auth-session-boundary.test.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

test('requires the parser and explicit session-token/access-token boundary evidence', () => {
  const patterns = PROFILE_DEFINITIONS['neon-auth-session-boundary'].evidence.filePatterns;
  assert.deepEqual(patterns.map(([path]) => path), [
    'lib/neon-auth/session.ts',
    'lib/neon-auth/server.ts',
    'tests/trade-neon-auth-session-boundary.test.ts',
    'tests/trade-neon-auth-session-boundary.test.ts',
  ]);
});

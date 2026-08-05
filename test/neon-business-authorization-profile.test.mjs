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

const contractTitles = [
  'creates only the shared authorization schema and bounded functions',
  'uses managed Neon Auth claims without an identity or organization mirror',
  'uses one bounded owner helper without granting managed schemas or tables',
  'fails closed for missing actor, active organization mismatch and missing membership',
  'keeps public functions security-invoker and denies public execution',
  'uses only a caller bearer token and organization context in the server adapter',
  'does not introduce business objects or irreversible execution authority',
];

test('accepts only the fixed Neon authorization profile name', () => {
  assert.equal(validateExactHeadRequest(request).validationProfile, 'neon-business-authorization-foundation');
  assert.throws(() => validateExactHeadRequest({ ...request, validationProfile: 'neon-custom-sql' }));
});

test('fixes N1 evidence, named contract stages, typecheck, and build', () => {
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
    ...contractTitles.map((title) => ['npm', [
      'test',
      '--',
      'tests/trade-neon-business-authorization-foundation.test.ts',
      '-t',
      title,
    ]]),
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

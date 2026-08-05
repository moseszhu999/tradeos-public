import test from 'node:test';
import assert from 'node:assert/strict';
import { PROFILE_DEFINITIONS } from '../scripts/run-private-profile.mjs';
import { validateExactHeadRequest } from '../scripts/validate-exact-head-request.mjs';

const request = {
  requestId: 'm1-retention-participation',
  privateExactSha: 'a'.repeat(40),
  expectedBaseSha: 'b'.repeat(40),
  expectedMainSha: '',
  validationProfile: 'public-market-retention-participation',
  expectedChangedFileCount: 13,
};

test('accepts only the fixed Retention participation profile name', () => {
  assert.equal(
    validateExactHeadRequest(request).validationProfile,
    'public-market-retention-participation',
  );
  assert.throws(() => validateExactHeadRequest({
    ...request,
    validationProfile: 'public-market-retention-custom-command',
  }));
});

test('fixes Retention evidence and four focused tests before typecheck and build', () => {
  const profile = PROFILE_DEFINITIONS['public-market-retention-participation'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/trade-public-market/retention/index.ts',
    'lib/trade-public-market/retention/from-match.ts',
    'lib/trade-public-market/retention/from-opportunity.ts',
    'lib/trade-public-market/retention/claim-invite.ts',
    'tests/trade-public-market-retention-runtime.test.ts',
    'tests/trade-public-market-retention-from-match.test.ts',
    'tests/trade-public-market-retention-from-opportunity.test.ts',
    'tests/trade-public-market-claim-invite-intents.test.ts',
  ]);
  assert.deepEqual(profile.commands, [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', [
      'test',
      '--',
      'tests/trade-public-market-retention-runtime.test.ts',
      'tests/trade-public-market-retention-from-match.test.ts',
      'tests/trade-public-market-retention-from-opportunity.test.ts',
      'tests/trade-public-market-claim-invite-intents.test.ts',
    ]],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

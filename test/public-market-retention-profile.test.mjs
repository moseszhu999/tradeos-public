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
  expectedChangedFileCount: 4,
};

const surfaceTitles = [
  'creates one deterministic privacy-safe object route for every Founder Opportunity case',
  'uses the existing Opportunity Import digest and canonical ted-eu provenance',
  'keeps excluded founder research and supplier evidence out of the public read model and share reference',
  'fails closed when the share version does not match the canonical object digest',
  'resolves only known object IDs',
  'prepares an organization-private Save object without persistence or canonical writes',
  'uses the canonical auth organization reader and hides Save when context is unavailable',
  'links the existing Founder Opportunity Cockpit to the canonical Retention share paths',
];

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

test('fixes Retention core and each Public Market surface contract before typecheck and build', () => {
  const profile = PROFILE_DEFINITIONS['public-market-retention-participation'];
  assert.deepEqual(profile.evidence.requiredFiles, [
    'lib/trade-public-market/retention/index.ts',
    'lib/trade-public-market/retention/from-match.ts',
    'lib/trade-public-market/retention/from-opportunity.ts',
    'lib/trade-public-market/retention/claim-invite.ts',
    'app/market/[kind]/[objectId]/page.tsx',
    'app/opportunities/page.tsx',
    'lib/opportunity-products/public-market-surface.ts',
    'tests/trade-public-market-retention-runtime.test.ts',
    'tests/trade-public-market-retention-from-match.test.ts',
    'tests/trade-public-market-retention-from-opportunity.test.ts',
    'tests/trade-public-market-claim-invite-intents.test.ts',
    'tests/trade-public-market-product-surface.test.ts',
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
    ...surfaceTitles.map((title) => ['npm', [
      'test',
      '--',
      'tests/trade-public-market-product-surface.test.ts',
      '-t',
      title,
    ]]),
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

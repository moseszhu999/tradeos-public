import test from 'node:test';
import assert from 'node:assert/strict';
import { validateExactHeadRequest } from '../scripts/validate-exact-head-request.mjs';

const sha = (digit) => digit.repeat(40);

function bounded(overrides = {}) {
  return {
    requestId: 'tradeos-token-check-v1',
    privateExactSha: sha('a'),
    expectedBaseSha: sha('a'),
    expectedMainSha: '',
    validationProfile: 'bounded-runtime',
    expectedChangedFileCount: 0,
    ...overrides,
  };
}

test('accepts a fixed bounded-runtime request', () => {
  assert.deepEqual(validateExactHeadRequest(bounded()), bounded());
});

test('rejects commands and unknown fields', () => {
  assert.throws(() => validateExactHeadRequest({ ...bounded(), command: 'npm test' }));
});

test('rejects uppercase, short, or malformed SHAs', () => {
  assert.throws(() => validateExactHeadRequest(bounded({ privateExactSha: sha('A') })));
  assert.throws(() => validateExactHeadRequest(bounded({ expectedBaseSha: 'abc' })));
});

test('rejects main SHA outside main-release', () => {
  assert.throws(() => validateExactHeadRequest(bounded({ expectedMainSha: sha('a') })));
});

test('main-release requires one identical live-main SHA and zero changed files', () => {
  const request = bounded({
    validationProfile: 'main-release',
    expectedMainSha: sha('a'),
  });
  assert.deepEqual(validateExactHeadRequest(request), request);
  assert.throws(() => validateExactHeadRequest({ ...request, expectedChangedFileCount: 1 }));
  assert.throws(() => validateExactHeadRequest({ ...request, expectedMainSha: sha('b') }));
});

test('rejects negative or non-integer file counts', () => {
  assert.throws(() => validateExactHeadRequest(bounded({ expectedChangedFileCount: -1 })));
  assert.throws(() => validateExactHeadRequest(bounded({ expectedChangedFileCount: 1.5 })));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { VALIDATION_PROFILES, validateExactHeadInputs } from '../scripts/exact-head-inputs.mjs';

const shaA = 'a'.repeat(40);
const shaB = 'b'.repeat(40);

test('accepts a bounded exact-head request', () => {
  const result = validateExactHeadInputs({
    PRIVATE_EXACT_SHA: shaA,
    EXPECTED_BASE_SHA: shaB,
    EXPECTED_MAIN_SHA: '',
    VALIDATION_PROFILE: 'bounded-runtime',
    EXPECTED_CHANGED_FILE_COUNT: '3',
  });
  assert.equal(result.status, 'PASS');
  assert.deepEqual(result.errors, []);
});

test('rejects uppercase and abbreviated SHAs', () => {
  const result = validateExactHeadInputs({
    PRIVATE_EXACT_SHA: 'A'.repeat(40),
    EXPECTED_BASE_SHA: 'abc123',
    EXPECTED_MAIN_SHA: '',
    VALIDATION_PROFILE: 'bounded-runtime',
    EXPECTED_CHANGED_FILE_COUNT: '1',
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.errors.includes('INVALID_PRIVATE_EXACT_SHA'));
  assert.ok(result.errors.includes('INVALID_EXPECTED_BASE_SHA'));
});

test('main release requires one exact immutable SHA and zero changed files', () => {
  const result = validateExactHeadInputs({
    PRIVATE_EXACT_SHA: shaA,
    EXPECTED_BASE_SHA: shaB,
    EXPECTED_MAIN_SHA: shaB,
    VALIDATION_PROFILE: 'main-release',
    EXPECTED_CHANGED_FILE_COUNT: '1',
  });
  assert.equal(result.status, 'FAIL');
  assert.ok(result.errors.includes('MAIN_SHA_MISMATCH'));
  assert.ok(result.errors.includes('MAIN_BASE_MISMATCH'));
  assert.ok(result.errors.includes('MAIN_CHANGED_FILE_COUNT_MUST_BE_ZERO'));
});

test('profile allowlist contains Codex and WorkBuddy integration gates', () => {
  assert.ok(VALIDATION_PROFILES.includes('codex-integration'));
  assert.ok(VALIDATION_PROFILES.includes('workbuddy-integration'));
});

import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const VALIDATION_PROFILES = Object.freeze([
  'bounded-runtime',
  'agent-client-contract',
  'codex-integration',
  'workbuddy-integration',
  'web-product',
  'main-release',
]);

const SHA_PATTERN = /^[0-9a-f]{40}$/;
const COUNT_PATTERN = /^(0|[1-9][0-9]*)$/;

export function validateExactHeadInputs(env = process.env) {
  const privateExactSha = env.PRIVATE_EXACT_SHA ?? '';
  const expectedBaseSha = env.EXPECTED_BASE_SHA ?? '';
  const expectedMainSha = env.EXPECTED_MAIN_SHA ?? '';
  const validationProfile = env.VALIDATION_PROFILE ?? '';
  const expectedChangedFileCount = env.EXPECTED_CHANGED_FILE_COUNT ?? '';
  const errors = [];

  if (!SHA_PATTERN.test(privateExactSha)) errors.push('INVALID_PRIVATE_EXACT_SHA');
  if (!SHA_PATTERN.test(expectedBaseSha)) errors.push('INVALID_EXPECTED_BASE_SHA');
  if (expectedMainSha && !SHA_PATTERN.test(expectedMainSha)) errors.push('INVALID_EXPECTED_MAIN_SHA');
  if (!VALIDATION_PROFILES.includes(validationProfile)) errors.push('INVALID_VALIDATION_PROFILE');
  if (!COUNT_PATTERN.test(expectedChangedFileCount)) errors.push('INVALID_CHANGED_FILE_COUNT');

  if (validationProfile === 'main-release') {
    if (expectedMainSha !== privateExactSha) errors.push('MAIN_SHA_MISMATCH');
    if (expectedBaseSha !== privateExactSha) errors.push('MAIN_BASE_MISMATCH');
    if (expectedChangedFileCount !== '0') errors.push('MAIN_CHANGED_FILE_COUNT_MUST_BE_ZERO');
  }

  return {
    status: errors.length === 0 ? 'PASS' : 'FAIL',
    errors,
    privateExactSha,
    expectedBaseSha,
    expectedMainSha,
    validationProfile,
    expectedChangedFileCount,
  };
}

function writeOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  appendFileSync(output, `${key}=${value}\n`, { encoding: 'utf8' });
}

function main() {
  const result = validateExactHeadInputs();
  writeOutput('status', result.status);
  writeOutput('failure_label', result.errors[0] ?? 'NONE');
  writeOutput('validation_profile', result.validationProfile);
  process.exitCode = result.status === 'PASS' ? 0 : 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

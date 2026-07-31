import { appendFileSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SHA = /^[0-9a-f]{40}$/;
const REQUEST_ID = /^[a-z0-9][a-z0-9-]{7,79}$/;
const PROFILES = new Set([
  'bounded-runtime',
  'agent-client-contract',
  'codex-integration',
  'workbuddy-integration',
  'web-product',
  'main-release',
]);

function requireExactKeys(value, allowed) {
  const keys = Object.keys(value).sort();
  const expected = [...allowed].sort();
  if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
    throw new TypeError(`Request keys must be exactly: ${expected.join(', ')}`);
  }
}

export function validateExactHeadRequest(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('Request must be a JSON object.');
  }

  requireExactKeys(input, [
    'requestId',
    'privateExactSha',
    'expectedBaseSha',
    'expectedMainSha',
    'validationProfile',
    'expectedChangedFileCount',
  ]);

  if (!REQUEST_ID.test(input.requestId)) throw new TypeError('Invalid requestId.');
  if (!SHA.test(input.privateExactSha)) throw new TypeError('Invalid privateExactSha.');
  if (!SHA.test(input.expectedBaseSha)) throw new TypeError('Invalid expectedBaseSha.');
  if (input.expectedMainSha !== '' && !SHA.test(input.expectedMainSha)) {
    throw new TypeError('Invalid expectedMainSha.');
  }
  if (!PROFILES.has(input.validationProfile)) throw new TypeError('Invalid validationProfile.');
  if (!Number.isInteger(input.expectedChangedFileCount) || input.expectedChangedFileCount < 0) {
    throw new TypeError('expectedChangedFileCount must be a non-negative integer.');
  }

  if (input.validationProfile === 'main-release') {
    if (
      input.privateExactSha !== input.expectedBaseSha
      || input.privateExactSha !== input.expectedMainSha
      || input.expectedChangedFileCount !== 0
    ) {
      throw new TypeError('main-release requires one exact live-main SHA and zero changed files.');
    }
  } else if (input.expectedMainSha !== '') {
    throw new TypeError('expectedMainSha is allowed only for main-release.');
  }

  return Object.freeze({ ...input });
}

function writeOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8');
}

function main() {
  const path = process.env.REQUEST_PATH || '.github/exact-head-request.json';
  try {
    const request = validateExactHeadRequest(JSON.parse(readFileSync(path, 'utf8')));
    for (const [key, value] of Object.entries(request)) writeOutput(key, String(value));
    writeOutput('status', 'PASS');
  } catch {
    writeOutput('status', 'FAIL');
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();

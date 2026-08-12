import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  HARDHAT_TARGETS,
  shellPlan,
  validateRequest,
} from '../scripts/public-market-visible-focused-profile.mjs';

const workflow = readFileSync('.github/workflows/public-market-visible-focused.yml', 'utf8');

const requestInput = {
  requestId: 'base-sepolia-escrow-poc-test',
  target: 'tradeos-base-sepolia-escrow-poc',
  privateExactSha: '1'.repeat(40),
  expectedBaseSha: '2'.repeat(40),
  expectedChangedFileCount: 8,
};

test('locks the Base Sepolia escrow PoC to one Hardhat-owned private test file', () => {
  assert.deepEqual(Object.keys(HARDHAT_TARGETS), ['tradeos-base-sepolia-escrow-poc']);
  assert.equal(
    HARDHAT_TARGETS['tradeos-base-sepolia-escrow-poc'].testFile,
    'test/TradeOSBaseSepoliaEscrowPoc.ts',
  );

  const request = validateRequest(requestInput);
  assert.equal(request.testRunner, 'hardhat');
  assert.equal(request.testFile, 'test/TradeOSBaseSepoliaEscrowPoc.ts');
  assert.equal(request.expectedChangedFileCount, 8);
});

test('Hardhat target keeps the same four fixed sealed stages and uses the nodejs test-file subtask', () => {
  const request = validateRequest(requestInput);
  assert.deepEqual(shellPlan(request), [
    ['npm', ['ci', '--no-audit', '--no-fund']],
    ['npm', ['run', 'contracts:test:node', '--', 'test/TradeOSBaseSepoliaEscrowPoc.ts']],
    ['npm', ['run', 'typecheck']],
    ['npm', ['run', 'build']],
  ]);
});

test('trusted workflow dispatches only explicit vitest or hardhat runners and never deploys', () => {
  assert.match(workflow, /case \"\$TEST_RUNNER\" in/);
  assert.match(workflow, /vitest\)/);
  assert.match(workflow, /hardhat\)/);
  assert.match(workflow, /npm run contracts:test:node -- \"\$TEST_FILE\"/);
  assert.match(workflow, /failure=focused-runner-invalid/);
  assert.doesNotMatch(workflow, /contracts:deploy:base-sepolia:escrow-poc/);
  assert.doesNotMatch(workflow, /BASE_SEPOLIA_PRIVATE_KEY/);
});

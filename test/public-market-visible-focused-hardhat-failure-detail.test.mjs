import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflow = readFileSync('.github/workflows/public-market-visible-focused.yml', 'utf8');

test('Hardhat failure detail is a bounded enum derived from sealed logs', () => {
  for (const detail of [
    'compiler-list-download',
    'compiler-download',
    'solidity-compile',
    'node-test',
    'hardhat-focused-other',
  ]) {
    assert.match(workflow, new RegExp(`failure_detail=${detail}`));
  }
  assert.match(workflow, /echo "failure_detail=\$failure_detail" >> "\$GITHUB_OUTPUT"/);
});

test('public verdict surfaces only the failure-detail enum and never raw sealed logs', () => {
  assert.match(workflow, /Failure detail:/);
  assert.match(workflow, /Only the bounded failure-detail enum may be surfaced/);
  assert.doesNotMatch(workflow, /cat "\$RUNNER_TEMP\/visible-focused-test\.log"/);
  assert.doesNotMatch(workflow, /tail .*visible-focused-test\.log/);
  assert.doesNotMatch(workflow, /head .*visible-focused-test\.log/);
});

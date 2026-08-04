import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflowPath = new URL('../.github/workflows/tradeos-exact-head-request.yml', import.meta.url);
const workflow = readFileSync(workflowPath, 'utf8');

test('carrier executes the fixed private profile inline after exact-scope validation', () => {
  assert.match(workflow, /Verify exact private scope/);
  assert.match(workflow, /scripts\/verify-private-scope\.mjs/);
  assert.match(workflow, /Run selected fixed profile with sealed output/);
  assert.match(workflow, /scripts\/run-private-profile\.mjs/);
  assert.match(workflow, /Enforce exact-head verdict/);
});

test('carrier remains a same-repository one-file request boundary', () => {
  assert.match(workflow, /head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /startsWith\(github\.event\.pull_request\.head\.ref, 'ci\/exact-head-request\/'\)/);
  assert.match(workflow, /changed\[0\].*\.github\/exact-head-request\.json/);
});

test('carrier does not dispatch another workflow or publish private artifacts', () => {
  assert.doesNotMatch(workflow, /createWorkflowDispatch/);
  assert.doesNotMatch(workflow, /upload-artifact/);
  assert.match(workflow, /PRIVATE_REPO_READ_TOKEN/);
  assert.match(workflow, /persist-credentials: false/);
  assert.match(workflow, /rm -rf private-repo/);
});

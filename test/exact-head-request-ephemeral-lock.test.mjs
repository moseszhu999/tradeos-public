import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const workflowPath = new URL('../.github/workflows/tradeos-exact-head-request.yml', import.meta.url);
const workflow = readFileSync(workflowPath, 'utf8');

test('exact-head carrier bootstraps only an ephemeral npm lock when the private repo has none', () => {
  assert.match(workflow, /Bootstrap ephemeral npm lock when absent/);
  assert.match(workflow, /npm install --package-lock-only --ignore-scripts --no-audit --no-fund/);
  assert.match(workflow, /mode=ephemeral_package_lock/);
  assert.match(workflow, /DEPENDENCY_LOCK_BOOTSTRAP/);
});

test('ephemeral lock remains runner-local and is removed with the private checkout', () => {
  assert.doesNotMatch(workflow, /git commit/);
  assert.doesNotMatch(workflow, /git push/);
  assert.doesNotMatch(workflow, /upload-artifact/);
  assert.match(workflow, /rm -rf private-repo/);
  assert.match(workflow, /tradeos-lock-bootstrap\.log/);
});

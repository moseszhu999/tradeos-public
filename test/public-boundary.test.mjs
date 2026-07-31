import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPath, scanContent } from '../scripts/scan-public-boundary.mjs';

test('allows only public controller roots', () => {
  assert.deepEqual(classifyPath('README.md'), []);
  assert.deepEqual(classifyPath('.github/workflows/public-safe.yml'), []);
  assert.deepEqual(classifyPath('docs/public-exact-head-ci.md'), []);
  assert.deepEqual(classifyPath('scripts/controller.mjs'), []);
  assert.deepEqual(classifyPath('test/controller.test.mjs'), []);
  assert.ok(classifyPath('app/private-source.ts').includes('OUTSIDE_PUBLIC_ALLOWLIST'));
  assert.ok(classifyPath('lib/runtime.ts').includes('OUTSIDE_PUBLIC_ALLOWLIST'));
});

test('rejects private-source and artifact-shaped paths', () => {
  assert.ok(classifyPath('docs/private-repo/source.txt').includes('FORBIDDEN_PATH'));
  assert.ok(classifyPath('docs/evidence.zip').includes('FORBIDDEN_EXTENSION'));
  assert.ok(classifyPath('docs/raw.log').includes('FORBIDDEN_EXTENSION'));
  assert.ok(classifyPath('docs/schema.sql').includes('FORBIDDEN_EXTENSION'));
});

test('rejects credentials, live backend URLs, and artifact workflows', () => {
  assert.ok(scanContent('-----BEGIN PRIVATE KEY-----').includes('PRIVATE_KEY'));
  assert.ok(scanContent('https://abcdefghijk.supabase.co').includes('SUPABASE_URL'));
  assert.ok(scanContent('uses: actions/upload-artifact@v4').includes('UPLOAD_ARTIFACT'));
  assert.ok(scanContent('persist-credentials: true').includes('PERSIST_CREDENTIALS_TRUE'));
  assert.ok(scanContent('pull_request_target:').includes('PULL_REQUEST_TARGET'));
});

test('allows secret names and sanitized architecture text', () => {
  assert.deepEqual(scanContent('PRIVATE_REPO_READ_TOKEN'), []);
  assert.deepEqual(scanContent('persist-credentials: false'), []);
  assert.deepEqual(scanContent('repository: moseszhu999/chaintrace-app'), []);
});

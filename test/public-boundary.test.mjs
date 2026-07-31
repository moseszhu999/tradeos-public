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
  const privateKey = ['-----BEGIN', 'PRIVATE KEY-----'].join(' ');
  const backendUrl = ['https://', 'abcdefghijk', '.supabase.co'].join('');
  const uploadArtifact = ['uses:', 'actions/upload-artifact@v4'].join(' ');
  const persistedCredential = ['persist-credentials:', 'true'].join(' ');
  const pullRequestTarget = ['pull_request_target', ':'].join('');

  assert.ok(scanContent(privateKey).includes('PRIVATE_KEY'));
  assert.ok(scanContent(backendUrl).includes('SUPABASE_URL'));
  assert.ok(scanContent(uploadArtifact).includes('UPLOAD_ARTIFACT'));
  assert.ok(scanContent(persistedCredential).includes('PERSIST_CREDENTIALS_TRUE'));
  assert.ok(scanContent(pullRequestTarget).includes('PULL_REQUEST_TARGET'));
});

test('allows secret names and sanitized architecture text', () => {
  assert.deepEqual(scanContent('PRIVATE_REPO_READ_TOKEN'), []);
  assert.deepEqual(scanContent('persist-credentials: false'), []);
  assert.deepEqual(scanContent('repository: moseszhu999/chaintrace-app'), []);
});

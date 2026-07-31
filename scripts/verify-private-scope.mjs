import { appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

function git(repoPath, args) {
  return execFileSync('git', ['-C', repoPath, ...args], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function writeOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  appendFileSync(output, `${key}=${value}\n`, { encoding: 'utf8' });
}

export function verifyPrivateScope(env = process.env) {
  const repoPath = env.PRIVATE_REPO_PATH;
  const mainRepoPath = env.PRIVATE_MAIN_REPO_PATH;
  const privateExactSha = env.PRIVATE_EXACT_SHA ?? '';
  const expectedBaseSha = env.EXPECTED_BASE_SHA ?? '';
  const expectedMainSha = env.EXPECTED_MAIN_SHA ?? '';
  const expectedChangedFileCount = Number(env.EXPECTED_CHANGED_FILE_COUNT ?? '-1');
  const validationProfile = env.VALIDATION_PROFILE ?? '';

  const actualSha = git(repoPath, ['rev-parse', 'HEAD']);
  const mergeBase = git(repoPath, ['merge-base', 'HEAD', expectedBaseSha]);
  const changedFilesRaw = validationProfile === 'main-release'
    ? ''
    : git(repoPath, ['diff', '--name-only', `${expectedBaseSha}...HEAD`]);
  const changedFileCount = changedFilesRaw ? changedFilesRaw.split('\n').filter(Boolean).length : 0;

  let actualMainSha = '';
  let mainRefEquality = 'NOT_RUN';
  if (validationProfile === 'main-release') {
    actualMainSha = git(mainRepoPath, ['rev-parse', 'HEAD']);
    mainRefEquality = actualMainSha === expectedMainSha && actualMainSha === privateExactSha
      ? 'PASS'
      : 'FAIL';
  }

  const checks = [
    actualSha === privateExactSha,
    mergeBase === expectedBaseSha,
    changedFileCount === expectedChangedFileCount,
    validationProfile !== 'main-release' || mainRefEquality === 'PASS',
  ];

  return {
    status: checks.every(Boolean) ? 'PASS' : 'FAIL',
    actualSha,
    mergeBase,
    changedFileCount,
    actualMainSha,
    mainRefEquality,
  };
}

function main() {
  try {
    const result = verifyPrivateScope();
    for (const [key, value] of Object.entries({
      status: result.status,
      actual_sha: result.actualSha,
      merge_base: result.mergeBase,
      changed_file_count: result.changedFileCount,
      actual_main_sha: result.actualMainSha || 'NOT_RUN',
      main_ref_equality: result.mainRefEquality,
    })) writeOutput(key, value);
    process.exitCode = result.status === 'PASS' ? 0 : 1;
  } catch {
    writeOutput('status', 'FAIL');
    writeOutput('failure_label', 'SCOPE_VERIFICATION_ERROR');
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

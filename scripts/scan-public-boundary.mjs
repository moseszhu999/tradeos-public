import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const ALLOWED_ROOT_FILES = new Set(['README.md', 'package.json', 'package-lock.json']);
const ALLOWED_ROOT_DIRECTORIES = new Set(['.github', 'docs', 'scripts', 'test']);
const FORBIDDEN_EXTENSIONS = new Set([
  '.env', '.log', '.sql', '.sqlite', '.db', '.zip', '.tar', '.gz', '.tgz', '.7z', '.pem', '.key', '.p12', '.pfx',
]);
const FORBIDDEN_PATH_PARTS = [
  /(^|\/)private-repo(\/|$)/i,
  /(^|\/)artifacts?(\/|$)/i,
  /(^|\/)customer[-_ ]?data(\/|$)/i,
  /(^|\/)production[-_ ]?data(\/|$)/i,
  /(^|\/)node_modules(\/|$)/i,
];
const CONTENT_RULES = Object.freeze([
  ['PRIVATE_KEY', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['GITHUB_TOKEN', /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}\b/],
  ['GITHUB_FINE_GRAINED_TOKEN', /\bgithub_pat_[A-Za-z0-9_]{20,}\b/],
  ['OPENAI_KEY', /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ['SUPABASE_URL', /https:\/\/[a-z0-9]{8,}\.supabase\.co\b/i],
  ['JWT_VALUE', /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/],
  ['UPLOAD_ARTIFACT', /uses:\s*actions\/upload-artifact@/i],
  ['PERSIST_CREDENTIALS_TRUE', /persist-credentials:\s*true/i],
  ['PULL_REQUEST_TARGET', /^\s*pull_request_target\s*:/im],
]);

export function classifyPath(filePath) {
  if (!filePath || filePath.startsWith('/') || filePath.includes('..')) return ['INVALID_PATH'];
  const root = filePath.split('/')[0];
  const failures = [];
  if (!ALLOWED_ROOT_FILES.has(filePath) && !ALLOWED_ROOT_DIRECTORIES.has(root)) {
    failures.push('OUTSIDE_PUBLIC_ALLOWLIST');
  }
  if (FORBIDDEN_EXTENSIONS.has(extname(filePath).toLowerCase())) failures.push('FORBIDDEN_EXTENSION');
  for (const pattern of FORBIDDEN_PATH_PARTS) if (pattern.test(filePath)) failures.push('FORBIDDEN_PATH');
  return [...new Set(failures)];
}

export function scanContent(content) {
  const failures = [];
  for (const [label, pattern] of CONTENT_RULES) if (pattern.test(content)) failures.push(label);
  return failures;
}

function trackedFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return output.split('\0').filter(Boolean);
}

export function scanRepository(files = trackedFiles()) {
  const findings = [];
  for (const filePath of files) {
    for (const label of classifyPath(filePath)) findings.push(`${label}:${filePath}`);
    let content;
    try {
      content = readFileSync(filePath, 'utf8');
    } catch {
      findings.push(`NON_TEXT_OR_UNREADABLE:${filePath}`);
      continue;
    }
    for (const label of scanContent(content)) findings.push(`${label}:${filePath}`);
  }
  return findings;
}

function main() {
  const findings = scanRepository();
  if (findings.length) {
    for (const finding of findings) console.error(finding);
    process.exitCode = 1;
    return;
  }
  console.log('TRADEOS_PUBLIC_BOUNDARY PASS');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();

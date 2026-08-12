import { appendFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const PROFILE = 'agent-l0-mcp-tool-contract';
const TEST_FILE = 'tests/tradeos-agent-l0-mcp-tool-contracts.test.ts';
const COMMANDS = Object.freeze([
  Object.freeze({ name: 'npm:ci', command: 'npm', args: Object.freeze(['ci', '--no-audit', '--no-fund']) }),
  Object.freeze({ name: 'npm:focused-test', command: 'npm', args: Object.freeze(['test', '--', TEST_FILE]) }),
  Object.freeze({ name: 'npm:typecheck', command: 'npm', args: Object.freeze(['run', 'typecheck']) }),
]);

function output(key, value) {
  if (!process.env.GITHUB_OUTPUT) return;
  appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`, 'utf8');
}

function finish(status, passed, failureStage) {
  output('status', status);
  output('passed_step_count', String(passed));
  output('step_count', String(COMMANDS.length));
  output('failure_stage', failureStage);
}

function main() {
  const selected = process.env.VALIDATION_PROFILE || '';
  const cwd = process.env.PRIVATE_REPO_PATH || '';
  if (selected !== PROFILE || !cwd) {
    finish('FAIL', 0, 'PROFILE_SELECTION');
    process.exitCode = 1;
    return;
  }

  let passed = 0;
  for (const stage of COMMANDS) {
    const result = spawnSync(stage.command, stage.args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
      maxBuffer: 16 * 1024 * 1024,
    });
    if (result.error || result.status !== 0) {
      finish('FAIL', passed, stage.name);
      process.exitCode = 1;
      return;
    }
    passed += 1;
  }
  finish('PASS', passed, 'NONE');
}

main();

import { appendFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const install = ['npm', ['ci', '--no-audit', '--no-fund']];
const unit = ['npm', ['test']];
const typecheck = ['npm', ['run', 'typecheck']];
const build = ['npm', ['run', 'build']];
const contractsCompile = ['npm', ['run', 'contracts:compile']];
const contractsTest = ['npm', ['run', 'contracts:test']];

export const PROFILE_DEFINITIONS = Object.freeze({
  'bounded-runtime': {
    markers: [],
    commands: [install, unit, typecheck],
  },
  'agent-client-contract': {
    markers: ['mcp', 'confirmation', 'audit'],
    commands: [install, unit, typecheck],
  },
  'codex-integration': {
    markers: ['codex', 'mcp'],
    commands: [install, unit, typecheck, build],
  },
  'workbuddy-integration': {
    markers: ['workbuddy', 'mcp'],
    commands: [install, unit, typecheck, build],
  },
  'web-product': {
    markers: [],
    commands: [install, unit, typecheck, build],
  },
  'main-release': {
    markers: [],
    commands: [install, unit, typecheck, build, contractsCompile, contractsTest],
  },
});

function writeOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  appendFileSync(output, `${key}=${value}\n`, { encoding: 'utf8' });
}

function appendSealed(logPath, label, result) {
  appendFileSync(logPath, `\n===== ${label} =====\n`, { encoding: 'utf8' });
  if (result.stdout) appendFileSync(logPath, result.stdout, { encoding: 'utf8' });
  if (result.stderr) appendFileSync(logPath, result.stderr, { encoding: 'utf8' });
}

function runMarker(repoPath, pattern, logPath) {
  const result = spawnSync('git', ['-C', repoPath, 'grep', '-I', '-i', '-l', '-e', pattern, '--', '.'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  appendSealed(logPath, `marker:${pattern}`, result);
  return result.status === 0;
}

function runCommand(repoPath, command, args, logPath) {
  const result = spawnSync(command, args, {
    cwd: repoPath,
    env: {
      ...process.env,
      CI: 'true',
      NEXT_TELEMETRY_DISABLED: '1',
    },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  appendSealed(logPath, `${command} ${args.join(' ')}`, result);
  return result.status === 0;
}

export function runFixedProfile({ repoPath, profile, runnerTemp }) {
  const definition = PROFILE_DEFINITIONS[profile];
  if (!definition) {
    return { status: 'FAIL', passedStepCount: 0, stepCount: 0, failureStage: 'INVALID_PROFILE' };
  }

  const logPath = join(runnerTemp, 'tradeos-private-profile.log');
  writeFileSync(logPath, '', { encoding: 'utf8', mode: 0o600 });
  const steps = [
    ...definition.markers.map((pattern) => ({ kind: 'marker', label: `marker:${pattern}`, pattern })),
    ...definition.commands.map(([command, args]) => ({ kind: 'command', label: `${command}:${args[0]}`, command, args })),
  ];

  let passedStepCount = 0;
  let failureStage = 'NONE';
  for (const step of steps) {
    const passed = step.kind === 'marker'
      ? runMarker(repoPath, step.pattern, logPath)
      : runCommand(repoPath, step.command, step.args, logPath);
    if (!passed) {
      failureStage = step.label;
      break;
    }
    passedStepCount += 1;
  }

  return {
    status: passedStepCount === steps.length ? 'PASS' : 'FAIL',
    passedStepCount,
    stepCount: steps.length,
    failureStage,
  };
}

function main() {
  try {
    const result = runFixedProfile({
      repoPath: process.env.PRIVATE_REPO_PATH,
      profile: process.env.VALIDATION_PROFILE,
      runnerTemp: process.env.RUNNER_TEMP,
    });
    writeOutput('status', result.status);
    writeOutput('passed_step_count', result.passedStepCount);
    writeOutput('step_count', result.stepCount);
    writeOutput('failure_stage', result.failureStage);
    process.exitCode = result.status === 'PASS' ? 0 : 1;
  } catch {
    writeOutput('status', 'FAIL');
    writeOutput('passed_step_count', '0');
    writeOutput('step_count', '0');
    writeOutput('failure_stage', 'PROFILE_CONTROLLER_ERROR');
    process.exitCode = 1;
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}

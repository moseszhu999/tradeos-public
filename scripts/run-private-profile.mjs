import { appendFileSync, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const install = ['npm', ['ci', '--no-audit', '--no-fund']];
const unit = ['npm', ['test']];
const typecheck = ['npm', ['run', 'typecheck']];
const build = ['npm', ['run', 'build']];
const contractsCompile = ['npm', ['run', 'contracts:compile']];
const contractsTest = ['npm', ['run', 'contracts:test']];
const opportunityImportFocused = ['npm', [
  'test',
  '--',
  'tests/trade-public-market-opportunity-import-core.test.ts',
  'tests/trade-public-market-opportunity-import-validation.test.ts',
]];
const explainableMatchFocused = ['npm', [
  'test',
  '--',
  'tests/trade-public-market-market-match-core.test.ts',
]];
const retentionParticipationFocused = ['npm', [
  'test',
  '--',
  'tests/trade-public-market-retention-runtime.test.ts',
  'tests/trade-public-market-retention-from-match.test.ts',
  'tests/trade-public-market-retention-from-opportunity.test.ts',
  'tests/trade-public-market-claim-invite-intents.test.ts',
]];
const neonAuthorizationFocused = ['npm', [
  'test',
  '--',
  'tests/trade-neon-business-authorization-foundation.test.ts',
]];

const CORE_FILES = Object.freeze([
  'app/api/integrations/agents/mcp/route.ts',
  'lib/tradeos-agent-gateway/context.ts',
  'lib/tradeos-agent-gateway/client-identity.ts',
  'lib/tradeos-agent-gateway/mcp-server.ts',
  'tests/tradeos-agent-gateway/mcp-contract.test.ts',
]);

const CORE_PATTERNS = Object.freeze([
  ['app/api/integrations/agents/mcp/route.ts', /initialize/i],
  ['app/api/integrations/agents/mcp/route.ts', /tools\/list/i],
  ['app/api/integrations/agents/mcp/route.ts', /tools\/call/i],
  ['app/api/integrations/agents/mcp/route.ts', /WWW-Authenticate/i],
  ['lib/tradeos-agent-gateway/context.ts', /authorization/i],
  ['lib/tradeos-agent-gateway/context.ts', /(organization|tenant)/i],
  ['lib/tradeos-agent-gateway/context.ts', /role/i],
  ['lib/tradeos-agent-gateway/client-identity.ts', /codex/i],
  ['lib/tradeos-agent-gateway/client-identity.ts', /workbuddy/i],
  ['lib/tradeos-agent-gateway/client-identity.ts', /unknown/i],
  ['lib/tradeos-agent-gateway/mcp-server.ts', /baseServer/i],
  ['lib/tradeos-agent-gateway/mcp-server.ts', /contextProvider/i],
  ['lib/tradeos-agent-gateway/mcp-server.ts', /handle/i],
  ['tests/tradeos-agent-gateway/mcp-contract.test.ts', /tools\/list/i],
  ['tests/tradeos-agent-gateway/mcp-contract.test.ts', /(cross.organization|cross.tenant)/i],
  ['tests/tradeos-agent-gateway/mcp-contract.test.ts', /confirmation/i],
  ['tests/tradeos-agent-gateway/mcp-contract.test.ts', /audit/i],
  ['tests/tradeos-agent-gateway/mcp-contract.test.ts', /service_role/i],
]);

const CODEX_EVIDENCE = Object.freeze({
  requiredFiles: ['tests/tradeos-agent-gateway/codex-integration.test.ts'],
  filePatterns: [
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /codex/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /initialize/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /tools\/list/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /tools\/call/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /(ordinary|user bearer|human bearer)/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /(cross.organization|cross.tenant)/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /confirmation/i],
    ['tests/tradeos-agent-gateway/codex-integration.test.ts', /audit/i],
  ],
});

const WORKBUDDY_EVIDENCE = Object.freeze({
  requiredFiles: ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts'],
  filePatterns: [
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /workbuddy/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /initialize/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /tools\/list/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /tools\/call/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /(ordinary|user bearer|human bearer)/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /(cross.organization|cross.tenant)/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /confirmation/i],
    ['tests/tradeos-agent-gateway/workbuddy-integration.test.ts', /audit/i],
  ],
});

const OPPORTUNITY_IMPORT_EVIDENCE = Object.freeze({
  requiredFiles: [
    'lib/trade-public-market/opportunity-import/index.ts',
    'tests/trade-public-market-opportunity-import-core.test.ts',
    'tests/trade-public-market-opportunity-import-validation.test.ts',
  ],
  filePatterns: [],
});

const EXPLAINABLE_MATCH_EVIDENCE = Object.freeze({
  requiredFiles: [
    'lib/trade-public-market/market-match/index.ts',
    'tests/trade-public-market-market-match-core.test.ts',
  ],
  filePatterns: [],
});

const RETENTION_PARTICIPATION_EVIDENCE = Object.freeze({
  requiredFiles: [
    'lib/trade-public-market/retention/index.ts',
    'lib/trade-public-market/retention/from-match.ts',
    'lib/trade-public-market/retention/from-opportunity.ts',
    'lib/trade-public-market/retention/claim-invite.ts',
    'tests/trade-public-market-retention-runtime.test.ts',
    'tests/trade-public-market-retention-from-match.test.ts',
    'tests/trade-public-market-retention-from-opportunity.test.ts',
    'tests/trade-public-market-claim-invite-intents.test.ts',
  ],
  filePatterns: [],
});

const NEON_AUTHORIZATION_EVIDENCE = Object.freeze({
  requiredFiles: [
    'database/neon/20260804210000_tradeos_business_authorization_foundation.sql',
    'lib/neon-business/server.ts',
    'tests/trade-neon-business-authorization-foundation.test.ts',
    'docs/waterfall/04-testing/tradeos-neon-business-authorization-foundation-v1.md',
    'docs/waterfall/04-testing/tradeos-current-progress.html',
  ],
  filePatterns: [],
});

const CORE_EVIDENCE = Object.freeze({ requiredFiles: CORE_FILES, filePatterns: CORE_PATTERNS });

export const PROFILE_DEFINITIONS = Object.freeze({
  'bounded-runtime': {
    evidence: null,
    commands: [install, unit, typecheck],
  },
  'public-market-opportunity-import': {
    evidence: OPPORTUNITY_IMPORT_EVIDENCE,
    commands: [install, opportunityImportFocused, typecheck, build],
  },
  'public-market-explainable-match': {
    evidence: EXPLAINABLE_MATCH_EVIDENCE,
    commands: [install, explainableMatchFocused, typecheck, build],
  },
  'public-market-retention-participation': {
    evidence: RETENTION_PARTICIPATION_EVIDENCE,
    commands: [install, retentionParticipationFocused, typecheck, build],
  },
  'neon-business-authorization-foundation': {
    evidence: NEON_AUTHORIZATION_EVIDENCE,
    commands: [install, neonAuthorizationFocused, typecheck, build],
  },
  'agent-client-contract': {
    evidence: CORE_EVIDENCE,
    commands: [install, unit, typecheck],
  },
  'codex-integration': {
    evidence: {
      requiredFiles: [...CORE_FILES, ...CODEX_EVIDENCE.requiredFiles],
      filePatterns: [...CORE_PATTERNS, ...CODEX_EVIDENCE.filePatterns],
    },
    commands: [install, unit, typecheck, build],
  },
  'workbuddy-integration': {
    evidence: {
      requiredFiles: [...CORE_FILES, ...WORKBUDDY_EVIDENCE.requiredFiles],
      filePatterns: [...CORE_PATTERNS, ...WORKBUDDY_EVIDENCE.filePatterns],
    },
    commands: [install, unit, typecheck, build],
  },
  'web-product': {
    evidence: null,
    commands: [install, unit, typecheck, build],
  },
  'main-release': {
    evidence: {
      ...CORE_EVIDENCE,
      anyOf: [CODEX_EVIDENCE, WORKBUDDY_EVIDENCE],
    },
    commands: [install, unit, typecheck, build, contractsCompile, contractsTest],
  },
});

function writeOutput(key, value) {
  const output = process.env.GITHUB_OUTPUT;
  if (!output) return;
  appendFileSync(output, `${key}=${value}\n`, { encoding: 'utf8' });
}

function appendSealed(logPath, label, output = '') {
  appendFileSync(logPath, `\n===== ${label} =====\n${output}`, { encoding: 'utf8' });
}

function verifyEvidenceSet(repoPath, evidence) {
  if (!evidence) return { passed: true, failures: [] };
  const failures = [];

  for (const relativePath of evidence.requiredFiles || []) {
    const absolutePath = join(repoPath, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      failures.push(`MISSING_FILE:${relativePath}`);
    }
  }

  for (const [relativePath, pattern] of evidence.filePatterns || []) {
    const absolutePath = join(repoPath, relativePath);
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      failures.push(`MISSING_PATTERN_FILE:${relativePath}`);
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    if (!pattern.test(content)) failures.push(`MISSING_PATTERN:${relativePath}:${pattern.source}`);
  }

  if (evidence.anyOf?.length) {
    const alternatives = evidence.anyOf.map((candidate) => verifyEvidenceSet(repoPath, candidate));
    if (!alternatives.some((candidate) => candidate.passed)) {
      failures.push('NO_REAL_CLIENT_INTEGRATION');
      alternatives.forEach((candidate, index) => {
        failures.push(...candidate.failures.map((failure) => `ALTERNATIVE_${index + 1}:${failure}`));
      });
    }
  }

  return { passed: failures.length === 0, failures };
}

function runEvidence(repoPath, evidence, logPath) {
  const result = verifyEvidenceSet(repoPath, evidence);
  appendSealed(logPath, 'canonical-evidence', `${result.failures.join('\n')}\n`);
  return result.passed;
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
  appendSealed(logPath, `${command} ${args.join(' ')}`, `${result.stdout || ''}${result.stderr || ''}`);
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
    ...(definition.evidence ? [{ kind: 'evidence', label: 'canonical-evidence', evidence: definition.evidence }] : []),
    ...definition.commands.map(([command, args]) => ({ kind: 'command', label: `${command}:${args.join(':')}`, command, args })),
  ];

  let passedStepCount = 0;
  let failureStage = 'NONE';
  for (const step of steps) {
    const passed = step.kind === 'evidence'
      ? runEvidence(repoPath, step.evidence, logPath)
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

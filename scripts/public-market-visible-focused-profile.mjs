#!/usr/bin/env node

import { readFileSync } from 'node:fs';

export const REQUEST_PATH = '.github/public-market-visible-focused-request.json';
export const TARGETS = Object.freeze({
  'market-watch-visible': Object.freeze({ testFile: 'tests/trade-public-market-market-watch-visible-adapter.test.ts' }),
  'evidence-feedback-visible': Object.freeze({ testFile: 'tests/trade-public-market-evidence-feedback-visible-adapter.test.ts' }),
  'market-shared-case-proposal': Object.freeze({ testFile: 'tests/trade-neon-market-shared-case-proposal-contract.test.ts' }),
  'neon-business-empty-success': Object.freeze({ testFile: 'tests/trade-neon-business-data-api-empty-success.test.ts' }),
  'business-channel-contracts': Object.freeze({ testFile: 'tests/business-channel-contracts.test.ts' }),
  'bottom-up-cockpit': Object.freeze({ testFile: 'tests/trade-bottom-up-cockpit.test.ts' }),
  'vercel-release-decoupling': Object.freeze({ testFile: 'tests/vercel-production-deploy-decoupling.test.ts' }),
  'group-work-inbox': Object.freeze({ testFile: 'tests/group-work-entry-work-inbox.test.ts' }),
  'group-work-provider-transport': Object.freeze({ testFile: 'tests/group-work-entry-provider-transport.test.ts' }),
  'tradeos-n2-work-source': Object.freeze({ testFile: 'tests/group-work-entry-tradeos-proposal-work-source.test.ts' }),
  'n2-specification-sourcing-conversion': Object.freeze({ testFile: 'tests/trade-neon-sourcing-conversion' }),
  'n3-a0-rfq-shared-case-preparation': Object.freeze({ testFile: 'tests/trade-neon-rfq-shared-case-preparation' }),
  'first-principles-proof-core': Object.freeze({ testFile: 'tests/first-principles-proof-contracts.test.ts' }),
  'first-principles-proof-pack': Object.freeze({ testFile: 'tests/first-principles-proof-pack.test.ts' }),
  'first-principles-physical-bom': Object.freeze({ testFile: 'tests/first-principles-physical-bom.test.ts' }),
  'first-principles-shadow-run': Object.freeze({ testFile: 'tests/first-principles-shadow-run.test.ts' }),
  'first-principles-shadow-observation-adapter': Object.freeze({ testFile: 'tests/first-principles-shadow-observation-adapter.test.ts' }),
  'tradeos-three-protocols': Object.freeze({ testFile: 'tests/trade-protocols-three-layer-core.test.ts' }),
  'tradeos-settlement-finance-interface': Object.freeze({ testFile: 'tests/trade-protocols-settlement-transport-finance-interface.test.ts' }),
  'tradeos-finance-connector-kit': Object.freeze({ testFile: 'tests/trade-protocols-finance-connector-kit.test.ts' }),
  'tradeos-authority-oracle-attestations': Object.freeze({ testFile: 'tests/trade-protocols-authority-oracle-attestations.test.ts' }),
  'tradeos-public-market-state-bridge': Object.freeze({ testFile: 'tests/trade-public-market-state-bridge.test.ts' }),
  'tradeos-oracle-fusion-readonly-binding': Object.freeze({ testFile: 'tests/trade-protocols-oracle-fusion-readonly-binding.test.ts' }),
  'tradeos-sap-s4hana-readonly-binding': Object.freeze({ testFile: 'tests/trade-protocols-sap-s4hana-readonly-binding.test.ts' }),
  'tradeos-kingdee-k3cloud-readonly-binding': Object.freeze({ testFile: 'tests/trade-protocols-kingdee-k3cloud-readonly-binding.test.ts' }),
  'tradeos-hsbc-trade-loans-binding': Object.freeze({ testFile: 'tests/trade-protocols-hsbc-trade-finance-loans-binding.test.ts' }),
  'tradeos-hsbc-receivables-finance-binding': Object.freeze({ testFile: 'tests/trade-protocols-hsbc-receivables-finance-binding.test.ts' }),
  'tradeos-hsbc-payment-initiation-settlement-binding': Object.freeze({ testFile: 'tests/trade-protocols-hsbc-payment-initiation-settlement-binding.test.ts' }),
  'tradeos-financial-institution-binding-registry': Object.freeze({ testFile: 'tests/trade-protocols-financial-institution-binding-registry.test.ts' }),
  'tradeos-citi-payment-settlement-binding': Object.freeze({ testFile: 'tests/trade-protocols-citi-payment-settlement-binding.test.ts' }),
  'tradeos-financial-institution-onboarding-attestation': Object.freeze({ testFile: 'tests/trade-protocols-financial-institution-onboarding-attestation.test.ts' }),
  'tradeos-financial-institution-transport-activation-plan': Object.freeze({ testFile: 'tests/trade-protocols-financial-institution-transport-activation-plan.test.ts' }),
  'tradeos-financial-institution-execution-authority': Object.freeze({ testFile: 'tests/trade-protocols-financial-institution-execution-authority.test.ts' }),
  'tradeos-financial-institution-execution-authority-replay-bound-assessment': Object.freeze({ testFile: 'tests/trade-protocols-financial-institution-execution-authority-replay-bound-assessment.test.ts' }),
  'tradeos-financial-institution-runtime-invocation': Object.freeze({ testFile: 'tests/trade-protocols-financial-institution-runtime-invocation-envelope.test.ts' }),
});

const SHA40 = /^[0-9a-f]{40}$/;
const REQUEST_ID = /^[a-z0-9][a-z0-9-]{2,63}$/;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateRequest(value) {
  if (!isRecord(value)) throw new Error('visible_focused_request_invalid');
  const expectedKeys = ['expectedBaseSha', 'expectedChangedFileCount', 'privateExactSha', 'requestId', 'target'];
  const keys = Object.keys(value).sort();
  if (JSON.stringify(keys) !== JSON.stringify(expectedKeys)) throw new Error('visible_focused_request_shape_invalid');
  if (!REQUEST_ID.test(value.requestId ?? '')) throw new Error('visible_focused_request_id_invalid');
  if (!Object.hasOwn(TARGETS, value.target)) throw new Error('visible_focused_target_invalid');
  if (!SHA40.test(value.privateExactSha ?? '')) throw new Error('visible_focused_private_sha_invalid');
  if (!SHA40.test(value.expectedBaseSha ?? '')) throw new Error('visible_focused_base_sha_invalid');
  if (!Number.isInteger(value.expectedChangedFileCount) || value.expectedChangedFileCount < 1 || value.expectedChangedFileCount > 10) {
    throw new Error('visible_focused_changed_file_count_invalid');
  }
  return Object.freeze({
    requestId: value.requestId,
    target: value.target,
    privateExactSha: value.privateExactSha,
    expectedBaseSha: value.expectedBaseSha,
    expectedChangedFileCount: value.expectedChangedFileCount,
    testFile: TARGETS[value.target].testFile,
  });
}

export function shellPlan(request) {
  return Object.freeze([
    Object.freeze(['npm', ['ci', '--no-audit', '--no-fund']]),
    Object.freeze(['npm', ['test', '--', request.testFile]]),
    Object.freeze(['npm', ['run', 'typecheck']]),
    Object.freeze(['npm', ['run', 'build']]),
  ]);
}

export function readRequest(path = REQUEST_PATH) {
  return validateRequest(JSON.parse(readFileSync(path, 'utf8')));
}

if (process.argv[1]?.endsWith('public-market-visible-focused-profile.mjs')) {
  try {
    const request = readRequest(process.argv[2] ?? REQUEST_PATH);
    process.stdout.write(`${JSON.stringify({
      schemaVersion: 'tradeos.public-market-visible-focused.v1',
      requestId: request.requestId,
      target: request.target,
      privateExactSha: request.privateExactSha,
      expectedBaseSha: request.expectedBaseSha,
      expectedChangedFileCount: request.expectedChangedFileCount,
      testFile: request.testFile,
      commands: shellPlan(request),
      deploymentPerformed: false,
      databaseWritePerformed: false,
      externalActionPerformed: false,
    })}\n`);
  } catch (error) {
    process.stderr.write(`${JSON.stringify({ verdict: 'FAIL', failure: error instanceof Error ? error.message : String(error) })}\n`);
    process.exitCode = 1;
  }
}

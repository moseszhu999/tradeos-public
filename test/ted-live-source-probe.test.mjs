import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TED_LIVE_ENDPOINT,
  TED_LIVE_FIELDS,
  TED_LIVE_LIMIT,
  TED_LIVE_PRIVATE_EXACT_SHA,
  TED_LIVE_QUERY,
  TED_LIVE_SCOPE,
  runTedLiveProbe,
  summarizeTedRows,
  validateTedLiveRequest,
} from '../scripts/ted-live-source-probe.mjs';

test('locks the fixed TED endpoint, known notice query, ALL scope and minimal field allowlist', () => {
  assert.equal(TED_LIVE_ENDPOINT, 'https://api.ted.europa.eu/v3/notices/search');
  assert.equal(TED_LIVE_QUERY, 'publication-number = 151703-2026');
  assert.equal(TED_LIVE_SCOPE, 'ALL');
  assert.equal(TED_LIVE_LIMIT, 1);
  assert.equal(TED_LIVE_PRIVATE_EXACT_SHA, 'd52c3d48dfd42cf6037a81088349e8e691705d8c');
  assert.deepEqual(TED_LIVE_FIELDS, [
    'publication-number',
    'notice-title',
    'buyer-name',
    'notice-type',
    'classification-cpv',
    'publication-date',
    'deadline',
    'place-of-performance',
  ]);
  assert.ok(TED_LIVE_FIELDS.every((field) => !/(email|phone|contact|touchpoint)/i.test(field)));
});

test('accepts only a tiny non-executable request that pins the private exact head', () => {
  const request = validateTedLiveRequest({
    requestId: 'ted-live-d52c3d4',
    privateExactSha: TED_LIVE_PRIVATE_EXACT_SHA,
  });
  assert.equal(request.privateExactSha, TED_LIVE_PRIVATE_EXACT_SHA);
  assert.throws(() => validateTedLiveRequest({
    requestId: 'ted-live-d52c3d4',
    privateExactSha: '0'.repeat(40),
  }), /ted_live_private_exact_sha_mismatch/);
  assert.throws(() => validateTedLiveRequest({
    requestId: 'ted-live-d52c3d4',
    privateExactSha: TED_LIVE_PRIVATE_EXACT_SHA,
    endpoint: 'https://example.test',
  }), /ted_live_request_shape_invalid/);
});

test('summarizes field names and counts without copying source values', () => {
  const rows = [{
    'publication-number': '151703-2026',
    'notice-title': { eng: 'Do not expose this title' },
    'buyer-name': { eng: 'Do not expose this buyer' },
    'buyer-email': 'private@example.test',
    nested: { 'buyer-touchpoint-name': 'Private Person' },
  }];
  const summary = summarizeTedRows(rows);
  const serialized = JSON.stringify(summary);
  assert.equal(summary.receivedRows, 1);
  assert.equal(summary.validPublicationNumberCount, 1);
  assert.deepEqual(summary.contactLikeFieldNames, ['buyer-email', 'buyer-touchpoint-name']);
  assert.doesNotMatch(serialized, /Do not expose this title/);
  assert.doesNotMatch(serialized, /Do not expose this buyer/);
  assert.doesNotMatch(serialized, /private@example\.test/);
  assert.doesNotMatch(serialized, /Private Person/);
});

test('sends one executable fixed POST and emits only the sanitized verdict contract', async () => {
  let capturedUrl;
  let capturedInit;
  const fakeFetch = async (url, init) => {
    capturedUrl = url;
    capturedInit = init;
    return {
      ok: true,
      status: 200,
      async json() {
        return {
          notices: [{
            'publication-number': '151703-2026',
            'notice-title': { eng: 'Sensitive-ish public title not needed in verdict' },
            'buyer-name': { eng: 'Public buyer name not needed in verdict' },
            'notice-type': 'cn-standard',
          }],
        };
      },
    };
  };

  const result = await runTedLiveProbe({
    requestId: 'ted-live-d52c3d4',
    privateExactSha: TED_LIVE_PRIVATE_EXACT_SHA,
  }, fakeFetch);

  assert.equal(capturedUrl, TED_LIVE_ENDPOINT);
  assert.equal(capturedInit.method, 'POST');
  const wire = JSON.parse(capturedInit.body);
  assert.deepEqual(Object.keys(wire).sort(), [
    'checkQuerySyntax', 'fields', 'limit', 'page', 'paginationMode', 'query', 'scope',
  ]);
  assert.equal(wire.query, TED_LIVE_QUERY);
  assert.equal(wire.scope, 'ALL');
  assert.equal(wire.limit, 1);
  assert.equal(wire.checkQuerySyntax, false);
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.scope, 'ALL');
  assert.equal(result.checkQuerySyntax, false);
  assert.equal(result.contactValuesCopied, false);
  assert.equal(result.rawRowsLogged, false);
  assert.equal(result.rawPayloadPersisted, false);
  assert.equal(result.persistencePerformed, false);
  assert.equal(result.databaseWritePerformed, false);
  assert.equal(result.externalSendPerformed, false);
  const serialized = JSON.stringify(result);
  assert.doesNotMatch(serialized, /Sensitive-ish public title/);
  assert.doesNotMatch(serialized, /Public buyer name/);
});

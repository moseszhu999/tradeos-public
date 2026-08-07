#!/usr/bin/env node

import { readFileSync } from 'node:fs';

export const TED_LIVE_ENDPOINT = 'https://api.ted.europa.eu/v3/notices/search';
export const TED_LIVE_QUERY = 'publication-number = 151703-2026';
export const TED_LIVE_SCOPE = 'ALL';
export const TED_LIVE_LIMIT = 1;
export const TED_LIVE_PRIVATE_EXACT_SHA = 'd52c3d48dfd42cf6037a81088349e8e691705d8c';
export const TED_LIVE_REQUEST_PATH = '.github/ted-live-source-probe-request.json';
export const TED_LIVE_FIELDS = Object.freeze([
  'publication-number',
  'notice-title',
  'buyer-name',
  'notice-type',
  'classification-cpv',
  'publication-date',
  'deadline',
  'place-of-performance',
]);

const CONTACT_LIKE = /(email|phone|contact|touchpoint)/i;
const PUBLICATION_NUMBER = /^\d{6,8}-\d{4}$/;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validateTedLiveRequest(value) {
  if (!isRecord(value)) throw new Error('ted_live_request_invalid');
  const keys = Object.keys(value).sort();
  if (JSON.stringify(keys) !== JSON.stringify(['privateExactSha', 'requestId'])) {
    throw new Error('ted_live_request_shape_invalid');
  }
  if (typeof value.requestId !== 'string' || !/^ted-live-[a-z0-9-]{1,48}$/.test(value.requestId)) {
    throw new Error('ted_live_request_id_invalid');
  }
  if (value.privateExactSha !== TED_LIVE_PRIVATE_EXACT_SHA) {
    throw new Error('ted_live_private_exact_sha_mismatch');
  }
  return Object.freeze({ requestId: value.requestId, privateExactSha: value.privateExactSha });
}

export function rowsFromTedResponse(body) {
  for (const candidate of [body?.notices, body?.results, body?.content]) {
    if (Array.isArray(candidate)) return candidate;
  }
  throw new Error('ted_live_response_rows_missing');
}

function collectFieldNames(value, output = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) collectFieldNames(item, output);
    return output;
  }
  if (!isRecord(value)) return output;
  for (const [key, child] of Object.entries(value)) {
    output.add(key);
    collectFieldNames(child, output);
  }
  return output;
}

export function summarizeTedRows(rows) {
  const fieldNames = [...collectFieldNames(rows)].sort();
  const contactLikeFieldNames = fieldNames.filter((name) => CONTACT_LIKE.test(name));
  let validPublicationNumberCount = 0;
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const raw = row['publication-number'];
    const candidates = Array.isArray(raw) ? raw : [raw];
    if (candidates.some((value) => PUBLICATION_NUMBER.test(String(value ?? '').trim()))) {
      validPublicationNumberCount += 1;
    }
  }
  return Object.freeze({
    receivedRows: rows.length,
    validPublicationNumberCount,
    returnedFieldNames: Object.freeze(fieldNames),
    contactLikeFieldNames: Object.freeze(contactLikeFieldNames),
  });
}

export async function runTedLiveProbe(request, fetchImpl = fetch) {
  const response = await fetchImpl(TED_LIVE_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'user-agent': 'tradeOS-public-ted-live-probe/1.0',
    },
    body: JSON.stringify({
      query: TED_LIVE_QUERY,
      fields: TED_LIVE_FIELDS,
      page: 1,
      limit: TED_LIVE_LIMIT,
      scope: TED_LIVE_SCOPE,
      checkQuerySyntax: false,
      paginationMode: 'PAGE_NUMBER',
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) throw new Error(`ted_live_http_${response.status}`);
  const rows = rowsFromTedResponse(await response.json());
  const summary = summarizeTedRows(rows);
  if (summary.receivedRows < 1) throw new Error('ted_live_no_rows');
  if (summary.validPublicationNumberCount < 1) throw new Error('ted_live_no_valid_publication_number');

  return Object.freeze({
    schemaVersion: 'tradeos.ted-live-source-probe.v1',
    requestId: request.requestId,
    privateExactSha: request.privateExactSha,
    endpoint: TED_LIVE_ENDPOINT,
    queryId: 'fixed-known-cn-standard-151703-2026-v2',
    scope: TED_LIVE_SCOPE,
    checkQuerySyntax: false,
    requestedLimit: TED_LIVE_LIMIT,
    httpStatus: response.status,
    receivedRows: summary.receivedRows,
    validPublicationNumberCount: summary.validPublicationNumberCount,
    returnedFieldNames: summary.returnedFieldNames,
    contactLikeFieldNames: summary.contactLikeFieldNames,
    contactValuesCopied: false,
    rawRowsLogged: false,
    rawPayloadPersisted: false,
    persistencePerformed: false,
    databaseWritePerformed: false,
    supplierCreated: false,
    sourcingProjectCreated: false,
    rfqIssued: false,
    externalSendPerformed: false,
    verdict: 'PASS',
  });
}

async function main() {
  const requestPath = process.argv[2] ?? TED_LIVE_REQUEST_PATH;
  const request = validateTedLiveRequest(JSON.parse(readFileSync(requestPath, 'utf8')));
  const result = await runTedLiveProbe(request);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1]?.endsWith('ted-live-source-probe.mjs')) {
  main().catch((error) => {
    process.stderr.write(`${JSON.stringify({
      schemaVersion: 'tradeos.ted-live-source-probe.v1',
      contactValuesCopied: false,
      rawRowsLogged: false,
      persistencePerformed: false,
      verdict: 'FAIL',
      failure: error instanceof Error ? error.message : String(error),
    })}\n`);
    process.exitCode = 1;
  });
}

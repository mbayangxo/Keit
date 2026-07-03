import '../helpers/setup.js';
import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';

import { initiateInternationalTransfer, lemfiConfigured } from '../../lib/lemfi.js';
import { uniqueRef } from '../helpers/db.js';

const realFetch = globalThis.fetch;

beforeEach(() => {
  delete process.env.LEMFI_API_KEY;
  delete process.env.LEMFI_API_KEY_SANDBOX;
  globalThis.fetch = realFetch;
});

after(() => {
  globalThis.fetch = realFetch;
});

const beneficiary = { name: 'Awa Diallo', phone: '+33612345678', country: 'FR' };

test('LemFi sandbox (mock mode) completes an international transfer', async () => {
  assert.equal(lemfiConfigured(), false);
  const result = await initiateInternationalTransfer({
    reference: uniqueRef('INTL'),
    amount: 100_000,
    beneficiary,
    idempotencyKey: uniqueRef('IDK'),
  });
  assert.equal(result.mode, 'sandbox');
  assert.equal(result.status, 'completed');
  assert.ok(result.externalId.startsWith('lemfi-sandbox-'));
});

test('LemFi sandbox with API key passes idempotency key and parses response', async () => {
  process.env.LEMFI_API_KEY_SANDBOX = 'lemfi-test-key';
  let captured;
  globalThis.fetch = async (url, init) => {
    captured = { url, init };
    return { ok: true, status: 200, json: async () => ({ id: 'lf-123', status: 'PROCESSING' }) };
  };

  const idempotencyKey = uniqueRef('IDK');
  const result = await initiateInternationalTransfer({
    reference: uniqueRef('INTL'),
    amount: 100_000,
    beneficiary,
    idempotencyKey,
  });

  assert.equal(result.status, 'processing');
  assert.equal(result.externalId, 'lf-123');
  assert.equal(captured.init.headers['Idempotency-Key'], idempotencyKey);
  assert.ok(captured.url.includes('sandbox'), 'non-production must hit the sandbox URL');
});

test('LemFi explicit rejection maps to failed', async () => {
  process.env.LEMFI_API_KEY_SANDBOX = 'lemfi-test-key';
  globalThis.fetch = async () => ({
    ok: false,
    status: 422,
    json: async () => ({ message: 'Beneficiary country not supported' }),
  });

  const result = await initiateInternationalTransfer({
    reference: uniqueRef('INTL'),
    amount: 100_000,
    beneficiary,
    idempotencyKey: uniqueRef('IDK'),
  });
  assert.equal(result.status, 'failed');
  assert.equal(result.message, 'Beneficiary country not supported');
});

test('LemFi timeout resolves pending (ambiguous) — caller must not settle', async () => {
  process.env.LEMFI_API_KEY_SANDBOX = 'lemfi-test-key';
  globalThis.fetch = (_url, init) =>
    new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    });

  const result = await initiateInternationalTransfer({
    reference: uniqueRef('INTL'),
    amount: 100_000,
    beneficiary,
    idempotencyKey: uniqueRef('IDK'),
  });
  assert.equal(result.status, 'pending');
  assert.equal(result.ambiguous, true);
});

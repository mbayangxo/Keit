import '../helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { EXTERNAL_API_MAX_RETRIES, fetchExternalJson } from '../../lib/external-fetch.js';

const realFetch = globalThis.fetch;

function jsonResponse(status, body = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

function withFetch(t, impl) {
  let calls = 0;
  globalThis.fetch = async (...args) => {
    calls += 1;
    return impl(calls, ...args);
  };
  t.after(() => {
    globalThis.fetch = realFetch;
  });
  return () => calls;
}

test('2xx returns ok with parsed body', async (t) => {
  const calls = withFetch(t, () => jsonResponse(200, { status: 'completed', id: 'x1' }));
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, true);
  assert.equal(result.body.id, 'x1');
  assert.equal(calls(), 1);
});

test('4xx is an explicit failure — no retry, safe to mark failed', async (t) => {
  const calls = withFetch(t, () => jsonResponse(400, { message: 'invalid phone' }));
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, false);
  assert.equal(result.explicitFailure, true);
  assert.equal(result.ambiguous, false);
  assert.equal(calls(), 1, '4xx must not be retried');
});

test('5xx retries then resolves ambiguous — must stay PENDING, never failed', async (t) => {
  const calls = withFetch(t, () => jsonResponse(503, {}));
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, false);
  assert.equal(result.explicitFailure, false);
  assert.equal(result.ambiguous, true);
  assert.equal(calls(), EXTERNAL_API_MAX_RETRIES);
});

test('5xx then success on retry recovers', async (t) => {
  const calls = withFetch(t, (n) =>
    n < 2 ? jsonResponse(500, {}) : jsonResponse(200, { status: 'completed' }),
  );
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, true);
  assert.equal(calls(), 2);
});

test('timeout aborts, retries, resolves ambiguous with timeout flag', async (t) => {
  const calls = withFetch(
    t,
    (n, _url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
        });
      }),
  );
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, false);
  assert.equal(result.ambiguous, true);
  assert.equal(result.timeout, true, 'timeout must be reported so caller marks tx pending');
  assert.equal(calls(), EXTERNAL_API_MAX_RETRIES);
});

test('network drop (connection reset) resolves ambiguous, never throws', async (t) => {
  const calls = withFetch(t, () => {
    throw Object.assign(new Error('socket hang up'), { code: 'ECONNRESET' });
  });
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, false);
  assert.equal(result.ambiguous, true);
  assert.notEqual(result.timeout, true);
  assert.equal(calls(), EXTERNAL_API_MAX_RETRIES);
});

test('unparseable JSON body does not crash the caller', async (t) => {
  withFetch(t, () => ({
    ok: true,
    status: 200,
    json: async () => {
      throw new Error('bad json');
    },
  }));
  const result = await fetchExternalJson('https://partner.test/pay');
  assert.equal(result.ok, true);
  assert.deepEqual(result.body, {});
});

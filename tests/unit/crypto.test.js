import '../helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { decryptAtRest, encryptAtRest, secretsEqual } from '../../lib/field-crypto.js';
import { cniMatchesHash, hashCni, normalizeCniNumber } from '../../lib/cni-hash.js';

test('AES-256-GCM round-trip', () => {
  const secret = 'CNI-1234567890';
  const encrypted = encryptAtRest(secret);
  assert.notEqual(encrypted, secret);
  assert.equal(decryptAtRest(encrypted), secret);
});

test('encryption is non-deterministic (fresh IV per call)', () => {
  const a = encryptAtRest('same-value');
  const b = encryptAtRest('same-value');
  assert.notEqual(a, b);
  assert.equal(decryptAtRest(a), decryptAtRest(b));
});

test('tampered ciphertext fails authentication (GCM tag)', () => {
  const encrypted = encryptAtRest('sensitive');
  const buf = Buffer.from(encrypted, 'base64');
  buf[buf.length - 1] ^= 0xff;
  assert.throws(() => decryptAtRest(buf.toString('base64')));
});

test('empty / null plaintext returns null (nothing stored)', () => {
  assert.equal(encryptAtRest(null), null);
  assert.equal(encryptAtRest(''), null);
  assert.equal(decryptAtRest(null), null);
});

test('secretsEqual: constant-time compare semantics', () => {
  assert.equal(secretsEqual('abc', 'abc'), true);
  assert.equal(secretsEqual('abc', 'abd'), false);
  assert.equal(secretsEqual('abc', 'abcd'), false);
  assert.equal(secretsEqual(null, 'abc'), false);
  assert.equal(secretsEqual('abc', null), false);
});

test('CNI hash: normalized, one-way, stable', () => {
  assert.equal(normalizeCniNumber(' 1 234 abc '), '1234ABC');
  const h1 = hashCni('1234 5678 90');
  const h2 = hashCni('1234567890');
  assert.equal(h1, h2, 'same CNI with different spacing must hash identically');
  assert.equal(h1.length, 64, 'sha256 hex');
  assert.notEqual(h1, '1234567890');
});

test('CNI hash matching', () => {
  const stored = hashCni('SN-1234-5678');
  assert.equal(cniMatchesHash('sn-1234-5678', stored), true);
  assert.equal(cniMatchesHash('SN-1234-5679', stored), false);
  assert.equal(cniMatchesHash('', stored), false);
  assert.equal(cniMatchesHash('SN-1234-5678', null), false);
});

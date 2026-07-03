import '../helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatBalanceMessage,
  formatOtpMessage,
  formatReceivedMessage,
  normalizeSmsPhone,
  parseInboundKeyword,
} from '../../lib/sms-service.js';

test('normalizeSmsPhone handles carrier formats', () => {
  assert.equal(normalizeSmsPhone('+221 77 123 45 67'), '+221771234567');
  assert.equal(normalizeSmsPhone('221771234567'), '+221771234567');
  assert.equal(normalizeSmsPhone('00221771234567'), '+221771234567');
});

test('parseInboundKeyword recognizes balance and help in FR/EN/Wolof', () => {
  assert.equal(parseInboundKeyword('solde'), 'balance');
  assert.equal(parseInboundKeyword('  BALANCE  '), 'balance');
  assert.equal(parseInboundKeyword('SALIO'), 'balance');
  assert.equal(parseInboundKeyword('aide'), 'help');
  assert.equal(parseInboundKeyword('?'), 'help');
  assert.equal(parseInboundKeyword('bonjour'), 'unknown');
});

test('formatBalanceMessage shows national + Kori', () => {
  const msg = formatBalanceMessage({ balance: 12500, koriBalance: 1200, currency: 'XOF' });
  assert.match(msg, /12[\s\u202f]?500 XOF/);
  assert.match(msg, /₭[\s\u202f]?1[\s\u202f]?200/);
  assert.match(msg, /SOLDE/);
});

test('formatReceivedMessage includes sender and new balance', () => {
  const msg = formatReceivedMessage({
    amount: 5000,
    currency: 'national',
    senderLabel: 'Awa',
    wallet: { balance: 17500, currency: 'XOF' },
  });
  assert.match(msg, /5[\s\u202f]?000/);
  assert.match(msg, /Awa/);
  assert.match(msg, /17[\s\u202f]?500/);
});

test('OTP message warns not to share code', () => {
  const msg = formatOtpMessage('482910');
  assert.match(msg, /482910/);
  assert.match(msg, /partage/i);
});

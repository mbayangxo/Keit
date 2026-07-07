import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalPhone, phoneFromCountry, phoneVariants, isValidLocalPhone } from '../../lib/phone-normalize.js';

test('US +1 numbers normalize consistently', () => {
  assert.equal(canonicalPhone('+1 555 123 4567'), '+15551234567');
  assert.equal(canonicalPhone('15551234567'), '+15551234567');
  assert.equal(phoneFromCountry({ dial: '+1', code: 'US' }, '5551234567'), '+15551234567');
  assert.equal(phoneFromCountry({ dial: '+1', code: 'US' }, '15551234567'), '+15551234567');
});

test('US phone variants include local 10-digit', () => {
  const variants = phoneVariants('+15551234567');
  assert.ok(variants.includes('+15551234567'));
  assert.ok(variants.includes('5551234567'));
});

test('isValidLocalPhone accepts 11-digit US paste', () => {
  assert.equal(isValidLocalPhone({ dial: '+1', phoneMin: 10, phoneMax: 10 }, '5551234567'), true);
  assert.equal(isValidLocalPhone({ dial: '+1', phoneMin: 10, phoneMax: 10 }, '15551234567'), true);
});

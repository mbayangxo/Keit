import '../helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  CONVERSION_FEE_BPS,
  RESERVE_XOF_PER_KORI,
  countryFromPhone,
  koriToNational,
  koriToNationalAfterFee,
  nationalToKori,
} from '../../lib/kori.js';
import { normalizeAmountToKori } from '../../lib/kori-primary.js';
import {
  ReserveInvariantError,
  assertReserveInvariant,
  expectedReserveXof,
} from '../../lib/kori-reserve.js';

test('national → Kori: 10,000 XOF mints exactly 1,000 ₭', () => {
  assert.equal(nationalToKori(10_000, 'SN'), 1_000);
});

test('legacy national currency on API converts XOF → ₭ (never treats XOF as ₭)', () => {
  assert.equal(normalizeAmountToKori(20_000, 'national', 'SN'), 2_000);
  assert.equal(normalizeAmountToKori(500, 'kori', 'SN'), 500);
});

test('national → Kori floors partial units (never over-mint)', () => {
  assert.equal(nationalToKori(10_009, 'SN'), 1_000);
  assert.equal(nationalToKori(9, 'SN'), 0);
  assert.equal(nationalToKori(0, 'SN'), 0);
});

test('Kori → national: 1,000 ₭ is 10,000 XOF gross', () => {
  assert.equal(koriToNational(1_000, 'SN'), 10_000);
});

test('conversion fee is exactly 2% and net + fee = gross', () => {
  const { grossNational, feeNational, netNational } = koriToNationalAfterFee(1_000, 'SN');
  assert.equal(grossNational, 10_000);
  assert.equal(feeNational, 200);
  assert.equal(netNational, 9_800);
  assert.equal(netNational + feeNational, grossNational);
  assert.equal(CONVERSION_FEE_BPS, 200);
});

test('conversion fee floors — user never overcharged on odd amounts', () => {
  // 3 ₭ → 30 XOF gross, 2% = 0.6 → fee floors to 0
  const { grossNational, feeNational, netNational } = koriToNationalAfterFee(3, 'SN');
  assert.equal(grossNational, 30);
  assert.equal(feeNational, 0);
  assert.equal(netNational, 30);
});

test('round-trip mint → convert never creates money', () => {
  for (const deposit of [1, 9, 10, 999, 10_000, 123_457, 2_000_000]) {
    const kori = nationalToKori(deposit, 'SN');
    const { netNational } = koriToNationalAfterFee(kori, 'SN');
    assert.ok(
      netNational <= deposit,
      `deposit ${deposit} XOF → ${kori} ₭ → ${netNational} XOF must not exceed deposit`,
    );
  }
});

test('country rates: Ghana ₭1 = 1 GHS, Nigeria ₭1 = 10 NGN', () => {
  assert.equal(nationalToKori(100, 'GH'), 100);
  assert.equal(nationalToKori(100, 'NG'), 10);
  assert.equal(koriToNational(50, 'GH'), 50);
  assert.equal(koriToNational(50, 'NG'), 500);
});

test('unknown country falls back to Senegal rate', () => {
  assert.equal(nationalToKori(10_000, 'ZZ'), 1_000);
  assert.equal(nationalToKori(10_000, undefined), 1_000);
});

test('country detection from phone prefix', () => {
  assert.equal(countryFromPhone('+221771234567'), 'SN');
  assert.equal(countryFromPhone('+2348012345678'), 'NG');
  assert.equal(countryFromPhone('+233201234567'), 'GH');
  assert.equal(countryFromPhone('+2201234567'), 'GM');
});

test('reserve invariant: circulation × 10 XOF', () => {
  assert.equal(RESERVE_XOF_PER_KORI, 10);
  assert.equal(expectedReserveXof(0), 0);
  assert.equal(expectedReserveXof(1_000), 10_000);
  assert.doesNotThrow(() => assertReserveInvariant(1_000, 10_000));
});

test('reserve invariant violation throws', () => {
  assert.throws(() => assertReserveInvariant(1_000, 9_999), ReserveInvariantError);
  assert.throws(() => assertReserveInvariant(1_000, 10_001), ReserveInvariantError);
});

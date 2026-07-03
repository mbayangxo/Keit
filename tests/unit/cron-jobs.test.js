import '../helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { expectedReserveXof } from '../../lib/kori-reserve.js';
import { parseInboundKeyword } from '../../lib/sms-service.js';

test('financial integrity invariant: reserve = circulation × 10', () => {
  assert.equal(expectedReserveXof(1000), 10_000);
  assert.equal(expectedReserveXof(0), 0);
});

test('cron job names map to documented SMS balance keywords (offline channel)', () => {
  assert.equal(parseInboundKeyword('SOLDE'), 'balance');
});

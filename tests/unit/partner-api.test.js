import '../helpers/setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

process.env.JOKO_API_KEY = 'unit-key-kebu';
process.env.JOKO_DEFAULT_PARTNER_ID = 'kebu';
process.env.JOKO_API_KEYS = 'rect:rect-key-xyz';

const { authenticatePartner, partnerAuthConfigured, enforcePartnerRateLimit } = await import(
  '../../lib/partner-auth.js'
);
const {
  resolveAmountXof,
  usdCentsToXof,
  signPartnerWebhookBody,
  PartnerPaymentError,
} = await import('../../lib/partner-payments-service.js');

test('partner auth accepts Bearer and x-api-key for kebu', () => {
  assert.equal(partnerAuthConfigured(), true);
  const a = authenticatePartner({
    headers: { authorization: 'Bearer unit-key-kebu' },
  });
  assert.deepEqual(a, { partnerId: 'kebu' });

  const b = authenticatePartner({
    headers: { 'x-api-key': 'rect-key-xyz' },
  });
  assert.deepEqual(b, { partnerId: 'rect' });

  assert.equal(authenticatePartner({ headers: { authorization: 'Bearer wrong' } }), null);
});

test('resolveAmountXof prefers XOF and bridges USD cents', () => {
  assert.equal(resolveAmountXof({ amount_xof: 15000 }), 15000);
  assert.equal(usdCentsToXof(100), 600); // 1 USD → 600 XOF default
  assert.equal(resolveAmountXof({ amount: 100, currency: 'USD' }), 600);
  assert.throws(() => resolveAmountXof({}), PartnerPaymentError);
});

test('webhook HMAC matches Kebu sha256= hex style', () => {
  const raw = '{"status":"paid"}';
  const hex = createHmac('sha256', 'sec').update(raw).digest('hex');
  assert.equal(signPartnerWebhookBody(raw, 'sec'), hex);
  assert.equal(`sha256=${hex}`.replace(/^sha256=/i, ''), hex);
});

test('partner rate limit trips after burst', () => {
  const id = `rate-${Date.now()}`;
  for (let i = 0; i < 60; i++) enforcePartnerRateLimit(id, { limit: 60 });
  assert.throws(() => enforcePartnerRateLimit(id, { limit: 60 }));
});

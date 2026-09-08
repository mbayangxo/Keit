import '../helpers/setup.js';
import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.JOKO_API_KEY = 'test-joko-partner-key-kebu';
process.env.JOKO_DEFAULT_PARTNER_ID = 'kebu';
process.env.JOKO_WEBHOOK_SECRET = 'test-webhook-secret-hmac';
process.env.PUBLIC_APP_URL = 'http://localhost:3999';

import {
  partnerCheckoutSessions,
  partnerMessagesSend,
  partnerPaymentGet,
  partnerPaymentSandboxComplete,
  partnerPaymentsCollect,
} from '../../lib/partner-handlers.js';
import { signPartnerWebhookBody } from '../../lib/partner-payments-service.js';
import { mockReq, mockRes, prisma, createUserWithWallet, uniquePhone } from '../helpers/db.js';

async function call(handler, { body, query, method = 'POST', headers = {} } = {}) {
  const req = mockReq({
    method,
    body,
    query,
    headers: {
      authorization: `Bearer ${process.env.JOKO_API_KEY}`,
      ...headers,
    },
  });
  const res = mockRes();
  await handler(req, res);
  return res;
}

let webhookServer;
let webhookUrl;
let lastWebhook = null;

before(async () => {
  lastWebhook = null;
  webhookServer = createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      lastWebhook = {
        raw,
        signature: req.headers['x-joko-signature'],
        payload: JSON.parse(raw),
      };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise((resolve) => webhookServer.listen(0, '127.0.0.1', resolve));
  const { port } = webhookServer.address();
  webhookUrl = `http://127.0.0.1:${port}/joko`;
});

after(async () => {
  await new Promise((resolve) => webhookServer.close(resolve));
  await prisma.$disconnect();
});

test('partner checkout session XOF + sandbox-complete → HMAC webhook + GET completed', async () => {
  lastWebhook = null;
  const reference = `shop_order_test${Date.now()}`;

  const createRes = await call(partnerCheckoutSessions, {
    body: {
      reference,
      amount_xof: 15000,
      currency: 'XOF',
      description: 'Shop order: Test product',
      customer: { phone: '+221771234567' },
      method: 'wave',
      webhook_url: webhookUrl,
      metadata: {
        partner: 'kebu',
        kind: 'shop_order',
        order_id: 'ord-1',
        project_id: 'proj-1',
      },
    },
  });

  assert.equal(createRes.statusCode, 201, JSON.stringify(createRes.body));
  assert.ok(createRes.body.id?.startsWith('pay_'));
  assert.equal(createRes.body.reference, reference);
  assert.ok(createRes.body.payment_url?.includes('/api/v1/pay/'));
  assert.equal(createRes.body.amount_xof, 15000);
  assert.equal(createRes.body.mode, 'sandbox');

  const idem = await call(partnerCheckoutSessions, {
    body: {
      reference,
      amount_xof: 15000,
      customer: { phone: '+221771234567' },
      webhook_url: webhookUrl,
    },
  });
  assert.equal(idem.statusCode, 200);
  assert.equal(idem.body.id, createRes.body.id);

  const completeRes = await call(partnerPaymentSandboxComplete, {
    query: { reference },
  });
  assert.equal(completeRes.statusCode, 200, JSON.stringify(completeRes.body));
  assert.equal(completeRes.body.status, 'completed');

  // Allow webhook async delivery
  for (let i = 0; i < 20 && !lastWebhook; i++) {
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.ok(lastWebhook, 'webhook should have been delivered');
  assert.equal(lastWebhook.payload.status, 'paid');
  assert.equal(lastWebhook.payload.reference, reference);
  assert.equal(lastWebhook.payload.amount_xof, 15000);
  assert.equal(lastWebhook.payload.metadata.kind, 'shop_order');

  const expectedSig = signPartnerWebhookBody(lastWebhook.raw, process.env.JOKO_WEBHOOK_SECRET);
  assert.equal(lastWebhook.signature, `sha256=${expectedSig}`);

  const getRes = await call(partnerPaymentGet, {
    method: 'GET',
    query: { reference },
  });
  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.body.status, 'completed');
});

test('partner collect accepts amount_xof + phone', async () => {
  const reference = `collect_${Date.now()}`;
  const res = await call(partnerPaymentsCollect, {
    body: {
      reference,
      amount_xof: 5000,
      phone: '+221770000001',
      method: 'orange_money',
      description: 'POS collect',
      webhook_url: webhookUrl,
    },
  });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.ok(res.body.payment_url);
  assert.equal(res.body.amount_xof, 5000);
});

test('partner messages send — Mbolo when user exists', async () => {
  const user = await createUserWithWallet({ name: 'Buyer Mbolo' });
  process.env.PARTNER_MESSAGING_USER_ID = user.id;

  const merchant = await createUserWithWallet({ name: 'Partner System Alt' });
  process.env.PARTNER_MESSAGING_USER_ID = merchant.id;

  const res = await call(partnerMessagesSend, {
    body: {
      to_phone: user.phone,
      text: 'Hi — your order ORD-1 is confirmed.',
      channel: 'mbolo_auto',
      metadata: { partner: 'kebu', kind: 'shop_fulfillment', order_id: 'ord-1' },
    },
  });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  assert.equal(res.body.status, 'sent');
  assert.equal(res.body.channel_used, 'mbolo');
  assert.equal(res.body.error, null);
});

test('partner messages send — honest fail or sms for unknown phone', async () => {
  const phone = uniquePhone();
  const res = await call(partnerMessagesSend, {
    body: {
      to_phone: phone,
      text: 'OTP 123456',
      channel: 'mbolo_auto',
      metadata: { kind: 'verification' },
    },
  });
  assert.equal(res.statusCode, 200, JSON.stringify(res.body));
  // SMS mock provider succeeds in test env when configured as mock
  assert.ok(['sent', 'failed'].includes(res.body.status));
  if (res.body.status === 'sent') {
    assert.equal(res.body.channel_used, 'sms');
  } else {
    assert.ok(res.body.error);
    assert.equal(res.body.channel_used, 'none');
  }
});

test('HMAC helper matches Kebu verify style', () => {
  const body = JSON.stringify({ reference: 'x', status: 'paid' });
  const hex = createHmac('sha256', 'secret').update(body).digest('hex');
  assert.equal(signPartnerWebhookBody(body, 'secret'), hex);
});

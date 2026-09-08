import '../helpers/setup.js';
import { createServer } from 'node:http';
import { test, after, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.JOKO_API_KEY = 'test-joko-partner-key-kebu';
process.env.JOKO_DEFAULT_PARTNER_ID = 'kebu';
process.env.JOKO_WEBHOOK_SECRET = 'test-webhook-secret-hmac';
process.env.PUBLIC_APP_URL = 'http://localhost:3999';

import {
  partnerPosSessions,
  partnerPayoutsCreate,
  partnerPayoutSandboxComplete,
  partnerPayoutGet,
  partnerSupportAgentsCreate,
  partnerSupportThreadsCreate,
  partnerSupportThreadAssign,
  partnerSupportThreadMessage,
} from '../../lib/partner-handlers.js';
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
      lastWebhook = { raw, payload: JSON.parse(raw) };
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise((resolve) => webhookServer.listen(0, '127.0.0.1', resolve));
  const { port } = webhookServer.address();
  webhookUrl = `http://127.0.0.1:${port}/hook`;
});

after(async () => {
  await new Promise((resolve) => webhookServer.close(resolve));
  await prisma.$disconnect();
});

test('slice2 POS session returns QR + payment_url channel=pos', async () => {
  const res = await call(partnerPosSessions, {
    body: {
      amount_xof: 2500,
      description: 'Boutique Dakar counter',
      webhook_url: webhookUrl,
      metadata: { shop_id: 'shop-1' },
    },
  });
  assert.equal(res.statusCode, 201, JSON.stringify(res.body));
  assert.equal(res.body.channel, 'pos');
  assert.ok(res.body.qr_payload?.includes('/api/v1/pay/'));
  assert.ok(res.body.terminal?.qr_payload);
  assert.equal(res.body.amount_xof, 2500);
});

test('slice3 payout create + sandbox-complete → webhook', async () => {
  lastWebhook = null;
  const reference = `payout_${Date.now()}`;
  const createRes = await call(partnerPayoutsCreate, {
    body: {
      reference,
      amount_xof: 10000,
      phone: '+221771112233',
      method: 'wave',
      description: 'Supplier pay',
      webhook_url: webhookUrl,
      metadata: { kind: 'payout', order_id: 'po-1' },
    },
  });
  assert.equal(createRes.statusCode, 201, JSON.stringify(createRes.body));
  assert.equal(createRes.body.status, 'pending');

  const done = await call(partnerPayoutSandboxComplete, { query: { reference } });
  assert.equal(done.statusCode, 200, JSON.stringify(done.body));
  assert.equal(done.body.status, 'completed');

  for (let i = 0; i < 20 && !lastWebhook; i++) await new Promise((r) => setTimeout(r, 50));
  assert.ok(lastWebhook, 'payout webhook delivered');
  assert.equal(lastWebhook.payload.type, 'payout');
  assert.equal(lastWebhook.payload.reference, reference);

  const getRes = await call(partnerPayoutGet, { method: 'GET', query: { reference } });
  assert.equal(getRes.body.status, 'completed');
});

test('slice4 support agents + thread + assign + message', async () => {
  const agentUser = await createUserWithWallet({ name: 'CS Agent Awa' });
  const customer = await createUserWithWallet({ name: 'Customer Modou' });
  const system = await createUserWithWallet({ name: 'Partner System' });
  process.env.PARTNER_MESSAGING_USER_ID = system.id;

  const agentRes = await call(partnerSupportAgentsCreate, {
    body: {
      phone: agentUser.phone,
      name: 'Awa',
      shop_external_id: 'kebu-shop-9',
      role: 'agent',
    },
  });
  assert.equal(agentRes.statusCode, 201, JSON.stringify(agentRes.body));
  assert.equal(agentRes.body.joko_user_id, agentUser.id);

  const threadRes = await call(partnerSupportThreadsCreate, {
    body: {
      customer_phone: customer.phone,
      order_id: `ord_${Date.now()}`,
      shop_external_id: 'kebu-shop-9',
      subject: 'Where is my order?',
      initial_message: 'Bonjour — un agent va vous aider.',
    },
  });
  assert.equal(threadRes.statusCode, 201, JSON.stringify(threadRes.body));
  assert.ok(threadRes.body.mbolo_thread_id);

  const assignRes = await call(partnerSupportThreadAssign, {
    query: { id: threadRes.body.id },
    body: { agent_id: agentRes.body.id },
  });
  assert.equal(assignRes.statusCode, 200, JSON.stringify(assignRes.body));
  assert.equal(assignRes.body.status, 'assigned');
  assert.equal(assignRes.body.assigned_agent_id, agentRes.body.id);

  const msgRes = await call(partnerSupportThreadMessage, {
    query: { id: threadRes.body.id },
    body: { agent_id: agentRes.body.id, text: 'Votre colis part demain.' },
  });
  assert.equal(msgRes.statusCode, 201, JSON.stringify(msgRes.body));
  assert.equal(msgRes.body.channel_used, 'mbolo');
});

test('slice4 agent phone without Joko user fails honestly', async () => {
  const res = await call(partnerSupportAgentsCreate, {
    body: { phone: uniquePhone(), name: 'Ghost' },
  });
  assert.equal(res.statusCode, 404);
  assert.equal(res.body.code, 'user_not_found');
});

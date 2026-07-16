import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import { callsToken, friendsHandler, friendRequestsList, friendRequestRespond } from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

async function makeDirectThread(aId, bHandle) {
  const a = aId;
  await call(friendsHandler, { userId: a, body: { handle: bHandle } });
  const inboxOwner = await prisma.user.findFirst({ where: { handle: bHandle } });
  const inbox = await call(friendRequestsList, { userId: inboxOwner.id, method: 'GET' });
  const accepted = await call(friendRequestRespond, {
    userId: inboxOwner.id,
    query: { id: inbox.body.incoming[0].id },
    body: { accept: true },
  });
  return accepted.body.mboloThreadId;
}

test('calls: honest 503 until LiveKit is configured', async () => {
  delete process.env.LIVEKIT_URL;
  delete process.env.LIVEKIT_API_KEY;
  delete process.env.LIVEKIT_API_SECRET;

  const a = await createUserWithWallet({ name: 'Awa' });
  const b = await createUserWithWallet({ name: 'Ibou' });
  const threadId = await makeDirectThread(a.id, b.handle);

  const res = await call(callsToken, { userId: a.id, body: { threadId } });
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'calls_unavailable');
});

test('calls: members get a signed room token, outsiders get nothing', async () => {
  process.env.LIVEKIT_URL = 'wss://calls.test.local';
  process.env.LIVEKIT_API_KEY = 'test-key';
  process.env.LIVEKIT_API_SECRET = 'test-secret-test-secret-test-secret';

  try {
    const a = await createUserWithWallet({ name: 'Awa Caller' });
    const b = await createUserWithWallet({ name: 'Ibou Callee' });
    const threadId = await makeDirectThread(a.id, b.handle);

    // Caller rings → token + join card in the chat + notification for B.
    const rung = await call(callsToken, { userId: a.id, body: { threadId, ring: true } });
    assert.equal(rung.statusCode, 200);
    assert.equal(rung.body.url, 'wss://calls.test.local');
    assert.equal(rung.body.room, `mbolo-${threadId}`);

    const claims = jwt.verify(rung.body.token, process.env.LIVEKIT_API_SECRET);
    assert.equal(claims.iss, 'test-key');
    assert.equal(claims.sub, a.id);
    assert.equal(claims.video.room, `mbolo-${threadId}`);
    assert.equal(claims.video.roomJoin, true);

    const joinCard = await prisma.mboloMessage.findFirst({
      where: { threadId, senderId: a.id, body: { contains: 'Appel en cours' } },
    });
    assert.ok(joinCard, 'ring drops a join card in the chat');
    const notif = await prisma.notification.findFirst({
      where: { userId: b.id, title: { contains: 'Appel entrant' } },
    });
    assert.ok(notif, 'callee is notified');

    // Callee joins the same room without re-ringing.
    const joined = await call(callsToken, { userId: b.id, body: { threadId } });
    assert.equal(joined.statusCode, 200);
    assert.equal(joined.body.room, rung.body.room);

    // A stranger is refused.
    const stranger = await createUserWithWallet({ name: 'Intrus' });
    const refused = await call(callsToken, { userId: stranger.id, body: { threadId } });
    assert.equal(refused.statusCode, 403);
    assert.equal(refused.body.code, 'not_a_member');
  } finally {
    delete process.env.LIVEKIT_URL;
    delete process.env.LIVEKIT_API_KEY;
    delete process.env.LIVEKIT_API_SECRET;
  }
});

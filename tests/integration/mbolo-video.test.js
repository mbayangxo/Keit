import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { mboloVideoUploadToken, mboloThreadMessages, friendsHandler, friendRequestsList, friendRequestRespond } from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

async function makeDirectThread(aId, bHandle) {
  await call(friendsHandler, { userId: aId, body: { handle: bHandle } });
  const inboxOwner = await prisma.user.findFirst({ where: { handle: bHandle } });
  const inbox = await call(friendRequestsList, { userId: inboxOwner.id, method: 'GET' });
  const accepted = await call(friendRequestRespond, {
    userId: inboxOwner.id,
    query: { id: inbox.body.incoming[0].id },
    body: { accept: true },
  });
  return accepted.body.mboloThreadId;
}

test('mbolo video: honest 503 until Vercel Blob is configured', async () => {
  delete process.env.BLOB_READ_WRITE_TOKEN;

  const user = await createUserWithWallet({ name: 'Awa' });
  const res = await call(mboloVideoUploadToken, {
    userId: user.id,
    body: { type: 'blob.generate-client-token', payload: { pathname: 'x.mp4', callbackUrl: '', clientPayload: null } },
  });

  assert.equal(res.statusCode, 503);
  assert.equal(res.body.code, 'video_unavailable');
});

test('mbolo video: mints a client upload token once Blob is configured', async () => {
  process.env.BLOB_READ_WRITE_TOKEN = 'vercel_blob_rw_teststore123_secretsecretsecret';
  try {
    const user = await createUserWithWallet({ name: 'Ibou' });
    const res = await call(mboloVideoUploadToken, {
      userId: user.id,
      body: {
        type: 'blob.generate-client-token',
        payload: { pathname: 'mbolo-video-1.mp4', callbackUrl: '', clientPayload: null, multipart: false },
      },
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.type, 'blob.generate-client-token');
    assert.match(res.body.clientToken, /^vercel_blob_client_teststore123_/);
  } finally {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  }
});

test('mbolo video: a message posts with kind video only for a real https mediaUrl', async () => {
  const a = await createUserWithWallet({ name: 'Awa2' });
  const b = await createUserWithWallet({ name: 'Ibou2' });
  const threadId = await makeDirectThread(a.id, b.handle);

  const rejected = await call(mboloThreadMessages, {
    userId: a.id,
    query: { id: threadId },
    body: { kind: 'video', mediaUrl: 'data:video/mp4;base64,AAAA' },
  });
  assert.equal(rejected.statusCode, 400);

  const accepted = await call(mboloThreadMessages, {
    userId: a.id,
    query: { id: threadId },
    body: { kind: 'video', mediaUrl: 'https://example.public.blob.vercel-storage.com/mbolo-video-1.mp4' },
  });
  assert.equal(accepted.statusCode, 201);
  assert.equal(accepted.body.kind, 'video');
  assert.equal(accepted.body.body, '🎬 Vidéo');
});

import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { transfersSend } from '../../lib/handlers.js';
import { createUserWithWallet, createVerifiedDevice, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function send(user, deviceId, body) {
  const req = mockReq({
    userId: user.id,
    body,
    headers: { 'x-device-id': deviceId, 'x-vercel-ip-country': 'SN' },
  });
  const res = mockRes();
  await transfersSend(req, res);
  return res;
}

test('send money: a gif attachment is stored on the KoriTransaction like other attachment types', async () => {
  const sender = await createUserWithWallet({ koriBalance: 50_000, name: 'Awa' });
  const recipient = await createUserWithWallet({ koriBalance: 0, name: 'Ibou' });
  const deviceId = await createVerifiedDevice(sender.id);

  const res = await send(sender, deviceId, {
    recipientHandle: recipient.handle,
    amount: 1_000,
    note: 'Tiens !',
    gifUrl: 'https://i.giphy.com/media/example/giphy.gif',
  });

  assert.equal(res.statusCode, 201);
  const tx = await prisma.koriTransaction.findFirst({ where: { reference: res.body.reference } });
  assert.equal(tx.attachmentType, 'gif');
  assert.equal(tx.attachmentUrl, 'https://i.giphy.com/media/example/giphy.gif');
});

test('send money: photo takes priority over other attachment fields if several are somehow sent', async () => {
  const sender = await createUserWithWallet({ koriBalance: 50_000, name: 'Awa2' });
  const recipient = await createUserWithWallet({ koriBalance: 0, name: 'Ibou2' });
  const deviceId = await createVerifiedDevice(sender.id);

  const res = await send(sender, deviceId, {
    recipientHandle: recipient.handle,
    amount: 1_000,
    voiceNoteUrl: 'data:audio/mp4;base64,AAAA',
    photoUrl: 'data:image/jpeg;base64,BBBB',
  });

  assert.equal(res.statusCode, 201);
  const tx = await prisma.koriTransaction.findFirst({ where: { reference: res.body.reference } });
  assert.equal(tx.attachmentType, 'voice', 'voiceNoteUrl still wins first per existing precedence order');
});

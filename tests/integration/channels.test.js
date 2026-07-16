import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import {
  channelsMine,
  channelsPost,
  channelsPostDelete,
  channelsBrowse,
  channelsFeed,
  channelsView,
  channelsFollow,
} from '../../lib/handlers.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

test('channels: one per account, posts validated, owner manages own posts only', async () => {
  const awa = await createUserWithWallet();

  // No channel yet.
  const none = await call(channelsMine, { userId: awa.id, method: 'GET' });
  assert.equal(none.body.channel, null);

  // Posting before creating a channel is refused.
  const early = await call(channelsPost, { userId: awa.id, body: { body: 'Salut' } });
  assert.equal(early.statusCode, 403);

  // Create, then "create again" just updates — still ONE channel.
  const c1 = await call(channelsMine, { userId: awa.id, body: { name: 'Awa Cuisine', bio: 'Recettes de Médina' } });
  assert.equal(c1.statusCode, 201);
  const c2 = await call(channelsMine, { userId: awa.id, body: { name: 'Awa Cuisine 2.0' } });
  assert.equal(c2.statusCode, 201);
  assert.equal(c2.body.channelId, c1.body.channelId, 'same channel, renamed');
  assert.equal(await prisma.channel.count({ where: { ownerId: awa.id } }), 1);

  // Empty posts refused; real post lands.
  const empty = await call(channelsPost, { userId: awa.id, body: {} });
  assert.equal(empty.statusCode, 400);
  const posted = await call(channelsPost, { userId: awa.id, body: { body: 'Thiéboudienne du jour 🍚' } });
  assert.equal(posted.statusCode, 201);

  const mine = await call(channelsMine, { userId: awa.id, method: 'GET' });
  assert.equal(mine.body.channel.posts.length, 1);

  // A stranger cannot delete Awa's post.
  const ibou = await createUserWithWallet();
  await call(channelsMine, { userId: ibou.id, body: { name: 'Ibou Foot' } });
  const forged = await call(channelsPostDelete, { userId: ibou.id, query: { id: posted.body.postId } });
  assert.equal(forged.statusCode, 404);
  const deleted = await call(channelsPostDelete, { userId: awa.id, query: { id: posted.body.postId } });
  assert.equal(deleted.statusCode, 200);
});

test('channels: follow, feed shows only followed, no self-follow', async () => {
  const creator = await createUserWithWallet();
  const other = await createUserWithWallet();
  const viewer = await createUserWithWallet();

  const ch = await call(channelsMine, { userId: creator.id, body: { name: `Dakar Vibes ${Date.now()}` } });
  await call(channelsPost, { userId: creator.id, body: { body: 'Premier post !' } });
  await call(channelsMine, { userId: other.id, body: { name: `Autre Chaîne ${Date.now()}` } });
  await call(channelsPost, { userId: other.id, body: { body: 'Pas suivi' } });

  // Owner cannot follow their own channel.
  const self = await call(channelsFollow, { userId: creator.id, query: { id: ch.body.channelId }, body: {} });
  assert.equal(self.statusCode, 403);

  // Viewer follows creator only; feed contains creator's post, not other's.
  assert.equal((await call(channelsFollow, { userId: viewer.id, query: { id: ch.body.channelId }, body: {} })).statusCode, 200);
  const feed = await call(channelsFeed, { userId: viewer.id, method: 'GET' });
  assert.ok(feed.body.posts.some((p) => p.body === 'Premier post !'));
  assert.ok(!feed.body.posts.some((p) => p.body === 'Pas suivi'), 'unfollowed channels stay out of the feed');

  // View shows follower count + following flag; browse marks it too.
  const view = await call(channelsView, { userId: viewer.id, query: { id: ch.body.channelId }, method: 'GET' });
  assert.equal(view.body.following, true);
  assert.equal(view.body.followerCount, 1);
  const browse = await call(channelsBrowse, { userId: viewer.id, method: 'GET' });
  const row = browse.body.channels.find((c) => c.id === ch.body.channelId);
  assert.equal(row.following, true);

  // Unfollow empties the feed.
  await call(channelsFollow, { userId: viewer.id, query: { id: ch.body.channelId }, body: { follow: false } });
  const feed2 = await call(channelsFeed, { userId: viewer.id, method: 'GET' });
  assert.ok(!feed2.body.posts.some((p) => p.body === 'Premier post !'));
});

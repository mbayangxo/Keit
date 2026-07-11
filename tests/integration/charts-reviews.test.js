import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { chartsGet, chartsSubmit, chartsVote, businessReviewsCreate, businessReviewsList } from '../../lib/handlers.js';
import { currentWeekKey } from '../../lib/charts-service.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query } = {}) {
  const req = mockReq({ userId, body, query });
  const res = mockRes();
  await handler(req, res);
  return res;
}

test('charts: submit casts a vote, second submit of same song joins it, one vote per user per week', async () => {
  const userA = await createUserWithWallet();
  const userB = await createUserWithWallet();

  const song = { title: `Yëkël ${Date.now()}`, artist: 'Saliou K.' };

  const r1 = await call(chartsSubmit, { userId: userA.id, body: song });
  assert.equal(r1.statusCode, 201);

  // Same song (case/space variations) from another user → same entry, new vote.
  const r2 = await call(chartsSubmit, {
    userId: userB.id,
    body: { title: song.title.toUpperCase(), artist: '  saliou k. ' },
  });
  assert.equal(r2.statusCode, 201);
  assert.equal(r2.body.songId, r1.body.songId, 'normalized duplicate maps to the same song');

  const chart = await call(chartsGet, { userId: userA.id });
  assert.equal(chart.statusCode, 200);
  assert.equal(chart.body.weekKey, currentWeekKey());
  const entry = chart.body.songs.find((s) => s.id === r1.body.songId);
  assert.equal(entry.votes, 2, 'both users counted once each');
  assert.equal(entry.mine, true, 'caller sees their own vote');

  // User A moves their weekly vote to a different song — total stays 1 per user.
  const other = await call(chartsSubmit, {
    userId: userA.id,
    body: { title: `Teranga ${Date.now()}`, artist: 'Dakar Crew' },
  });
  assert.equal(other.statusCode, 201);
  const after1 = await call(chartsGet, { userId: userA.id });
  const first = after1.body.songs.find((s) => s.id === r1.body.songId);
  const second = after1.body.songs.find((s) => s.id === other.body.songId);
  assert.equal(first.votes, 1, 'vote moved away');
  assert.equal(second.votes, 1);
  assert.equal(after1.body.myVoteSongId, other.body.songId);

  // Voting on an existing song by id also works.
  const rv = await call(chartsVote, { userId: userA.id, body: { songId: r1.body.songId } });
  assert.equal(rv.statusCode, 200);
});

test('charts: garbage input rejected', async () => {
  const user = await createUserWithWallet();
  const bad = await call(chartsSubmit, { userId: user.id, body: { title: '', artist: 'x'.repeat(200) } });
  assert.equal(bad.statusCode, 400);
  const noSong = await call(chartsVote, { userId: user.id, body: { songId: 'nope' } });
  assert.equal(noSong.statusCode, 404);
});

test('reviews: one per user per business, average computed from real rows only', async () => {
  const owner = await createUserWithWallet();
  const alice = await createUserWithWallet();
  const bob = await createUserWithWallet();
  const business = await prisma.business.create({
    data: { ownerId: owner.id, name: `Chez Test ${Date.now()}`, category: 'restaurant' },
  });

  // No reviews yet → null average, zero count ("leave the first review" state).
  const empty = await call(businessReviewsList, { userId: alice.id, query: { id: business.id } });
  assert.equal(empty.body.average, null);
  assert.equal(empty.body.count, 0);

  const r1 = await call(businessReviewsCreate, {
    userId: alice.id,
    query: { id: business.id },
    body: { rating: 5, text: 'Dibi bi neex na!' },
  });
  assert.equal(r1.statusCode, 201);

  const r2 = await call(businessReviewsCreate, {
    userId: bob.id,
    query: { id: business.id },
    body: { rating: 2 },
  });
  assert.equal(r2.statusCode, 201);

  let list = await call(businessReviewsList, { userId: alice.id, query: { id: business.id } });
  assert.equal(list.body.count, 2);
  assert.equal(list.body.average, 3.5);

  // Alice revises — still one review for her, average follows.
  await call(businessReviewsCreate, {
    userId: alice.id,
    query: { id: business.id },
    body: { rating: 4 },
  });
  list = await call(businessReviewsList, { userId: alice.id, query: { id: business.id } });
  assert.equal(list.body.count, 2, 'revision does not add a second review');
  assert.equal(list.body.average, 3);

  // Owner cannot rate their own business; junk ratings rejected.
  const own = await call(businessReviewsCreate, {
    userId: owner.id,
    query: { id: business.id },
    body: { rating: 5 },
  });
  assert.equal(own.statusCode, 403);
  const junk = await call(businessReviewsCreate, {
    userId: bob.id,
    query: { id: business.id },
    body: { rating: 9 },
  });
  assert.equal(junk.statusCode, 400);
});

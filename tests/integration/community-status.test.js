import '../helpers/setup.js';
import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { businessCommunityStatusUpdate } from '../../lib/org-handlers.js';
import { enrollStudentPass } from '../../lib/moi-service.js';
import { getShopCatalog } from '../../lib/marketplace-service.js';
import { createUserWithWallet, mockReq, mockRes, prisma } from '../helpers/db.js';

after(() => prisma.$disconnect());

async function call(handler, { userId, body, query, method = 'POST' } = {}) {
  const req = mockReq({ userId, body, query, method });
  const res = mockRes();
  await handler(req, res);
  return res;
}

test('community status: a student whose Pass matches the school can post, others cannot', async () => {
  const owner = await createUserWithWallet({ name: 'Recteur' });
  const school = await prisma.business.create({
    data: { ownerId: owner.id, name: `Universite Test ${Date.now()}`, type: 'school', category: 'school' },
  });

  const student = await createUserWithWallet({ name: 'Fatou Sy' });
  const stranger = await createUserWithWallet({ name: 'Personne' });

  // Enroll with a school name that doesn't match yet — no link, no posting rights.
  const unmatched = await enrollStudentPass(student.id, 'Autre Ecole');
  assert.equal(unmatched.studentPassBusinessId, null);

  const denied = await call(businessCommunityStatusUpdate, {
    userId: student.id,
    query: { id: school.id },
    body: { statusText: 'En cours de L3' },
  });
  assert.equal(denied.statusCode, 403);

  // Enrolling with the exact (case-insensitive) school name links the pass.
  const matched = await enrollStudentPass(student.id, school.name.toUpperCase());
  assert.equal(matched.studentPassBusinessId, school.id);
  assert.equal(matched.studentPassStatus, 'active');

  const posted = await call(businessCommunityStatusUpdate, {
    userId: student.id,
    query: { id: school.id },
    body: { statusText: '  En cours de L3 — promo 2026  ' },
  });
  assert.equal(posted.statusCode, 200);
  assert.equal(posted.body.statusText, 'En cours de L3 — promo 2026');

  const catalog = await getShopCatalog(prisma, school.id, { viewerId: student.id });
  assert.equal(catalog.shop.viewerCanPostStatus, true);
  assert.equal(catalog.shop.viewerStatusText, 'En cours de L3 — promo 2026');
  assert.equal(catalog.communityStatuses.length, 1);
  assert.equal(catalog.communityStatuses[0].name, 'Fatou Sy');

  // A stranger with no link, no membership, no ownership still can't post.
  const strangerDenied = await call(businessCommunityStatusUpdate, {
    userId: stranger.id,
    query: { id: school.id },
    body: { statusText: 'Je m’incruste' },
  });
  assert.equal(strangerDenied.statusCode, 403);

  const strangerCatalog = await getShopCatalog(prisma, school.id, { viewerId: stranger.id });
  assert.equal(strangerCatalog.shop.viewerCanPostStatus, false);

  // Clearing removes the row.
  const cleared = await call(businessCommunityStatusUpdate, {
    userId: student.id,
    query: { id: school.id },
    body: { statusText: null },
  });
  assert.equal(cleared.statusCode, 200);
  assert.equal(cleared.body.statusText, null);
  const afterClear = await getShopCatalog(prisma, school.id, { viewerId: student.id });
  assert.equal(afterClear.communityStatuses.length, 0);
});

test('community status: a regular business — owner and staff can post, this is not school-only', async () => {
  const owner = await createUserWithWallet({ name: 'Owner' });
  const staff = await createUserWithWallet({ name: 'Employee' });
  const biz = await prisma.business.create({
    data: { ownerId: owner.id, name: `Boutique Test ${Date.now()}`, type: 'merchant', category: 'boutique' },
  });
  await prisma.businessMember.create({ data: { businessId: biz.id, userId: staff.id, role: 'staff' } });

  const ownerPost = await call(businessCommunityStatusUpdate, {
    userId: owner.id,
    query: { id: biz.id },
    body: { statusText: 'Journée porte ouverte' },
  });
  assert.equal(ownerPost.statusCode, 200);

  const staffPost = await call(businessCommunityStatusUpdate, {
    userId: staff.id,
    query: { id: biz.id },
    body: { statusText: 'Je suis en poste aujourd’hui' },
  });
  assert.equal(staffPost.statusCode, 200);

  const catalog = await getShopCatalog(prisma, biz.id, {});
  assert.equal(catalog.communityStatuses.length, 2);
});

test('community status: works like a story — expires after 24h and drops out of the board', async () => {
  const owner = await createUserWithWallet({ name: 'Owner' });
  const poster = await createUserWithWallet({ name: 'Poster' });
  const biz = await prisma.business.create({
    data: { ownerId: owner.id, name: `Biz Test ${Date.now()}`, type: 'merchant', category: 'boutique' },
  });
  await prisma.businessMember.create({ data: { businessId: biz.id, userId: poster.id, role: 'staff' } });

  const posted = await call(businessCommunityStatusUpdate, {
    userId: poster.id,
    query: { id: biz.id },
    body: { statusText: 'Ouvert jusqu’à minuit' },
  });
  assert.equal(posted.statusCode, 200);
  const expiresAt = new Date(posted.body.expiresAt);
  const hoursUntilExpiry = (expiresAt.getTime() - Date.now()) / (60 * 60 * 1000);
  assert.ok(hoursUntilExpiry > 23.9 && hoursUntilExpiry <= 24.1);

  const fresh = await getShopCatalog(prisma, biz.id, { viewerId: poster.id });
  assert.equal(fresh.communityStatuses.length, 1);
  assert.equal(fresh.shop.viewerStatusText, 'Ouvert jusqu’à minuit');

  // Force it into the past, as if 24h had already gone by.
  await prisma.businessCommunityStatus.updateMany({
    where: { businessId: biz.id, userId: poster.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });

  const afterExpiry = await getShopCatalog(prisma, biz.id, { viewerId: poster.id });
  assert.equal(afterExpiry.communityStatuses.length, 0);
  assert.equal(afterExpiry.shop.viewerStatusText, null);
});

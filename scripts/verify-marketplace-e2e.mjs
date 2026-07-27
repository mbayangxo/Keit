#!/usr/bin/env node
/**
 * Marketplace backend smoke test — run before/after deploy.
 * Usage: node scripts/verify-marketplace-e2e.mjs
 * Uses DATABASE_URL from .env (same as production when pointed at Supabase).
 */
import '../tests/helpers/setup.js';
import { prisma } from '../lib/prisma.js';
import { dispatchApi } from '../lib/api-router.js';
import {
  marketplaceSearch,
  marketplaceOrderCreate,
  marketplaceHubsList,
} from '../lib/marketplace-handlers.js';
import { deliveriesNearby } from '../lib/handlers.js';
import {
  createUserWithWallet,
  createVerifiedDevice,
  mockReq,
  mockRes,
  resetReserveToWallets,
} from '../tests/helpers/db.js';
import { signAccessToken } from '../api/_lib/auth.js';

function call(handler, { userId, body, query, method = 'POST', deviceId } = {}) {
  const headers = deviceId ? { 'x-device-id': deviceId } : {};
  const req = mockReq({ userId, body, query, method, headers });
  const res = mockRes();
  return handler(req, res).then(() => res);
}

async function main() {
  console.log('→ Resetting Kori reserve…');
  await resetReserveToWallets();

  const stamp = Date.now();
  const merchant = await createUserWithWallet({ koriBalance: 0, name: 'Verify Merchant' });
  const buyer = await createUserWithWallet({ koriBalance: 3000, name: 'Verify Buyer' });
  const buyerDevice = await createVerifiedDevice(buyer.id);

  const business = await prisma.business.create({
    data: {
      ownerId: merchant.id,
      name: `Verify Marché ${stamp}`,
      category: 'grocery',
      lat: 14.6892,
      lng: -17.4421,
      address: 'Test',
    },
  });

  const product = await prisma.product.create({
    data: {
      businessId: business.id,
      title: `Riz verify ${stamp}`,
      price: 400,
      inventory: 5,
      category: 'grocery',
      active: true,
    },
  });

  console.log('→ Route: GET /api/marketplace/shops/:id');
  const routeRes = mockRes();
  await dispatchApi(
    {
      method: 'GET',
      headers: { authorization: `Bearer ${signAccessToken(buyer.id)}` },
      query: {},
      body: {},
    },
    routeRes,
    ['marketplace', 'shops', business.id],
  );
  if (routeRes.statusCode !== 200) {
    throw new Error(`Shop route failed: ${routeRes.statusCode} ${JSON.stringify(routeRes.body)}`);
  }

  console.log('→ Hubs seed');
  const hubs = await call(marketplaceHubsList, { userId: buyer.id, method: 'GET' });
  if (hubs.statusCode !== 200 || hubs.body.hubs.length < 1) {
    throw new Error('Hubs not seeded');
  }

  console.log('→ Search');
  const search = await call(marketplaceSearch, {
    userId: buyer.id,
    method: 'GET',
    query: { q: String(stamp), lat: '14.69', lng: '-17.44' },
  });
  if (!search.body.shops.some((s) => s.id === business.id)) {
    throw new Error('Search did not return test shop');
  }

  console.log('→ Order (delivery)');
  const order = await call(marketplaceOrderCreate, {
    userId: buyer.id,
    deviceId: buyerDevice,
    body: {
      businessId: business.id,
      items: [{ productId: product.id, quantity: 1 }],
      fulfillmentType: 'delivery',
      dropoff: { area: 'Médina', address: 'Test dropoff', lat: 14.69, lng: -17.44 },
    },
  });
  if (order.statusCode !== 201) {
    throw new Error(`Order failed: ${order.statusCode} ${JSON.stringify(order.body)}`);
  }

  console.log('→ Rider nearby');
  const jobs = await call(deliveriesNearby, {
    userId: buyer.id,
    method: 'GET',
    query: { lat: '14.69', lng: '-17.44' },
  });
  if (!jobs.body.some((j) => j.id === order.body.delivery.id)) {
    throw new Error('Delivery job not visible to rider');
  }

  console.log('✅ Marketplace backend E2E OK');
  console.log(`   businessId=${business.id} orderId=${order.body.orderId} deliveryId=${order.body.delivery.id}`);
}

main()
  .catch((err) => {
    console.error('❌ Marketplace verify failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

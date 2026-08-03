import { distanceKm, estimateMinutesFromDistance, formatDistanceKm } from './geo.js';
import { spendKoriAtMerchant } from './kori-service.js';
import { runMoneyTransaction, InsufficientFundsError } from './wallet-atomic.js';
import { createDeliveryTask } from './delivery-service.js';
import { KORI_EARN } from './kori.js';
import { ensureDefaultHubs, findNearestHub } from './hub-service.js';

export { ensureDefaultHubs, findNearestHub };

export class MarketplaceError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'MarketplaceError';
  }
}

export function marketplaceErrorStatus(code) {
  switch (code) {
    case 'not_found':
      return 404;
    case 'forbidden':
      return 403;
    case 'insufficient':
      return 400;
    default:
      return 400;
  }
}

export function productPriceNow(product) {
  if (product.flashPrice != null && product.flashExpiresAt && product.flashExpiresAt > new Date()) {
    return product.flashPrice;
  }
  return product.price;
}

function shopShape(business, { lat, lng } = {}) {
  const distance =
    lat != null && lng != null && business.lat != null && business.lng != null
      ? distanceKm(lat, lng, business.lat, business.lng)
      : null;
  return {
    id: business.id,
    name: business.name,
    category: business.category,
    type: business.type,
    arrondissement: business.arrondissement,
    address: business.address,
    lat: business.lat,
    lng: business.lng,
    imageUrl: business.imageUrl,
    statusText: business.statusText ?? null,
    verified: business.verified,
    distanceKm: distance,
    distanceLabel: formatDistanceKm(distance),
    productCount: business._count?.products ?? business.productCount ?? 0,
  };
}

function productShape(product, business) {
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    imageUrl: product.imageUrl,
    price: product.price,
    flashPrice: product.flashPrice,
    flashExpiresAt: product.flashExpiresAt?.toISOString?.() ?? product.flashExpiresAt ?? null,
    effectivePrice: productPriceNow(product),
    category: product.category,
    inventory: product.inventory,
    business: business
      ? {
          id: business.id,
          name: business.name,
          arrondissement: business.arrondissement,
          lat: business.lat,
          lng: business.lng,
        }
      : null,
  };
}

export async function searchMarketplace(db, { q, lat, lng, category, limit = 40 }) {
  await ensureDefaultHubs(db);
  const query = String(q ?? '').trim();
  if (query.length < 2) {
    return { query, results: [], shops: [] };
  }

  const products = await db.product.findMany({
    where: {
      active: true,
      inventory: { gt: 0 },
      ...(category ? { category } : {}),
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    },
    include: {
      business: {
        select: {
          id: true,
          name: true,
          category: true,
          type: true,
          arrondissement: true,
          address: true,
          lat: true,
          lng: true,
          imageUrl: true,
          verified: true,
        },
      },
    },
    take: limit,
    orderBy: { title: 'asc' },
  });

  const byShop = new Map();
  for (const product of products) {
    if (!product.business) continue;
    const key = product.business.id;
    if (!byShop.has(key)) {
      byShop.set(key, { shop: product.business, products: [] });
    }
    byShop.get(key).products.push(productShape(product, product.business));
  }

  const shops = [...byShop.values()]
    .map(({ shop, products: shopProducts }) => ({
      ...shopShape(shop, { lat, lng }),
      matchCount: shopProducts.length,
      products: shopProducts,
    }))
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

  return {
    query,
    results: products.map((p) => productShape(p, p.business)),
    shops,
  };
}

export async function listNearbyShops(db, { lat, lng, category, limit = 30 }) {
  await ensureDefaultHubs(db);
  const businesses = await db.business.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      ...(category ? { category } : {}),
      products: { some: { active: true, inventory: { gt: 0 } } },
    },
    include: { _count: { select: { products: { where: { active: true, inventory: { gt: 0 } } } } } },
    take: 100,
  });

  return businesses
    .map((b) => shopShape(b, { lat, lng }))
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999))
    .slice(0, limit);
}

export async function getShopCatalog(db, businessId, { lat, lng, viewerId } = {}) {
  const business = await db.business.findUnique({
    where: { id: businessId },
    include: {
      products: {
        where: { active: true },
        orderBy: { title: 'asc' },
      },
      _count: { select: { products: true } },
      communityStatuses: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        include: { user: { select: { id: true, name: true, handle: true, avatarUrl: true, avatarEmoji: true } } },
      },
    },
  });
  if (!business) throw new MarketplaceError('not_found', 'Commerce introuvable');

  let viewerCanPostStatus = false;
  let viewerStatusText = null;
  if (viewerId) {
    const mine = business.communityStatuses.find((c) => c.userId === viewerId);
    viewerStatusText = mine?.text ?? null;
    if (business.ownerId === viewerId) {
      viewerCanPostStatus = true;
    } else {
      const member = await db.businessMember.findFirst({ where: { businessId, userId: viewerId } });
      if (member) {
        viewerCanPostStatus = true;
      } else if (business.type === 'school') {
        const viewer = await db.user.findUnique({ where: { id: viewerId } });
        if (viewer?.studentPassBusinessId === businessId && viewer.studentPassStatus === 'active') {
          viewerCanPostStatus = true;
        }
      }
    }
  }

  return {
    shop: { ...shopShape(business, { lat, lng }), viewerCanPostStatus, viewerStatusText },
    products: business.products.map((p) => productShape(p, business)),
    communityStatuses: business.communityStatuses.map((c) => ({
      userId: c.userId,
      name: c.user?.name ?? c.user?.handle ?? 'Quelqu’un',
      avatarUrl: c.user?.avatarUrl ?? null,
      avatarEmoji: c.user?.avatarEmoji ?? null,
      text: c.text,
      updatedAt: c.updatedAt.toISOString(),
      expiresAt: c.expiresAt.toISOString(),
    })),
  };
}

function deliveryFeeFromDistance(distanceKmValue) {
  if (distanceKmValue == null) return 1500;
  return Math.max(1500, Math.min(8000, Math.round(distanceKmValue * 450 + 1000)));
}

export async function placeMarketplaceOrder(db, params) {
  const { buyerId, businessId, items, fulfillmentType, dropoff, reference } = params;

  const business = await db.business.findUnique({
    where: { id: businessId },
    include: { owner: { include: { wallet: true } } },
  });
  if (!business?.owner?.wallet) throw new MarketplaceError('not_found', 'Commerce introuvable');

  const productIds = items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, businessId, active: true },
  });
  if (products.length !== new Set(productIds).size) {
    throw new MarketplaceError('invalid', 'Un produit n’est plus disponible');
  }

  let totalKori = 0;
  const lineItems = [];
  const summaryParts = [];
  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    const qty = Math.max(1, Math.floor(item.quantity));
    if (!product || product.inventory < qty) {
      throw new MarketplaceError('insufficient', `Stock insuffisant pour ${product?.title ?? 'produit'}`);
    }
    const unitPrice = productPriceNow(product);
    totalKori += unitPrice * qty;
    lineItems.push({ productId: product.id, quantity: qty, unitPrice });
    summaryParts.push(`${qty}× ${product.title}`);
  }

  const buyer = await db.user.findUnique({ where: { id: buyerId }, include: { wallet: true } });
  if (!buyer?.wallet) throw new MarketplaceError('invalid', 'Portefeuille introuvable');

  return runMoneyTransaction(db, async (tx) => {
    for (const li of lineItems) {
      const updated = await tx.product.updateMany({
        where: { id: li.productId, inventory: { gte: li.quantity } },
        data: { inventory: { decrement: li.quantity } },
      });
      if (updated.count !== 1) {
        throw new MarketplaceError('insufficient', 'Stock épuisé — réessaie');
      }
    }

    try {
      await spendKoriAtMerchant(tx, {
        payerWalletId: buyer.wallet.id,
        merchantWalletId: business.owner.wallet.id,
        payerId: buyerId,
        merchantUserId: business.ownerId,
        amountKori: totalKori,
        reference,
        merchantName: business.name,
        payerName: buyer.name ?? buyer.handle ?? 'Client',
      });
    } catch (err) {
      if (err instanceof InsufficientFundsError) {
        throw new MarketplaceError('insufficient', 'Solde C insuffisant');
      }
      throw err;
    }

    let hub = null;
    let pickupType = 'merchant';
    let pickupLabel = business.name;
    let pickupAddress = business.address ?? business.name;
    let pickupLat = business.lat;
    let pickupLng = business.lng;

    const isBrandWarehouse = business.type === 'brand' || business.category === 'k21';

    if (fulfillmentType === 'delivery') {
      const anchorLat = dropoff?.lat ?? business.lat ?? 14.6928;
      const anchorLng = dropoff?.lng ?? business.lng ?? -17.4467;
      hub = await findNearestHub(tx, anchorLat, anchorLng);

      if (isBrandWarehouse && hub?.isWarehouse) {
        pickupType = 'warehouse';
        pickupLabel = hub.name;
        pickupAddress = hub.address;
        pickupLat = hub.lat;
        pickupLng = hub.lng;
      } else if (hub) {
        pickupType = 'hub';
        pickupLabel = `${hub.name} · collecte ${business.name}`;
        pickupAddress = `${hub.address} (via ${business.name})`;
        pickupLat = business.lat ?? hub.lat;
        pickupLng = business.lng ?? hub.lng;
      }
    }

    const order = await tx.order.create({
      data: {
        buyerId,
        businessId,
        status: fulfillmentType === 'pickup' ? 'ready_for_pickup' : 'pending_delivery',
        fulfillmentType,
        totalAmount: totalKori,
        deliveryAddress: dropoff?.address ?? null,
        hubId: hub?.id ?? null,
        notes: summaryParts.join(', '),
        items: {
          create: lineItems.map((li) => ({
            productId: li.productId,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    let delivery = null;
    if (fulfillmentType === 'delivery') {
      if (!dropoff?.area || !dropoff?.address) {
        throw new MarketplaceError('invalid', 'Adresse de livraison requise');
      }
      const dist =
        pickupLat != null && pickupLng != null && dropoff.lat != null && dropoff.lng != null
          ? distanceKm(pickupLat, pickupLng, dropoff.lat, dropoff.lng)
          : null;
      delivery = await createDeliveryTask(tx, {
        orderId: order.id,
        buyerId,
        pickupType,
        pickupLabel,
        pickupAddress,
        pickupLat,
        pickupLng,
        dropoffArea: dropoff.area,
        dropoffExact: dropoff.exact ?? dropoff.address,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        dropoffAddress: dropoff.address,
        deliveryFeeNational: deliveryFeeFromDistance(dist),
        riderKoriEarnings: KORI_EARN.delivery,
        estimatedMinutes: estimateMinutesFromDistance(dist),
        hubId: hub?.id ?? null,
        productSummary: summaryParts.join(', '),
      });
    }

    return { order, delivery, hub, totalKori };
  });
}

import { z } from 'zod';
import { prisma } from './prisma.js';
import { validationError } from './validation.js';
import { gateOrExecute } from './risk-gate.js';
import { assertStepUpForAmount, StepUpRequiredError } from './step-up.js';
import { amountToNationalXof } from './kori-primary.js';
import { supportedOriginCountries } from './hub-parcel-service.js';
import { listDeliveryHubs } from './hub-service.js';
import {
  getShopCatalog,
  listNearbyShops,
  marketplaceErrorStatus,
  MarketplaceError,
  placeMarketplaceOrder,
  searchMarketplace,
} from './marketplace-service.js';

function ref(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function parseCoords(req) {
  const lat = req.query.lat != null ? Number(req.query.lat) : null;
  const lng = req.query.lng != null ? Number(req.query.lng) : null;
  return {
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
  };
}

export async function marketplaceSearch(req, res) {
  const q = String(req.query.q ?? '').trim();
  const category = req.query.category ? String(req.query.category) : undefined;
  const { lat, lng } = parseCoords(req);
  const data = await searchMarketplace(prisma, { q, lat, lng, category });
  res.json(data);
}

export async function marketplaceShopsNearby(req, res) {
  const category = req.query.category ? String(req.query.category) : undefined;
  const { lat, lng } = parseCoords(req);
  const shops = await listNearbyShops(prisma, { lat, lng, category });
  res.json({ shops });
}

export async function marketplaceShopGet(req, res) {
  const businessId = String(req.query.id ?? '');
  if (!businessId) {
    res.status(400).json({ error: 'id required' });
    return;
  }
  try {
    const { lat, lng } = parseCoords(req);
    const catalog = await getShopCatalog(prisma, businessId, { lat, lng });
    res.json(catalog);
  } catch (error) {
    if (error instanceof MarketplaceError) {
      res.status(marketplaceErrorStatus(error.code)).json({ error: error.message, code: error.code });
      return;
    }
    throw error;
  }
}

export async function marketplaceHubsList(req, res) {
  const { lat, lng } = parseCoords(req);
  const hubs = await listDeliveryHubs(prisma, { lat, lng, country: req.query.country ? String(req.query.country) : undefined });
  res.json({ hubs, originCountries: supportedOriginCountries() });
}

export async function marketplaceOrderCreate(req, res) {
  const schema = z.object({
    businessId: z.string().min(1),
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(20),
        }),
      )
      .min(1)
      .max(20),
    fulfillmentType: z.enum(['pickup', 'delivery']),
    dropoff: z
      .object({
        area: z.string().min(2),
        address: z.string().min(2),
        exact: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
      .optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed.error);

  if (parsed.data.fulfillmentType === 'delivery' && !parsed.data.dropoff) {
    res.status(400).json({ error: 'Adresse de livraison requise', code: 'dropoff_required' });
    return;
  }

  const buyer = await prisma.user.findUniqueOrThrow({ where: { id: req.userId }, include: { wallet: true } });
  const previewProducts = await prisma.product.findMany({
    where: { id: { in: parsed.data.items.map((i) => i.productId) }, businessId: parsed.data.businessId, active: true },
  });
  let previewTotal = 0;
  for (const item of parsed.data.items) {
    const p = previewProducts.find((x) => x.id === item.productId);
    if (!p) continue;
    const unit =
      p.flashPrice != null && p.flashExpiresAt && p.flashExpiresAt > new Date() ? p.flashPrice : p.price;
    previewTotal += unit * item.quantity;
  }

  try {
    await assertStepUpForAmount(req, amountToNationalXof(previewTotal, 'kori', buyer.country));
  } catch (error) {
    if (error instanceof StepUpRequiredError) {
      res.status(403).json({ error: error.message, code: error.code, thresholdXOF: 50_000 });
      return;
    }
    throw error;
  }

  const reference = ref('MKT');

  try {
    const gate = await gateOrExecute(
      req,
      res,
      {
        operationType: 'marketplace_order',
        amountNational: amountToNationalXof(previewTotal, 'kori', buyer.country),
        recipientId: parsed.data.businessId,
        payload: {
          buyerId: req.userId,
          businessId: parsed.data.businessId,
          items: parsed.data.items,
          fulfillmentType: parsed.data.fulfillmentType,
          dropoff: parsed.data.dropoff,
          reference,
        },
      },
      async (heldRef) => {
        const result = await placeMarketplaceOrder(prisma, {
          buyerId: req.userId,
          businessId: parsed.data.businessId,
          items: parsed.data.items,
          fulfillmentType: parsed.data.fulfillmentType,
          dropoff: parsed.data.dropoff,
          reference: heldRef ?? reference,
        });
        return {
          orderId: result.order.id,
          status: result.order.status,
          fulfillmentType: result.order.fulfillmentType,
          totalKori: result.totalKori,
          hub: result.hub
            ? { id: result.hub.id, name: result.hub.name, address: result.hub.address }
            : null,
          delivery: result.delivery
            ? {
                id: result.delivery.id,
                status: result.delivery.status,
                deliveryFeeNational: result.delivery.deliveryFeeNational,
                pickupType: result.delivery.pickupType,
                pickupLabel: result.delivery.pickupLabel,
              }
            : null,
        };
      },
    );
    if (gate.held) return;
    res.status(201).json(gate.result);
  } catch (error) {
    if (error instanceof MarketplaceError) {
      res.status(marketplaceErrorStatus(error.code)).json({ error: error.message, code: error.code });
      return;
    }
    throw error;
  }
}

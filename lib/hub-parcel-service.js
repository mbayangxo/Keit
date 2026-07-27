import crypto from 'crypto';
import { distanceKm, estimateMinutesFromDistance } from './geo.js';
import { createDeliveryTask } from './delivery-service.js';
import { KORI_EARN } from './kori.js';
import { getHubById, hubShape, listDeliveryHubs } from './hub-service.js';
import { createInAppNotification } from './notify-service.js';

export class HubParcelError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'HubParcelError';
  }
}

export function hubParcelErrorStatus(code) {
  switch (code) {
    case 'not_found':
      return 404;
    case 'forbidden':
      return 403;
    case 'invalid_state':
      return 400;
    default:
      return 400;
  }
}

const ORIGIN_COUNTRIES = [
  { code: 'US', label: 'États-Unis / Amazon' },
  { code: 'NG', label: 'Nigeria' },
  { code: 'CI', label: "Côte d'Ivoire" },
  { code: 'FR', label: 'France' },
  { code: 'GB', label: 'Royaume-Uni' },
  { code: 'SN', label: 'Sénégal (autre ville)' },
  { code: 'OTHER', label: 'Autre pays' },
];

export function supportedOriginCountries() {
  return ORIGIN_COUNTRIES;
}

function ref() {
  return `PCL-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function pickupCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function deliveryFeeFromDistance(dist) {
  if (dist == null) return 1500;
  return Math.max(1500, Math.min(10000, Math.round(dist * 450 + 1000)));
}

export function hubParcelShape(parcel, { hub, lastMileDelivery } = {}) {
  const hubInfo = hub ?? parcel.hub;
  return {
    id: parcel.id,
    reference: parcel.reference,
    externalRef: parcel.externalRef,
    originCountry: parcel.originCountry,
    originLabel: parcel.originLabel,
    description: parcel.description,
    senderName: parcel.senderName,
    senderContact: parcel.senderContact,
    status: parcel.status,
    fulfillmentPlan: parcel.fulfillmentPlan,
    dropoffArea: parcel.dropoffArea,
    dropoffAddress: parcel.dropoffAddress,
    pickupCode: ['at_hub', 'ready_for_pickup'].includes(parcel.status) ? parcel.pickupCode : null,
    arrivedAt: parcel.arrivedAt?.toISOString?.() ?? null,
    pickedUpAt: parcel.pickedUpAt?.toISOString?.() ?? null,
    deliveredAt: parcel.deliveredAt?.toISOString?.() ?? null,
    createdAt: parcel.createdAt.toISOString(),
    hub: hubInfo ? hubShape(hubInfo) : null,
    shippingAddress: hubInfo
      ? {
          label: hubInfo.name,
          line1: hubInfo.address,
          line2: `Réf. K21: ${parcel.reference}`,
          country: hubInfo.country ?? 'SN',
        }
      : null,
    lastMile: lastMileDelivery
      ? {
          deliveryId: lastMileDelivery.id,
          status: lastMileDelivery.status,
          deliveryFeeNational: lastMileDelivery.deliveryFeeNational,
        }
      : null,
  };
}

export async function registerHubParcel(db, params) {
  const {
    ownerId,
    hubId,
    originCountry,
    originLabel,
    description,
    externalRef,
    senderName,
    senderContact,
    fulfillmentPlan = 'pickup',
    dropoff,
    notes,
  } = params;

  const hub = await getHubById(db, hubId);
  if (!hub) throw new HubParcelError('not_found', 'Point K21 introuvable');

  const owner = await db.user.findUnique({ where: { id: ownerId } });
  if (!owner) throw new HubParcelError('not_found', 'Compte introuvable');

  if (fulfillmentPlan === 'last_mile' && (!dropoff?.area || !dropoff?.address)) {
    throw new HubParcelError('invalid_state', 'Adresse de livraison requise pour la livraison à domicile');
  }

  const reference = ref();
  const code = pickupCode();

  const parcel = await db.hubParcel.create({
    data: {
      ownerId,
      hubId,
      reference,
      externalRef: externalRef ?? null,
      originCountry,
      originLabel: originLabel ?? null,
      description,
      senderName: senderName ?? null,
      senderContact: senderContact ?? null,
      fulfillmentPlan,
      dropoffArea: dropoff?.area ?? null,
      dropoffAddress: dropoff?.address ?? null,
      dropoffLat: dropoff?.lat ?? null,
      dropoffLng: dropoff?.lng ?? null,
      pickupCode: code,
      notes: notes ?? null,
      status: 'registered',
    },
    include: { hub: true },
  });

  return hubParcelShape(parcel);
}

export async function listOwnerHubParcels(db, ownerId) {
  const parcels = await db.hubParcel.findMany({
    where: { ownerId },
    include: { hub: true, lastMileOrder: { include: { delivery: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return parcels.map((p) =>
    hubParcelShape(p, { lastMileDelivery: p.lastMileOrder?.delivery ?? null }),
  );
}

export async function getHubParcelDetail(db, parcelId, viewerId, { isHubStaff = false } = {}) {
  const parcel = await db.hubParcel.findUnique({
    where: { id: parcelId },
    include: { hub: true, lastMileOrder: { include: { delivery: true } } },
  });
  if (!parcel) throw new HubParcelError('not_found', 'Colis introuvable');
  if (parcel.ownerId !== viewerId && !isHubStaff) {
    throw new HubParcelError('forbidden', 'Accès refusé');
  }
  return hubParcelShape(parcel, { lastMileDelivery: parcel.lastMileOrder?.delivery ?? null });
}

export async function markHubParcelInTransit(db, parcelId, ownerId) {
  const parcel = await db.hubParcel.findUnique({ where: { id: parcelId } });
  if (!parcel) throw new HubParcelError('not_found', 'Colis introuvable');
  if (parcel.ownerId !== ownerId) throw new HubParcelError('forbidden', 'Accès refusé');
  if (parcel.status !== 'registered') {
    throw new HubParcelError('invalid_state', 'Ce colis ne peut plus être marqué en route');
  }
  const updated = await db.hubParcel.update({
    where: { id: parcelId },
    data: { status: 'in_transit' },
    include: { hub: true },
  });
  return hubParcelShape(updated);
}

export async function markHubParcelArrived(db, parcelId, { staffUserId }) {
  const parcel = await db.hubParcel.findUnique({
    where: { id: parcelId },
    include: { hub: true, owner: true },
  });
  if (!parcel) throw new HubParcelError('not_found', 'Colis introuvable');
  if (!['registered', 'in_transit'].includes(parcel.status)) {
    throw new HubParcelError('invalid_state', 'Colis déjà reçu ou clôturé');
  }

  const updated = await db.hubParcel.update({
    where: { id: parcelId },
    data: {
      status: parcel.fulfillmentPlan === 'last_mile' ? 'at_hub' : 'ready_for_pickup',
      arrivedAt: new Date(),
    },
    include: { hub: true },
  });

  await createInAppNotification(parcel.ownerId, 'Colis arrivé au Point K21', `${parcel.description} — ${parcel.hub.name}. ${parcel.fulfillmentPlan === 'pickup' ? 'Viens le retirer avec ton code.' : 'Tu peux demander la livraison à domicile.'}`, {
    kind: 'hub_parcel',
    refId: parcel.id,
    actionLabel: 'Voir le colis',
  });

  if (parcel.fulfillmentPlan === 'last_mile' && parcel.dropoffAddress) {
    try {
      await requestHubParcelLastMile(db, parcelId, parcel.ownerId, {
        area: parcel.dropoffArea,
        address: parcel.dropoffAddress,
        lat: parcel.dropoffLat,
        lng: parcel.dropoffLng,
      });
    } catch (err) {
      console.warn('[hub-parcel] auto last-mile skipped', err?.message);
    }
  }

  const fresh = await db.hubParcel.findUnique({
    where: { id: parcelId },
    include: { hub: true, lastMileOrder: { include: { delivery: true } } },
  });
  return hubParcelShape(fresh, { lastMileDelivery: fresh.lastMileOrder?.delivery ?? null });
}

export async function requestHubParcelLastMile(db, parcelId, ownerId, dropoff) {
  const parcel = await db.hubParcel.findUnique({
    where: { id: parcelId },
    include: { hub: true, lastMileOrder: true },
  });
  if (!parcel) throw new HubParcelError('not_found', 'Colis introuvable');
  if (parcel.ownerId !== ownerId) throw new HubParcelError('forbidden', 'Accès refusé');
  if (!['at_hub', 'ready_for_pickup'].includes(parcel.status)) {
    throw new HubParcelError('invalid_state', 'Le colis doit être au Point K21 avant la livraison');
  }
  if (parcel.lastMileOrderId) {
    throw new HubParcelError('invalid_state', 'Livraison déjà demandée');
  }
  if (!dropoff?.area || !dropoff?.address) {
    throw new HubParcelError('invalid_state', 'Adresse de livraison requise');
  }

  const hub = parcel.hub;
  const dist =
    hub.lat != null && dropoff.lat != null
      ? distanceKm(hub.lat, hub.lng, dropoff.lat, dropoff.lng)
      : null;
  const fee = deliveryFeeFromDistance(dist);

  const result = await db.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        buyerId: ownerId,
        status: 'pending_delivery',
        fulfillmentType: 'delivery',
        totalAmount: fee,
        hubId: hub.id,
        deliveryAddress: dropoff.address,
        notes: `Colis ${parcel.reference}`,
      },
    });

    const task = await createDeliveryTask(tx, {
      orderId: order.id,
      buyerId: ownerId,
      pickupType: 'hub_parcel',
      pickupLabel: `${hub.name} · ${parcel.reference}`,
      pickupAddress: hub.address,
      pickupLat: hub.lat,
      pickupLng: hub.lng,
      dropoffArea: dropoff.area,
      dropoffExact: dropoff.address,
      dropoffLat: dropoff.lat,
      dropoffLng: dropoff.lng,
      dropoffAddress: dropoff.address,
      deliveryFeeNational: fee,
      riderKoriEarnings: KORI_EARN.delivery,
      estimatedMinutes: estimateMinutesFromDistance(dist),
      hubId: hub.id,
      productSummary: parcel.description,
    });

    const updated = await tx.hubParcel.update({
      where: { id: parcelId },
      data: {
        status: 'out_for_delivery',
        lastMileOrderId: order.id,
        dropoffArea: dropoff.area,
        dropoffAddress: dropoff.address,
        dropoffLat: dropoff.lat ?? null,
        dropoffLng: dropoff.lng ?? null,
      },
      include: { hub: true },
    });

    return { parcel: updated, task };
  });

  return hubParcelShape(result.parcel, { lastMileDelivery: result.task });
}

export async function confirmHubParcelPickup(db, parcelId, ownerId, code) {
  const parcel = await db.hubParcel.findUnique({ where: { id: parcelId } });
  if (!parcel) throw new HubParcelError('not_found', 'Colis introuvable');
  if (parcel.ownerId !== ownerId) throw new HubParcelError('forbidden', 'Accès refusé');
  if (!['at_hub', 'ready_for_pickup'].includes(parcel.status)) {
    throw new HubParcelError('invalid_state', 'Retrait impossible dans cet état');
  }
  if (String(code) !== parcel.pickupCode) {
    throw new HubParcelError('invalid_state', 'Code de retrait incorrect');
  }

  const updated = await db.hubParcel.update({
    where: { id: parcelId },
    data: { status: 'picked_up', pickedUpAt: new Date() },
    include: { hub: true },
  });
  return hubParcelShape(updated);
}

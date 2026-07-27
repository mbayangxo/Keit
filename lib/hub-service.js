/** Shared K-21 pickup points — local marché routing + international/regional parcels. */

import { distanceKm, formatDistanceKm } from './geo.js';

export const DEFAULT_HUBS = [
  {
    code: 'HUB-PLATEAU',
    name: 'Point K21 Plateau',
    address: 'Avenue Léopold Sédar Senghor, Plateau, Dakar',
    lat: 14.6708,
    lng: -17.4381,
    arrondissement: 'plateau',
    city: 'Dakar',
    country: 'SN',
    isWarehouse: true,
  },
  {
    code: 'HUB-MEDINA',
    name: 'Point K21 Médina',
    address: 'Rue 22 x 40, Médina, Dakar',
    lat: 14.6892,
    lng: -17.4421,
    arrondissement: 'medina',
    city: 'Dakar',
    country: 'SN',
    isWarehouse: false,
  },
  {
    code: 'HUB-PIKINE',
    name: 'Point K21 Pikine',
    address: 'Marché Pikine, Pikine, Dakar',
    lat: 14.7547,
    lng: -17.3981,
    arrondissement: 'pikine',
    city: 'Dakar',
    country: 'SN',
    isWarehouse: false,
  },
  {
    code: 'HUB-YOFF',
    name: 'Point K21 Yoff',
    address: 'Route de l’Aéroport, Yoff, Dakar',
    lat: 14.7519,
    lng: -17.4856,
    arrondissement: 'yoff',
    city: 'Dakar',
    country: 'SN',
    isWarehouse: false,
  },
  {
    code: 'HUB-THIES',
    name: 'Point K21 Thiès',
    address: 'Grand Thiès, Thiès',
    lat: 14.7886,
    lng: -16.926,
    arrondissement: 'thies',
    city: 'Thiès',
    country: 'SN',
    isWarehouse: false,
  },
  {
    code: 'HUB-KAOLACK',
    name: 'Point K21 Kaolack',
    address: 'Marché central, Kaolack',
    lat: 14.165,
    lng: -16.0726,
    arrondissement: 'kaolack',
    city: 'Kaolack',
    country: 'SN',
    isWarehouse: false,
  },
];

export async function ensureDefaultHubs(db) {
  for (const hub of DEFAULT_HUBS) {
    await db.deliveryHub.upsert({
      where: { code: hub.code },
      update: {
        name: hub.name,
        address: hub.address,
        lat: hub.lat,
        lng: hub.lng,
        arrondissement: hub.arrondissement,
        city: hub.city,
        country: hub.country,
        active: true,
      },
      create: hub,
    });
  }
}

export function hubShape(hub, { lat, lng } = {}) {
  const distance =
    lat != null && lng != null ? distanceKm(lat, lng, hub.lat, hub.lng) : null;
  return {
    id: hub.id,
    code: hub.code,
    name: hub.name,
    address: hub.address,
    lat: hub.lat,
    lng: hub.lng,
    arrondissement: hub.arrondissement,
    city: hub.city ?? null,
    country: hub.country ?? 'SN',
    isWarehouse: hub.isWarehouse,
    distanceKm: distance,
    distanceLabel: formatDistanceKm(distance),
    shippingLabel: `${hub.name} · Réf. K21 colis`,
  };
}

export async function listDeliveryHubs(db, { lat, lng, country } = {}) {
  await ensureDefaultHubs(db);
  const hubs = await db.deliveryHub.findMany({
    where: {
      active: true,
      ...(country ? { country } : {}),
    },
    orderBy: [{ city: 'asc' }, { name: 'asc' }],
  });
  const shaped = hubs.map((h) => hubShape(h, { lat, lng }));
  if (lat != null && lng != null) {
    shaped.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  }
  return shaped;
}

export async function findNearestHub(db, lat, lng, { country } = {}) {
  if (lat == null || lng == null) {
    return db.deliveryHub.findFirst({
      where: { active: true, ...(country ? { country } : {}) },
      orderBy: { createdAt: 'asc' },
    });
  }
  const hubs = await listDeliveryHubs(db, { lat, lng, country });
  if (!hubs.length) return null;
  return db.deliveryHub.findUnique({ where: { id: hubs[0].id } });
}

export async function getHubById(db, hubId) {
  return db.deliveryHub.findUnique({ where: { id: hubId, active: true } });
}

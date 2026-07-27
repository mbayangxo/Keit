/** Approximate coords for distance sorting when GPS is unavailable. */
export const DAKAR_CENTER = { lat: 14.6928, lng: -17.4467 };

export const ARRONDISSEMENT_COORDS = {
  plateau: { lat: 14.6708, lng: -17.4381 },
  medina: { lat: 14.6892, lng: -17.4421 },
  pikine: { lat: 14.7547, lng: -17.3981 },
  guediawaye: { lat: 14.7694, lng: -17.3986 },
  yoff: { lat: 14.7519, lng: -17.4856 },
  ouakam: { lat: 14.7236, lng: -17.4947 },
  almadies: { lat: 14.7397, lng: -17.5103 },
  hlm: { lat: 14.7078, lng: -17.4542 },
  parcelles: { lat: 14.7647, lng: -17.4214 },
};

export function coordsFromArrondissement(key) {
  if (!key) return DAKAR_CENTER;
  return ARRONDISSEMENT_COORDS[key] ?? DAKAR_CENTER;
}

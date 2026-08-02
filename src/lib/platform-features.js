import { useCallback, useEffect, useState } from 'react';
import { getPlatformConfig } from './api-client';

/** Offline-safe defaults — conservative (nothing “live” we cannot verify). */
export const DEFAULT_PLATFORM = {
  platform: 'k21',
  version: 1,
  region: 'SN',
  message: 'K21 — infrastructure de paiement au Sénégal.',
  message: 'K21 — wallet, marketplace et Mboolo. Rect = app séparée.',
  auth: { emailOnly: true, phoneRequired: false },
  apps: {
    k21: { id: 'k21', separateApp: false },
    rect: { id: 'rect', separateApp: true, paymentsVia: 'k21-api' },
  },
  features: {
    wallet: { send: true, receive: true, requests: true, undo: true, tontine: true },
    cash: { depositsLive: false, withdrawalsLive: false, betaDeposits: false, available: true, agentDeposits: true, stripeDeposits: false },
    marketplace: { delivery: true, movement: true, seller: true, events: false, tickets: false, merchantPay: true },
    mboolo: { chat: true, voiceNotes: true, voiceCalls: false, videoCalls: false },
    comingSoon: { nuLekk: true, familyWallet: true, merchantQrOffline: true, float: true, wakhna: true, lemFiLive: false },
  },
};

let cached = null;
let cachedAt = 0;
const TTL_MS = 60_000;

export async function loadPlatformFeatures(force = false) {
  if (!force && cached && Date.now() - cachedAt < TTL_MS) return cached;
  try {
    cached = await getPlatformConfig();
  } catch {
    cached = DEFAULT_PLATFORM;
  }
  cachedAt = Date.now();
  return cached;
}

export function clearPlatformFeaturesCache() {
  cached = null;
  cachedAt = 0;
}

export function featureEnabled(config, ...path) {
  let node = config?.features;
  for (const key of path) {
    if (node == null || typeof node !== 'object') return false;
    node = node[key];
  }
  if (typeof node === 'boolean') return node;
  return false;
}

export function isComingSoon(config, key) {
  return Boolean(config?.features?.comingSoon?.[key]);
}

export function usePlatformFeatures() {
  const [config, setConfig] = useState(cached ?? DEFAULT_PLATFORM);
  const [loading, setLoading] = useState(!cached);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setConfig(await loadPlatformFeatures(true));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformFeatures().then(setConfig).finally(() => setLoading(false));
  }, []);

  return { config, loading, reload, feature: (...path) => featureEnabled(config, ...path), comingSoon: (key) => isComingSoon(config, key) };
}

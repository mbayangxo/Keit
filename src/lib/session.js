import { getAccessToken, getRefreshToken, saveSessionTokens, clearSession } from './secure-storage.js';
import { getMe, getWallet, getTransactions, authRefreshToken } from './api-client.js';

function mapProfile(profile) {
  return {
    name: profile.name ?? '',
    handle: profile.handle ?? '',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    arrondissement: profile.arrondissement ?? { key: '', icon: '📍', name: '' },
    accountType: profile.accountType ?? (profile.business ? 'business' : 'personal'),
    afriId: profile.afriId ?? '',
    avatarEmoji: profile.avatarEmoji ?? '👤',
    avatarUrl: profile.avatarUrl ?? null,
    verification: profile.verification ?? null,
    studentPass: profile.studentPass ?? null,
    payQrUrl: profile.payQrUrl ?? null,
    business: profile.business ?? null,
    businesses: profile.businesses ?? [],
  };
}

/** Build app state from verify response — no extra API round-trip. */
export function sessionPayloadFromVerify({ profile, email } = {}) {
  if (!profile?.name && !profile?.handle && !email) return null;
  return {
    profile: mapProfile({ ...profile, email: profile?.email || email }),
    balance: 0,
    transactions: [],
  };
}

export async function fetchSessionPayload({ accessToken, profile: profileSnapshot, email } = {}) {
  let profile = profileSnapshot;
  if (!profile) {
    try {
      profile = await getMe(accessToken);
    } catch (error) {
      console.warn('[session] getMe failed after login', error?.message ?? error);
      if (email) {
        return sessionPayloadFromVerify({ profile: { email }, email }) ?? {
          profile: mapProfile({ email }),
          balance: 0,
          transactions: [],
        };
      }
      throw error;
    }
  }

  let wallet = { nationalBalance: 0, balance: 0 };
  let transactions = [];
  try {
    wallet = await getWallet(accessToken);
  } catch (error) {
    console.warn('[session] wallet fetch failed after login', error?.message ?? error);
  }
  try {
    transactions = await getTransactions(20, accessToken);
  } catch (error) {
    console.warn('[session] transactions fetch failed after login', error?.message ?? error);
  }

  return {
    profile: mapProfile(profile),
    balance: wallet.balance ?? wallet.koriBalance ?? 0,
    transactions,
  };
}

export async function tryRefreshAccessToken() {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;
  try {
    const data = await authRefreshToken(refreshToken);
    await saveSessionTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
    return true;
  } catch {
    await clearSession();
    return false;
  }
}

/** Restore session from stored tokens; returns payload or null. */
export async function restoreSession() {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    return await fetchSessionPayload({ accessToken: token });
  } catch (error) {
    if (error.status !== 401) throw error;
    const refreshed = await tryRefreshAccessToken();
    if (!refreshed) return null;
    return fetchSessionPayload({ accessToken: await getAccessToken() });
  }
}

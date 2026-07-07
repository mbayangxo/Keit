import { getAccessToken, getRefreshToken, saveSessionTokens, clearSession } from './secure-storage.js';
import { getMe, getWallet, getTransactions, authRefreshToken } from './api-client.js';

export async function fetchSessionPayload() {
  const [profile, wallet, transactions] = await Promise.all([
    getMe(),
    getWallet(),
    getTransactions(),
  ]);
  return {
    profile: {
      name: profile.name,
      handle: profile.handle,
      phone: profile.phone ?? '',
      email: profile.email ?? '',
      arrondissement: profile.arrondissement ?? { key: '', icon: '📍', name: '' },
      accountType: profile.accountType ?? (profile.business ? 'business' : 'personal'),
      afriId: profile.afriId ?? '',
      business: profile.business ?? null,
      businesses: profile.businesses ?? [],
    },
    balance: wallet.nationalBalance ?? wallet.balance ?? 0,
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
    return await fetchSessionPayload();
  } catch (error) {
    if (error.status !== 401) throw error;
    const refreshed = await tryRefreshAccessToken();
    if (!refreshed) return null;
    return fetchSessionPayload();
  }
}

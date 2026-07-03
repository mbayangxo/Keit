import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { colors } from '../theme';
import { getWallet, getTransactions } from '../lib/api-client.js';

function generateId(prefix) {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${part()}-${part()}`;
}

const EMPTY_PROFILE = {
  accountType: 'personal',
  name: '',
  handle: '',
  arrondissement: { key: '', icon: '📍', name: '' },
  afriId: '',
  business: null,
};

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [profile, setProfileState] = useState(EMPTY_PROFILE);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [authenticated, setAuthenticated] = useState(false);
  const [pendingMboloShare, setPendingMboloShare] = useState(null);

  const setProfile = useCallback((partial) => {
    setProfileState((prev) => ({ ...prev, ...partial }));
  }, []);

  const addTransaction = useCallback(({ icon, iconBg, title, subtitle, amount }) => {
    setBalance((prev) => prev + amount);
    setTransactions((prev) => [{ key: `tx-${Date.now()}`, icon, iconBg, title, subtitle, amount }, ...prev]);
  }, []);

  const hydrateFromApi = useCallback(({ profile: p, balance: b, transactions: txs }) => {
    setProfileState({
      accountType: p.accountType ?? 'personal',
      name: p.name ?? '',
      handle: p.handle ?? '',
      arrondissement: p.arrondissement ?? EMPTY_PROFILE.arrondissement,
      afriId: p.afriId ?? '',
      business: p.business ?? null,
    });
    setBalance(b ?? 0);
    setTransactions(txs ?? []);
    setAuthenticated(true);
  }, []);

  const resetSession = useCallback(() => {
    setProfileState(EMPTY_PROFILE);
    setBalance(0);
    setTransactions([]);
    setAuthenticated(false);
  }, []);

  const refreshWallet = useCallback(async () => {
    const [wallet, txs] = await Promise.all([getWallet(), getTransactions()]);
    setBalance(wallet.nationalBalance ?? wallet.balance ?? 0);
    setTransactions(txs);
    return wallet;
  }, []);

  const initAccount = useCallback(({ name, handle, arrondissement, fundAmount, transactions: txs }) => {
    setProfileState((prev) => ({
      ...prev,
      accountType: 'personal',
      name: name ?? prev.name,
      handle: handle ?? prev.handle,
      arrondissement: arrondissement ?? prev.arrondissement,
      afriId: prev.afriId || generateId('AFRI'),
      business: null,
    }));
    if (fundAmount != null) setBalance(fundAmount);
    if (txs?.length) {
      setTransactions(txs);
    } else if (fundAmount) {
      setTransactions([
        { key: 'funding', icon: '💰', iconBg: colors.greenA08, title: 'Dépôt initial', subtitle: 'Bienvenue sur K21', amount: fundAmount },
      ]);
    } else {
      setTransactions([]);
    }
    setAuthenticated(true);
  }, []);

  const initBusinessAccount = useCallback(({ businessName, category, arrondissement, fundAmount }) => {
    setProfileState((prev) => ({
      ...prev,
      accountType: 'business',
      arrondissement,
      business: { name: businessName, category, keboId: generateId('KEBU') },
    }));
    setBalance(fundAmount ?? 0);
    setTransactions(
      fundAmount
        ? [{ key: 'funding', icon: '💰', iconBg: colors.greenA08, title: 'Dépôt initial', subtitle: 'Bienvenue sur K21 Business', amount: fundAmount }]
        : []
    );
    setAuthenticated(true);
  }, []);

  const value = useMemo(
    () => ({
      profile,
      setProfile,
      balance,
      transactions,
      authenticated,
      addTransaction,
      initAccount,
      initBusinessAccount,
      hydrateFromApi,
      resetSession,
      refreshWallet,
      pendingMboloShare,
      setPendingMboloShare,
    }),
    [
      profile,
      setProfile,
      balance,
      transactions,
      authenticated,
      addTransaction,
      initAccount,
      initBusinessAccount,
      hydrateFromApi,
      resetSession,
      refreshWallet,
      pendingMboloShare,
    ]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

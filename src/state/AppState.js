import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { colors } from '../theme';

// Single in-memory source of truth for the signed-in user's profile, wallet
// balance, and transaction history — replaces the per-screen hardcoded
// "Saliou" / "47 000 F" values so a name/amount entered at signup (or spent
// on a real screen) actually shows up everywhere else. No persistence yet:
// this resets on app reload, same as the rest of the app's state.

const DEFAULT_PROFILE = {
  name: 'Saliou',
  handle: 'saliou_medina',
  arrondissement: { key: 'medina', icon: '🏘️', name: 'Médina' },
};

const DEFAULT_BALANCE = 47000;

const DEFAULT_TRANSACTIONS = [
  { key: 'seed-1', icon: '📥', iconBg: colors.greenA08, title: 'Reçu de Papa', subtitle: "Aujourd'hui · 14h22", amount: 5000 },
  { key: 'seed-2', icon: '🏪', iconBg: colors.orangeA08, title: 'Dibiterie Chez Papa', subtitle: 'Hier · 19h04', amount: -2500 },
];

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [profile, setProfileState] = useState(DEFAULT_PROFILE);
  const [balance, setBalance] = useState(DEFAULT_BALANCE);
  const [transactions, setTransactions] = useState(DEFAULT_TRANSACTIONS);

  const setProfile = useCallback((partial) => {
    setProfileState((prev) => ({ ...prev, ...partial }));
  }, []);

  // `amount` is signed: positive for money in, negative for money out.
  const addTransaction = useCallback(({ icon, iconBg, title, subtitle, amount }) => {
    setBalance((prev) => prev + amount);
    setTransactions((prev) => [{ key: `tx-${Date.now()}`, icon, iconBg, title, subtitle, amount }, ...prev]);
  }, []);

  // Called once when signup finishes: replaces the seed demo data with the
  // account the person actually just created (their name + their real
  // starting deposit), instead of adding on top of the placeholder 47 000 F.
  const initAccount = useCallback(({ name, handle, arrondissement, fundAmount }) => {
    setProfileState((prev) => ({ ...prev, name, handle, arrondissement }));
    setBalance(fundAmount ?? 0);
    setTransactions(
      fundAmount
        ? [{ key: 'funding', icon: '💰', iconBg: colors.greenA08, title: 'Dépôt initial', subtitle: 'Bienvenue sur K21', amount: fundAmount }]
        : []
    );
  }, []);

  const value = useMemo(
    () => ({ profile, setProfile, balance, transactions, addTransaction, initAccount }),
    [profile, setProfile, balance, transactions, addTransaction, initAccount]
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}

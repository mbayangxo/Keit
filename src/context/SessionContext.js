import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearSession } from '../lib/secure-storage.js';
import { restoreSession } from '../lib/session.js';
import { useAppState } from '../state/AppState.js';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const { hydrateFromApi, resetSession: resetAppState } = useAppState();
  const [bootstrapped, setBootstrapped] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  const bootstrap = useCallback(async () => {
    try {
      const payload = await restoreSession();
      if (payload) {
        hydrateFromApi(payload);
        setHasSession(true);
      } else {
        setHasSession(false);
      }
    } catch {
      await clearSession();
      resetAppState();
      setHasSession(false);
    } finally {
      setBootstrapped(true);
    }
  }, [hydrateFromApi, resetAppState]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const markSignedIn = useCallback(() => setHasSession(true), []);

  const signOut = useCallback(async () => {
    await clearSession();
    resetAppState();
    setHasSession(false);
  }, [resetAppState]);

  const value = useMemo(
    () => ({
      bootstrapped,
      hasSession,
      markSignedIn,
      signOut,
      refreshBootstrap: bootstrap,
    }),
    [bootstrapped, hasSession, markSignedIn, signOut, bootstrap],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

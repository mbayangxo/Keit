import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadPreferences, savePreferences } from '../lib/preferences-storage';

const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState({ lowDataMode: false, largeText: false, ready: false });

  useEffect(() => {
    loadPreferences().then((loaded) => setPrefs({ ...loaded, ready: true }));
  }, []);

  const setLowDataMode = useCallback(async (lowDataMode) => {
    const next = await savePreferences({ lowDataMode });
    setPrefs((p) => ({ ...p, ...next }));
  }, []);

  const setLargeText = useCallback(async (largeText) => {
    const next = await savePreferences({ largeText });
    setPrefs((p) => ({ ...p, ...next }));
  }, []);

  const value = useMemo(
    () => ({
      lowDataMode: prefs.lowDataMode,
      largeText: prefs.largeText,
      ready: prefs.ready,
      setLowDataMode,
      setLargeText,
      /** Skip decorative animations and heavy visuals on slow connections. */
      reduceMotion: prefs.lowDataMode,
    }),
    [prefs, setLowDataMode, setLargeText],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}

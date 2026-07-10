import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { COUNTRIES, getCountryByCode } from '../i18n/countries';
import { LANGUAGES } from '../i18n/languages';
import { getDefaultRegion, getRegionByKey } from '../i18n/regions';
import { loadPreferences, savePreferences } from '../lib/preferences-storage';

const LocaleContext = createContext(null);

const SPLASH_LANG = { FR: 'fr', WO: 'wo', EN: 'en' };

export function LocaleProvider({ children }) {
  const [country, setCountryState] = useState(COUNTRIES[0]);
  const [language, setLanguageState] = useState(LANGUAGES.find((l) => l.code === 'fr'));
  const [region, setRegionState] = useState(getDefaultRegion(COUNTRIES[0]?.code));
  const [onboardingIntent, setOnboardingIntentState] = useState(null);
  const [showMovementTab, setShowMovementTabState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPreferences().then((prefs) => {
      let nextCountry = COUNTRIES[0];
      if (prefs.countryCode) {
        const c = getCountryByCode(prefs.countryCode);
        if (c) nextCountry = c;
      }
      setCountryState(nextCountry);
      if (prefs.languageCode) {
        const l = LANGUAGES.find((x) => x.code === prefs.languageCode);
        if (l) setLanguageState(l);
      }
      if (prefs.regionKey) {
        const r = getRegionByKey(nextCountry.code, prefs.regionKey);
        if (r) setRegionState(r);
        else if (prefs.regionName) {
          setRegionState({ key: prefs.regionKey, name: prefs.regionName, icon: prefs.regionIcon ?? '📍' });
        }
      } else {
        setRegionState(getDefaultRegion(nextCountry.code));
      }
      if (prefs.onboardingIntent) setOnboardingIntentState(prefs.onboardingIntent);
      if (prefs.showMovementTab) setShowMovementTabState(Boolean(prefs.showMovementTab));
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (partial) => {
    const nextCountry = partial.country ?? country;
    const nextRegion = partial.region ?? region;
    await savePreferences({
      countryCode: nextCountry?.code ?? country?.code,
      languageCode: partial.language?.code ?? language?.code,
      regionKey: nextRegion?.key ?? region?.key,
      regionName: nextRegion?.name ?? region?.name,
      regionIcon: nextRegion?.icon ?? region?.icon,
      onboardingIntent: partial.onboardingIntent ?? onboardingIntent,
      showMovementTab: partial.showMovementTab ?? showMovementTab,
    });
  }, [country, language, region, onboardingIntent, showMovementTab]);

  const setCountry = useCallback(async (c) => {
    setCountryState(c);
    const nextRegion = getDefaultRegion(c?.code);
    setRegionState(nextRegion);
    await persist({ country: c, region: nextRegion });
  }, [persist]);

  const setLanguage = useCallback(async (l) => {
    setLanguageState(l);
    await persist({ language: l });
  }, [persist]);

  const setRegion = useCallback(async (r) => {
    setRegionState(r);
    await persist({ region: r });
  }, [persist]);

  const setOnboardingIntent = useCallback(async (intent) => {
    setOnboardingIntentState(intent);
    await persist({ onboardingIntent: intent });
  }, [persist]);

  const setShowMovementTab = useCallback(async (enabled) => {
    setShowMovementTabState(Boolean(enabled));
    await persist({ showMovementTab: Boolean(enabled) });
  }, [persist]);

  const setLanguageFromSplash = useCallback((code) => {
    const langCode = SPLASH_LANG[code] ?? 'fr';
    const l = LANGUAGES.find((x) => x.code === langCode) ?? LANGUAGES[0];
    setLanguageState(l);
    persist({ language: l });
  }, [persist]);

  const langCode = language?.code ?? 'fr';

  const value = useMemo(
    () => ({
      country,
      language,
      region,
      langCode,
      currency: country?.currency ?? 'XOF',
      onboardingIntent,
      showMovementTab,
      ready,
      setCountry,
      setLanguage,
      setRegion,
      setOnboardingIntent,
      setShowMovementTab,
      setLanguageFromSplash,
    }),
    [country, language, region, langCode, onboardingIntent, showMovementTab, ready, setCountry, setLanguage, setRegion, setOnboardingIntent, setShowMovementTab, setLanguageFromSplash],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

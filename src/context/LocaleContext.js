import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { COUNTRIES, getCountryByCode } from '../i18n/countries';
import { LANGUAGES } from '../i18n/languages';
import { loadPreferences, savePreferences } from '../lib/preferences-storage';

const LocaleContext = createContext(null);

const SPLASH_LANG = { FR: 'fr', WO: 'wo', EN: 'en' };

export function LocaleProvider({ children }) {
  const [country, setCountryState] = useState(COUNTRIES[0]);
  const [language, setLanguageState] = useState(LANGUAGES.find((l) => l.code === 'fr'));
  const [onboardingIntent, setOnboardingIntentState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadPreferences().then((prefs) => {
      if (prefs.countryCode) {
        const c = getCountryByCode(prefs.countryCode);
        if (c) setCountryState(c);
      }
      if (prefs.languageCode) {
        const l = LANGUAGES.find((x) => x.code === prefs.languageCode);
        if (l) setLanguageState(l);
      }
      if (prefs.onboardingIntent) setOnboardingIntentState(prefs.onboardingIntent);
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (partial) => {
    await savePreferences({
      countryCode: partial.country?.code ?? country?.code,
      languageCode: partial.language?.code ?? language?.code,
      onboardingIntent: partial.onboardingIntent ?? onboardingIntent,
    });
  }, [country, language, onboardingIntent]);

  const setCountry = useCallback(async (c) => {
    setCountryState(c);
    await persist({ country: c });
  }, [persist]);

  const setLanguage = useCallback(async (l) => {
    setLanguageState(l);
    await persist({ language: l });
  }, [persist]);

  const setOnboardingIntent = useCallback(async (intent) => {
    setOnboardingIntentState(intent);
    await persist({ onboardingIntent: intent });
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
      langCode,
      currency: country?.currency ?? 'XOF',
      onboardingIntent,
      ready,
      setCountry,
      setLanguage,
      setOnboardingIntent,
      setLanguageFromSplash,
    }),
    [country, language, langCode, onboardingIntent, ready, setCountry, setLanguage, setOnboardingIntent, setLanguageFromSplash],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

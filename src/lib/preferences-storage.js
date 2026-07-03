const KEY = 'k21_preferences';

const DEFAULTS = {
  lowDataMode: false,
  largeText: false,
  countryCode: 'SN',
  languageCode: 'fr',
  onboardingIntent: null,
};

async function getItem(key) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

async function setItem(key, value) {
  if (typeof sessionStorage !== 'undefined') {
    try {
      sessionStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
  }
}

/** Persist accessibility / network prefs (device-local). */
export async function loadPreferences() {
  try {
    const { Platform } = await import('react-native');
    if (Platform.OS !== 'web') {
      const SecureStore = await import('expo-secure-store');
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
      return { ...DEFAULTS };
    }
  } catch {
    /* fall through */
  }
  const raw = await getItem(KEY);
  if (raw) {
    try {
      return { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULTS };
    }
  }
  return { ...DEFAULTS };
}

export async function savePreferences(partial) {
  const current = await loadPreferences();
  const next = { ...current, ...partial };
  const json = JSON.stringify(next);
  try {
    const { Platform } = await import('react-native');
    if (Platform.OS !== 'web') {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(KEY, json);
      return next;
    }
  } catch {
    /* fall through */
  }
  await setItem(KEY, json);
  return next;
}

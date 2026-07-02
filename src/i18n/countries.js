// Countries selectable during onboarding, ordered per the brief's §14 launch
// sequence: Senegal first, then diaspora France, then the rest of West/Central
// Africa and other diaspora hubs. `languages` lists the language codes
// (see languages.js) suggested first for that country — the full list is
// always available below the suggestions.
export const COUNTRIES = [
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳', languages: ['wo', 'ff', 'srr', 'mnk', 'dyo', 'fr'] },
  { code: 'FR', name: 'France', flag: '🇫🇷', languages: ['fr', 'wo', 'bm', 'en'] },
  { code: 'ML', name: 'Mali', flag: '🇲🇱', languages: ['bm', 'ff', 'fr'] },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳', languages: ['ff', 'mnk', 'fr'] },
  { code: 'GM', name: 'Gambie', flag: '🇬🇲', languages: ['mnk', 'wo', 'ff', 'en'] },
  { code: 'MR', name: 'Mauritanie', flag: '🇲🇷', languages: ['ff', 'wo', 'fr'] },
  { code: 'CI', name: 'Côte d’Ivoire', flag: '🇨🇮', languages: ['bm', 'fr'] },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫', languages: ['ff', 'bm', 'fr'] },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', languages: ['ha', 'en'] },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲', languages: ['ff', 'fr', 'en'] },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', languages: ['sw', 'en'] },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸', languages: ['en', 'fr', 'wo'] },
  { code: 'OTHER', name: 'Autre pays', flag: '🌍', languages: ['fr', 'en'] },
];

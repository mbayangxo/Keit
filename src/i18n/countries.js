// Countries selectable during onboarding, ordered per the brief's §14 launch
// sequence: Senegal first, then diaspora France, then the rest of West/Central
// Africa and other diaspora hubs. `languages` lists the language codes
// (see languages.js) suggested first for that country — the full list is
// always available below the suggestions.
export const COUNTRIES = [
  { code: 'SN', name: 'Sénégal', nameEn: 'Senegal', flag: '🇸🇳', dial: '+221', currency: 'XOF', phoneMin: 9, phoneMax: 9, languages: ['wo', 'ff', 'srr', 'mnk', 'dyo', 'fr'] },
  { code: 'FR', name: 'France', nameEn: 'France', flag: '🇫🇷', dial: '+33', currency: 'EUR', phoneMin: 9, phoneMax: 10, languages: ['fr', 'wo', 'bm', 'en'] },
  { code: 'ML', name: 'Mali', nameEn: 'Mali', flag: '🇲🇱', dial: '+223', currency: 'XOF', phoneMin: 8, phoneMax: 8, languages: ['bm', 'ff', 'fr'] },
  { code: 'GN', name: 'Guinée', nameEn: 'Guinea', flag: '🇬🇳', dial: '+224', currency: 'GNF', phoneMin: 9, phoneMax: 9, languages: ['ff', 'mnk', 'fr'] },
  { code: 'GM', name: 'Gambie', nameEn: 'Gambia', flag: '🇬🇲', dial: '+220', currency: 'GMD', phoneMin: 7, phoneMax: 7, languages: ['mnk', 'wo', 'ff', 'en'] },
  { code: 'MR', name: 'Mauritanie', nameEn: 'Mauritania', flag: '🇲🇷', dial: '+222', currency: 'MRU', phoneMin: 8, phoneMax: 8, languages: ['ff', 'wo', 'fr'] },
  { code: 'CI', name: 'Côte d’Ivoire', nameEn: 'Côte d’Ivoire', flag: '🇨🇮', dial: '+225', currency: 'XOF', phoneMin: 10, phoneMax: 10, languages: ['bm', 'fr'] },
  { code: 'BF', name: 'Burkina Faso', nameEn: 'Burkina Faso', flag: '🇧🇫', dial: '+226', currency: 'XOF', phoneMin: 8, phoneMax: 8, languages: ['ff', 'bm', 'fr'] },
  { code: 'NG', name: 'Nigeria', nameEn: 'Nigeria', flag: '🇳🇬', dial: '+234', currency: 'NGN', phoneMin: 10, phoneMax: 10, languages: ['ha', 'en'] },
  { code: 'CM', name: 'Cameroun', nameEn: 'Cameroon', flag: '🇨🇲', dial: '+237', currency: 'XAF', phoneMin: 9, phoneMax: 9, languages: ['ff', 'fr', 'en'] },
  { code: 'KE', name: 'Kenya', nameEn: 'Kenya', flag: '🇰🇪', dial: '+254', currency: 'KES', phoneMin: 9, phoneMax: 9, languages: ['sw', 'en'] },
  { code: 'US', name: 'États-Unis', nameEn: 'United States', flag: '🇺🇸', dial: '+1', currency: 'USD', phoneMin: 10, phoneMax: 10, languages: ['en', 'fr', 'wo'] },
  { code: 'OTHER', name: 'Autre pays', nameEn: 'Other country', flag: '🌍', dial: '+221', currency: 'XOF', phoneMin: 8, phoneMax: 12, languages: ['fr', 'en'] },
];

export function getCountryByCode(code) {
  return COUNTRIES.find((c) => c.code === code) ?? null;
}

export function getCountryDisplayName(country, langCode = 'fr') {
  if (!country) return '';
  if (langCode === 'en' && country.nameEn) return country.nameEn;
  return country.name;
}

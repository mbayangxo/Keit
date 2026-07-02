// Languages selectable during onboarding. `name` is the English name (for
// search), `native` is the autonym as written by speakers of that language.
//
// Confidence note: `fr`, `en`, and `wo` translations in translations.js are
// solid. The rest (ff, bm, srr, snk, mnk, dyo, ha, sw) are best-effort —
// several of these languages have multiple accepted orthographies and no
// single "official" UI-string convention. Have a native speaker review
// those before shipping to users of those languages.
export const LANGUAGES = [
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'wo', name: 'Wolof', native: 'Wolof' },
  { code: 'ff', name: 'Pulaar / Fulani', native: 'Pulaar' },
  { code: 'bm', name: 'Bambara', native: 'Bamanankan' },
  { code: 'srr', name: 'Serer', native: 'Seereer' },
  { code: 'mnk', name: 'Mandinka', native: 'Mandi’nkakan' },
  { code: 'snk', name: 'Soninke', native: 'Sooninkanxanne' },
  { code: 'dyo', name: 'Jola / Diola', native: 'Joola' },
  { code: 'ha', name: 'Hausa', native: 'Hausa' },
  { code: 'sw', name: 'Swahili', native: 'Kiswahili' },
];

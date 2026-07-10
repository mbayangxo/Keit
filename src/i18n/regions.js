// Sub-national regions (states, arrondissements, major cities) per country code.
// Used on the unified onboarding page and stored as profile arrondissement.

const GENERIC = [
  { key: 'urban', icon: '🏙️', name: 'Ville / City' },
  { key: 'suburban', icon: '🏘️', name: 'Banlieue / Suburbs' },
  { key: 'rural', icon: '🌾', name: 'Campagne / Rural' },
  { key: 'other', icon: '📍', name: 'Autre / Other' },
];

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
].map((name) => ({
  key: `us-${name.toLowerCase().replace(/\s+/g, '-')}`,
  icon: '🗺️',
  name,
}));

const REGIONS_BY_COUNTRY = {
  SN: [
    { key: 'medina', icon: '🏘️', name: 'Médina' },
    { key: 'plateau', icon: '🏙️', name: 'Plateau' },
    { key: 'parcelles', icon: '🌆', name: 'Parcelles Assainies' },
    { key: 'hlm', icon: '🌇', name: 'HLM' },
    { key: 'ouakam', icon: '🌃', name: 'Ouakam' },
    { key: 'yoff', icon: '🏖️', name: 'Yoff' },
    { key: 'almadies', icon: '🌴', name: 'Almadies' },
    { key: 'pikine', icon: '🏘️', name: 'Pikine' },
    { key: 'guediawaye', icon: '🌆', name: 'Guédiawaye' },
    { key: 'thies', icon: '🚂', name: 'Thiès' },
    { key: 'saint-louis', icon: '🕌', name: 'Saint-Louis' },
    { key: 'kaolack', icon: '🌾', name: 'Kaolack' },
    { key: 'ziguinchor', icon: '🌊', name: 'Ziguinchor' },
  ],
  FR: [
    { key: 'idf', icon: '🗼', name: 'Île-de-France' },
    { key: 'ara', icon: '🏔️', name: 'Auvergne-Rhône-Alpes' },
    { key: 'paca', icon: '☀️', name: "Provence-Alpes-Côte d'Azur" },
    { key: 'occ', icon: '🍇', name: 'Occitanie' },
    { key: 'naq', icon: '🌊', name: 'Nouvelle-Aquitaine' },
    { key: 'hdf', icon: '🏭', name: 'Hauts-de-France' },
    { key: 'ges', icon: '🥨', name: 'Grand Est' },
    { key: 'bfc', icon: '🍷', name: 'Bourgogne-Franche-Comté' },
    { key: 'bre', icon: '⚓', name: 'Bretagne' },
    { key: 'cvl', icon: '🏰', name: 'Centre-Val de Loire' },
    { key: 'cor', icon: '🏝️', name: 'Corse' },
    { key: 'nor', icon: '🌾', name: 'Normandie' },
    { key: 'pdl', icon: '🌿', name: 'Pays de la Loire' },
  ],
  US: US_STATES,
  ML: [
    { key: 'bamako', icon: '🏙️', name: 'Bamako' },
    { key: 'sikasso', icon: '🌾', name: 'Sikasso' },
    { key: 'segou', icon: '🕌', name: 'Ségou' },
    { key: 'mopti', icon: '🛶', name: 'Mopti' },
    { key: 'kayes', icon: '🏜️', name: 'Kayes' },
    { key: 'gao', icon: '🏜️', name: 'Gao' },
    { key: 'tombouctou', icon: '📜', name: 'Tombouctou' },
  ],
  CI: [
    { key: 'abidjan', icon: '🏙️', name: 'Abidjan' },
    { key: 'bouake', icon: '🌆', name: 'Bouaké' },
    { key: 'yamoussoukro', icon: '🏛️', name: 'Yamoussoukro' },
    { key: 'san-pedro', icon: '⚓', name: 'San-Pédro' },
    { key: 'korhogo', icon: '🌾', name: 'Korhogo' },
    { key: 'daloa', icon: '☕', name: 'Daloa' },
  ],
  NG: [
    { key: 'lagos', icon: '🏙️', name: 'Lagos' },
    { key: 'abuja', icon: '🏛️', name: 'Abuja' },
    { key: 'kano', icon: '🕌', name: 'Kano' },
    { key: 'port-harcourt', icon: '⚓', name: 'Port Harcourt' },
    { key: 'ibadan', icon: '🌆', name: 'Ibadan' },
    { key: 'kaduna', icon: '🏭', name: 'Kaduna' },
  ],
  BF: [
    { key: 'ouagadougou', icon: '🏙️', name: 'Ouagadougou' },
    { key: 'bobo-dioulasso', icon: '🌆', name: 'Bobo-Dioulasso' },
    { key: 'koudougou', icon: '🌾', name: 'Koudougou' },
  ],
  GN: [
    { key: 'conakry', icon: '🏙️', name: 'Conakry' },
    { key: 'labe', icon: '🌾', name: 'Labé' },
    { key: 'kankan', icon: '🕌', name: 'Kankan' },
    { key: 'nzerekore', icon: '🌳', name: 'Nzérékoré' },
  ],
  GM: [
    { key: 'banjul', icon: '🏙️', name: 'Banjul' },
    { key: 'serrekunda', icon: '🌆', name: 'Serrekunda' },
    { key: 'brikama', icon: '🏘️', name: 'Brikama' },
  ],
  MR: [
    { key: 'nouakchott', icon: '🏙️', name: 'Nouakchott' },
    { key: 'nouadhibou', icon: '⚓', name: 'Nouadhibou' },
    { key: 'rosso', icon: '🌊', name: 'Rosso' },
  ],
  CM: [
    { key: 'douala', icon: '🏙️', name: 'Douala' },
    { key: 'yaounde', icon: '🏛️', name: 'Yaoundé' },
    { key: 'garoua', icon: '🌾', name: 'Garoua' },
    { key: 'bafoussam', icon: '☕', name: 'Bafoussam' },
  ],
  KE: [
    { key: 'nairobi', icon: '🏙️', name: 'Nairobi' },
    { key: 'mombasa', icon: '🏖️', name: 'Mombasa' },
    { key: 'kisumu', icon: '🌊', name: 'Kisumu' },
    { key: 'nakuru', icon: '🌋', name: 'Nakuru' },
  ],
  OTHER: GENERIC,
};

export function getRegionsForCountry(countryCode) {
  if (!countryCode) return GENERIC;
  return REGIONS_BY_COUNTRY[countryCode] ?? GENERIC;
}

export function getRegionByKey(countryCode, key) {
  if (!key) return null;
  return getRegionsForCountry(countryCode).find((r) => r.key === key) ?? null;
}

export function getDefaultRegion(countryCode) {
  const list = getRegionsForCountry(countryCode);
  return list[0] ?? null;
}

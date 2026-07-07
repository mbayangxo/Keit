/**
 * Culture feed — curated sports & culture headlines by country/region.
 * Phase 1: curated fixtures + optional RSS when CULTURE_RSS_URL is set.
 */

const BASE_BY_COUNTRY = {
  SN: [
    { key: 'can', icon: '⚽', title: 'Lions — match à venir', meta: 'AFCON · Dakar · 17h', tag: 'Sport', region: 'senegal' },
    { key: 'basket', icon: '🏀', title: 'AS Douanes vs Jaraaf', meta: 'Basket · Dakar Arena · 20h', tag: 'Sport', region: 'dakar' },
    { key: 'lutte', icon: '🤼', title: 'Gala de Lutte', meta: 'Arène Nationale · 16h', tag: 'Sport', region: 'senegal' },
    { key: 'expo', icon: '🎨', title: 'Expo Art Contemporain', meta: 'IFAN · Cette semaine', tag: 'Culture', region: 'dakar' },
  ],
  US: [
    { key: 'nba', icon: '🏀', title: 'NBA Tonight', meta: 'National TV · 20h ET', tag: 'Sport', region: 'usa' },
    { key: 'nfl', icon: '🏈', title: 'NFL Highlights', meta: 'This week', tag: 'Sport', region: 'usa' },
    { key: 'afcon-diaspora', icon: '⚽', title: 'Sénégal diaspora watch parties', meta: 'New York · Atlanta · DC', tag: 'Culture', region: 'diaspora' },
  ],
  FR: [
    { key: 'ligue1', icon: '⚽', title: 'Ligue 1 — week-end', meta: 'Paris · 21h', tag: 'Sport', region: 'france' },
    { key: 'diaspora', icon: '🇸🇳', title: 'Communauté sénégalaise', meta: 'Événements · Paris 18e', tag: 'Culture', region: 'diaspora' },
  ],
};

export function getCultureFeed({ country = 'SN', query = '' } = {}) {
  const items = BASE_BY_COUNTRY[country] ?? BASE_BY_COUNTRY.SN;
  const q = String(query).trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.meta.toLowerCase().includes(q) ||
          i.tag.toLowerCase().includes(q),
      )
    : items;

  return {
    country,
    items: filtered,
    preview: true,
    source: 'curated',
    message: 'Phase 1 — curated headlines. User-posted culture & live scores coming next.',
  };
}

export const GIFT_CARD_THEMES = [
  { key: 'tabaski', emoji: '🐑', label: 'Tabaski', color: '#e8920a' },
  { key: 'korite', emoji: '🌙', label: 'Korité', color: '#0fbc48' },
  { key: 'birthday', emoji: '🎂', label: 'Anniversaire', color: '#e85c1a' },
  { key: 'thank_you', emoji: '🙏', label: 'Merci', color: '#0fbc48' },
  { key: 'love', emoji: '❤️', label: 'Amour', color: '#e85c1a' },
  { key: 'new_year', emoji: '🎊', label: 'Nouvel an', color: '#fad836' },
];

export function giftCardThemeMeta(key) {
  return GIFT_CARD_THEMES.find((t) => t.key === key) ?? null;
}

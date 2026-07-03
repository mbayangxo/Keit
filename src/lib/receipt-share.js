/**
 * Plain-text receipt for WhatsApp / Mbolo sharing — no secrets, no balance.
 */
export function formatReceiptText({ type = 'send', amount, counterparty, reference, note, fee = 0 }) {
  const amountStr = `${Number(amount).toLocaleString('fr-FR')} F CFA`;
  const lines = [
    '✦ K21 — Reçu',
    '—'.repeat(20),
    type === 'merchant' ? `🏪 Paiement marchand` : `💸 Envoi d'argent`,
    `Montant: ${amountStr}`,
    counterparty ? `À: ${counterparty}` : null,
    fee === 0 ? 'Frais: 0 F ✦' : `Frais: ${fee.toLocaleString('fr-FR')} F`,
    note ? `Motif: ${note}` : null,
    `Réf: ${reference}`,
    `Date: ${new Date().toLocaleString('fr-FR')}`,
    '—'.repeat(20),
    'K21 · Zéro frais · k21.sn',
  ];
  return lines.filter(Boolean).join('\n');
}

export function whatsAppShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

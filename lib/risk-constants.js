export const HELD_USER_MESSAGE_FR =
  'Nous vérifions cette transaction pour votre sécurité. Vous aurez de nos nouvelles dans les 2 heures.';

export const REVIEW_SLA_MS = 2 * 60 * 60 * 1000;

export const RISK_LIMITS = {
  TX_PER_HOUR: 10,
  OUTBOUND_24H_XOF: 500_000,
  REPEAT_SAME_RECIPIENT_HOUR: 3,
  NIGHT_LARGE_XOF: 100_000,
  KORI_CONVERT_REVIEW_XOF: 50_000,
  DEVICES_24H: 3,
};

export const WAEMU_COUNTRY_CODES = new Set(['SN', 'BJ', 'BF', 'CI', 'GW', 'ML', 'NE', 'TG']);

export const OUTBOUND_LEDGER_TYPES = [
  'send',
  'cash_out',
  'pay_merchant',
  'payroll',
  'ticket_purchase',
  'solidarity_donate',
  'delivery_escrow_hold',
  'marketplace_purchase',
];

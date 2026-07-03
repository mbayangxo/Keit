/**
 * K21 regulatory rollout and payment-rail context.
 *
 * Kori (₭) is a closed-loop stored value instrument — no separate BCEAO
 * license required under stored-value rules for internal circulation.
 * National currency in/out MUST use licensed partners (Julaya/Pawapay/LemFi).
 *
 * See docs/K21-REGULATORY-STRATEGY.md for BCEAO application, closed-loop
 * boundaries, and honest Kori positioning (what to promise vs north star).
 */
export const PHASE_1_COUNTRIES = ['SN'];
export const WAEMU_COUNTRIES = [
    'SN',
    'BJ',
    'BF',
    'CI',
    'GW',
    'ML',
    'NE',
    'TG',
];
/** Licensed BCEAO rails — K21 builds on their infrastructure in Phase 1/2 */
export const PAYMENT_RAILS = {
    phase1: {
        domestic: ['julaya', 'pawapay'],
        international: ['lemfi', 'sama_money'],
    },
    phase3: {
        NG: ['flutterwave', 'paystack'],
        GH: ['mtn_momo'],
        GM: [], // TBD
    },
};
export function rolloutPhaseForCountry(country) {
    if (PHASE_1_COUNTRIES.includes(country))
        return 1;
    if (WAEMU_COUNTRIES.includes(country))
        return 2;
    return 3;
}
export function isWaemu(country) {
    return WAEMU_COUNTRIES.includes(country);
}
/**
 * Within WAEMU, XOF is shared — Kori mechanics are identical, no cross-rate
 * inside the bloc. Cross-bloc (WAEMU ↔ Nigeria/Ghana/Gambia) Kori transfers
 * stay universal ₭; national-currency conversion is handled internally by K21
 * and never exposed to the user on Kori sends.
 */
/** Operations that stay inside K21 ledger — lighter regulatory surface when fiat rails are partner-licensed */
export const CLOSED_LOOP_OPERATIONS = [
    'kori_transfer',
    'kori_merchant_pay',
    'tontine_internal',
    'group_split_internal',
    'kori_earn',
    'kori_spend',
];
/** Operations that MUST go through licensed payment rails — never simulate as "done" in production */
export const LICENSED_RAIL_OPERATIONS = [
    'cash_in_mobile_money',
    'cash_out_mobile_money',
    'international_remittance',
];
export const KORI_REGULATORY_NOTE = 'Closed-loop stored value instrument. Not cryptocurrency. No blockchain. No speculative value. ' +
    'No exchange trading. Internal credit for cheaper K21-to-K21 activity only.';

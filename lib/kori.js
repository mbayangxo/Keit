/**
 * Cauris (C) — closed-loop digital stored value (internal field names still use kori*).
 * Not cryptocurrency. No blockchain. Universal across K21 countries.
 *
 * Display: **C̶** — C with a horizontal stroke (Cauris), never plain C, ₭, or K.
 */
import { countryConfig as marketCountryConfig, RESERVE_XOF_PER_CAURIS } from './currency-registry.js';

/** C + U+0336 COMBINING LONG STROKE OVERLAY — line through the middle of C */
export const CAURIS_SYMBOL = 'C\u0336';
/** @deprecated use CAURIS_SYMBOL — kept for existing imports */
export const KORI_SYMBOL = CAURIS_SYMBOL;
export const KORI_COLOR = '#1af060';
export const CONVERSION_FEE_BPS = 200; // 2%
export const RESERVE_XOF_PER_KORI = RESERVE_XOF_PER_CAURIS;
export const KORI_EARN = {
    send: 2,
    pay_merchant: 5,
    refer_friend: 50,
    delivery: 10,
    onboard_merchant: 100,
};
export function countryFromPhone(phone) {
    const normalized = phone.replace(/\s/g, '');
    if (normalized.startsWith('+234') || normalized.startsWith('234'))
        return 'NG';
    if (normalized.startsWith('+233') || normalized.startsWith('233'))
        return 'GH';
    if (normalized.startsWith('+220') || normalized.startsWith('220'))
        return 'GM';
    return 'SN';
}
export function countryConfig(country) {
    return marketCountryConfig(country);
}
/** National deposit → Cauris minted (e.g. 10,000 XOF → 1,000 C) */
export function nationalToKori(nationalAmount, country) {
    const { nationalPerKori } = countryConfig(country);
    return Math.floor(nationalAmount / nationalPerKori);
}
/** Cauris → national before fee (e.g. 1,000 C → 10,000 XOF) */
export function koriToNational(koriAmount, country) {
    const { nationalPerKori } = countryConfig(country);
    return koriAmount * nationalPerKori;
}
/** Apply 2% conversion fee; returns net national credited */
export function koriToNationalAfterFee(koriAmount, country) {
    const grossNational = koriToNational(koriAmount, country);
    const feeNational = Math.floor((grossNational * CONVERSION_FEE_BPS) / 10000);
    return { grossNational, feeNational, netNational: grossNational - feeNational };
}
export function formatKori(amount) {
    const n = Number(amount) || 0;
    const formatted = n.toLocaleString('fr-FR').replace(/\s/g, ' ');
    return `${CAURIS_SYMBOL} ${formatted}`;
}
/** Alias — prefer this name in new UI code. */
export const formatCauris = formatKori;
/** Primary wallet view — spendable balance is always Cauris (C). */
export function walletShape(wallet, country = 'SN') {
    const kori = wallet.koriBalance ?? 0;
    return {
        balance: kori,
        koriBalance: kori,
        nationalEquivalent: koriToNational(kori, country),
        currency: 'CAURIS',
        unit: CAURIS_SYMBOL,
        kori: {
            balance: kori,
            symbol: CAURIS_SYMBOL,
            formatted: formatKori(kori),
            color: KORI_COLOR,
        },
        cauris: {
            balance: kori,
            symbol: CAURIS_SYMBOL,
            formatted: formatKori(kori),
            color: KORI_COLOR,
        },
        legacyNationalBalance: wallet.balance ?? 0,
    };
}

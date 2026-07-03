/**
 * Kori (₭) — closed-loop digital stored value instrument.
 * Not cryptocurrency. No blockchain. Universal across K21 countries.
 *
 * Regulatory: no separate BCEAO license needed for Kori under stored-value
 * instrument rules. National currency rails use licensed partners (Julaya,
 * Pawapay, etc.) — see lib/regulatory.ts.
 *
 * Exchange rates (national currency per 1 Kori):
 * - WAEMU / XOF (Senegal + all 8 WAEMU countries): ₭1 = 10 XOF
 * - Nigeria (NGN): ₭1 = 10 NGN
 * - Ghana (GHS): ₭1 = 1 GHS
 *
 * Phase 2 WAEMU: same ₭ mechanics, shared XOF — no intra-bloc rate complexity.
 * Phase 3 cross-bloc: ₭ sends are universal; national conversion is internal.
 */
export const KORI_SYMBOL = '₭';
export const KORI_COLOR = '#1af060';
export const CONVERSION_FEE_BPS = 200; // 2%
export const RESERVE_XOF_PER_KORI = 10;
export const KORI_EARN = {
    send: 2,
    pay_merchant: 5,
    refer_friend: 50,
    delivery: 10,
    onboard_merchant: 100,
};
const COUNTRY_CONFIG = {
    SN: { currency: 'XOF', nationalPerKori: 10 },
    BJ: { currency: 'XOF', nationalPerKori: 10 },
    BF: { currency: 'XOF', nationalPerKori: 10 },
    CI: { currency: 'XOF', nationalPerKori: 10 },
    GW: { currency: 'XOF', nationalPerKori: 10 },
    ML: { currency: 'XOF', nationalPerKori: 10 },
    NE: { currency: 'XOF', nationalPerKori: 10 },
    TG: { currency: 'XOF', nationalPerKori: 10 },
    NG: { currency: 'NGN', nationalPerKori: 10 },
    GH: { currency: 'GHS', nationalPerKori: 1 },
    GM: { currency: 'GMD', nationalPerKori: 10 },
};
export function countryFromPhone(phone) {
    const normalized = phone.replace(/\s/g, '');
    if (normalized.startsWith('+234') || normalized.startsWith('234'))
        return 'NG';
    if (normalized.startsWith('+233') || normalized.startsWith('233'))
        return 'GH';
    if (normalized.startsWith('+220') || normalized.startsWith('220'))
        return 'GM';
    // Phase 1 default: Senegal (+221). Other WAEMU prefixes map in Phase 2.
    return 'SN';
}
export function countryConfig(country) {
    return COUNTRY_CONFIG[country ?? 'SN'] ?? COUNTRY_CONFIG.SN;
}
/** National deposit → Kori minted (e.g. 10,000 XOF → 1,000 ₭) */
export function nationalToKori(nationalAmount, country) {
    const { nationalPerKori } = countryConfig(country);
    return Math.floor(nationalAmount / nationalPerKori);
}
/** Kori → national before fee (e.g. 1,000 ₭ → 10,000 XOF) */
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
    const formatted = amount.toLocaleString('fr-FR').replace(/\s/g, ' ');
    return `${KORI_SYMBOL}${formatted}`;
}
export function walletShape(wallet) {
    return {
        balance: wallet.balance,
        nationalBalance: wallet.balance,
        koriBalance: wallet.koriBalance,
        currency: wallet.currency,
        kori: {
            balance: wallet.koriBalance,
            symbol: KORI_SYMBOL,
            formatted: formatKori(wallet.koriBalance),
            color: KORI_COLOR,
        },
    };
}

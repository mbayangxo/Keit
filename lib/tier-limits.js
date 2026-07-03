/** Verification tiers and wallet / activity limits (XOF + Kori). */

export const TIER_LIMITS = {
  1: {
    label: 'Tier 1 — téléphone',
    maxNationalBalance: 50_000,
    maxKoriBalance: 5_000,
    maxSendPerDay: 10_000,
    maxCashOutPerDay: 0,
    canCashOut: false,
    canInternational: false,
    canCreateBusiness: false,
  },
  2: {
    label: 'Tier 2 — CNI vérifiée',
    maxNationalBalance: 2_000_000,
    maxKoriBalance: 200_000,
    maxSendPerDay: null,
    maxCashOutPerDay: 500_000,
    canCashOut: true,
    canInternational: true,
    canCreateBusiness: false,
  },
  3: {
    label: 'Tier 3 — adresse vérifiée',
    maxNationalBalance: 10_000_000,
    maxKoriBalance: 1_000_000,
    maxSendPerDay: null,
    maxCashOutPerDay: 2_000_000,
    canCashOut: true,
    canInternational: true,
    canCreateBusiness: true,
  },
};

export function limitsForTier(tier) {
  return TIER_LIMITS[tier] ?? TIER_LIMITS[1];
}

export function effectiveTier(user) {
  if (user.verificationTier >= 3 && user.addressVerifiedAt) return 3;
  if (user.verificationTier >= 2 && user.cniVerifiedAt) return 2;
  return 1;
}

export function tierShape(user) {
  const tier = effectiveTier(user);
  const limits = limitsForTier(tier);
  return {
    tier,
    verificationStatus: user.verificationStatus,
    cniVerifiedAt: user.cniVerifiedAt?.toISOString() ?? null,
    addressVerifiedAt: user.addressVerifiedAt?.toISOString() ?? null,
    limits: {
      maxNationalBalance: limits.maxNationalBalance,
      maxKoriBalance: limits.maxKoriBalance,
      maxSendPerDay: limits.maxSendPerDay,
      maxCashOutPerDay: limits.maxCashOutPerDay,
      canCashOut: limits.canCashOut,
      canInternational: limits.canInternational,
      canCreateBusiness: limits.canCreateBusiness,
    },
  };
}

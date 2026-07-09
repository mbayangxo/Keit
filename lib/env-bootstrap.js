/**
 * Vercel dashboard sometimes stores env keys in lowercase. Node expects canonical
 * UPPER_SNAKE names (DATABASE_URL, JWT_ACCESS_SECRET, …). Map aliases once at boot.
 */
const ALIASES = [
  ['DATABASE_URL', 'database_url'],
  ['JWT_ACCESS_SECRET', 'jwt_access_secret'],
  ['JWT_REFRESH_SECRET', 'jwt_refresh_secret'],
  ['DATA_ENCRYPTION_KEY', 'data_encryption_key'],
  ['CRON_SECRET', 'cron_secret'],
  ['EXPO_PUBLIC_API_URL', 'expo_public_api_url'],
  ['ALLOW_BETA_OTP', 'allow_beta_otp'],
  ['EXPO_PUBLIC_ALLOW_BETA_OTP', 'expo_public_allow_beta_otp'],
  ['RESEND_API_KEY', 'resend_api_key'],
  ['RESEND_FROM', 'resend_from'],
  ['ALLOW_BETA_DEPOSITS', 'allow_beta_deposits'],
  ['EXPO_PUBLIC_ALLOW_BETA_DEPOSITS', 'expo_public_allow_beta_deposits'],
  ['BETA_DEPOSIT_MAX', 'beta_deposit_max'],
  ['SENTRY_DSN', 'sentry_dsn'],
];

export function bootstrapEnv() {
  for (const [canonical, alias] of ALIASES) {
    if (!process.env[canonical]?.trim() && process.env[alias]?.trim()) {
      process.env[canonical] = process.env[alias].trim();
    }
  }
}

// Side-effect import: api handlers load this before Prisma.
bootstrapEnv();

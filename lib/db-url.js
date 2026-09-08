/**
 * Normalize Postgres URLs for Prisma dev proxy and Supabase poolers.
 * Without pgbouncer=true, pooled connections error with
 * "prepared statement already exists" under concurrent use.
 */
export function normalizeDatabaseUrl(raw) {
  if (!raw?.trim()) return raw;

  try {
    const url = new URL(raw.trim());
    const isLocalPrismaDev =
      /localhost|127\.0\.0\.1/i.test(url.hostname) && /^5121[0-9]$/.test(url.port);
    const isSupabasePooler = url.port === '6543';

    if (isLocalPrismaDev || isSupabasePooler) {
      url.searchParams.set('pgbouncer', 'true');
    }
    if (isLocalPrismaDev) {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '20');
      }
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '120');
      }
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'disable');
      }
    }
    if (process.env.VERCEL) {
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
      }
      if (!url.searchParams.has('sslmode')) {
        url.searchParams.set('sslmode', 'require');
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}

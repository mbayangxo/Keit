/** Shared auth for scheduled jobs (Vercel Cron, Supabase pg_cron, Edge Functions). */

export function assertCronAuth(req, res) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function cronApiBaseUrl() {
  return (
    process.env.CRON_API_URL?.replace(/\/$/, '') ??
    process.env.VERCEL_URL?.replace(/\/$/, '') ??
    'http://localhost:3000'
  );
}

# K21 Supabase scheduled jobs

K21's cron **business logic** lives in `lib/cron/` and runs via `/api/cron/*` on Vercel. Supabase can trigger the same jobs in two ways:

## Option A — pg_cron + pg_net (recommended)

1. Enable extensions: `pg_cron`, `pg_net`
2. Run migrations (in order):
   - `supabase/migrations/20260703000000_pg_cron_schedules.sql` (jobs 1–8)
   - `supabase/migrations/20260817190000_add_agent_monthly_payout_cron.sql` (only if you applied an older 7-job version)
3. Set database settings:

```sql
ALTER DATABASE postgres SET app.cron_api_url = 'https://your-app.vercel.app';
ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret';
```

Verify:

```sql
SELECT jobname, schedule FROM cron.job ORDER BY jobname;
-- Expect 8 rows including agent_monthly_payout
```

## Option B — Supabase Edge Functions

Deploy the shared proxy (set `CRON_JOB_NAME` per function or pass job in path):

```bash
supabase functions deploy cron-proxy
```

Set secrets: `CRON_API_URL`, `CRON_SECRET`, optional `CRON_JOB_NAME`.

## pg_cron job schedule (UTC)

| Job | Schedule | Endpoint |
|-----|----------|----------|
| financial_integrity_check | `0 * * * *` | `/api/cron/financial-integrity` |
| pending_transaction_resolver | `*/5 * * * *` | `/api/cron/pending-transactions` |
| fraud_monitor | `*/15 * * * *` | `/api/cron/fraud-monitor` |
| tontine_processor | `0 7 * * *` (08:00 WAT) | `/api/cron/tontine-processor` |
| rider_status_updater | `*/10 * * * *` | `/api/cron/rider-status` |
| daily_financial_report | `0 23 * * *` (00:00 WAT) | `/api/cron/daily-financial-report` |
| delivery_auto_release | `*/30 * * * *` | `/api/cron/delivery-auto-release` |
| agent_monthly_payout | `0 7 1 * *` (08:00 WAT, 1st of month) | `/api/cron/agent-monthly-payout` |

All requests require `Authorization: Bearer $CRON_SECRET`.

## Vercel Cron (separate from pg_cron)

These are defined in `vercel.json` and **do not** appear in `cron.job`:

| Path | Schedule (UTC) | Role |
|------|----------------|------|
| `/api/cron/daily` | `0 6 * * *` | Runs a batch of daily jobs (includes agent payout gate on the 1st) |
| `/api/cron/scheduled-payments` | `0 * * * *` | Auto-save / scheduled payment runs |

On Hobby/single-cron plans, pg_cron fills gaps (5‑min pending tx, hourly integrity, etc.). Keep both systems in mind when changing hosting.

## Env vars

- `CRON_SECRET` — required in production
- `CRON_API_URL` — base URL for pg_cron / edge functions
- `ADMIN_USER_ID` — optional; receives integrity + daily report alerts

Reports and alerts are written to the `SecureLog` table.

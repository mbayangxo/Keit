# K21 Supabase scheduled jobs

K21's cron **business logic** lives in `lib/cron/` and runs via `/api/cron/*` on Vercel. Supabase can trigger the same jobs in two ways:

## Option A — pg_cron + pg_net (recommended)

1. Enable extensions: `pg_cron`, `pg_net`
2. Run migration: `supabase/migrations/20260703000000_pg_cron_schedules.sql`
3. Set database settings:

```sql
ALTER DATABASE postgres SET app.cron_api_url = 'https://your-app.vercel.app';
ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret';
```

## Option B — Supabase Edge Functions

Deploy the shared proxy (set `CRON_JOB_NAME` per function or pass job in path):

```bash
supabase functions deploy cron-proxy
```

Set secrets: `CRON_API_URL`, `CRON_SECRET`, optional `CRON_JOB_NAME`.

## Job schedule (UTC)

| Job | Schedule | Endpoint |
|-----|----------|----------|
| financial_integrity_check | `0 * * * *` | `/api/cron/financial-integrity` |
| pending_transaction_resolver | `*/5 * * * *` | `/api/cron/pending-transactions` |
| fraud_monitor | `*/15 * * * *` | `/api/cron/fraud-monitor` |
| tontine_processor | `0 7 * * *` (08:00 WAT) | `/api/cron/tontine-processor` |
| rider_status_updater | `*/10 * * * *` | `/api/cron/rider-status` |
| daily_financial_report | `0 23 * * *` (00:00 WAT) | `/api/cron/daily-financial-report` |
| delivery_auto_release | `*/30 * * * *` | `/api/cron/delivery-auto-release` |

All requests require `Authorization: Bearer $CRON_SECRET`.

## Env vars

- `CRON_SECRET` — required in production
- `CRON_API_URL` — base URL for pg_cron / edge functions
- `ADMIN_USER_ID` — optional; receives integrity + daily report alerts

Reports and alerts are written to the `SecureLog` table.

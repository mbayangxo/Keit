-- K21 scheduled jobs via pg_cron + pg_net
-- Invokes Vercel /api/cron/* endpoints (same logic as Supabase Edge Functions).
--
-- Prerequisites (Supabase dashboard → Database → Extensions):
--   pg_cron, pg_net
--
-- Before running, set secrets (Supabase SQL editor):
--   ALTER DATABASE postgres SET app.cron_api_url = 'https://your-app.vercel.app';
--   ALTER DATABASE postgres SET app.cron_secret = 'your-cron-secret';

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper: POST to a cron endpoint with Bearer auth
CREATE OR REPLACE FUNCTION k21_invoke_cron(job_path text)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  base_url text;
  secret text;
  request_id bigint;
BEGIN
  base_url := current_setting('app.cron_api_url', true);
  secret := current_setting('app.cron_secret', true);
  IF base_url IS NULL OR secret IS NULL THEN
    RAISE WARNING 'k21_invoke_cron: app.cron_api_url or app.cron_secret not set';
    RETURN NULL;
  END IF;

  SELECT net.http_post(
    url := base_url || job_path,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    body := '{}'::jsonb
  ) INTO request_id;

  RETURN request_id;
END;
$$;

-- 1. financial_integrity_check — hourly
SELECT cron.schedule(
  'financial_integrity_check',
  '0 * * * *',
  $$SELECT k21_invoke_cron('/api/cron/financial-integrity');$$
);

-- 2. pending_transaction_resolver — every 5 minutes
SELECT cron.schedule(
  'pending_transaction_resolver',
  '*/5 * * * *',
  $$SELECT k21_invoke_cron('/api/cron/pending-transactions');$$
);

-- 3. fraud_monitor — every 15 minutes
SELECT cron.schedule(
  'fraud_monitor',
  '*/15 * * * *',
  $$SELECT k21_invoke_cron('/api/cron/fraud-monitor');$$
);

-- 4. tontine_processor — daily 08:00 WAT (07:00 UTC)
SELECT cron.schedule(
  'tontine_processor',
  '0 7 * * *',
  $$SELECT k21_invoke_cron('/api/cron/tontine-processor');$$
);

-- 5. rider_status_updater — every 10 minutes
SELECT cron.schedule(
  'rider_status_updater',
  '*/10 * * * *',
  $$SELECT k21_invoke_cron('/api/cron/rider-status');$$
);

-- 6. daily_financial_report — daily 00:00 WAT (23:00 UTC)
SELECT cron.schedule(
  'daily_financial_report',
  '0 23 * * *',
  $$SELECT k21_invoke_cron('/api/cron/daily-financial-report');$$
);

-- 7. delivery_auto_release — every 30 minutes
SELECT cron.schedule(
  'delivery_auto_release',
  '*/30 * * * *',
  $$SELECT k21_invoke_cron('/api/cron/delivery-auto-release');$$
);

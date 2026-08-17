-- Add agent monthly payout as pg_cron job #8 (for projects that already ran the 7-job migration).
-- Pays active agents on the 1st of each month; handler skips other days if called early.
-- Requires k21_invoke_cron from 20260703000000_pg_cron_schedules.sql.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'agent_monthly_payout') THEN
    PERFORM cron.unschedule('agent_monthly_payout');
  END IF;
END $$;

-- 1st of month, 08:00 WAT (07:00 UTC) — same window as tontine_processor
SELECT cron.schedule(
  'agent_monthly_payout',
  '0 7 1 * *',
  $$SELECT k21_invoke_cron('/api/cron/agent-monthly-payout');$$
);

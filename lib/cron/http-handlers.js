import { assertCronAuth } from '../cron-auth.js';
import { runFinancialIntegrityCheck } from './financial-integrity.js';
import { runPendingTransactionResolver } from './pending-transactions.js';
import { runFraudMonitor } from './fraud-monitor.js';
import { runTontineProcessor } from './tontine-processor.js';
import { runRiderStatusUpdater } from './rider-status.js';
import { runDailyFinancialReport } from './daily-financial-report.js';
import { runDeliveryAutoRelease } from './delivery-auto-release.js';

function cronHandler(runner) {
  return async (req, res) => {
    if (!assertCronAuth(req, res)) return;
    try {
      const result = await runner();
      res.json(result);
    } catch (error) {
      console.error('[CRON]', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Cron job failed',
      });
    }
  };
}

export const cronFinancialIntegrity = cronHandler(runFinancialIntegrityCheck);
export const cronPendingTransactions = cronHandler(runPendingTransactionResolver);
export const cronFraudMonitor = cronHandler(runFraudMonitor);
export const cronTontineProcessor = cronHandler(runTontineProcessor);
export const cronRiderStatus = cronHandler(runRiderStatusUpdater);
export const cronDailyFinancialReport = cronHandler(runDailyFinancialReport);
export const cronDeliveryAutoRelease = cronHandler(runDeliveryAutoRelease);

/** @deprecated use cronFinancialIntegrity */
export const cronKoriReconcile = cronFinancialIntegrity;

/** @deprecated use cronDeliveryAutoRelease */
export const cronDeliveriesAutoRelease = cronDeliveryAutoRelease;

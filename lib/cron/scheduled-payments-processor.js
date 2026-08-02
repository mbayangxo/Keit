/**
 * Cron: execute due user scheduled payments (recurring sends + dedicated funds).
 */

import { prisma } from '../prisma.js';
import { runDueScheduledPayments } from '../scheduled-payment-service.js';

export async function runScheduledPaymentsCron(db = prisma) {
  const results = await runDueScheduledPayments(db, { limit: 500 });
  const ok = results.filter((r) => r.status === 'ok').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  if (failed > 0) {
    console.warn('[CRON scheduled_payments]', { ok, failed, sample: results.filter((r) => r.status === 'failed').slice(0, 5) });
  }

  return {
    processed: results.length,
    ok,
    failed,
    results: results.slice(0, 50),
  };
}

/**
 * Cron: monthly agent payouts (flat fee + volume bonus).
 * Runs on the 1st of each month via daily cron gate.
 */

import { runAgentMonthlyPayouts } from '../agent-payout-service.js';

export async function runAgentMonthlyPayoutCron(now = new Date()) {
  if (now.getUTCDate() !== 1) {
    return { skipped: true, reason: 'not_first_of_month' };
  }
  return runAgentMonthlyPayouts(undefined, now);
}

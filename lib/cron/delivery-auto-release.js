import { processAutoReleases, processDisputeDeadlines } from '../delivery-service.js';
import { prisma } from '../prisma.js';

/**
 * Every 30 min: auto-release delivery escrow when customer has not confirmed
 * within 30 minutes of rider marking delivered (autoReleaseAt).
 */
export async function runDeliveryAutoRelease(db = prisma) {
  const releases = await processAutoReleases(db);
  const disputes = await processDisputeDeadlines(db);
  return {
    job: 'delivery_auto_release',
    releases,
    disputes,
    ranAt: new Date().toISOString(),
  };
}

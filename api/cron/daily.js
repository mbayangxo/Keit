import { createHandler } from '../_lib/http.js';
import { cronDailyAll } from '../../lib/cron/http-handlers.js';

/** Vercel Hobby: single daily cron runs all jobs (see api-disabled/cron/ for per-job routes). */
export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: cronDailyAll,
});

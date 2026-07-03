import { createHandler } from '../_lib/http.js';
import { cronPendingTransactions } from '../../lib/cron/http-handlers.js';

export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: cronPendingTransactions,
});

import { createHandler } from '../_lib/http.js';
import { cronFraudMonitor } from '../../lib/cron/http-handlers.js';

export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: cronFraudMonitor,
});

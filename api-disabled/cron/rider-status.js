import { createHandler } from '../../api/_lib/http.js';
import { cronRiderStatus } from '../../lib/cron/http-handlers.js';

export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: cronRiderStatus,
});

import { createHandler } from '../_lib/http.js';
import { cronDeliveryAutoRelease } from '../../lib/cron/http-handlers.js';

export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: cronDeliveryAutoRelease,
});

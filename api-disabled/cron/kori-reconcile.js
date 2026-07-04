import { createHandler } from '../../api/_lib/http.js';
import { cronKoriReconcile } from '../../lib/cron/http-handlers.js';

export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: cronKoriReconcile,
});

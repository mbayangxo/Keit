import { createHandler } from '../../api/_lib/http.js';
import { kycPurgeCron } from '../../lib/handlers.js';

export default createHandler({
  methods: ['GET', 'POST'],
  auth: false,
  skipRateLimit: true,
  handler: kycPurgeCron,
});

import { createHandler, readJson } from '../../api/_lib/http.js';
import { kycStatus } from '../../lib/handlers.js';

export default createHandler({
  methods: ['GET'],
  auth: true,
  handler: kycStatus,
});

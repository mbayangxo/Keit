import { createHandler } from './_lib/http.js';
import { apiPathSegments } from './_lib/path.js';
import { dispatchApi, prepareApiBody } from '../lib/api-router.js';

/** Single Vercel entry — all /api/* traffic is rewritten here (see vercel.json). */
export default createHandler({
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  auth: false,
  skipRateLimit: true,
  handler: async (req, res) => {
    await prepareApiBody(req);
    return dispatchApi(req, res, apiPathSegments(req));
  },
});

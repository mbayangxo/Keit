import { createHandler } from './_lib/http.js';
import { dispatchApi, prepareApiBody } from '../lib/api-router.js';

export default createHandler({
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  auth: false,
  skipRateLimit: true,
  handler: async (req, res) => {
    await prepareApiBody(req);
    const segments = req.query.path;
    return dispatchApi(req, res, segments);
  },
});

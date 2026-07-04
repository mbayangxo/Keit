import { createHandler, readJson } from '../../api/_lib/http.js';
import { smsPreferencesGet, smsPreferencesUpdate } from '../../lib/handlers.js';

export default createHandler({
  methods: ['GET', 'PATCH'],
  auth: true,
  handler: async (req, res) => {
    if (req.method === 'GET') return smsPreferencesGet(req, res);
    req.body = await readJson(req);
    return smsPreferencesUpdate(req, res);
  },
});

import { createHandler, readJson } from '../../_lib/http.js';
import { webhooksKycSumsub } from '../../../lib/handlers.js';

export default createHandler({
  methods: ['POST'],
  auth: false,
  skipRateLimit: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return webhooksKycSumsub(req, res);
  },
});

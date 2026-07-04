import { createHandler, readJson } from '../../_lib/http.js';
import { webhooksKycSmile } from '../../../lib/handlers.js';

export default createHandler({
  methods: ['POST'],
  auth: false,
  skipRateLimit: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return webhooksKycSmile(req, res);
  },
});

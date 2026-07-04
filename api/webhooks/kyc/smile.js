import { createHandler } from '../../_lib/http.js';
import { webhooksKycSmile } from '../../../lib/handlers.js';

export const config = { api: { bodyParser: false } };

export default createHandler({
  methods: ['POST'],
  auth: false,
  skipRateLimit: true,
  handler: async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = Buffer.concat(chunks).toString('utf8');
    return webhooksKycSmile(req, res);
  },
});

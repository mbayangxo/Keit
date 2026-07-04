import { createHandler } from '../../../api/_lib/http.js';
import { webhooksSmsInbound } from '../../../lib/handlers.js';

export const config = { api: { bodyParser: false } };

export default createHandler({
  methods: ['POST'],
  auth: false,
  skipRateLimit: true,
  handler: async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf8');
    const contentType = req.headers['content-type'] ?? '';
    if (contentType.includes('application/json')) {
      try {
        req.body = JSON.parse(raw || '{}');
      } catch {
        req.body = {};
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      req.body = Object.fromEntries(new URLSearchParams(raw).entries());
    } else {
      req.body = raw;
    }
    return webhooksSmsInbound(req, res);
  },
});

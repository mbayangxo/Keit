import { createHandler } from '../_lib/http.js';
import { webhooksJulaya } from '../../lib/handlers.js';

export const config = { api: { bodyParser: false } };

export default createHandler({
  methods: ['POST'],
  auth: false,
  handler: async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    req.body = Buffer.concat(chunks).toString('utf8');
    return webhooksJulaya(req, res);
  },
});

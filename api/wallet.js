import { createHandler, readJson } from './_lib/http.js';
import { getWallet } from '../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return getWallet(req, res);
  },
});

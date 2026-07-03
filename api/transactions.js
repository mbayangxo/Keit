import { createHandler, readJson } from './_lib/http.js';
import { getTransactions } from '../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return getTransactions(req, res);
  },
});

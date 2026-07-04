import { createHandler, readJson } from '../../api/_lib/http.js';
import { cashTransactions } from '../../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return cashTransactions(req, res);
  },
});

import { createHandler, readJson } from '../../api/_lib/http.js';
import { koriTransactions } from '../../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return koriTransactions(req, res);
  },
});

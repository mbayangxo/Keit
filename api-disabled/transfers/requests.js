import { createHandler, readJson } from '../../api/_lib/http.js';
import { transfersRequestsList } from '../../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return transfersRequestsList(req, res);
  },
});

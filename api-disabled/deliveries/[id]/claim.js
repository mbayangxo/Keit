import { createHandler, readJson } from '../../../api/_lib/http.js';
import { deliveriesClaim } from '../../../lib/handlers.js';

export default createHandler({
  methods: ["POST"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return deliveriesClaim(req, res);
  },
});

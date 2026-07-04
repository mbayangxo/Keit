import { createHandler, readJson } from '../_lib/http.js';
import { cashIn } from '../../lib/handlers.js';

export default createHandler({
  methods: ["POST"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return cashIn(req, res);
  },
});

import { createHandler, readJson } from '../_lib/http.js';
import { authRefresh } from '../../lib/handlers.js';

export default createHandler({
  methods: ["POST"],
  auth: false,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return authRefresh(req, res);
  },
});

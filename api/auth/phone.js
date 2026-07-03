import { createHandler, readJson } from '../_lib/http.js';
import { authPhone } from '../../lib/handlers.js';

export default createHandler({
  methods: ["POST"],
  auth: false,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return authPhone(req, res);
  },
});

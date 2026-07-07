import { createHandler, readJson } from '../_lib/http.js';
import { authVerify } from '../../lib/handlers.js';

export default createHandler({
  methods: ["POST"],
  auth: false,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return authVerify(req, res);
  },
});

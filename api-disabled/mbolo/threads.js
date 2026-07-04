import { createHandler, readJson } from '../_lib/http.js';
import { mboloThreads } from '../../lib/handlers.js';

export default createHandler({
  methods: ["GET","POST"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return mboloThreads(req, res);
  },
});

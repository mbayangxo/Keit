import { createHandler, readJson } from '../api/_lib/http.js';
import { events } from '../lib/handlers.js';

export default createHandler({
  methods: ["GET","POST"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return events(req, res);
  },
});

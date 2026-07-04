import { createHandler, readJson } from '../api/_lib/http.js';
import { notificationsList } from '../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return notificationsList(req, res);
  },
});

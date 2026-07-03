import { createHandler, readJson } from './_lib/http.js';
import { health } from '../lib/handlers.js';

export default createHandler({
  methods: ["GET"],
  auth: false,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return health(req, res);
  },
});

import { createHandler, readJson } from '../_lib/http.js';
import { kycCniSubmit } from '../../lib/handlers.js';

export default createHandler({
  methods: ['POST'],
  auth: true,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return kycCniSubmit(req, res);
  },
});

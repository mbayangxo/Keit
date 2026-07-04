import { adminAuthVerify2fa } from '../../../lib/admin-handlers.js';
import { createAdminHandler, readJson } from '../../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST'],
  auth: false,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return adminAuthVerify2fa(req, res);
  },
});

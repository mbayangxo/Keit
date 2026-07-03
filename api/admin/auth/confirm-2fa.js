import { adminAuthConfirm2fa } from '../../../lib/admin-handlers.js';
import { createAdminHandler, readJson } from '../../_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST'],
  auth: false,
  handler: async (req, res) => {
    req.body = await readJson(req);
    return adminAuthConfirm2fa(req, res);
  },
});

import { adminIssueRefund } from '../../lib/admin-handlers.js';
import { createAdminHandler, readJson } from '../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST'],
  handler: async (req, res) => {
    req.body = await readJson(req);
    return adminIssueRefund(req, res);
  },
});

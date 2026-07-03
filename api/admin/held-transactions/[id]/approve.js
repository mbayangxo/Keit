import { adminHeldTransactionApprove } from '../../../../lib/admin-handlers.js';
import { createAdminHandler, readJson, routeParam } from '../../../_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST'],
  handler: async (req, res) => {
    req.query = { ...req.query, id: routeParam(req, 'id') };
    req.body = await readJson(req);
    return adminHeldTransactionApprove(req, res);
  },
});

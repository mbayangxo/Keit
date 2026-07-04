import { adminTransactionDetail } from '../../../lib/admin-handlers.js';
import { createAdminHandler, routeParam } from '../../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['GET'],
  handler: async (req, res) => {
    req.query = { ...req.query, id: routeParam(req, 'id') };
    return adminTransactionDetail(req, res);
  },
});

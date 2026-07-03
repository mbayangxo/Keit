import { adminFraudAlertAck } from '../../../../lib/admin-handlers.js';
import { createAdminHandler, routeParam } from '../../../_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST'],
  handler: async (req, res) => {
    req.query = { ...req.query, id: routeParam(req, 'id') };
    return adminFraudAlertAck(req, res);
  },
});

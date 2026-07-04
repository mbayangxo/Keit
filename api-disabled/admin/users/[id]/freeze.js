import { adminFreezeUser, adminUnfreezeUser } from '../../../../lib/admin-handlers.js';
import { createAdminHandler, readJson, routeParam } from '../../../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST', 'DELETE'],
  handler: async (req, res) => {
    req.query = { ...req.query, id: routeParam(req, 'id') };
    if (req.method === 'DELETE') return adminUnfreezeUser(req, res);
    req.body = await readJson(req);
    return adminFreezeUser(req, res);
  },
});

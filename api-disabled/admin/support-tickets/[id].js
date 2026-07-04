import {
  adminSupportTicketGet,
  adminSupportTicketPatch,
  adminSupportTicketReply,
} from '../../../lib/admin-handlers.js';
import { createAdminHandler, readJson, routeParam } from '../../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['GET', 'POST', 'PATCH'],
  handler: async (req, res) => {
    req.query = { ...req.query, id: routeParam(req, 'id') };
    if (req.method === 'GET') return adminSupportTicketGet(req, res);
    req.body = await readJson(req);
    if (req.method === 'POST') return adminSupportTicketReply(req, res);
    return adminSupportTicketPatch(req, res);
  },
});

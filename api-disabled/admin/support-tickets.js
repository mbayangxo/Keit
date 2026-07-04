import { adminSupportTicketsList } from '../../lib/admin-handlers.js';
import { createAdminHandler } from '../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['GET'],
  handler: adminSupportTicketsList,
});

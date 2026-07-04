import { adminAuthLogout } from '../../../lib/admin-handlers.js';
import { createAdminHandler } from '../../../api/_lib/admin-http.js';

export default createAdminHandler({
  methods: ['POST'],
  auth: false,
  handler: adminAuthLogout,
});

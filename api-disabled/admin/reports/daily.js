import { adminDailyReportExport, adminDailyReports } from '../../../lib/admin-handlers.js';
import { createAdminHandler } from '../../_lib/admin-http.js';

export default createAdminHandler({
  methods: ['GET'],
  handler: async (req, res) => {
    if (req.query.export === '1' || req.query.format) {
      return adminDailyReportExport(req, res);
    }
    return adminDailyReports(req, res);
  },
});

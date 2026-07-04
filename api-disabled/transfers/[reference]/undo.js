import { transferUndo } from '../../../lib/handlers.js';
import { createHandler, routeParam } from '../../../api/_lib/http.js';

export default createHandler({
  methods: ['POST'],
  auth: true,
  handler: async (req, res) => {
    req.query = { ...req.query, reference: routeParam(req, 'reference') };
    return transferUndo(req, res);
  },
});

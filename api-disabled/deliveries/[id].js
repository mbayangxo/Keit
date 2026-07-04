import { createHandler } from '../../api/_lib/http.js';
import { deliveryDetail } from '../../lib/handlers.js';

export default createHandler({
  methods: ['GET'],
  auth: true,
  handler: deliveryDetail,
});

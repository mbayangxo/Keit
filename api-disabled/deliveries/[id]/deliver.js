import { createHandler } from '../../../api/_lib/http.js';
import { deliveriesDeliver } from '../../../lib/handlers.js';

export default createHandler({
  methods: ['POST'],
  auth: true,
  handler: deliveriesDeliver,
});

import { createHandler } from '../../_lib/http.js';
import { deliveriesPickup } from '../../../lib/handlers.js';

export default createHandler({
  methods: ['POST'],
  auth: true,
  handler: deliveriesPickup,
});

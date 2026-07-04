import { createHandler } from '../../_lib/http.js';
import { deliveriesConfirm } from '../../../lib/handlers.js';

export default createHandler({
  methods: ['POST'],
  auth: true,
  handler: deliveriesConfirm,
});

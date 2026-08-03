import { getInviteShareForUser } from './invite-service.js';

export async function inviteShare(req, res) {
  const payload = await getInviteShareForUser(req.userId);
  res.json(payload);
}

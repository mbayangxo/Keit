import { purgeExpiredMessages, purgeExpiredStories } from '../mbolo-stories-service.js';

export async function cronMboloEphemeral(db = undefined) {
  const prisma = db ?? (await import('../prisma.js')).prisma;
  const [messages, stories] = await Promise.all([
    purgeExpiredMessages(prisma),
    purgeExpiredStories(prisma),
  ]);
  return { messages, stories };
}

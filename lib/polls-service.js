import { prisma } from './prisma.js';

/**
 * Profile polls — a member asks one question ("Sortie plage ou concert ?"),
 * friends vote on their profile. One active poll per user; asking a new
 * question closes the old one. Results are pure vote counts, never seeded.
 */

export class PollError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function askPoll(userId, { question, options } = {}) {
  const q = String(question ?? '').trim();
  if (q.length < 3 || q.length > 120) {
    throw new PollError('invalid_question', 'Question invalide (3–120 caractères).');
  }
  const opts = (Array.isArray(options) ? options : [])
    .map((o) => String(o ?? '').trim())
    .filter(Boolean);
  if (opts.length < 2 || opts.length > 4) {
    throw new PollError('invalid_options', 'Il faut 2 à 4 choix.');
  }
  if (opts.some((o) => o.length > 40)) {
    throw new PollError('option_too_long', 'Chaque choix fait 40 caractères max.');
  }

  return prisma.$transaction(async (tx) => {
    await tx.userPoll.updateMany({ where: { userId, active: true }, data: { active: false } });
    return tx.userPoll.create({ data: { userId, question: q, options: opts } });
  });
}

export async function closePoll(userId) {
  await prisma.userPoll.updateMany({ where: { userId, active: true }, data: { active: false } });
}

export async function votePoll(voterId, pollId, optionIx) {
  const poll = await prisma.userPoll.findUnique({ where: { id: String(pollId ?? '') } });
  if (!poll || !poll.active) throw new PollError('poll_not_found', 'Sondage introuvable ou fermé.', 404);
  const ix = Number(optionIx);
  const optionCount = Array.isArray(poll.options) ? poll.options.length : 0;
  if (!Number.isInteger(ix) || ix < 0 || ix >= optionCount) {
    throw new PollError('invalid_option', 'Choix invalide.');
  }
  if (poll.userId === voterId) {
    throw new PollError('own_poll', 'Tu ne peux pas voter sur ton propre sondage.', 403);
  }
  await prisma.userPollVote.upsert({
    where: { pollId_userId: { pollId: poll.id, userId: voterId } },
    create: { pollId: poll.id, userId: voterId, optionIx: ix },
    update: { optionIx: ix },
  });
  return poll;
}

/** Active poll for a user with real counts + the viewer's own vote. */
export async function activePollShape(ownerId, viewerId) {
  const poll = await prisma.userPoll.findFirst({
    where: { userId: ownerId, active: true },
    orderBy: { createdAt: 'desc' },
  });
  if (!poll) return null;

  const [grouped, myVote] = await Promise.all([
    prisma.userPollVote.groupBy({
      by: ['optionIx'],
      where: { pollId: poll.id },
      _count: true,
    }),
    viewerId
      ? prisma.userPollVote.findUnique({ where: { pollId_userId: { pollId: poll.id, userId: viewerId } } })
      : null,
  ]);

  const counts = new Map(grouped.map((g) => [g.optionIx, g._count]));
  const options = (Array.isArray(poll.options) ? poll.options : []).map((label, ix) => ({
    ix,
    label,
    votes: counts.get(ix) ?? 0,
  }));
  const total = options.reduce((s, o) => s + o.votes, 0);

  return {
    id: poll.id,
    question: poll.question,
    options,
    totalVotes: total,
    myVoteIx: myVote?.optionIx ?? null,
    mine: poll.userId === viewerId,
  };
}

import { prisma } from './prisma.js';

/**
 * K21 Charts — the community favorite-song chart ("221 Bëgg").
 * 100% real data: songs are submitted by users, ranked purely by user votes
 * (one vote per user per week, changeable), and shown next to what Senegal
 * actually streams on YouTube (cached weekly by the cron). Nothing curated
 * by hand, nothing invented.
 */

export class ChartsError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** ISO week key, e.g. "2026-W28" — chart resets every Monday. */
export function currentWeekKey(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function normalizeKey(title, artist) {
  return `${String(title).trim().toLowerCase()}::${String(artist).trim().toLowerCase()}`
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

function validateSongInput(title, artist) {
  const t = String(title ?? '').trim();
  const a = String(artist ?? '').trim();
  if (t.length < 1 || t.length > 80) throw new ChartsError('invalid_title', 'Titre de chanson invalide (1–80 caractères).');
  if (a.length < 1 || a.length > 60) throw new ChartsError('invalid_artist', "Nom d'artiste invalide (1–60 caractères).");
  return { title: t, artist: a };
}

/**
 * Submit a song for this week's chart and cast the submitter's weekly vote
 * on it. If the song already exists this week, it just becomes their vote.
 */
export async function submitAndVote(userId, { title, artist, videoId } = {}) {
  const clean = validateSongInput(title, artist);
  const weekKey = currentWeekKey();
  const titleKey = normalizeKey(clean.title, clean.artist);

  return prisma.$transaction(async (tx) => {
    let song = await tx.chartSong.findUnique({ where: { weekKey_titleKey: { weekKey, titleKey } } });
    if (!song) {
      song = await tx.chartSong.create({
        data: {
          weekKey,
          titleKey,
          title: clean.title,
          artist: clean.artist,
          videoId: videoId ? String(videoId).slice(0, 20) : null,
          submittedBy: userId,
        },
      });
    }
    await castVote(tx, userId, song, weekKey);
    return song;
  });
}

/** Vote (or move your weekly vote) to an existing song. */
export async function voteForSong(userId, songId) {
  const weekKey = currentWeekKey();
  return prisma.$transaction(async (tx) => {
    const song = await tx.chartSong.findUnique({ where: { id: String(songId ?? '') } });
    if (!song || song.weekKey !== weekKey) {
      throw new ChartsError('song_not_found', 'Chanson introuvable dans le chart de cette semaine.', 404);
    }
    await castVote(tx, userId, song, weekKey);
    return song;
  });
}

async function castVote(tx, userId, song, weekKey) {
  await tx.songVote.upsert({
    where: { userId_weekKey: { userId, weekKey } },
    create: { userId, weekKey, songId: song.id },
    update: { songId: song.id },
  });
}

/**
 * This week's chart: community songs ranked by real votes, the caller's own
 * vote, and the cached YouTube Senegal trending list (may be empty until the
 * cron has run with a YOUTUBE_API_KEY configured).
 */
export async function getWeeklyChart(userId) {
  const weekKey = currentWeekKey();

  const [songs, myVote, youtube] = await Promise.all([
    prisma.chartSong.findMany({
      where: { weekKey },
      include: { _count: { select: { votes: true } } },
    }),
    userId
      ? prisma.songVote.findUnique({ where: { userId_weekKey: { userId, weekKey } } })
      : null,
    prisma.trendingCache.findMany({
      where: { kind: 'youtube_music_sn' },
      orderBy: [{ periodKey: 'desc' }, { rank: 'asc' }],
      take: 10,
    }),
  ]);

  const latestPeriod = youtube[0]?.periodKey;
  const youtubeList = youtube
    .filter((y) => y.periodKey === latestPeriod)
    .map((y) => ({ rank: y.rank, title: y.title, meta: y.meta, url: y.url }));

  const ranked = songs
    .map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.artist,
      videoId: s.videoId,
      votes: s._count.votes,
      mine: myVote?.songId === s.id,
    }))
    .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))
    .slice(0, 20);

  return {
    weekKey,
    question: 'Ta chanson préférée cette semaine ?',
    songs: ranked,
    myVoteSongId: myVote?.songId ?? null,
    youtube: youtubeList,
    youtubeUpdatedAt: youtube[0]?.createdAt ?? null,
  };
}

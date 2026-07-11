import { prisma } from './prisma.js';
import { currentWeekKey } from './charts-service.js';

/**
 * YouTube Data API v3 — most popular music videos in Senegal (regionCode=SN,
 * videoCategoryId=10). Free quota is far above our daily-refresh needs.
 * Requires YOUTUBE_API_KEY; without it the refresh is a silent no-op and the
 * chart simply shows community votes only — never invented data.
 */

const YT_ENDPOINT = 'https://www.googleapis.com/youtube/v3/videos';

export async function fetchYouTubeTrendingMusic({ regionCode = 'SN', maxResults = 10 } = {}) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, reason: 'no_api_key' };

  const url = `${YT_ENDPOINT}?part=snippet&chart=mostPopular&videoCategoryId=10&regionCode=${encodeURIComponent(
    regionCode,
  )}&maxResults=${Math.min(25, maxResults)}&key=${encodeURIComponent(key)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const body = await res.json();
    const items = (body.items ?? []).map((v, i) => ({
      rank: i + 1,
      title: String(v.snippet?.title ?? '').slice(0, 120),
      meta: String(v.snippet?.channelTitle ?? '').slice(0, 80),
      url: v.id ? `https://www.youtube.com/watch?v=${v.id}` : null,
    }));
    return { ok: true, items };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

/** Refresh the cached YouTube SN music chart (called by the daily cron). */
export async function refreshYouTubeChartCache() {
  const result = await fetchYouTubeTrendingMusic();
  if (!result.ok || result.items.length === 0) {
    return { refreshed: false, reason: result.reason ?? 'empty' };
  }

  const periodKey = currentWeekKey();
  await prisma.$transaction(async (tx) => {
    await tx.trendingCache.deleteMany({ where: { kind: 'youtube_music_sn', periodKey } });
    await tx.trendingCache.createMany({
      data: result.items.map((it) => ({
        kind: 'youtube_music_sn',
        periodKey,
        rank: it.rank,
        title: it.title,
        meta: it.meta,
        url: it.url,
      })),
    });
  });
  return { refreshed: true, count: result.items.length, periodKey };
}

/** Search YouTube music videos (Senegal-biased) — the ONLY way users pick a
 * chart song: real videos, no free-typed titles. */
export async function searchYouTubeMusic(query, { maxResults = 8 } = {}) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return { ok: false, reason: 'no_api_key' };

  const q = String(query ?? '').trim();
  if (q.length < 2) return { ok: false, reason: 'query_too_short' };

  const url =
    'https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10' +
    `&regionCode=SN&maxResults=${Math.min(15, maxResults)}&q=${encodeURIComponent(q)}&key=${encodeURIComponent(key)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const body = await res.json();
    return {
      ok: true,
      results: (body.items ?? [])
        .filter((v) => v.id?.videoId)
        .map((v) => ({
          videoId: v.id.videoId,
          title: String(v.snippet?.title ?? '').slice(0, 80),
          artist: String(v.snippet?.channelTitle ?? '').slice(0, 60),
          thumbnail: v.snippet?.thumbnails?.default?.url ?? null,
        })),
    };
  } catch (err) {
    return { ok: false, reason: err.name === 'AbortError' ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}

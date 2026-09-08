/**
 * K21 + community + user GIF library (Supabase Storage).
 */

import { prisma } from './prisma.js';
import {
  completeMboloMediaUpload,
  mintMboloMediaUpload,
  MboloMediaError,
  supabaseStorageConfigured,
} from './mbolo-media-storage-service.js';
import {
  createSignedReadUrl,
  storageBucketName,
} from './supabase-storage.js';

const K21_GIF_SEEDS = [
  { label: 'Salut', path: 'seed/wave.gif', url: 'https://i.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif' },
  { label: 'Danse', path: 'seed/dance.gif', url: 'https://i.giphy.com/media/26BRuo6sKonk9uYIo/giphy.gif' },
  { label: 'Argent', path: 'seed/money.gif', url: 'https://i.giphy.com/media/3o7TKSjRrfIPjeiVy/giphy.gif' },
  { label: 'Teranga', path: 'seed/party.gif', url: 'https://i.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' },
  { label: 'Jërëjëf', path: 'seed/love.gif', url: 'https://i.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif' },
  { label: 'Oui', path: 'seed/yes.gif', url: 'https://i.giphy.com/media/3o6Zt4819NFAgQtaik/giphy.gif' },
  { label: 'Bravo', path: 'seed/clap.gif', url: 'https://i.giphy.com/media/111ebatAtH7mVW/giphy.gif' },
  { label: 'Ñu Lekk', path: 'seed/eat.gif', url: 'https://i.giphy.com/media/3o6Zt6MLG0QCGRqu5O/giphy.gif' },
];

async function ensureK21Gifs() {
  const count = await prisma.mbooloGif.count({ where: { scope: 'k21' } });
  if (count > 0) return;

  for (const seed of K21_GIF_SEEDS) {
    await prisma.mbooloGif.create({
      data: {
        label: seed.label,
        storagePath: seed.path,
        mimeType: 'image/gif',
        scope: 'k21',
        sizeBytes: 0,
        active: true,
      },
    });
  }
}

function shapeGif(row, readUrl) {
  return {
    id: row.id,
    label: row.label,
    scope: row.scope,
    url: readUrl ?? row.externalUrl ?? null,
    creatorId: row.creatorId,
    useCount: row.useCount,
  };
}

export async function listMboloGifs(userId) {
  try {
    await ensureK21Gifs();
  } catch (err) {
    console.warn('[mbolo-gifs] seed failed', err.message);
    return K21_GIF_SEEDS.map((seed, i) => ({
      id: `seed-${i}`,
      label: seed.label,
      scope: 'k21',
      url: seed.url,
      creatorId: null,
      useCount: 0,
    }));
  }

  try {
    const rows = await prisma.mbooloGif.findMany({
      where: {
        active: true,
        OR: [{ scope: { in: ['k21', 'community'] } }, { creatorId: userId, scope: 'personal' }],
      },
      orderBy: [{ scope: 'asc' }, { useCount: 'desc' }, { createdAt: 'desc' }],
      take: 100,
    });

    return Promise.all(
      rows.map(async (row) => {
        if (row.storagePath.startsWith('seed/')) {
          const seed = K21_GIF_SEEDS.find((s) => s.path === row.storagePath);
          return shapeGif(row, seed?.url ?? null);
        }
        if (supabaseStorageConfigured()) {
          try {
            return shapeGif(row, await createSignedReadUrl(row.storagePath));
          } catch {
            return shapeGif(row, null);
          }
        }
        return shapeGif(row, null);
      }),
    );
  } catch (err) {
    console.warn('[mbolo-gifs] list failed', err.message);
    return K21_GIF_SEEDS.map((seed, i) => ({
      id: `seed-${i}`,
      label: seed.label,
      scope: 'k21',
      url: seed.url,
      creatorId: null,
      useCount: 0,
    }));
  }
}

export async function registerUserGif(userId, { assetId, label }) {
  const { asset, readUrl } = await completeMboloMediaUpload(userId, { assetId });
  if (asset.kind !== 'gif') {
    throw new MboloMediaError('invalid_kind', 'Asset must be a GIF');
  }

  const gif = await prisma.mbooloGif.create({
    data: {
      creatorId: userId,
      label: String(label ?? 'Mon GIF').slice(0, 40),
      storagePath: asset.storagePath,
      mimeType: asset.mimeType,
      sizeBytes: asset.sizeBytes,
      scope: 'personal',
    },
  });

  return shapeGif(gif, readUrl);
}

export async function mintGifUpload(userId, { sizeBytes, mimeType }) {
  return mintMboloMediaUpload(userId, {
    kind: 'gif',
    mimeType: mimeType ?? 'image/gif',
    sizeBytes,
    retention: 'vault',
    threadId: null,
  });
}

export async function incrementGifUse(gifId) {
  await prisma.mbooloGif.update({
    where: { id: gifId },
    data: { useCount: { increment: 1 } },
  });
}

/** Resolve a library GIF into message fields (durable asset for Supabase-backed GIFs). */
export async function resolveGifForMessage(userId, threadId, gifId) {
  await ensureK21Gifs();
  const row = await prisma.mbooloGif.findUnique({ where: { id: gifId } });
  if (!row || !row.active) {
    throw new MboloMediaError('not_found', 'GIF introuvable', 404);
  }
  if (row.scope === 'personal' && row.creatorId !== userId) {
    throw new MboloMediaError('forbidden', 'GIF privé', 403);
  }

  await incrementGifUse(gifId);

  if (row.storagePath.startsWith('seed/')) {
    const seed = K21_GIF_SEEDS.find((s) => s.path === row.storagePath);
    return {
      mediaUrl: seed?.url ?? null,
      mediaAssetId: null,
      label: row.label,
    };
  }

  if (!supabaseStorageConfigured()) {
    throw new MboloMediaError('storage_unavailable', 'Stockage GIF indisponible', 503);
  }

  const asset = await prisma.mbooloMediaAsset.create({
    data: {
      ownerId: userId,
      threadId: threadId ?? null,
      bucket: storageBucketName(),
      storagePath: row.storagePath,
      mimeType: row.mimeType,
      kind: 'gif',
      sizeBytes: row.sizeBytes,
      status: 'ready',
      retention: 'thread',
    },
  });

  const readUrl = await createSignedReadUrl(row.storagePath);
  return { mediaUrl: readUrl, mediaAssetId: asset.id, label: row.label };
}

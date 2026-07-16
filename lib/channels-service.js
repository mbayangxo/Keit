import { prisma } from './prisma.js';

/**
 * Channels — each account can create exactly one channel; members follow
 * channels and watch what they post. All content is member-created; the
 * feed is purely "channels you follow", newest first. Nothing curated.
 */

export class ChannelError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const MAX_IMAGE = 400_000; // same data-URL budget as avatars

export async function upsertChannel(userId, { name, bio } = {}) {
  const n = String(name ?? '').trim();
  if (n.length < 2 || n.length > 60) {
    throw new ChannelError('invalid_name', 'Nom de chaîne invalide (2–60 caractères).');
  }
  const b = bio == null ? null : String(bio).trim().slice(0, 160) || null;

  return prisma.channel.upsert({
    where: { ownerId: userId },
    create: { ownerId: userId, name: n, bio: b },
    update: { name: n, bio: b },
  });
}

export async function publishPost(userId, { body, imageUrl } = {}) {
  const channel = await prisma.channel.findUnique({ where: { ownerId: userId } });
  if (!channel) throw new ChannelError('no_channel', 'Crée ta chaîne avant de publier.', 403);

  const text = String(body ?? '').trim();
  const image = imageUrl ? String(imageUrl) : null;
  if (!text && !image) throw new ChannelError('empty_post', 'Un post a besoin de texte ou d’une photo.');
  if (text.length > 500) throw new ChannelError('post_too_long', 'Texte trop long (500 caractères max).');
  if (image && image.length > MAX_IMAGE) throw new ChannelError('image_too_large', 'Photo trop lourde.');

  return prisma.channelPost.create({
    data: { channelId: channel.id, body: text || null, imageUrl: image },
  });
}

export async function deletePost(userId, postId) {
  const channel = await prisma.channel.findUnique({ where: { ownerId: userId } });
  if (!channel) throw new ChannelError('no_channel', 'Chaîne introuvable.', 404);
  const { count } = await prisma.channelPost.deleteMany({
    where: { id: String(postId ?? ''), channelId: channel.id },
  });
  if (!count) throw new ChannelError('post_not_found', 'Post introuvable.', 404);
}

export async function setFollow(userId, channelId, follow) {
  const channel = await prisma.channel.findUnique({ where: { id: String(channelId ?? '') } });
  if (!channel) throw new ChannelError('channel_not_found', 'Chaîne introuvable.', 404);
  if (channel.ownerId === userId) {
    throw new ChannelError('own_channel', 'C’est déjà ta chaîne.', 403);
  }
  if (follow) {
    await prisma.channelFollow.upsert({
      where: { channelId_userId: { channelId: channel.id, userId } },
      create: { channelId: channel.id, userId },
      update: {},
    });
  } else {
    await prisma.channelFollow.deleteMany({ where: { channelId: channel.id, userId } });
  }
}

async function ownerCards(channels) {
  const ownerIds = [...new Set(channels.map((c) => c.ownerId))];
  const owners = ownerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: ownerIds } },
        select: { id: true, name: true, handle: true, avatarEmoji: true, avatarUrl: true },
      })
    : [];
  return new Map(owners.map((o) => [o.id, o]));
}

function channelShape(channel, owner, extras = {}) {
  return {
    id: channel.id,
    name: channel.name,
    bio: channel.bio,
    owner: owner
      ? { name: owner.name, handle: owner.handle, avatarEmoji: owner.avatarEmoji, avatarUrl: owner.avatarUrl }
      : null,
    ...extras,
  };
}

/** Own channel with posts + follower count (null if not created yet). */
export async function myChannel(userId) {
  const channel = await prisma.channel.findUnique({
    where: { ownerId: userId },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 50 },
      _count: { select: { followers: true } },
    },
  });
  if (!channel) return null;
  return channelShape(channel, null, {
    mine: true,
    followerCount: channel._count.followers,
    posts: channel.posts,
  });
}

/** Public view of one channel. */
export async function viewChannel(channelId, viewerId) {
  const channel = await prisma.channel.findUnique({
    where: { id: String(channelId ?? '') },
    include: {
      posts: { orderBy: { createdAt: 'desc' }, take: 50 },
      _count: { select: { followers: true } },
    },
  });
  if (!channel) throw new ChannelError('channel_not_found', 'Chaîne introuvable.', 404);
  const owners = await ownerCards([channel]);
  const following = viewerId
    ? Boolean(
        await prisma.channelFollow.findUnique({
          where: { channelId_userId: { channelId: channel.id, userId: viewerId } },
        }),
      )
    : false;
  return channelShape(channel, owners.get(channel.ownerId), {
    mine: channel.ownerId === viewerId,
    following,
    followerCount: channel._count.followers,
    posts: channel.posts,
  });
}

/** Browse: recently active channels (excluding your own). */
export async function browseChannels(viewerId) {
  const channels = await prisma.channel.findMany({
    where: { NOT: { ownerId: viewerId } },
    orderBy: { updatedAt: 'desc' },
    take: 30,
    include: { _count: { select: { followers: true, posts: true } } },
  });
  const owners = await ownerCards(channels);
  const follows = await prisma.channelFollow.findMany({
    where: { userId: viewerId, channelId: { in: channels.map((c) => c.id) } },
    select: { channelId: true },
  });
  const followed = new Set(follows.map((f) => f.channelId));
  return channels.map((c) =>
    channelShape(c, owners.get(c.ownerId), {
      followerCount: c._count.followers,
      postCount: c._count.posts,
      following: followed.has(c.id),
    }),
  );
}

/** Feed: latest posts from channels you follow. */
export async function followFeed(userId) {
  const follows = await prisma.channelFollow.findMany({
    where: { userId },
    select: { channelId: true },
  });
  const ids = follows.map((f) => f.channelId);
  if (!ids.length) return [];
  const posts = await prisma.channelPost.findMany({
    where: { channelId: { in: ids } },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { channel: true },
  });
  const owners = await ownerCards(posts.map((p) => p.channel));
  return posts.map((p) => ({
    id: p.id,
    body: p.body,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt,
    channel: channelShape(p.channel, owners.get(p.channel.ownerId)),
  }));
}

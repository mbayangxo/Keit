/**
 * Supabase Storage — signed upload/read URLs via REST (service role, server-only).
 */

const DEFAULT_BUCKET = 'mbolo-media';

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || DEFAULT_BUCKET;
  return { url, key, bucket };
}

export function supabaseStorageConfigured() {
  const { url, key } = config();
  return Boolean(url && key);
}

function assertConfigured() {
  if (!supabaseStorageConfigured()) {
    const err = new Error('Supabase Storage not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    err.code = 'storage_unavailable';
    err.status = 503;
    throw err;
  }
}

async function storageFetch(path, { method = 'GET', body, headers = {} } = {}) {
  const { url, key } = config();
  const res = await fetch(`${url}/storage/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(json?.message ?? json?.error ?? `Storage error ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return json;
}

/** Mint a signed upload URL (client PUTs the file bytes). */
export async function createSignedUploadUrl(storagePath, { upsert = false } = {}) {
  assertConfigured();
  const { bucket } = config();
  const encoded = storagePath.split('/').map(encodeURIComponent).join('/');
  const json = await storageFetch(`/object/upload/sign/${bucket}/${encoded}`, {
    method: 'POST',
    body: { upsert },
  });
  return {
    uploadUrl: json.url ?? json.signedUrl,
    token: json.token,
    path: json.path ?? storagePath,
  };
}

/** Mint a time-limited read URL for private objects. */
export async function createSignedReadUrl(storagePath, expiresIn = 3600) {
  assertConfigured();
  const { bucket } = config();
  const encoded = storagePath.split('/').map(encodeURIComponent).join('/');
  const json = await storageFetch(`/object/sign/${bucket}/${encoded}`, {
    method: 'POST',
    body: { expiresIn },
  });
  return json.signedURL ?? json.signedUrl;
}

export async function removeObject(storagePath) {
  assertConfigured();
  const { bucket } = config();
  const encoded = storagePath.split('/').map(encodeURIComponent).join('/');
  await storageFetch(`/object/${bucket}/${encoded}`, { method: 'DELETE' });
}

export function buildStoragePath({ userId, threadId, kind, ext }) {
  const safeExt = String(ext ?? 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'bin';
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  const threadPart = threadId ? `${threadId}/` : 'vault/';
  return `users/${userId}/${threadPart}${kind}/${ts}-${rand}.${safeExt}`;
}

export function mimeToExt(mime) {
  const m = String(mime ?? '').toLowerCase();
  if (m.includes('jpeg') || m.includes('jpg')) return 'jpg';
  if (m.includes('png')) return 'png';
  if (m.includes('gif')) return 'gif';
  if (m.includes('webp')) return 'webp';
  if (m.includes('mp4')) return 'mp4';
  if (m.includes('quicktime')) return 'mov';
  if (m.includes('webm') && m.includes('video')) return 'webm';
  if (m.includes('webm')) return 'webm';
  if (m.includes('3gp')) return '3gp';
  if (m.includes('mpeg') || m.includes('mp3')) return 'mp3';
  if (m.includes('mp4') && m.includes('audio')) return 'm4a';
  return 'bin';
}

export function storageBucketName() {
  return config().bucket;
}

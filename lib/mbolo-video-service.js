/**
 * Real video messages in Mboolo, via Vercel Blob — the existing image/gif/
 * voice pipeline stores base64 directly in Postgres (capped at ~800KB),
 * which cannot hold real video. The client uploads the video file directly
 * to Blob storage (bypassing the ~4.5MB Vercel serverless body limit) using
 * a short-lived client token minted here, then posts the resulting HTTPS
 * URL as a normal 'video' kind MboloMessage, same as it already does for
 * image/gif/voice URLs.
 *
 * No onUploadCompleted callback is registered — Vercel Blob would otherwise
 * need to reach back into this server over the public internet, which adds
 * real complexity for no benefit here: the uploading client already knows
 * the moment its own upload finishes and can post the chat message itself.
 *
 * Until BLOB_READ_WRITE_TOKEN is configured, the honest 503 gate below
 * matches the same pattern used for Mboolo calls (docs/K21-CALLS-LIVEKIT.md)
 * — nothing pretends to work until the real storage is provisioned.
 */

import { handleUpload } from '@vercel/blob/client';

export const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25MB — short Mboolo clips only
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/3gpp'];

export function blobConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function mintMboloVideoUploadToken(req) {
  return handleUpload({
    body: req.body,
    request: req,
    onBeforeGenerateToken: async () => ({
      allowedContentTypes: ALLOWED_VIDEO_TYPES,
      maximumSizeInBytes: MAX_VIDEO_BYTES,
      addRandomSuffix: true,
    }),
  });
}

import { Platform } from 'react-native';
import { pickMboloVideoAsset } from './mbolo-media';

const MAX_FRAMES = 8;
const FRAME_MS = 180;

/** Sample frames from a video file and build an animated GIF (web) or return frames for upload. */
export async function runTerangaGifStudio() {
  const asset = await pickMboloVideoAsset();
  if (!asset) return null;

  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return {
      uri: asset.uri,
      mimeType: asset.mimeType ?? 'video/mp4',
      blob: asset.blob,
      mode: 'video_fallback',
      label: 'Clip Teranga',
    };
  }

  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.src = asset.uri;
  await new Promise((resolve, reject) => {
    video.onloadeddata = resolve;
    video.onerror = reject;
  });

  const durationMs = Math.min((video.duration ?? 3) * 1000, 2400);
  const canvas = document.createElement('canvas');
  const maxEdge = 320;
  const scale = Math.min(1, maxEdge / Math.max(video.videoWidth, video.videoHeight, 1));
  canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
  canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('GIF studio indisponible');

  const frames = [];
  for (let i = 0; i < MAX_FRAMES; i += 1) {
    const t = Math.min(durationMs, i * FRAME_MS) / 1000;
    video.currentTime = t;
    await new Promise((resolve) => {
      video.onseeked = resolve;
    });
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    frames.push(canvas.toDataURL('image/jpeg', 0.72));
  }

  URL.revokeObjectURL(asset.uri);

  return {
    uri: frames[0],
    frames,
    mimeType: 'image/gif',
    mode: 'gif_studio',
    label: 'GIF Teranga',
    blob: await (await fetch(frames[0])).blob(),
  };
}

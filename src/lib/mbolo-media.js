import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { readAsStringAsync, writeAsStringAsync, EncodingType, cacheDirectory } from 'expo-file-system/legacy';

/** Keep under server zod limit (800k) with JSON overhead. */
export const MAX_MEDIA_CHARS = 720_000;
export const MAX_VOICE_CHARS = 780_000;
export const MAX_GIF_CHARS = 720_000;
const MAX_IMAGE_EDGE = 960;
const JPEG_QUALITY = 0.55;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function assertDataUrlSize(dataUrl) {
  if (String(dataUrl).length > MAX_MEDIA_CHARS) {
    throw new Error('Photo trop lourde — recadre ou choisis une image plus petite');
  }
  return dataUrl;
}

async function compressWebImageFile(file) {
  if (typeof document === 'undefined') {
    return assertDataUrlSize(await readFileAsDataUrl(file));
  }
  const blobUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve, reject) => {
      const el = document.createElement('img');
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = blobUrl;
    });
    for (const edge of [MAX_IMAGE_EDGE, 720, 480]) {
      let { width, height } = img;
      const scale = Math.min(1, edge / Math.max(width, height, 1));
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Compression impossible');
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
      if (dataUrl.length <= MAX_MEDIA_CHARS) return assertDataUrlSize(dataUrl);
    }
    throw new Error('Photo trop lourde — recadre ou choisis une image plus petite');
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

async function compressNativeImageUri(uri) {
  const { manipulateAsync, SaveFormat } = await import('expo-image-manipulator');
  for (const width of [MAX_IMAGE_EDGE, 720, 480, 360]) {
    try {
      const result = await manipulateAsync(uri, [{ resize: { width } }], {
        compress: JPEG_QUALITY,
        format: SaveFormat.JPEG,
        base64: true,
      });
      if (result.base64) {
        const dataUrl = assertDataUrlSize(`data:image/jpeg;base64,${result.base64}`);
        return dataUrl;
      }
      if (result.uri) {
        const dataUrl = await readUriAsDataUrl(result.uri, 'image/jpeg');
        if (dataUrl.length <= MAX_MEDIA_CHARS) return dataUrl;
      }
    } catch {
      // Try the next size.
    }
  }
  throw new Error('Photo trop lourde — recadre ou choisis une image plus petite');
}

function assertVoiceDataUrlSize(dataUrl) {
  if (String(dataUrl).length > MAX_VOICE_CHARS) {
    throw new Error('Message vocal trop long — enregistre moins de 60 secondes');
  }
  return dataUrl;
}

export async function readVoiceUriAsDataUrl(uri, mime = 'audio/mp4') {
  if (!uri) throw new Error('Enregistrement introuvable');
  if (uri.startsWith('data:')) return assertVoiceDataUrlSize(uri);
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    return assertVoiceDataUrlSize(await readFileAsDataUrl(blob));
  }
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  return assertVoiceDataUrlSize(`data:${mime};base64,${base64}`);
}

/** Native players need a file:// URI — data URLs fail on iOS/Android. */
export async function resolveVoicePlaybackSource(url) {
  if (!url) return null;
  if (Platform.OS === 'web' || !String(url).startsWith('data:')) return url;

  const match = String(url).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return url;

  const mime = match[1].toLowerCase();
  const ext = mime.includes('webm') ? 'webm' : mime.includes('3gp') ? '3gp' : mime.includes('caf') ? 'caf' : 'm4a';
  const path = `${cacheDirectory}mbolo-voice-${Date.now()}.${ext}`;
  await writeAsStringAsync(path, match[2], { encoding: EncodingType.Base64 });
  return path;
}

/** Fetch a GIF and return a data URL when small enough; otherwise return the HTTPS URL. */
export async function resolveGifMediaUrl(url) {
  const direct = String(url ?? '').trim();
  if (!direct.startsWith('http')) throw new Error('GIF invalide');

  try {
    const res = await fetch(direct);
    if (!res.ok) return direct;
    const blob = await res.blob();
    if (blob.size > MAX_GIF_CHARS * 0.75) return direct;
    const dataUrl = await readFileAsDataUrl(blob);
    if (String(dataUrl).length <= MAX_GIF_CHARS) return dataUrl;
    return direct;
  } catch {
    return direct;
  }
}

export async function readUriAsDataUrl(uri, mime = 'application/octet-stream') {
  if (!uri) throw new Error('Fichier introuvable');
  if (uri.startsWith('data:')) return assertDataUrlSize(uri);
  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    const blob = await res.blob();
    return compressWebImageFile(blob);
  }
  if (mime.startsWith('image/')) {
    return compressNativeImageUri(uri);
  }
  const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
  return assertDataUrlSize(`data:${mime};base64,${base64}`);
}

async function assetToDataUrl(asset) {
  if (asset.uri) {
    return compressNativeImageUri(asset.uri);
  }
  throw new Error('Impossible de lire la photo');
}

async function pickImageFromLibrary() {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) throw new Error('Accès photos refusé — autorise dans les réglages');
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: Platform.OS === 'ios',
    quality: JPEG_QUALITY,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return assetToDataUrl(result.assets[0]);
}

async function takePhotoWithCamera() {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) throw new Error('Accès caméra refusé — autorise dans les réglages');
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: Platform.OS === 'ios',
    quality: JPEG_QUALITY,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  return assetToDataUrl(result.assets[0]);
}

function pickMboloImageWeb() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      try {
        resolve(await compressWebImageFile(file));
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

/** Pick an image from the library. Returns data URL or null if cancelled. */
export async function pickMboloImage() {
  if (Platform.OS === 'web') return pickMboloImageWeb();
  return pickImageFromLibrary();
}

/** Take a photo with the camera. Returns data URL or null if cancelled. */
export async function takeMboloPhoto() {
  if (Platform.OS === 'web') return pickMboloImageWeb();
  return takePhotoWithCamera();
}

/** Record voice via MediaRecorder (web). Returns { stop } or rejects. */
export async function startMboloVoiceRecording() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Messages vocaux indisponibles sur cet appareil');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.start();

  return {
    stop: () =>
      new Promise((resolve, reject) => {
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          try {
            const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
            resolve(assertVoiceDataUrlSize(await readFileAsDataUrl(blob)));
          } catch (err) {
            reject(err);
          }
        };
        recorder.stop();
      }),
  };
}

import { Platform } from 'react-native';

const MAX_MEDIA_CHARS = 750_000;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Pick an image (web file input). Returns data URL or null if cancelled. */
export function pickMboloImage() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return Promise.reject(new Error('Photos disponibles sur le web pour la beta'));
  }
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
        const dataUrl = await readFileAsDataUrl(file);
        if (String(dataUrl).length > MAX_MEDIA_CHARS) {
          reject(new Error('Image trop lourde — choisis une photo plus petite'));
          return;
        }
        resolve(dataUrl);
      } catch (err) {
        reject(err);
      }
    };
    input.click();
  });
}

/** Record voice via MediaRecorder (web). Returns { dataUrl, stop } or rejects. */
export async function startMboloVoiceRecording() {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Messages vocaux disponibles sur le web pour la beta');
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
            const dataUrl = await readFileAsDataUrl(blob);
            if (String(dataUrl).length > MAX_MEDIA_CHARS) {
              reject(new Error('Enregistrement trop long'));
              return;
            }
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        recorder.stop();
      }),
  };
}

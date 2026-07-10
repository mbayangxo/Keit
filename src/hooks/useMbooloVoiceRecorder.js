import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { readVoiceUriAsDataUrl } from '../lib/mbolo-media';

const MAX_VOICE_SECONDS = 60;

export function useMbooloVoiceRecorder() {
  const recorderRef = useRef(null);
  const webSessionRef = useRef(null);
  const [recording, setRecording] = useState(false);

  useEffect(() => {
    return () => {
      webSessionRef.current = null;
      const recorder = recorderRef.current;
      recorderRef.current = null;
      if (recorder?.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  }, []);

  const start = useCallback(async () => {
    if (Platform.OS === 'web') {
      const { startMboloVoiceRecording } = await import('../lib/mbolo-media');
      webSessionRef.current = await startMboloVoiceRecording();
      setRecording(true);
      return;
    }

    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) throw new Error('Accès micro refusé — autorise dans les réglages');

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

    const recorder = new AudioModule.AudioRecorder(RecordingPresets.LOW_QUALITY);
    await recorder.prepareToRecordAsync();
    recorder.record({ forDuration: MAX_VOICE_SECONDS });
    recorderRef.current = recorder;
    setRecording(true);
  }, []);

  const stop = useCallback(async () => {
    if (Platform.OS === 'web') {
      if (!webSessionRef.current) return null;
      const url = await webSessionRef.current.stop();
      webSessionRef.current = null;
      setRecording(false);
      return url;
    }

    const recorder = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    if (!recorder) return null;

    await recorder.stop();
    const uri = recorder.uri;
    if (!uri) throw new Error('Enregistrement vide');

    const mime = uri.endsWith('.3gp') ? 'audio/3gp' : uri.endsWith('.webm') ? 'audio/webm' : 'audio/mp4';
    return readVoiceUriAsDataUrl(uri, mime);
  }, []);

  return { start, stop, isRecording: recording };
}

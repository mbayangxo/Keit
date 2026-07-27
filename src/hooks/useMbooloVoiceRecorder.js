import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { readVoiceUriAsDataUrl } from '../lib/mbolo-media';

export const MAX_VOICE_SECONDS = 60;

/** Mono / low bitrate — keeps uploads under the API size cap. */
const VOICE_RECORDING_OPTIONS = {
  ...RecordingPresets.LOW_QUALITY,
  numberOfChannels: 1,
  bitRate: 32000,
  sampleRate: 22050,
};

function mimeFromRecordingUri(uri) {
  const value = String(uri ?? '').toLowerCase();
  if (value.includes('.3gp')) return 'audio/3gp';
  if (value.includes('.webm')) return 'audio/webm';
  if (value.includes('.caf')) return 'audio/x-caf';
  if (value.includes('.mp4') || value.includes('.m4a')) return 'audio/mp4';
  return Platform.OS === 'web' ? 'audio/webm' : 'audio/mp4';
}

function pulseHaptic(kind) {
  if (Platform.OS === 'web') return;
  if (kind === 'start') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    return;
  }
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** @typedef {'idle' | 'recording' | 'ready' | 'processing'} VoiceRecordingPhase */

export function useMbooloVoiceRecorder() {
  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);
  const activeRef = useRef(false);
  /** @type {[VoiceRecordingPhase, Function]} */
  const [phase, setPhase] = useState('idle');

  useEffect(() => {
    if (phase !== 'recording') return;
    if (!recorderState.isRecording && activeRef.current) {
      setPhase('ready');
      pulseHaptic('stop');
    }
  }, [phase, recorderState.isRecording]);

  useEffect(() => {
    return () => {
      if (recorder.isRecording) {
        recorder.stop().catch(() => {});
      }
    };
  }, [recorder]);

  const start = useCallback(async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) throw new Error('Accès micro refusé — autorise dans les réglages');

    await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    await recorder.prepareToRecordAsync();
    recorder.record({ forDuration: MAX_VOICE_SECONDS });
    activeRef.current = true;
    setPhase('recording');
    pulseHaptic('start');
  }, [recorder]);

  const stop = useCallback(async () => {
    if (!activeRef.current && !recorder.isRecording && phase !== 'ready') return null;

    activeRef.current = false;
    setPhase('processing');
    if (phase === 'recording') pulseHaptic('stop');

    if (recorder.isRecording) {
      await recorder.stop();
    }

    const uri = recorder.uri;
    if (!uri) {
      setPhase('idle');
      throw new Error('Enregistrement vide');
    }

    try {
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      return await readVoiceUriAsDataUrl(uri, mimeFromRecordingUri(uri));
    } finally {
      setPhase('idle');
    }
  }, [recorder, phase]);

  const cancel = useCallback(async () => {
    if (!activeRef.current && !recorder.isRecording && phase !== 'ready') return;

    activeRef.current = false;
    setPhase('idle');
    pulseHaptic('stop');

    if (recorder.isRecording) {
      await recorder.stop().catch(() => {});
    }
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
  }, [recorder, phase]);

  const durationMillis =
    phase === 'recording' || phase === 'ready' ? recorderState.durationMillis : 0;
  const isRecording = phase === 'recording';
  const isReady = phase === 'ready';
  const isProcessing = phase === 'processing';
  const isVoiceBusy = isRecording || isReady || isProcessing;

  return {
    start,
    stop,
    cancel,
    phase,
    isRecording,
    isReady,
    isProcessing,
    isVoiceBusy,
    durationMillis,
    maxSeconds: MAX_VOICE_SECONDS,
  };
}

export function formatVoiceDuration(ms) {
  const total = Math.max(0, Math.floor(Number(ms ?? 0) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

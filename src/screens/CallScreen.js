import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import { getCallToken } from '../lib/api-client';
import { callsSupported, createCallSession } from '../lib/call-room';
import { colors, fontFamily, radius, spacing, type } from '../theme';

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/**
 * In-call screen (LiveKit). One room per Mboolo thread — the caller rings
 * (join card + notification in the chat), the others join from the chat.
 * Audio is auto-attached; video tracks render into DOM nodes on web.
 */
export default function CallScreen({ navigation, route }) {
  const { threadId, title, video: wantsVideo, ring } = route.params ?? {};
  const [phase, setPhase] = useState('connecting'); // connecting | live | error
  const [error, setError] = useState(null);
  const [others, setOthers] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(Boolean(wantsVideo));
  const [elapsed, setElapsed] = useState(0);

  const sessionRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localVideoRef = useRef(null);
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (phase !== 'live') return undefined;
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;

    const mountVideo = (node, track, mirrored) => {
      if (!node?.appendChild) return;
      const el = track.attach();
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.objectFit = 'cover';
      el.style.borderRadius = '18px';
      if (mirrored) el.style.transform = 'scaleX(-1)';
      node.replaceChildren(el);
    };

    (async () => {
      if (!callsSupported) {
        setError('Les appels arrivent sur mobile — utilise K21 web pour l’instant.');
        setPhase('error');
        return;
      }
      try {
        const { url, token } = await getCallToken({
          threadId,
          video: Boolean(wantsVideo),
          ring: Boolean(ring),
        });
        if (cancelled) return;
        const session = createCallSession({
          onParticipants: (n) => !cancelled && setOthers(n),
          onVideoTrack: (track) => mountVideo(remoteVideoRef.current, track, false),
          onDisconnected: () => !cancelled && navigation.goBack(),
        });
        sessionRef.current = session;
        await session.connect(url, token, { video: Boolean(wantsVideo) });
        if (cancelled) return;
        if (wantsVideo) {
          const local = session.localVideoTrack();
          if (local) mountVideo(localVideoRef.current, local, true);
        }
        setPhase('live');
      } catch (err) {
        if (cancelled) return;
        setError(err?.message ?? 'Appel impossible pour le moment.');
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      sessionRef.current?.disconnect();
      sessionRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId]);

  const toggleMic = async () => {
    const next = !micOn;
    setMicOn(next);
    try { await sessionRef.current?.setMic(next); } catch {}
  };

  const toggleCam = async () => {
    const next = !camOn;
    setCamOn(next);
    try {
      await sessionRef.current?.setCamera(next);
      if (next) {
        const local = sessionRef.current?.localVideoTrack();
        const node = localVideoRef.current;
        if (local && node?.appendChild) {
          const el = local.attach();
          el.style.width = '100%';
          el.style.height = '100%';
          el.style.objectFit = 'cover';
          el.style.borderRadius = '18px';
          el.style.transform = 'scaleX(-1)';
          node.replaceChildren(el);
        }
      } else if (localVideoRef.current?.replaceChildren) {
        localVideoRef.current.replaceChildren();
      }
    } catch {}
  };

  const hangUp = () => {
    sessionRef.current?.disconnect();
    sessionRef.current = null;
    navigation.goBack();
  };

  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const pulseFade = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0] });

  const statusLine =
    phase === 'connecting'
      ? 'Connexion…'
      : others === 0
        ? 'Ça sonne…'
        : `En appel · ${formatDuration(elapsed)}${others > 1 ? ` · ${others + 1} participants` : ''}`;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{wantsVideo ? 'Appel vidéo' : 'Appel vocal'}</Text>
          <Text style={styles.title} numberOfLines={1}>{title ?? 'Mboolo'}</Text>
          <Text style={styles.status}>{phase === 'error' ? ' ' : statusLine}</Text>
        </View>

        {phase === 'error' ? (
          <View style={styles.center}>
            <Text style={{ fontSize: 40, marginBottom: spacing.lg }}>📞</Text>
            <Text style={styles.errorText}>{error}</Text>
            <PressScale scaleTo={0.95} onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backBtnText}>← Retour au chat</Text>
            </PressScale>
          </View>
        ) : wantsVideo ? (
          <View style={styles.videoArea}>
            <View ref={remoteVideoRef} style={styles.remoteVideo}>
              {others === 0 ? (
                <View style={styles.center}>
                  {phase === 'connecting' ? (
                    <ActivityIndicator color={colors.green} />
                  ) : (
                    <Text style={styles.waitingText}>En attente de l’autre personne…</Text>
                  )}
                </View>
              ) : null}
            </View>
            <View ref={localVideoRef} style={styles.localVideo} />
          </View>
        ) : (
          <View style={styles.center}>
            <View style={styles.avatarWrap}>
              <Animated.View
                style={[styles.avatarPulse, { opacity: pulseFade, transform: [{ scale: pulseScale }] }]}
              />
              <View style={styles.avatarDisc}>
                <Text style={{ fontSize: 44 }}>{phase === 'connecting' ? '📡' : '📞'}</Text>
              </View>
            </View>
            <Text style={styles.voiceHint}>
              {others === 0
                ? 'Ton ami reçoit une notification — il peut rejoindre depuis le chat.'
                : 'Appel en cours — bonne discussion !'}
            </Text>
          </View>
        )}

        {phase !== 'error' ? (
          <View style={styles.controls}>
            <PressScale scaleTo={0.9} onPress={toggleMic} style={[styles.ctrlBtn, !micOn && styles.ctrlBtnOff]}>
              <Text style={{ fontSize: 22 }}>{micOn ? '🎙️' : '🔇'}</Text>
              <Text style={styles.ctrlLabel}>{micOn ? 'Micro' : 'Coupé'}</Text>
            </PressScale>
            {wantsVideo ? (
              <PressScale scaleTo={0.9} onPress={toggleCam} style={[styles.ctrlBtn, !camOn && styles.ctrlBtnOff]}>
                <Text style={{ fontSize: 22 }}>{camOn ? '🎥' : '🚫'}</Text>
                <Text style={styles.ctrlLabel}>Caméra</Text>
              </PressScale>
            ) : null}
            <PressScale scaleTo={0.9} onPress={hangUp} style={styles.hangBtn}>
              <Text style={{ fontSize: 22, color: '#fff' }}>✕</Text>
              <Text style={styles.hangLabel}>Raccrocher</Text>
            </PressScale>
          </View>
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  header: { alignItems: 'center', paddingTop: spacing.xxl, paddingHorizontal: spacing.huge },
  eyebrow: { ...type.eyebrow, color: colors.greenDark },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 19, color: colors.ink, marginTop: 4 },
  status: { fontSize: 12, color: 'rgba(5,8,5,0.55)', marginTop: 6, minHeight: 16 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.huge },

  avatarWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center' },
  avatarPulse: {
    position: 'absolute', width: 150, height: 150, borderRadius: 75,
    backgroundColor: 'rgba(26,240,96,0.35)',
  },
  avatarDisc: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 2, borderColor: 'rgba(15,188,72,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  voiceHint: {
    marginTop: spacing.xxl, fontSize: 12, color: 'rgba(5,8,5,0.55)',
    textAlign: 'center', lineHeight: 18, maxWidth: 260,
  },

  videoArea: { flex: 1, margin: spacing.xl, position: 'relative' },
  remoteVideo: {
    flex: 1, borderRadius: 18, overflow: 'hidden',
    backgroundColor: 'rgba(5,8,5,0.06)',
    borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)',
  },
  waitingText: { fontSize: 12, color: 'rgba(5,8,5,0.5)' },
  localVideo: {
    position: 'absolute', right: 10, top: 10, width: 96, height: 128,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1, borderColor: 'rgba(5,8,5,0.12)',
  },

  controls: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    gap: spacing.xxl, paddingVertical: spacing.xxl,
  },
  ctrlBtn: {
    width: 74, alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)',
    borderRadius: radius.xl, borderBottomRightRadius: 9,
    paddingVertical: spacing.lg,
  },
  ctrlBtnOff: { backgroundColor: 'rgba(232,92,26,0.12)', borderColor: 'rgba(232,92,26,0.3)' },
  ctrlLabel: { fontSize: 10, color: 'rgba(5,8,5,0.6)', fontFamily: fontFamily.bodyBold },
  hangBtn: {
    width: 84, alignItems: 'center', gap: 4,
    backgroundColor: colors.orange,
    borderRadius: radius.xl, borderBottomRightRadius: 9,
    paddingVertical: spacing.lg,
  },
  hangLabel: { fontSize: 10, color: '#fff', fontFamily: fontFamily.bodyBold },

  errorText: { fontSize: 13, color: 'rgba(5,8,5,0.65)', textAlign: 'center', lineHeight: 19, maxWidth: 280 },
  backBtn: { marginTop: spacing.xxl },
  backBtnText: { fontSize: 13, color: colors.greenDark, fontFamily: fontFamily.bodyBold },
});

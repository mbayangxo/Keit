import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Keypad from '../components/Keypad';
import GlowButton from '../components/GlowButton';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useSecurity } from '../context/SecurityContext';

const PIN_LENGTH = 6;

export default function PinGateScreen({ mode = 'unlock', title, subtitle, onSuccess, onSetupComplete }) {
  const security = useSecurity();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [phase, setPhase] = useState(mode === 'setup' ? 'enter' : 'verify');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const heading =
    title ??
    (mode === 'setup'
      ? phase === 'enter'
        ? 'Choisis ton PIN'
        : 'Confirme ton PIN'
      : 'Entre ton PIN');

  const sub =
    subtitle ??
    (mode === 'setup'
      ? 'Minimum 6 chiffres — jamais stocké en clair sur ton téléphone.'
      : 'Ton compte est verrouillé après inactivité.');

  async function submit(value) {
    if (value.length < PIN_LENGTH) return;
    setError('');
    setLoading(true);

    try {
      if (mode === 'setup') {
        if (phase === 'enter') {
          setConfirmPin(value);
          setPin('');
          setPhase('confirm');
          setLoading(false);
          return;
        }
        if (value !== confirmPin) {
          setError('Les PIN ne correspondent pas');
          setPin('');
          setPhase('enter');
          setConfirmPin('');
          setLoading(false);
          return;
        }
        await security.setupPin(value);
        onSetupComplete?.();
        onSuccess?.();
        return;
      }

      if (mode === 'stepup') {
        const result = await security.requestStepUp(value);
        if (!result.ok) {
          setError(result.message ?? 'PIN incorrect');
          setPin('');
          setLoading(false);
          return;
        }
        onSuccess?.(result.stepUpToken);
        return;
      }

      const result = await security.unlockWithPin(value);
      if (!result.ok) {
        setError(result.message ?? 'PIN incorrect');
        setPin('');
        setLoading(false);
        return;
      }
      onSuccess?.();
    } finally {
      setLoading(false);
    }
  }

  function onDigit(d) {
    const next = `${pin}${d}`.slice(0, PIN_LENGTH);
    setPin(next);
    if (next.length === PIN_LENGTH) submit(next);
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.title}>{heading}</Text>
        <Text style={styles.sub}>{sub}</Text>

        <View style={styles.dots}>
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <View key={i} style={[styles.dot, i < pin.length && styles.dotFilled]} />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'unlock' && security.biometricReady ? (
          <PressScale
            onPress={async () => {
              const result = await security.unlockWithBiometric();
              if (result.ok) onSuccess?.();
              else setError(result.message);
            }}
            style={styles.bioBtn}
          >
            <Text style={styles.bioText}>Utiliser empreinte / Face ID</Text>
          </PressScale>
        ) : null}

        <Keypad onDigit={onDigit} onBackspace={() => setPin((p) => p.slice(0, -1))} />

        {mode === 'setup' && security.pinReady === false ? (
          <GlowButton
            label={loading ? '…' : 'Activer biométrie'}
            onPress={async () => {
              const r = await security.enableBiometric();
              if (!r.ok) setError(r.message);
            }}
            style={{ marginTop: spacing.xl }}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  body: { flex: 1, padding: spacing.xl, justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBold, fontSize: 24, color: colors.white, marginBottom: spacing.sm },
  sub: { fontFamily: fontFamily.body, fontSize: 14, color: colors.whiteA55, marginBottom: spacing.xxl },
  dots: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.xl },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.whiteA15 },
  dotFilled: { backgroundColor: colors.green },
  error: { color: '#e8192c', textAlign: 'center', marginBottom: spacing.md, fontFamily: fontFamily.body },
  bioBtn: { alignSelf: 'center', marginBottom: spacing.xl, padding: spacing.md },
  bioText: { color: colors.green, fontFamily: fontFamily.bodySemiBold, fontSize: 14 },
});

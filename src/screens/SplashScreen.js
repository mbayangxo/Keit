import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SplashBackground from '../components/SplashBackground';
import K21Logo from '../components/K21Logo';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, spacing } from '../theme';
import { useLocale } from '../context/LocaleContext';

const LANGS = ['FR', 'WO', 'EN'];
const SPLASH_FROM_CODE = { fr: 'FR', wo: 'WO', en: 'EN' };

// design/k21-onboarding.html, Screen 1 (Splash / first open) — the K21
// mark over a warm "Dakar alive" background, with the two real entry
// points (create account / already have one) and a quick language toggle.
export default function SplashScreen({ onCreateAccount, onHaveAccount }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const { langCode, setLanguageFromSplash } = useLocale();
  const lang = SPLASH_FROM_CODE[langCode] ?? 'FR';

  useEffect(() => {
    Animated.timing(entrance, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }).start();
  }, [entrance]);

  return (
    <View style={styles.root}>
      <SplashBackground />
      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <View style={styles.content}>
          <Animated.View
            style={{
              alignItems: 'center',
              opacity: entrance,
              transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }, { translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
            }}
          >
            <K21Logo size={150} />
          </Animated.View>
          <Text style={styles.tagline}>African Youth Wallet</Text>

          <View style={styles.cta}>
            <GlowButton label="Créer mon compte" onPress={onCreateAccount} />
            <PressScale scaleTo={0.96} onPress={onHaveAccount} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>J'ai déjà un compte</Text>
            </PressScale>
          </View>
        </View>

        <View style={styles.langRow}>
          {LANGS.map((l) => (
            <PressScale key={l} scaleTo={0.92} onPress={() => setLanguageFromSplash(l)}>
              <Text style={[styles.langBtn, l === lang && styles.langBtnOn]}>{l}</Text>
            </PressScale>
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: '#050805' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.giant },
  tagline: { marginTop: 18, marginBottom: 48, fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 3, color: colors.whiteA30, textTransform: 'uppercase' },
  cta: { width: 240, gap: spacing.md },
  secondaryBtn: { height: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 13, fontWeight: '600', color: colors.whiteA55 },
  langRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingBottom: spacing.xl },
  langBtn: { fontSize: 11, color: colors.whiteA30, paddingVertical: 4, paddingHorizontal: 8 },
  langBtnOn: { color: colors.green, fontWeight: '700' },
});

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import ScreenBackground from '../components/ScreenBackground';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

const LANGS = ['FR', 'WO', 'EN'];
const SPLASH_FROM_CODE = { fr: 'FR', wo: 'WO', en: 'EN' };

function AppleMark({ size = 16, color = colors.ink }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.98-.2 1.98-.85 3.32-.76 1.61.13 2.83.77 3.63 1.94-3.36 2.01-2.56 6.43.66 7.72-.61 1.6-1.39 3.17-2.69 4.27zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"
      />
    </Svg>
  );
}

function GoogleMark({ size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 18.9 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.7l6.3 5.3C40.6 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-3.5z" />
    </Svg>
  );
}

// Entry screen — editorial "lifestyle brand" treatment (no photos):
// sunrise mark + giant stacked display headline + one loud gold CTA.
// Deliberately bright (brand green field, ink accents) as a one-off; the
// rest of the app keeps the locked dark #050805 shell.
export default function SplashScreen({ onCreateAccount, onHaveAccount, onContinueApple, onContinueGoogle }) {
  const sunrise = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(0)).current;
  const lines = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const ctas = useRef(new Animated.Value(0)).current;
  const { langCode, setLanguageFromSplash } = useLocale();
  const lang = SPLASH_FROM_CODE[langCode] ?? 'FR';

  useEffect(() => {
    Animated.sequence([
      Animated.timing(sunrise, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(130, [
        ...lines.map((v) =>
          Animated.spring(v, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true }),
        ),
        Animated.timing(ctas, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();

    // Living pulse — sunrise rings breathe, gold promise line glows.
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(goldPulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(goldPulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    breathe.start();
    glow.start();
    return () => {
      breathe.stop();
      glow.stop();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lineStyle = (v) => ({
    opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  });

  const ringPulse = (from, to) => ({
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }],
  });

  return (
    <View style={styles.root}>
      <ScreenBackground />

      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <View style={styles.frame}>
          {/* Top bar — language switch left, sign-in right (Sendwave-style "Log in") */}
          <View style={styles.topBar}>
            <View style={styles.langRow}>
              {LANGS.map((l) => (
                <PressScale key={l} scaleTo={0.92} onPress={() => setLanguageFromSplash(l)} style={[styles.langBtn, l === lang && styles.langBtnOn]}>
                  <Text style={[styles.langBtnText, l === lang && styles.langBtnTextOn]}>{l}</Text>
                </PressScale>
              ))}
            </View>
            <PressScale scaleTo={0.94} onPress={onHaveAccount}>
              <Text style={styles.loginLink}>{t(langCode, 'splashSignInAction')}</Text>
            </PressScale>
          </View>

          {/* Sunrise hero — concentric rings breaking the top of the layout */}
          <Animated.View
            style={[
              styles.hero,
              {
                opacity: sunrise,
                transform: [{ scale: sunrise.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] }) }],
              },
            ]}
          >
            <Animated.View style={[styles.ringOuter, ringPulse(1, 1.07)]}>
              <Animated.View style={[styles.ringMid, ringPulse(1.04, 1)]}>
                <View style={styles.sun}>
                  <Text style={styles.wordmark}>K21</Text>
                  <View style={styles.flagStripe}>
                    <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
                    <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
                    <View style={[styles.flagSeg, { backgroundColor: colors.flagRed }]} />
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </Animated.View>

          {/* Editorial stacked headline */}
          <View style={styles.headline}>
            <Animated.Text style={[styles.headLine, lineStyle(lines[0])]}>{t(langCode, 'splashHead1')}</Animated.Text>
            <Animated.Text style={[styles.headLine, styles.headIndent, lineStyle(lines[1])]}>{t(langCode, 'splashHead2')}</Animated.Text>
            <Animated.View style={lineStyle(lines[2])}>
              <Animated.Text
                style={[
                  styles.headLine,
                  styles.headAccent,
                  {
                    opacity: goldPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] }),
                    transform: [{ scale: goldPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }],
                  },
                ]}
              >
                {t(langCode, 'splashHead3')}
              </Animated.Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.ctaBlock, lineStyle(ctas)]}>
            <PressScale scaleTo={0.97} onPress={onCreateAccount} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{t(langCode, 'splashCreate')}</Text>
            </PressScale>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>{t(langCode, 'splashOr')}</Text>
              <View style={styles.orLine} />
            </View>

            <PressScale scaleTo={0.97} onPress={onContinueApple} style={styles.outlineBtn}>
              <AppleMark color={colors.white} />
              <Text style={styles.outlineBtnText}>{t(langCode, 'splashApple')}</Text>
            </PressScale>
            <PressScale scaleTo={0.97} onPress={onContinueGoogle} style={styles.outlineBtn}>
              <GoogleMark />
              <Text style={styles.outlineBtnText}>{t(langCode, 'splashGoogle')}</Text>
            </PressScale>

            <Text style={styles.caption}>{t(langCode, 'splashCaption')}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const RING_OUTER = 260;
const RING_MID = 214;
const SUN = 168;

const styles = StyleSheet.create({
  root: { flex: 1 },
  frame: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: spacing.giant },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg },
  langRow: { flexDirection: 'row', gap: spacing.xs },
  langBtn: { borderRadius: radius.round, paddingVertical: 5, paddingHorizontal: spacing.md + 2, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08 },
  langBtnOn: { backgroundColor: colors.green, borderColor: colors.green },
  langBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.whiteA40 },
  langBtnTextOn: { color: colors.ink },
  loginLink: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.whiteA70, textDecorationLine: 'underline' },

  hero: { alignItems: 'center', marginTop: spacing.giant },
  ringOuter: {
    width: RING_OUTER, height: RING_OUTER, borderRadius: RING_OUTER / 2,
    backgroundColor: colors.greenA05, alignItems: 'center', justifyContent: 'center',
  },
  ringMid: {
    width: RING_MID, height: RING_MID, borderRadius: RING_MID / 2,
    backgroundColor: colors.greenA10, alignItems: 'center', justifyContent: 'center',
  },
  sun: {
    width: SUN, height: SUN, borderRadius: SUN / 2, backgroundColor: '#0a1a0c',
    borderWidth: 1.5, borderColor: colors.greenA30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 30, elevation: 10,
  },
  wordmark: { fontFamily: fontFamily.displayBlack, fontSize: 44, letterSpacing: -2, color: colors.green, textShadowColor: 'rgba(26,240,96,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 18 },
  flagStripe: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden', width: 44, marginTop: spacing.sm },
  flagSeg: { flex: 1 },

  headline: { marginTop: 'auto', marginBottom: 'auto', paddingVertical: spacing.giant },
  headLine: { fontFamily: fontFamily.displayBlack, fontSize: 37, lineHeight: 46, letterSpacing: -1.6, color: colors.white },
  headIndent: { marginLeft: 34 },
  headAccent: { color: colors.flagGold, textShadowColor: 'rgba(250,216,54,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 },

  ctaBlock: { marginTop: 'auto', paddingBottom: spacing.xl },
  primaryBtn: {
    height: 58, borderRadius: radius.round, backgroundColor: colors.flagGold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.flagGold, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 18, elevation: 6,
  },
  primaryBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 15, color: colors.ink },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginVertical: spacing.lg },
  orLine: { flex: 1, height: 1, backgroundColor: colors.whiteA12 },
  orText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: colors.whiteA40 },

  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.md,
    height: 52, borderRadius: radius.round, borderWidth: 1.5, borderColor: colors.whiteA25,
    marginBottom: spacing.md, backgroundColor: colors.whiteA06,
  },
  outlineBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 13.5, color: colors.white },

  caption: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: colors.whiteA40, textAlign: 'center', marginTop: spacing.sm, letterSpacing: 0.4 },
});

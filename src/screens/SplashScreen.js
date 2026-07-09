import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from 'react-native-svg';
import K21Logo from '../components/K21Logo';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

const LANGS = [
  { code: 'FR', splash: 'FR', name: 'Français' },
  { code: 'WO', splash: 'WO', name: 'Wolof' },
  { code: 'EN', splash: 'EN', name: 'English' },
];
const SPLASH_FROM_CODE = { fr: 'FR', wo: 'WO', en: 'EN' };

/** Locked splash from design/k21-onboarding.html — dark Dakar canvas, stacked K21 mark, premium CTAs. */
export default function SplashScreen({ onCreateAccount, onHaveAccount }) {
  const enter = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const { langCode, setLanguageFromSplash } = useLocale();
  const activeLang = SPLASH_FROM_CODE[langCode] ?? 'FR';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(enter, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(float, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(float, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [enter, float]);

  const rise = {
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

  const markFloat = {
    transform: [{ translateY: float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
  };

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
          <Defs>
            <RadialGradient id="spOrange" cx="30%" cy="18%" r="55%">
              <Stop offset="0%" stopColor="#ff6422" stopOpacity={0.22} />
              <Stop offset="100%" stopColor="#ff6422" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="spGold" cx="72%" cy="78%" r="55%">
              <Stop offset="0%" stopColor="#f7b731" stopOpacity={0.14} />
              <Stop offset="100%" stopColor="#f7b731" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="spGreen" cx="50%" cy="50%" r="65%">
              <Stop offset="0%" stopColor="#1af060" stopOpacity={0.08} />
              <Stop offset="100%" stopColor="#1af060" stopOpacity={0} />
            </RadialGradient>
            <LinearGradient id="spDiamond" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.035} />
              <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width="100" height="100" fill={colors.ink} />
          <Rect width="100" height="100" fill="url(#spOrange)" />
          <Rect width="100" height="100" fill="url(#spGold)" />
          <Rect width="100" height="100" fill="url(#spGreen)" />
          <Rect width="100" height="100" fill="url(#spDiamond)" />
        </Svg>
        <WaxPattern color="rgba(255,255,255,0.04)" size={20} durationMs={90000} />
      </View>

      <SafeAreaView style={styles.safe}>
        <View style={styles.frame}>
          <Animated.View style={[styles.center, rise]}>
            <Animated.View style={[styles.markWrap, markFloat]}>
              <K21Logo size={112} />
            </Animated.View>
            <Text style={styles.tagline}>{t(langCode, 'splashBrandLine')}</Text>
            <Text style={styles.subline}>{t(langCode, 'splashTagline')}</Text>

            <View style={styles.ctaBlock}>
              <GlowButton label={t(langCode, 'splashCreate')} onPress={onCreateAccount} tone="green" style={styles.primaryBtn} />
              <PressScale scaleTo={0.98} onPress={onHaveAccount} style={styles.secondaryBtn}>
                <Text style={styles.secondaryBtnText}>{t(langCode, 'splashHaveAccount')}</Text>
              </PressScale>
            </View>
            <Text style={styles.caption}>{t(langCode, 'splashCaption')}</Text>
          </Animated.View>

          <View style={styles.langRow}>
            {LANGS.map((l) => {
              const on = activeLang === l.code;
              return (
                <PressScale
                  key={l.code}
                  scaleTo={0.96}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={l.name}
                  onPress={() => setLanguageFromSplash(l.splash)}
                  style={styles.langBtn}
                >
                  <Text style={[styles.langText, on && styles.langTextOn]}>{l.code}</Text>
                </PressScale>
              );
            })}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  safe: { flex: 1, width: '100%' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: spacing.xxl,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
  },
  markWrap: {
    marginBottom: spacing.xl,
    ...Platform.select({
      web: { filter: 'drop-shadow(0 0 40px rgba(26,240,96,0.25))' },
      default: {
        shadowColor: colors.green,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
    }),
  },
  tagline: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 10,
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.38)',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subline: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.52)',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: spacing.giant + 4,
  },
  ctaBlock: {
    width: '100%',
    maxWidth: 300,
    gap: 10,
  },
  primaryBtn: {
    height: 52,
    borderRadius: 14,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  secondaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.62)',
  },
  caption: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    marginTop: spacing.lg,
    letterSpacing: 0.4,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
  },
  langBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.md,
  },
  langText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.28)',
  },
  langTextOn: {
    fontFamily: fontFamily.displayBlack,
    color: colors.green,
  },
});

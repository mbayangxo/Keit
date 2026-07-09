import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
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

export default function SplashScreen({ onCreateAccount, onHaveAccount }) {
  const sunrise = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
  const lines = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const ctas = useRef(new Animated.Value(0)).current;
  const { langCode, setLanguageFromSplash } = useLocale();
  const activeLang = SPLASH_FROM_CODE[langCode] ?? 'FR';

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
    const orbit = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: true }),
    );
    const sweep = Animated.loop(
      Animated.sequence([
        Animated.delay(2600),
        Animated.timing(sheen, { toValue: 1, duration: 950, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(sheen, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    breathe.start();
    glow.start();
    orbit.start();
    sweep.start();
    return () => {
      breathe.stop();
      glow.stop();
      orbit.stop();
      sweep.stop();
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

      <SafeAreaView style={styles.safe}>
        <View style={styles.frame}>
          {/* Language — segmented control, top-left only (no sign-in here) */}
          <View style={styles.topBar}>
            <View style={styles.langSegment} accessibilityRole="tablist">
              {LANGS.map((l) => {
                const on = activeLang === l.code;
                return (
                  <PressScale
                    key={l.code}
                    scaleTo={0.97}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={l.name}
                    onPress={() => setLanguageFromSplash(l.splash)}
                    style={[styles.langChip, on && styles.langChipOn]}
                  >
                    <Text style={[styles.langChipText, on && styles.langChipTextOn]}>{l.code}</Text>
                  </PressScale>
                );
              })}
            </View>
          </View>

          <Animated.View
            style={[
              styles.hero,
              {
                opacity: sunrise,
                transform: [{ scale: sunrise.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }],
              },
            ]}
          >
            <Animated.View style={[styles.ringOuter, ringPulse(1, 1.06)]}>
              <Animated.View style={[styles.ringMid, ringPulse(1.03, 1)]}>
                <Animated.View
                  style={[
                    styles.dashRing,
                    { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
                  ]}
                />
                <View style={styles.sun}>
                  <Animated.View
                    style={[
                      styles.sunSheen,
                      {
                        transform: [
                          { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-SUN, SUN] }) },
                          { rotate: '22deg' },
                        ],
                      },
                    ]}
                  />
                  <Text style={styles.wordmark}>K21</Text>
                  <View style={styles.flagStripe}>
                    <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
                    <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
                    <View style={[styles.flagSeg, { backgroundColor: colors.terracotta }]} />
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </Animated.View>

          <View style={styles.headline}>
            <Animated.Text style={[styles.headLine, lineStyle(lines[0])]}>{t(langCode, 'splashHead1')}</Animated.Text>
            <Animated.Text style={[styles.headLine, styles.headIndent, lineStyle(lines[1])]}>{t(langCode, 'splashHead2')}</Animated.Text>
            <Animated.View style={lineStyle(lines[2])}>
              <Animated.Text
                style={[
                  styles.headLine,
                  styles.headAccent,
                  {
                    opacity: goldPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] }),
                  },
                ]}
              >
                {t(langCode, 'splashHead3')}
              </Animated.Text>
            </Animated.View>
          </View>

          <Animated.View style={[styles.ctaBlock, lineStyle(ctas)]}>
            <GlowButton label={t(langCode, 'splashCreate')} onPress={onCreateAccount} tone="green" style={styles.primaryBtn} />
            <PressScale scaleTo={0.98} onPress={onHaveAccount} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>{t(langCode, 'splashSignInAction')}</Text>
            </PressScale>
            <Text style={styles.caption}>{t(langCode, 'splashCaption')}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const RING_OUTER = 220;
const RING_MID = 182;
const SUN = 142;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  safe: { flex: 1, width: '100%' },
  frame: {
    flex: 1,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: spacing.xxl,
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    zIndex: 30,
  },
  langSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    padding: 3,
    ...Platform.select({
      web: { boxShadow: '0 2px 12px rgba(5,8,5,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  langChip: {
    minWidth: 44,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  langChipOn: {
    backgroundColor: colors.green,
  },
  langChipText: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.6,
    color: 'rgba(5,8,5,0.45)',
  },
  langChipTextOn: {
    fontFamily: fontFamily.displayBlack,
    color: colors.ink,
  },

  hero: { alignItems: 'center', marginTop: spacing.lg },
  ringOuter: {
    width: RING_OUTER,
    height: RING_OUTER,
    borderRadius: RING_OUTER / 2,
    backgroundColor: 'rgba(26,240,96,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringMid: {
    width: RING_MID,
    height: RING_MID,
    borderRadius: RING_MID / 2,
    backgroundColor: 'rgba(26,240,96,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashRing: {
    position: 'absolute',
    width: SUN + 20,
    height: SUN + 20,
    borderRadius: (SUN + 20) / 2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(15,188,72,0.45)',
  },
  sun: {
    width: SUN,
    height: SUN,
    borderRadius: SUN / 2,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  sunSheen: {
    position: 'absolute',
    top: -SUN * 0.3,
    bottom: -SUN * 0.3,
    width: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  wordmark: { fontFamily: fontFamily.displayBlack, fontSize: 40, letterSpacing: -2, color: colors.green },
  flagStripe: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden', width: 40, marginTop: spacing.sm },
  flagSeg: { flex: 1 },

  headline: { marginTop: spacing.xl, marginBottom: spacing.md },
  headLine: { fontFamily: fontFamily.displayBlack, fontSize: 32, lineHeight: 40, letterSpacing: -1.4, color: colors.ink },
  headIndent: { marginLeft: 28 },
  headAccent: { color: colors.goldDark },

  ctaBlock: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    gap: spacing.sm + 2,
    paddingBottom: spacing.xl,
  },
  primaryBtn: { height: 52, borderRadius: 14 },
  secondaryBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.12)',
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(5,8,5,0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  secondaryBtnText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: 'rgba(5,8,5,0.72)',
  },
  caption: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: 'rgba(5,8,5,0.42)',
    textAlign: 'center',
    marginTop: spacing.xs,
    letterSpacing: 0.3,
  },
});

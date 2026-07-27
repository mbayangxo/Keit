import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import ScreenBackground from '../components/ScreenBackground';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

const LANGS = ['FR', 'WO', 'EN'];
const LANG_NAMES = { FR: 'Français', WO: 'Wolof', EN: 'English' };
const SPLASH_FROM_CODE = { fr: 'FR', wo: 'WO', en: 'EN' };

// design/k21-onboarding.html Screen 1 — logo + headline centered,
// primary + secondary CTAs side-by-side in the center (not pinned to bottom).
export default function SplashScreen({ onCreateAccount, onHaveAccount }) {
  const sunrise = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(0)).current;
  const lines = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const ctas = useRef(new Animated.Value(0)).current;
  const tickerFade = useRef(new Animated.Value(1)).current;
  const [tickerIx, setTickerIx] = useState(0);
  const { langCode, setLanguageFromSplash } = useLocale();
  const lang = SPLASH_FROM_CODE[langCode] ?? 'FR';
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(sunrise, { toValue: 1, duration: 650, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.stagger(
        130,
        [
          ...lines.map((v) => Animated.spring(v, { toValue: 1, friction: 7, tension: 60, useNativeDriver: true })),
          Animated.timing(ctas, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ],
      ),
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
    breathe.start();
    glow.start();

    const ticker = setInterval(() => {
      Animated.timing(tickerFade, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setTickerIx((i) => (i + 1) % 3);
        Animated.timing(tickerFade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    }, 3400);

    return () => {
      breathe.stop();
      glow.stop();
      clearInterval(ticker);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lineStyle = (v) => ({
    opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
    transform: [
      { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [34, 0] }) },
      { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) },
    ],
  });

  const ctaStyle = {
    opacity: ctas.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 1] }),
    transform: [{ translateY: ctas.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }],
  };

  const renderStagger = (text, v, baseStyle) => {
    const chars = [...String(text)];
    const n = Math.max(chars.length, 1);
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {chars.map((ch, i) => {
          const start = (i / n) * 0.55;
          const end = Math.min(start + 0.45, 1);
          return (
            <Animated.Text
              key={`${i}-${ch}`}
              style={[
                baseStyle,
                {
                  opacity: v.interpolate({ inputRange: [0, start, end, 1], outputRange: [0, 0, 1, 1] }),
                  transform: [
                    {
                      translateY: v.interpolate({
                        inputRange: [0, start, end, 1],
                        outputRange: [26, 26, 0, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              {ch === ' ' ? '\u00A0' : ch}
            </Animated.Text>
          );
        })}
      </View>
    );
  };

  const ringPulse = (from, to) => ({
    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [from, to] }) }],
  });

  return (
    <View style={styles.root}>
      <ScreenBackground soft />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Top — language only */}
        <View style={styles.topBar}>
          <View style={styles.langWrap}>
            <PressScale scaleTo={0.94} onPress={() => setLangOpen((o) => !o)} style={styles.langBtn}>
              <Text style={styles.langBtnText}>🌍 {lang}</Text>
              <Text style={styles.langCaret}>{langOpen ? '▴' : '▾'}</Text>
            </PressScale>
            {langOpen && (
              <View style={styles.langMenu}>
                {LANGS.filter((l) => l !== lang).map((l) => (
                  <PressScale
                    key={l}
                    scaleTo={0.95}
                    onPress={() => {
                      setLanguageFromSplash(l);
                      setLangOpen(false);
                    }}
                    style={styles.langItem}
                  >
                    <Text style={styles.langItemText}>{LANG_NAMES[l]}</Text>
                  </PressScale>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Center — logo + headline + ticker */}
        <View style={styles.center}>
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
                    <View style={[styles.flagSeg, { backgroundColor: colors.terracotta }]} />
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
            <Text style={styles.brandLine}>{t(langCode, 'splashBrandLine')}</Text>
          </Animated.View>

          <View style={styles.headline}>
            {renderStagger(t(langCode, 'splashHead1'), lines[0], styles.headLine)}
            <View style={styles.headIndent}>
              {renderStagger(t(langCode, 'splashHead2'), lines[1], styles.headLine)}
            </View>
            <Animated.View
              style={{
                opacity: goldPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.78] }),
                transform: [{ scale: goldPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }],
              }}
            >
              {renderStagger(t(langCode, 'splashHead3'), lines[2], [styles.headLine, styles.headAccent])}
            </Animated.View>
          </View>

          <Animated.View style={[styles.tickerWrap, { opacity: tickerFade }]}>
            <View style={styles.tickerDot} />
            <Text style={styles.tickerText} numberOfLines={2}>
              {t(langCode, `splashTicker${tickerIx + 1}`)}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.ctaRow, ctaStyle]}>
            <PressScale scaleTo={0.97} onPress={onCreateAccount} style={styles.primaryBtn}>
              <LinearGradient
                colors={['#ffe45c', colors.flagGold, colors.goldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.primaryBtnText} numberOfLines={2}>
                {t(langCode, 'splashCreateAccount')}
              </Text>
              <View style={styles.primaryBtnStripe}>
                <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
                <View style={[styles.flagSeg, { backgroundColor: colors.ink }]} />
                <View style={[styles.flagSeg, { backgroundColor: colors.terracotta }]} />
              </View>
            </PressScale>

            <PressScale scaleTo={0.97} onPress={onHaveAccount} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText} numberOfLines={2}>
                {t(langCode, 'splashHaveAccount')}
              </Text>
            </PressScale>
          </Animated.View>

          <Animated.Text style={[styles.caption, ctaStyle]}>{t(langCode, 'splashCaption')}</Animated.Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const RING_OUTER = 148;
const RING_MID = 122;
const SUN = 96;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  safe: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.giant,
    paddingTop: spacing.sm,
    zIndex: 30,
  },
  langWrap: { position: 'relative', zIndex: 20 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: radius.round,
    paddingVertical: 4,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
  },
  langBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: 'rgba(5,8,5,0.75)' },
  langCaret: { fontSize: 8, color: 'rgba(5,8,5,0.5)' },
  langMenu: {
    position: 'absolute',
    top: 28,
    left: 0,
    minWidth: 92,
    backgroundColor: '#ffffff',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  langItem: { paddingVertical: 6, paddingHorizontal: spacing.lg },
  langItemText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11.5, color: colors.ink },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.giant,
    paddingVertical: spacing.lg,
  },

  hero: { alignItems: 'center', marginBottom: spacing.lg },
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
    backgroundColor: 'rgba(26,240,96,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  wordmark: { fontFamily: fontFamily.displayBlack, fontSize: 34, letterSpacing: -1.5, color: colors.green },
  flagStripe: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden', width: 36, marginTop: spacing.xs },
  flagSeg: { flex: 1 },
  brandLine: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 9,
    letterSpacing: 2.5,
    color: 'rgba(5,8,5,0.45)',
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },

  headline: { alignItems: 'center', marginBottom: spacing.lg, width: '100%' },
  headLine: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -1.2,
    color: colors.ink,
    textAlign: 'center',
  },
  headIndent: { marginLeft: 0 },
  headAccent: { color: colors.goldDark, textShadowColor: 'rgba(232,146,10,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },

  tickerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.round,
    borderBottomRightRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: spacing.lg,
    maxWidth: '100%',
  },
  tickerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.greenDark },
  tickerText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: 'rgba(5,8,5,0.7)', flexShrink: 1 },

  ctaRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm,
    width: '100%',
    marginTop: spacing.xl,
  },
  primaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.xl,
    borderBottomRightRadius: 12,
    backgroundColor: colors.flagGold,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    shadowColor: colors.goldDark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtnText: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 12,
    lineHeight: 15,
    letterSpacing: 0.1,
    color: colors.ink,
    textAlign: 'center',
  },
  primaryBtnStripe: {
    position: 'absolute',
    bottom: 0,
    left: '22%',
    right: '22%',
    height: 3,
    flexDirection: 'row',
    borderRadius: 2,
    overflow: 'hidden',
  },
  secondaryBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: radius.xl,
    borderBottomRightRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
  },
  secondaryBtnText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    lineHeight: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  caption: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 11,
    color: 'rgba(5,8,5,0.5)',
    textAlign: 'center',
    marginTop: spacing.md,
    letterSpacing: 0.4,
    paddingHorizontal: spacing.md,
  },
});

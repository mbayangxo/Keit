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

// Entry screen — editorial "lifestyle brand" treatment (no photos):
// crisp animated sunrise mark + stacked display headline + one gold CTA,
// on the shared bright canvas (ScreenBackground) used across the app.
// Apple/Google sign-in removed until real OAuth credentials exist —
// email/phone signup is the single entry path for the beta.
export default function SplashScreen({ onCreateAccount, onHaveAccount }) {
  const sunrise = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const goldPulse = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const sheen = useRef(new Animated.Value(0)).current;
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
    // Crisp logo motion — a dashed orbit slowly turning around the mark,
    // and a light sweep crossing the disc every few seconds.
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
    // Promise ticker — one live line cycling through the three K21 pillars.
    const ticker = setInterval(() => {
      Animated.timing(tickerFade, { toValue: 0, duration: 260, useNativeDriver: true }).start(() => {
        setTickerIx((i) => (i + 1) % 3);
        Animated.timing(tickerFade, { toValue: 1, duration: 320, useNativeDriver: true }).start();
      });
    }, 3400);
    return () => {
      breathe.stop();
      glow.stop();
      orbit.stop();
      sweep.stop();
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

  // Letter cascade — each glyph rises a beat after the previous one, all
  // driven by the line's single Animated value (no per-letter timers).
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
      <ScreenBackground />

      <SafeAreaView style={{ flex: 1, width: '100%' }}>
        <View style={styles.frame}>
          {/* Top bar — language switch left, sign-in right (Sendwave-style "Log in") */}
          <View style={styles.topBar}>
            {/* One quiet dropdown instead of a row of pills */}
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
            <View />
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
            <Animated.View
              style={[
                styles.sunriseArc,
                {
                  opacity: sunrise.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 0.55] }),
                  transform: [
                    { translateY: sunrise.interpolate({ inputRange: [0, 1], outputRange: [70, 18] }) },
                    { scaleX: 1.35 },
                  ],
                },
              ]}
            />
            <Animated.View style={[styles.ringOuter, ringPulse(1, 1.07)]}>
              <Animated.View style={[styles.ringMid, ringPulse(1.04, 1)]}>
                <Animated.View
                  style={[
                    styles.dashRing,
                    { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
                  ]}
                >
                  {ORBITERS.map((o) => (
                    <View key={o.icon} style={[styles.orbiter, o.pos]}>
                      <Animated.Text
                        style={{
                          fontSize: 15,
                          transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) }],
                        }}
                      >
                        {o.icon}
                      </Animated.Text>
                    </View>
                  ))}
                </Animated.View>
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
            <Text style={styles.brandLine}>{t(langCode, 'splashBrandLine')}</Text>
          </Animated.View>

          {/* Editorial stacked headline */}
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
            <Text style={styles.tickerText} numberOfLines={1}>
              {t(langCode, `splashTicker${tickerIx + 1}`)}
            </Text>
          </Animated.View>

          <Animated.View style={[styles.ctaBlock, lineStyle(ctas)]}>
            <PressScale scaleTo={0.97} onPress={onCreateAccount} style={styles.primaryBtn}>
              <LinearGradient
                colors={['#ffe45c', colors.flagGold, colors.goldDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View
                style={[
                  styles.primaryBtnSheen,
                  {
                    transform: [
                      { translateX: sheen.interpolate({ inputRange: [0, 1], outputRange: [-220, 380] }) },
                      { rotate: '18deg' },
                    ],
                  },
                ]}
              />
              <Text style={styles.primaryBtnText}>{t(langCode, 'splashCreate')}</Text>
              <Animated.View
                style={[
                  styles.primaryBtnBadge,
                  { transform: [{ translateX: goldPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 3] }) }] },
                ]}
              >
                <Text style={styles.primaryBtnBadgeArrow}>→</Text>
              </Animated.View>
              <View style={styles.primaryBtnStripe}>
                <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
                <View style={[styles.flagSeg, { backgroundColor: colors.ink }]} />
                <View style={[styles.flagSeg, { backgroundColor: colors.terracotta }]} />
              </View>
            </PressScale>

            <PressScale scaleTo={0.97} onPress={onHaveAccount} style={styles.secondaryBtn}>
              <Text style={styles.secondaryBtnText}>
                {t(langCode, 'splashHaveAccount')} <Text style={styles.secondaryBtnBold}>{t(langCode, 'splashSignInAction')}</Text>
              </Text>
            </PressScale>

            <Text style={styles.caption}>{t(langCode, 'splashCaption')}</Text>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const ORB = 34;
const ORBITERS = [
  { icon: '💸', pos: { top: -ORB / 2, left: ((168 + 24) - ORB) / 2 } },
  { icon: '🎶', pos: { bottom: 6, right: -ORB / 4 } },
  { icon: '🍖', pos: { bottom: 6, left: -ORB / 4 } },
];

const RING_OUTER = 260;
const RING_MID = 214;
const SUN = 168;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  frame: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center', paddingHorizontal: spacing.giant },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.lg, zIndex: 30 },
  langRow: { flexDirection: 'row', gap: spacing.xs },
  langWrap: { position: 'relative', zIndex: 20 },
  langBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: radius.round, paddingVertical: 4, paddingHorizontal: spacing.md + 2,
    backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)',
  },
  langBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: 'rgba(5,8,5,0.75)' },
  langCaret: { fontSize: 8, color: 'rgba(5,8,5,0.5)' },
  // Thin, compact menu — must never reach down to the logo mark.
  langMenu: {
    position: 'absolute', top: 28, left: 0, minWidth: 92,
    backgroundColor: '#ffffff', borderRadius: radius.lg, borderWidth: 1, borderColor: 'rgba(5,8,5,0.08)',
    paddingVertical: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
  },
  langItem: { paddingVertical: 6, paddingHorizontal: spacing.lg },
  langItemText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11.5, color: colors.ink },
  loginLink: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: 'rgba(5,8,5,0.75)', textDecorationLine: 'underline' },

  hero: { alignItems: 'center', marginTop: spacing.giant },
  // Warm gold half-glow rising behind the mark on first load — the sunrise.
  sunriseArc: {
    position: 'absolute', alignSelf: 'center', top: 60,
    width: 300, height: 150, borderTopLeftRadius: 150, borderTopRightRadius: 150,
    backgroundColor: 'rgba(250,216,54,0.28)',
  },
  ringOuter: {
    width: RING_OUTER, height: RING_OUTER, borderRadius: RING_OUTER / 2,
    backgroundColor: 'rgba(26,240,96,0.10)', alignItems: 'center', justifyContent: 'center',
  },
  ringMid: {
    width: RING_MID, height: RING_MID, borderRadius: RING_MID / 2,
    backgroundColor: 'rgba(26,240,96,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  dashRing: {
    position: 'absolute', width: SUN + 24, height: SUN + 24, borderRadius: (SUN + 24) / 2,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(15,188,72,0.6)',
  },
  // The money/culture loop — three mini-discs riding the orbit, kept upright
  // by counter-rotation: send money, vote your song, eat together.
  orbiter: {
    position: 'absolute', width: ORB, height: ORB, borderRadius: ORB / 2, borderBottomRightRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.95)', borderWidth: 1.5, borderColor: 'rgba(5,8,5,0.1)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  sun: {
    width: SUN, height: SUN, borderRadius: SUN / 2, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: colors.green, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10,
  },
  sunSheen: {
    position: 'absolute', top: -SUN * 0.3, bottom: -SUN * 0.3, width: 34,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  // Crisp wordmark — no text shadow (it read as blur), pure sharp letterforms.
  wordmark: { fontFamily: fontFamily.displayBlack, fontSize: 46, letterSpacing: -2, color: colors.green },
  flagStripe: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden', width: 44, marginTop: spacing.sm },
  flagSeg: { flex: 1 },
  brandLine: { fontFamily: fontFamily.bodyBold, fontSize: 10, letterSpacing: 3, color: 'rgba(5,8,5,0.45)', textTransform: 'uppercase', marginTop: spacing.xl },

  headline: { marginTop: 'auto', paddingTop: spacing.giant, paddingBottom: spacing.xl },
  headLine: { fontFamily: fontFamily.displayBlack, fontSize: 37, lineHeight: 46, letterSpacing: -1.6, color: colors.ink },
  headIndent: { marginLeft: 34 },
  headAccent: { color: colors.goldDark, textShadowColor: 'rgba(232,146,10,0.25)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },

  tickerWrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    alignSelf: 'flex-start', marginTop: spacing.lg, marginBottom: 'auto',
    backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.round, borderBottomRightRadius: 8,
    paddingVertical: 7, paddingHorizontal: spacing.lg, maxWidth: '100%',
  },
  tickerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.greenDark },
  tickerText: { fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: 'rgba(5,8,5,0.7)', flexShrink: 1 },

  ctaBlock: { marginTop: 'auto', paddingBottom: spacing.xl },
  // K21 signature button: pill with one "cut" corner (bottom-right), an ink
  // arrow badge, and the flag micro-stripe — no other app has this shape.
  primaryBtn: {
    height: 58, borderRadius: radius.round, borderBottomRightRadius: 10,
    backgroundColor: colors.flagGold, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.goldDark, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.45, shadowRadius: 20, elevation: 8,
  },
  primaryBtnSheen: {
    position: 'absolute', top: -20, bottom: -20, width: 46,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  primaryBtnText: { fontFamily: fontFamily.displayBlack, fontSize: 13, letterSpacing: 0.4, color: colors.ink },
  primaryBtnBadge: {
    position: 'absolute', right: 10, width: 38, height: 38, borderRadius: 19, borderBottomRightRadius: 7,
    backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnBadgeArrow: { fontSize: 16, color: colors.flagGold },
  primaryBtnStripe: { position: 'absolute', bottom: 0, left: '38%', right: '38%', height: 3, flexDirection: 'row', borderRadius: 2, overflow: 'hidden' },



  secondaryBtn: {
    marginTop: spacing.md, height: 46, borderRadius: radius.round, borderBottomRightRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1.5, borderColor: 'rgba(5,8,5,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { fontFamily: fontFamily.bodyMedium, fontSize: 13, color: 'rgba(5,8,5,0.6)' },
  secondaryBtnBold: { fontFamily: fontFamily.bodyBold, color: colors.greenDark },

  caption: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: 'rgba(5,8,5,0.5)', textAlign: 'center', marginTop: spacing.md, letterSpacing: 0.4 },
});

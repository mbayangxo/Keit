import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

// Three worlds of K21, one per slide — each a crafted brand composition,
// no emoji, no stock art: the zero-fee promise, 221 Bëgg music, and the
// Mboolo/tontine community circle.

/** Slide 1 — giant tilted "0%" over the brand green field. */
function ZeroVisual() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View style={vs.center}>
      <Animated.View
        style={[
          vs.zeroHalo,
          { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] },
        ]}
      />
      <Animated.Text
        style={[
          vs.zeroText,
          {
            transform: [
              { rotate: '-7deg' },
              { scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) },
            ],
          },
        ]}
      >
        0%
      </Animated.Text>
      <View style={vs.zeroStripe}>
        <View style={[vs.stripeSeg, { backgroundColor: colors.green }]} />
        <View style={[vs.stripeSeg, { backgroundColor: colors.flagGold }]} />
        <View style={[vs.stripeSeg, { backgroundColor: colors.flagRed }]} />
      </View>
    </View>
  );
}

/** Slide 2 — living equalizer in flag colors on the ink field. */
function EqualizerBar({ color, delay, tall }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(v, { toValue: 1, duration: 460 + delay / 3, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: 520 + delay / 4, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [v, delay]);

  return (
    <Animated.View
      style={[
        vs.eqBar,
        {
          backgroundColor: color,
          height: tall,
          transform: [{ scaleY: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }) }],
        },
      ]}
    />
  );
}

function MusicVisual() {
  const bars = [
    { color: colors.green, tall: 74, delay: 0 },
    { color: colors.flagGold, tall: 120, delay: 140 },
    { color: colors.flagRed, tall: 96, delay: 260 },
    { color: colors.green, tall: 150, delay: 80 },
    { color: colors.flagGold, tall: 88, delay: 320 },
    { color: colors.flagRed, tall: 128, delay: 200 },
    { color: colors.green, tall: 66, delay: 380 },
  ];
  return (
    <View style={vs.center}>
      <View style={vs.eqRow}>
        {bars.map((b, i) => (
          <EqualizerBar key={i} {...b} />
        ))}
      </View>
      <Text style={vs.eqCaption}>221 BËGG</Text>
    </View>
  );
}

/** Slide 3 — the tontine circle: people-dots orbiting the shared pot. */
function TontineVisual() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 26000, easing: Easing.linear, useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const R = 108;
  const DOTS = 9;
  return (
    <View style={vs.center}>
      <Animated.View
        style={[
          vs.orbit,
          { width: R * 2 + 26, height: R * 2 + 26, borderRadius: R + 13 },
          { transform: [{ rotate: spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] },
        ]}
      >
        {Array.from({ length: DOTS }).map((_, i) => {
          const a = (i / DOTS) * Math.PI * 2;
          return (
            <View
              key={i}
              style={[
                vs.orbitDot,
                i % 3 === 0 && { backgroundColor: colors.flagGold },
                {
                  left: R + 13 + Math.cos(a) * R - 9,
                  top: R + 13 + Math.sin(a) * R - 9,
                },
              ]}
            />
          );
        })}
      </Animated.View>
      <View style={vs.pot}>
        <Text style={vs.potText}>K21</Text>
      </View>
    </View>
  );
}

const vs = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  zeroHalo: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: colors.greenA08 },
  zeroText: { fontFamily: fontFamily.displayBlack, fontSize: 128, letterSpacing: -6, color: colors.green, textShadowColor: 'rgba(26,240,96,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 30 },
  zeroStripe: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', width: 74, marginTop: spacing.md },
  stripeSeg: { flex: 1 },

  eqRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 160 },
  eqBar: { width: 18, borderRadius: 9 },
  eqCaption: { fontFamily: fontFamily.displayBlack, fontSize: 15, letterSpacing: 4, color: colors.whiteA55, marginTop: spacing.xxl },

  orbit: { position: 'absolute', borderWidth: 1.5, borderColor: colors.whiteA20, borderStyle: 'dashed' },
  orbitDot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.terracottaLight },
  pot: {
    width: 108, height: 108, borderRadius: 54, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.terracotta, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 26, elevation: 9,
  },
  potText: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1, color: colors.ink },
});

// One shared canvas (ScreenBackground) — each slide keeps its own color
// identity in the artwork and CTA, not in the wallpaper.
const SLIDES = [
  {
    key: 'payments',
    Visual: ZeroVisual,
    ctaBg: colors.green,
    ctaColor: colors.ink,
    accent: colors.green,
  },
  {
    key: 'music',
    Visual: MusicVisual,
    ctaBg: colors.flagGold,
    ctaColor: colors.ink,
    accent: colors.flagGold,
  },
  {
    key: 'community',
    Visual: TontineVisual,
    ctaBg: colors.terracotta,
    ctaColor: colors.white,
    accent: colors.terracottaLight,
  },
];

export default function WelcomeScreen({ onComplete }) {
  const { langCode } = useLocale();
  const [index, setIndex] = useState(0);
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, { toValue: 1, duration: 480, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [index, enter]);

  const slides = useMemo(
    () =>
      SLIDES.map((meta, i) => ({
        ...meta,
        titleLine1: t(langCode, `welcomeSlide${i + 1}Title1`),
        titleLine2: t(langCode, `welcomeSlide${i + 1}Title2`),
        body: t(langCode, `welcomeSlide${i + 1}Body`),
        button: t(langCode, `welcomeSlide${i + 1}Btn`),
      })),
    [langCode],
  );

  const slide = slides[index];
  const { Visual } = slide;

  const goNext = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else onComplete?.();
  };

  const rise = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) }],
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.frame}>
          <View style={styles.topBar}>
            <Text style={[styles.brandMark, { color: colors.green }]}>K21</Text>
            <PressScale scaleTo={0.94} onPress={onComplete}>
              <Text style={[styles.skipText, { color: colors.whiteA55 }]}>{t(langCode, 'welcomeSkip')}</Text>
            </PressScale>
          </View>

          <Animated.View style={[{ flex: 1 }, rise]}>
            <Visual />
          </Animated.View>

          <Animated.View style={[styles.bottom, rise]}>
            <View style={styles.dotsRow}>
              {slides.map((s, i) => (
                <View
                  key={s.key}
                  style={[
                    styles.dot,
                    { backgroundColor: colors.whiteA20 },
                    i === index && { width: 22, backgroundColor: slide.accent },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.title, { color: colors.white }]}>
              {slide.titleLine1}
              {'\n'}
              <Text style={{ color: slide.accent }}>{slide.titleLine2}</Text>
            </Text>
            <Text style={[styles.body, { color: colors.whiteA55 }]}>{slide.body}</Text>
            <PressScale scaleTo={0.97} onPress={goNext} style={[styles.nextBtn, { backgroundColor: slide.ctaBg, shadowColor: slide.ctaBg }]}>
              <Text style={[styles.nextBtnText, { color: slide.ctaColor }]}>{slide.button}</Text>
            </PressScale>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  frame: { flex: 1, width: '100%', maxWidth: 420, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.lg },
  brandMark: { fontFamily: fontFamily.displayBlack, fontSize: 17, letterSpacing: -0.5 },
  skipText: { fontFamily: fontFamily.bodyBold, fontSize: 12, textDecorationLine: 'underline' },

  bottom: { paddingHorizontal: spacing.xxxl, paddingBottom: spacing.giant + 4 },
  dotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  dot: { width: 6, height: 6, borderRadius: 3 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 27, letterSpacing: -1, lineHeight: 34, marginBottom: spacing.md },
  body: { fontFamily: fontFamily.bodyRegular, fontSize: 13.5, lineHeight: 21, marginBottom: spacing.xxl },
  nextBtn: {
    width: '100%', height: 56, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 14, elevation: 6,
  },
  nextBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 14.5 },
});

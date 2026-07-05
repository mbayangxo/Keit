import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
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
        <View style={[vs.stripeSeg, { backgroundColor: colors.ink }]} />
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
  zeroHalo: { position: 'absolute', width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(5,8,5,0.09)' },
  zeroText: { fontFamily: fontFamily.displayBlack, fontSize: 128, letterSpacing: -6, color: colors.ink },
  zeroStripe: { flexDirection: 'row', height: 4, borderRadius: 2, overflow: 'hidden', width: 74, marginTop: spacing.md },
  stripeSeg: { flex: 1 },

  eqRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 160 },
  eqBar: { width: 18, borderRadius: 9 },
  eqCaption: { fontFamily: fontFamily.displayBlack, fontSize: 15, letterSpacing: 4, color: colors.whiteA55, marginTop: spacing.xxl },

  orbit: { position: 'absolute', borderWidth: 1.5, borderColor: 'rgba(5,8,5,0.22)', borderStyle: 'dashed' },
  orbitDot: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.ink },
  pot: {
    width: 108, height: 108, borderRadius: 54, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 18, elevation: 9,
  },
  potText: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1, color: colors.flagGold },
});

const SLIDES = [
  {
    key: 'payments',
    Visual: ZeroVisual,
    field: ['#25ff77', colors.green, '#12d954'],
    dark: false,
    ctaBg: colors.flagGold,
    ctaColor: colors.ink,
    titleColor: colors.ink,
    accent: 'rgba(5,8,5,0.55)',
    bodyColor: 'rgba(5,8,5,0.72)',
    wax: 'rgba(5,8,5,0.045)',
  },
  {
    key: 'music',
    Visual: MusicVisual,
    field: ['#0a0f0a', colors.ink, '#050805'],
    dark: true,
    ctaBg: colors.green,
    ctaColor: colors.ink,
    titleColor: colors.white,
    accent: colors.green,
    bodyColor: colors.whiteA55,
    wax: 'rgba(255,255,255,0.03)',
  },
  {
    key: 'community',
    Visual: TontineVisual,
    field: ['#ff7a36', colors.terracotta, colors.terracottaDark],
    dark: false,
    ctaBg: colors.ink,
    ctaColor: colors.flagGold,
    titleColor: colors.ink,
    accent: 'rgba(5,8,5,0.55)',
    bodyColor: 'rgba(5,8,5,0.75)',
    wax: 'rgba(5,8,5,0.05)',
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
      <LinearGradient colors={slide.field} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
      <WaxPattern color={slide.wax} size={22} durationMs={34000} />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.frame}>
          <View style={styles.topBar}>
            <Text style={[styles.brandMark, { color: slide.dark ? colors.green : colors.ink }]}>K21</Text>
            <PressScale scaleTo={0.94} onPress={onComplete}>
              <Text style={[styles.skipText, { color: slide.dark ? colors.whiteA55 : 'rgba(5,8,5,0.6)' }]}>
                {t(langCode, 'welcomeSkip')}
              </Text>
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
                    { backgroundColor: slide.dark ? colors.whiteA20 : 'rgba(5,8,5,0.2)' },
                    i === index && { width: 22, backgroundColor: slide.dark ? colors.green : colors.ink },
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.title, { color: slide.titleColor }]}>
              {slide.titleLine1}
              {'\n'}
              <Text style={{ color: slide.accent }}>{slide.titleLine2}</Text>
            </Text>
            <Text style={[styles.body, { color: slide.bodyColor }]}>{slide.body}</Text>
            <PressScale scaleTo={0.97} onPress={goNext} style={[styles.nextBtn, { backgroundColor: slide.ctaBg }]}>
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

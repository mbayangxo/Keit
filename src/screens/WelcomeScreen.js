import { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useFloatLoop } from '../hooks/animations';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

const { width } = Dimensions.get('window');

const SLIDE_META = [
  { key: 'payments', icon: '💸', accent: colors.green, glow: 'rgba(26,240,96,0.12)' },
  { key: 'music', icon: '🎵', accent: colors.orange, glow: 'rgba(255,100,34,0.12)' },
  { key: 'community', icon: '🏘️', accent: colors.flagGold, glow: 'rgba(247,183,49,0.12)' },
];

function SlideIcon({ icon }) {
  const float = useFloatLoop(0, 12, 2000);
  return (
    <Animated.Text style={[styles.icon, { transform: [{ translateY: float }] }]}>{icon}</Animated.Text>
  );
}

export default function WelcomeScreen({ onComplete }) {
  const { langCode } = useLocale();
  const [index, setIndex] = useState(0);

  const slides = useMemo(
    () =>
      SLIDE_META.map((meta, i) => ({
        ...meta,
        titleLine1: t(langCode, `welcomeSlide${i + 1}Title1`),
        titleLine2: t(langCode, `welcomeSlide${i + 1}Title2`),
        body: t(langCode, `welcomeSlide${i + 1}Body`),
        button: t(langCode, `welcomeSlide${i + 1}Btn`),
      })),
    [langCode]
  );

  const slide = slides[index];

  const goNext = () => {
    if (index < slides.length - 1) setIndex(index + 1);
    else onComplete?.();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.topBar}>
          <Text style={styles.brandMark}>K21</Text>
          <PressScale scaleTo={0.94} onPress={onComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>{t(langCode, 'welcomeSkip')}</Text>
          </PressScale>
        </View>

        <View style={styles.visual}>
          <View style={[styles.glow, { backgroundColor: slide.glow }]} />
          <SlideIcon icon={slide.icon} />
        </View>

        <View style={styles.bottom}>
          <View style={styles.dotsRow}>
            {slides.map((s, i) => (
              <View key={s.key} style={[styles.dot, i === index && styles.dotOn]} />
            ))}
          </View>
          <Text style={styles.title}>
            {slide.titleLine1}
            {'\n'}
            <Text style={{ color: slide.accent }}>{slide.titleLine2}</Text>
          </Text>
          <Text style={styles.body}>{slide.body}</Text>
          <PressScale scaleTo={0.96} onPress={goNext} style={[styles.nextBtn, { backgroundColor: slide.accent }]}>
            <Text style={[styles.nextBtnText, slide.accent === colors.flagGold && { color: colors.ink }]}>{slide.button}</Text>
          </PressScale>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxl, paddingTop: spacing.md },
  brandMark: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.green, letterSpacing: -0.5 },
  visual: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glow: { position: 'absolute', width: width * 1.4, height: width * 1.4, borderRadius: width * 0.7, top: '50%', left: '50%', marginLeft: -(width * 0.7), marginTop: -(width * 0.7) },
  icon: { fontSize: 80 },
  skipBtn: { backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  skipText: { fontSize: 11, color: colors.whiteA30 },

  bottom: { paddingHorizontal: spacing.xxxl, paddingTop: spacing.giant, paddingBottom: spacing.giant + 4 },
  dotsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xxl },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.whiteA12 },
  dotOn: { width: 20, backgroundColor: colors.green },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 20, letterSpacing: -0.5, lineHeight: 26, color: colors.white, marginBottom: spacing.md },
  body: { fontSize: 13, color: colors.whiteA40, lineHeight: 21, marginBottom: spacing.xxl },
  nextBtn: { width: '100%', height: 50, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 6 },
  nextBtnText: { fontFamily: fontFamily.displayBlack, fontSize: 11, letterSpacing: 0.5, color: colors.ink },
});

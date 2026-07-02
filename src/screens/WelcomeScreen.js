import { useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useFloatLoop } from '../hooks/animations';

// design/k21-onboarding.html, Screens 2a-2c (onboarding carousel) —
// reproduced closely: glowing icon visual, dot pagination, title with an
// accent-colored second line, and a Next button that matches each slide's
// accent color.
const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'payments',
    icon: '💸',
    accent: colors.green,
    glow: 'rgba(26,240,96,0.12)',
    titleLine1: 'Envoie de l’argent',
    titleLine2: 'sans frais. Pour de vrai.',
    body: 'Yónnee à ta famille, tes amis, tes marchands. Zéro frais. Zéro mauvaises surprises. L’argent arrive instantanément.',
    button: 'Suivant →',
  },
  {
    key: 'music',
    icon: '🎵',
    accent: colors.orange,
    glow: 'rgba(255,100,34,0.12)',
    titleLine1: 'La musique',
    titleLine2: 'sénégalaise reconnue.',
    body: '221 Bëgg — le premier classement basé sur ce que le Sénégal écoute vraiment. Pas les streams achetés. Toi tu décides.',
    button: 'Suivant →',
  },
  {
    key: 'community',
    icon: '🏘️',
    accent: colors.flagGold,
    glow: 'rgba(247,183,49,0.12)',
    titleLine1: 'Ton quartier.',
    titleLine2: 'Ton identité.',
    body: 'Mboolo, Tontine digitale, cagnottes de groupe. K21 c’est Dakar dans ta poche — pas une appli bancaire de plus.',
    button: 'C’est parti →',
  },
];

function SlideIcon({ icon }) {
  const float = useFloatLoop(0, 12, 2000);
  return (
    <Animated.Text style={[styles.icon, { transform: [{ translateY: float }] }]}>{icon}</Animated.Text>
  );
}

export default function WelcomeScreen({ onComplete }) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];

  const goNext = () => {
    if (index < SLIDES.length - 1) setIndex(index + 1);
    else onComplete?.();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.visual}>
          <View style={[styles.glow, { backgroundColor: slide.glow }]} />
          <SlideIcon icon={slide.icon} />
          <PressScale scaleTo={0.94} onPress={onComplete} style={styles.skipBtn}>
            <Text style={styles.skipText}>Passer</Text>
          </PressScale>
        </View>

        <View style={styles.bottom}>
          <View style={styles.dotsRow}>
            {SLIDES.map((s, i) => (
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
  visual: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  glow: { position: 'absolute', width: width * 1.4, height: width * 1.4, borderRadius: width * 0.7, top: '50%', left: '50%', marginLeft: -(width * 0.7), marginTop: -(width * 0.7) },
  icon: { fontSize: 80 },
  skipBtn: { position: 'absolute', top: spacing.xl, right: spacing.xxl, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
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

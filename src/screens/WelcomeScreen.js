import { useRef, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, spacing } from '../theme';

// No prototype exists for this screen. The value-prop intro every app
// needs before onboarding gets specific (country/language/phone) — three
// slides pulled directly from the brief's north star: zero-fee transfers,
// Mboolo as the cultural nervous system, and Wakhna recognition.
const { width } = Dimensions.get('window');

const SLIDES = [
  { key: 'money', icon: '💸', accent: colors.green, title: 'Zéro frais. Zéro attente.', body: 'Envoie et reçois de l’argent instantanément. Zéro frais sur tous tes envois domestiques.' },
  { key: 'mboolo', icon: '💬', accent: colors.terracotta, title: 'Ta communauté, en direct.', body: 'Messages, musique, tontines et cagnottes de groupe — tout ce qui compte, au même endroit.' },
  { key: 'wakhna', icon: '✦', accent: colors.flagGold, title: 'Ton mérite, reconnu.', body: 'Le Wakhna score reconnaît ta vraie contribution culturelle — pas juste des followers.' },
];

function Slide({ item }) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={[styles.iconRing, { backgroundColor: `${item.accent}1A`, borderColor: `${item.accent}40` }]}>
        <Text style={{ fontSize: 44 }}>{item.icon}</Text>
      </View>
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideBody}>{item.body}</Text>
    </View>
  );
}

export default function WelcomeScreen({ onComplete }) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef(null);

  const goNext = () => {
    if (index < SLIDES.length - 1) {
      const next = index + 1;
      setIndex(next);
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    } else {
      onComplete?.();
    }
  };

  const onScroll = (e) => setIndex(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.skipRow}>
          <PressScale scaleTo={0.94} onPress={onComplete}>
            <Text style={styles.skipText}>Passer</Text>
          </PressScale>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s) => (
            <Slide key={s.key} item={s} />
          ))}
        </ScrollView>

        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && { backgroundColor: colors.green, width: 20 }]} />
          ))}
        </View>

        <View style={styles.footer}>
          <GlowButton label={index === SLIDES.length - 1 ? 'Commencer →' : 'Suivant →'} onPress={goNext} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  skipRow: { alignItems: 'flex-end', paddingHorizontal: spacing.huge, paddingTop: spacing.md },
  skipText: { fontSize: 12, fontWeight: '600', color: colors.whiteA40 },

  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.giant + 8 },
  iconRing: { width: 96, height: 96, borderRadius: 48, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.giant },
  slideTitle: { fontFamily: fontFamily.displayBlack, fontSize: 22, color: colors.white, textAlign: 'center', letterSpacing: -0.5, marginBottom: spacing.lg },
  slideBody: { fontSize: 13, color: colors.whiteA55, textAlign: 'center', lineHeight: 20 },

  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginBottom: spacing.giant },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.whiteA20 },

  footer: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxl },
});

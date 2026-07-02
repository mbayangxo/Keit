import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance, useFillIn, usePopIn, useSpinLoop } from '../hooks/animations';

// design/k21-mboolo-bright.html, Screen 3 (Ñu Lekk — shared buying).

const MEMBERS = [
  { key: 'aminata', avaBg: '#fff5ee', emoji: '👩🏿', name: 'Aminata', amount: '2 000 F', done: true },
  { key: 'ibou', avaBg: '#f0fff5', emoji: '👦🏿', name: 'Ibou', amount: '2 000 F', done: true },
  { key: 'fatou', avaBg: '#fffbee', emoji: '👩🏾', name: 'Fatou', amount: '2 000 F', done: true },
  { key: 'cheikh', avaBg: '#fff0f5', emoji: '👨🏿', name: 'Cheikh', amount: 'En attente...', done: false },
];

// `plate-spin`: rotate -5deg <-> 5deg + scale 1 <-> 1.1, 3s, infinite.
function usePlateSpin() {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val]);
  return {
    rotate: val.interpolate({ inputRange: [0, 1], outputRange: ['-5deg', '5deg'] }),
    scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }),
  };
}

// `btn-bounce`: translateY 0 <-> -3 with shadow growing, 2.5s, infinite.
function useButtonBounce() {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: 1250, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val]);
  return val.interpolate({ inputRange: [0, 1], outputRange: [0, -3] });
}

function MemberRow({ item, delay }) {
  const entrance = useEntrance(delay, 400, 14, 'x');
  const checkPop = usePopIn(delay + 100, 400, 0);
  const waitSpin = useSpinLoop(3000);

  return (
    <Animated.View style={[styles.memberItem, entrance, !item.done && { opacity: 0.65 }]}>
      <View style={[styles.memberAva, { backgroundColor: item.avaBg }]}>
        <Text style={{ fontSize: 19 }}>{item.emoji}</Text>
      </View>
      <Text style={styles.memberName}>{item.name}</Text>
      <Text style={[styles.memberAmount, !item.done && { color: colors.mboolo.ink3 }]}>{item.amount}</Text>
      {item.done ? (
        <Animated.View style={[styles.memberDone, checkPop]}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: colors.mboolo.ink }}>✓</Text>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.memberWait, { transform: [{ rotate: waitSpin }] }]} />
      )}
    </Animated.View>
  );
}

export default function NuLekkScreen({ navigation }) {
  const plate = usePlateSpin();
  const poolEntrance = useEntrance(0, 800, 6);
  const progressFill = useFillIn(66, 200, 1500);
  const buttonLift = useButtonBounce();

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#ffe08a', '#ffb347', '#ff8c52']} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={styles.hero}>
            <WaxPattern color="rgba(255,255,255,0.08)" size={14} durationMs={25000} />
            <View style={styles.heroBackRow}>
              <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.heroBack}>
                <Text style={{ fontSize: 14, color: '#fff' }}>←</Text>
              </PressScale>
              <Text style={styles.heroTitle}>Ñu Lekk 🍖</Text>
            </View>
            <Animated.Text style={[styles.plate, { transform: [{ rotate: plate.rotate }, { scale: plate.scale }] }]}>
              🍖
            </Animated.Text>
            <Text style={styles.heroQuestion}>On mange ensemble ?</Text>
            <Text style={styles.heroBy}>Proposé par Aminata · Médina Squad</Text>
          </LinearGradient>

          <View style={styles.pool}>
            <View style={styles.poolTop}>
              <View>
                <Text style={styles.poolLabel}>Cagnotte</Text>
                <Animated.View style={poolEntrance}>
                  <Text style={styles.poolAmountRow}>
                    <Text style={styles.poolAmount}>8 000</Text> <Text style={styles.currency}>F CFA</Text>
                  </Text>
                </Animated.View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.goalLabel}>Objectif</Text>
                <Text style={styles.goalAmount}>12 000 F</Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View style={{ width: progressFill, height: '100%' }}>
                <LinearGradient colors={[colors.mboolo.terra, colors.mboolo.mango]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 5 }} />
              </Animated.View>
            </View>
            <Text style={styles.statusText}>
              <Text style={styles.statusBold}>4 sur 6</Text> membres ont contribué
            </Text>
          </View>

          <View style={styles.members}>
            <Text style={styles.membersHead}>Contributions</Text>
            {MEMBERS.map((m, i) => (
              <MemberRow key={m.key} item={m} delay={i * 100} />
            ))}
          </View>

          <View style={styles.cta}>
            <PressScale scaleTo={0.96} style={{ borderRadius: radius.xxl }}>
              <Animated.View style={{ transform: [{ translateY: buttonLift }] }}>
                <LinearGradient colors={[colors.mboolo.terra, colors.mboolo.mangoDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ctaButton}>
                  <Text style={styles.ctaText}>Contribuer 2 000 F →</Text>
                </LinearGradient>
              </Animated.View>
            </PressScale>
            <Text style={styles.ctaNote}>Argent réservé · Envoyé au marchand quand tout le monde a payé 🔒</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.mboolo.bg },

  hero: { paddingHorizontal: spacing.huge, paddingTop: spacing.giant, paddingBottom: 24, overflow: 'hidden' },
  heroBackRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xxxl },
  heroBack: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fontFamily.displayBlack, fontSize: 14, color: '#fff' },
  plate: { fontSize: 56, textAlign: 'center', marginBottom: spacing.md },
  heroQuestion: { fontFamily: fontFamily.displayBlack, fontSize: 17, color: '#fff', textAlign: 'center', marginBottom: 4 },
  heroBy: { fontSize: 11, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },

  pool: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -16, paddingHorizontal: spacing.huge, paddingTop: spacing.giant, shadowColor: '#b43c00', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 4 },
  poolTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: spacing.lg },
  poolLabel: { fontSize: 10, fontWeight: '700', color: colors.mboolo.ink3, textTransform: 'uppercase', letterSpacing: 1 },
  poolAmountRow: { flexDirection: 'row', alignItems: 'baseline' },
  poolAmount: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1.5, color: colors.mboolo.mangoDark },
  currency: { fontSize: 13, color: colors.mboolo.ink3 },
  goalLabel: { fontSize: 10, color: colors.mboolo.ink3 },
  goalAmount: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.mboolo.terra },

  progressTrack: { height: 10, backgroundColor: 'rgba(232,92,26,0.08)', borderRadius: 5, overflow: 'hidden', marginBottom: spacing.sm },
  statusText: { fontSize: 11, color: colors.mboolo.ink3, marginBottom: spacing.xxxl },
  statusBold: { color: colors.mboolo.terraDark, fontWeight: '700' },

  members: { paddingHorizontal: spacing.huge, gap: spacing.md, backgroundColor: '#fff' },
  membersHead: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.mboolo.ink3, textTransform: 'uppercase', marginBottom: 4 },
  memberItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.mboolo.bg, borderWidth: 2, borderColor: 'rgba(232,92,26,0.1)', borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg },
  memberAva: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(232,92,26,0.15)' },
  memberName: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.mboolo.ink },
  memberAmount: { fontSize: 12, fontWeight: '700', color: colors.mboolo.mangoDark },
  memberDone: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.mboolo.green, alignItems: 'center', justifyContent: 'center' },
  memberWait: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: 'rgba(232,92,26,0.3)', borderStyle: 'dashed' },

  cta: { padding: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.giant, backgroundColor: '#fff' },
  ctaButton: { height: 54, borderRadius: radius.xxl, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(232,92,26,0.4)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 20, elevation: 6 },
  ctaText: { fontFamily: fontFamily.displayBlack, fontSize: 12, letterSpacing: 0.5, color: '#fff' },
  ctaNote: { textAlign: 'center', fontSize: 10, color: colors.mboolo.ink3, marginTop: spacing.md, lineHeight: 16 },
});

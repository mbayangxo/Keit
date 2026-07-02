import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import WaxPattern from '../components/WaxPattern';
import { colors, fontFamily, radius, spacing } from '../theme';
import { usePopIn, useEntrance, useSuccessHaptic } from '../hooks/animations';

// design/k21-onboarding.html, Screen 9 (Welcome / all done) — the
// celebration screen shown once signup completes, before landing on Main.
const STEPS = [
  { key: 'send', icon: '💸', label: 'Envoyer' },
  { key: 'chart', icon: '🎵', label: '221 Bëgg' },
  { key: 'mboolo', icon: '💬', label: 'Mboolo' },
];

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

export default function WelcomeCelebrationScreen({ name, arrondissement, fundAmount, onEnter }) {
  useSuccessHaptic();
  const celebration = usePopIn(0, 500, 0.3);
  const content = useEntrance(200, 500, 10);
  const firstName = (name || 'Saliou').split(' ')[0];
  const steps = arrondissement ? [...STEPS, { key: 'arr', icon: '🏘️', label: arrondissement.name }] : STEPS;

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(255,255,255,0.02)" size={20} animated={false} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Animated.Text style={[styles.celebration, celebration]}>🎉</Animated.Text>
          <Animated.View style={content}>
            <Text style={styles.greeting}>Bienvenue dans K21</Text>
            <Text style={styles.name}>{firstName},{'\n'}tu es chez toi.</Text>
            <Text style={styles.sub}>Ton compte est prêt. Ton quartier t'attend.{'\n'}La musique tourne déjà.</Text>

            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Ton solde K21</Text>
              <Text style={styles.balanceAmount}>
                {formatAmount(fundAmount ?? 0)} <Text style={styles.balanceCurrency}>F CFA</Text>
              </Text>
              <Text style={styles.balanceNote}>✦ Zéro frais sur tous tes envois</Text>
            </View>

            <View style={styles.stepsRow}>
              {steps.map((s) => (
                <View key={s.key} style={styles.stepItem}>
                  <Text style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</Text>
                  <Text style={styles.stepLabel} numberOfLines={1}>{s.label}</Text>
                </View>
              ))}
            </View>

            <GlowButton label="Entrer dans K21 →" onPress={onEnter} />
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.giant },
  celebration: { fontSize: 52, marginBottom: spacing.xxl },
  greeting: { fontFamily: fontFamily.displayBold, fontSize: 11, letterSpacing: 2, color: colors.green, textTransform: 'uppercase', textAlign: 'center', marginBottom: spacing.sm },
  name: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1, lineHeight: 32, color: colors.white, textAlign: 'center', marginBottom: spacing.xl },
  sub: { fontSize: 13, color: colors.whiteA40, lineHeight: 22, textAlign: 'center', marginBottom: spacing.giant },

  balanceCard: { backgroundColor: 'rgba(26,240,96,0.08)', borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.xxxl, padding: spacing.xxl, marginBottom: spacing.giant, alignItems: 'center', width: '100%' },
  balanceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: spacing.sm },
  balanceAmount: { fontFamily: fontFamily.displayBlack, fontSize: 36, letterSpacing: -2, color: colors.green },
  balanceCurrency: { fontSize: 14, fontWeight: '400', color: 'rgba(26,240,96,0.5)' },
  balanceNote: { fontSize: 10, color: 'rgba(26,240,96,0.5)', marginTop: spacing.sm },

  stepsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.giant, width: '100%' },
  stepItem: { flex: 1, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xs, alignItems: 'center' },
  stepLabel: { fontSize: 9, fontWeight: '700', color: colors.whiteA40 },
});

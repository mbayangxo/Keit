import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import WaxPattern from '../components/WaxPattern';
import { colors, fontFamily, radius, spacing } from '../theme';
import { usePopIn, useEntrance, useSuccessHaptic } from '../hooks/animations';

// design/k21-onboarding.html, Screen 9 (Welcome / all done) — the
// celebration screen shown once signup completes, before landing on Main.
// Extended to cover the business-account variant: KEBU ID instead of AFRI
// ID, business-flavored quick links, gold accent instead of green.
const PERSONAL_STEPS = [
  { key: 'send', icon: '💸', label: 'Envoyer' },
  { key: 'chart', icon: '🎵', label: '221 Bëgg' },
  { key: 'mboolo', icon: '💬', label: 'Mboolo' },
];

const BUSINESS_STEPS = [
  { key: 'receive', icon: '💳', label: 'Recevoir' },
  { key: 'discover', icon: '🔍', label: 'Discover' },
  { key: 'stats', icon: '📊', label: 'Stats' },
];

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

export default function WelcomeCelebrationScreen({ accountType = 'personal', name, businessName, afriId, keboId, arrondissement, fundAmount, onEnter }) {
  useSuccessHaptic();
  const celebration = usePopIn(0, 500, 0.3);
  const content = useEntrance(200, 500, 10);
  const isBusiness = accountType === 'business';
  const accent = isBusiness ? colors.flagGold : colors.green;
  const firstName = (name || 'Saliou').split(' ')[0];
  const displayName = isBusiness ? businessName || 'Ton commerce' : firstName;
  const idLabel = isBusiness ? 'Ton KEBU ID' : 'Ton AFRI ID';
  const idValue = isBusiness ? keboId : afriId;
  const baseSteps = isBusiness ? BUSINESS_STEPS : PERSONAL_STEPS;
  const steps = arrondissement ? [...baseSteps, { key: 'arr', icon: '🏘️', label: arrondissement.name }] : baseSteps;

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(255,255,255,0.02)" size={20} animated={false} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <Animated.Text style={[styles.celebration, celebration]}>{isBusiness ? '🏆' : '🎉'}</Animated.Text>
          <Animated.View style={content}>
            <Text style={[styles.greeting, { color: accent }]}>Bienvenue {isBusiness ? 'sur K21 Business' : 'dans K21'}</Text>
            <Text style={styles.name}>
              {displayName},{'\n'}
              {isBusiness ? 'tu es prêt à vendre.' : 'tu es chez toi.'}
            </Text>
            <Text style={styles.sub}>
              {isBusiness
                ? "Ton compte business est prêt. Tes clients peuvent déjà te payer."
                : "Ton compte est prêt. Ton quartier t'attend.\nLa musique tourne déjà."}
            </Text>

            {idValue ? (
              <View style={[styles.idPill, { borderColor: accent }]}>
                <Text style={[styles.idPillLabel, { color: accent }]}>{idLabel}</Text>
                <Text style={styles.idPillValue}>{idValue}</Text>
              </View>
            ) : null}

            <View style={[styles.balanceCard, { backgroundColor: isBusiness ? 'rgba(250,216,54,0.08)' : 'rgba(26,240,96,0.08)', borderColor: isBusiness ? colors.goldA20 : colors.greenA20 }]}>
              <Text style={[styles.balanceLabel, { color: isBusiness ? 'rgba(250,216,54,0.7)' : 'rgba(26,240,96,0.6)' }]}>
                {isBusiness ? 'Solde de ton commerce' : 'Ton solde K21'}
              </Text>
              <Text style={[styles.balanceAmount, { color: accent }]}>
                {formatAmount(fundAmount ?? 0)} <Text style={[styles.balanceCurrency, { color: isBusiness ? 'rgba(250,216,54,0.5)' : 'rgba(26,240,96,0.5)' }]}>F CFA</Text>
              </Text>
              <Text style={[styles.balanceNote, { color: isBusiness ? 'rgba(250,216,54,0.5)' : 'rgba(26,240,96,0.5)' }]}>
                {isBusiness ? '✦ Zéro frais sur tes paiements reçus' : '✦ Zéro frais sur tous tes envois'}
              </Text>
            </View>

            <View style={styles.stepsRow}>
              {steps.map((s) => (
                <View key={s.key} style={styles.stepItem}>
                  <Text style={{ fontSize: 20, marginBottom: 5 }}>{s.icon}</Text>
                  <Text style={styles.stepLabel} numberOfLines={1}>{s.label}</Text>
                </View>
              ))}
            </View>

            <GlowButton
              label={isBusiness ? 'Entrer dans mon commerce →' : 'Entrer dans K21 →'}
              onPress={onEnter}
              style={isBusiness ? { backgroundColor: colors.flagGold } : undefined}
            />
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

  idPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.xl },
  idPillLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  idPillValue: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.white },

  balanceCard: { backgroundColor: 'rgba(26,240,96,0.08)', borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.xxxl, padding: spacing.xxl, marginBottom: spacing.giant, alignItems: 'center', width: '100%' },
  balanceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: spacing.sm },
  balanceAmount: { fontFamily: fontFamily.displayBlack, fontSize: 36, letterSpacing: -2, color: colors.green },
  balanceCurrency: { fontSize: 14, fontWeight: '400', color: 'rgba(26,240,96,0.5)' },
  balanceNote: { fontSize: 10, color: 'rgba(26,240,96,0.5)', marginTop: spacing.sm },

  stepsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.giant, width: '100%' },
  stepItem: { flex: 1, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xs, alignItems: 'center' },
  stepLabel: { fontSize: 9, fontWeight: '700', color: colors.whiteA40 },
});

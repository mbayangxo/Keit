import { Animated, StyleSheet, Text, View } from 'react-native';
import GlowButton from '../components/GlowButton';
import OnboardingShell from '../components/OnboardingShell';
import { fontFamily, radius, spacing } from '../theme';
import { ob } from '../theme/onboarding';
import { usePopIn, useEntrance, useSuccessHaptic } from '../hooks/animations';

const PERSONAL_STEPS = [
  { key: 'send', icon: '💸', label: 'Envoyer' },
  { key: 'chart', icon: '🎵', label: 'Wey yu 221 bëgg' },
  { key: 'mboolo', icon: '💬', label: 'Mboolo' },
];

const BUSINESS_STEPS = [
  { key: 'receive', icon: '💳', label: 'Recevoir' },
  { key: 'discover', icon: '🔍', label: 'Discover' },
  { key: 'stats', icon: '📊', label: 'Stats' },
];

import { formatKori } from '../lib/kori.js';

export default function WelcomeCelebrationScreen({ accountType = 'personal', name, businessName, afriId, keboId, arrondissement, fundAmount, onEnter }) {
  useSuccessHaptic();
  const celebration = usePopIn(0, 500, 0.3);
  const content = useEntrance(200, 500, 10);
  const isBusiness = accountType === 'business';
  const accent = isBusiness ? ob.orange : ob.green;
  const firstName = (name || 'Saliou').split(' ')[0];
  const displayName = isBusiness ? businessName || 'Ton commerce' : firstName;
  const idLabel = isBusiness ? 'Ton KEBU ID' : 'Ton AFRI ID';
  const idValue = isBusiness ? keboId : afriId;
  const baseSteps = isBusiness ? BUSINESS_STEPS : PERSONAL_STEPS;
  const steps = arrondissement ? [...baseSteps, { key: 'arr', icon: '🏘️', label: arrondissement.name }] : baseSteps;

  return (
    <OnboardingShell edges={[]}>
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

          {isBusiness && afriId ? (
            <View style={[styles.idPill, { borderColor: ob.green, marginBottom: spacing.sm }]}>
              <Text style={[styles.idPillLabel, { color: ob.green }]}>Ton AFRI ID</Text>
              <Text style={styles.idPillValue}>{afriId}</Text>
            </View>
          ) : null}

          {idValue ? (
            <View style={[styles.idPill, { borderColor: accent }]}>
              <Text style={[styles.idPillLabel, { color: accent }]}>{idLabel}</Text>
              <Text style={styles.idPillValue}>{idValue}</Text>
            </View>
          ) : null}

          <View style={[styles.balanceCard, { backgroundColor: isBusiness ? ob.orangeSoft : ob.greenSoft, borderColor: isBusiness ? ob.orangeBorder : ob.greenBorder }]}>
            <Text style={[styles.balanceLabel, { color: isBusiness ? ob.orange : ob.green }]}>
              {isBusiness ? 'Solde de ton commerce' : 'Ton solde K21'}
            </Text>
            <Text style={[styles.balanceAmount, { color: accent }]}>
              {formatKori(fundAmount ?? 0)}
            </Text>
            <Text style={[styles.balanceNote, { color: ob.muted }]}>
              {(fundAmount ?? 0) > 0
                ? isBusiness
                  ? '✦ Zéro frais sur tes paiements reçus'
                  : '✦ Zéro frais sur tous tes envois'
                : isBusiness
                  ? 'Ton commerce est prêt — les paiements arriveront ici.'
                  : 'Commence sans solde — ajoute de l’argent quand tu veux via Cash.'}
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
            style={isBusiness ? { backgroundColor: ob.orange } : undefined}
          />
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.giant },
  celebration: { fontSize: 52, marginBottom: spacing.xxl },
  greeting: { fontFamily: fontFamily.displayBold, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: spacing.sm },
  name: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1, lineHeight: 32, color: ob.ink, textAlign: 'center', marginBottom: spacing.xl },
  sub: { fontSize: 13, color: ob.muted, lineHeight: 22, textAlign: 'center', marginBottom: spacing.giant },

  idPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginBottom: spacing.xl },
  idPillLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  idPillValue: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: ob.ink },

  balanceCard: { borderWidth: 1, borderRadius: radius.xxxl, padding: spacing.xxl, marginBottom: spacing.giant, alignItems: 'center', width: '100%' },
  balanceLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: spacing.sm },
  balanceAmount: { fontFamily: fontFamily.displayBlack, fontSize: 36, letterSpacing: -2 },
  balanceCurrency: { fontSize: 14, fontWeight: '400' },
  balanceNote: { fontSize: 10, marginTop: spacing.sm },

  stepsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.giant, width: '100%' },
  stepItem: { flex: 1, backgroundColor: ob.surface, borderWidth: 1, borderColor: ob.border, borderRadius: radius.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.xs, alignItems: 'center' },
  stepLabel: { fontSize: 9, fontWeight: '700', color: ob.muted },
});

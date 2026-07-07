import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useBlink, useEntrance } from '../hooks/animations';

// Business-account landing screen — reached instead of the personal
// MainTabs when accountType === 'business'. No HTML prototype exists for
// this (it's new scope beyond Phase 1's original brief); built to match
// the established system with a gold accent instead of green, per the
// brief's convention of gold = secondary/business-flavored surfaces.
// "Employés" / "Analytics" stay as coming-soon: real payroll and revenue
// analytics need a licensed backend, not just UI, same reasoning as the
// rest of the app's KYC/payments boundary.

const ACTIONS = [
  { icon: '💳', label: 'Recevoir', route: 'Receive' },
  { icon: '🧾', label: 'Historique', route: 'Info', params: { title: 'Historique complet', subtitle: 'La liste détaillée des transactions arrive bientôt.', icon: '🧾' } },
  { icon: '👥', label: 'Employés', route: 'Info', params: { title: 'Employés', subtitle: "Payer ton équipe directement depuis K21 arrive bientôt — ça demande une vraie vérification d'entreprise.", icon: '👥' } },
  { icon: '📊', label: 'Analytics', route: 'Info', params: { title: 'Analytics', subtitle: 'Statistiques de vente en temps réel arrivent bientôt.', icon: '📊' } },
];

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function ActionButton({ icon, label, delay, onPress }) {
  const entrance = useEntrance(delay, 300, 8);
  return (
    <Animated.View style={entrance}>
      <PressScale scaleTo={0.9} onPress={onPress} style={styles.actionItem}>
        <View style={styles.actionIcon}>
          <Text style={{ fontSize: 20 }}>{icon}</Text>
        </View>
        <Text style={styles.actionLabel}>{label}</Text>
      </PressScale>
    </Animated.View>
  );
}

function TransactionRow({ tx }) {
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: tx.iconBg }]}>
        <Text style={{ fontSize: 16 }}>{tx.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txTitle}>{tx.title}</Text>
        <Text style={styles.txSub}>{tx.subtitle}</Text>
      </View>
      <Text style={[styles.txAmount, { color: tx.amount > 0 ? colors.flagGold : colors.flagRed }]}>
        {tx.amount > 0 ? '+' : ''}{formatAmount(tx.amount)} F
      </Text>
    </View>
  );
}

export default function BusinessDashboardScreen({ navigation }) {
  const { profile, balance, transactions } = useAppState();
  const business = profile.business ?? { name: 'Ton commerce', category: 'Commerce', kebuId: '—', type: 'merchant' };
  const typeLabel = {
    merchant: 'Marchand',
    employer: 'Employeur',
    school: 'École',
    cooperative: 'Coopérative',
  }[business.type] ?? 'Commerce';
  const liveDot = useBlink(1400, 0.3);
  const balanceEntrance = useEntrance(0, 700, 12);

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(255,255,255,0.025)" size={18} animated={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.topRow}>
              <View style={styles.bizAva}>
                <Text style={{ fontSize: 26 }}>🏪</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bizName}>{business.name}</Text>
                <Text style={styles.bizMeta}>
                  {typeLabel} · {business.category} · {profile.arrondissement?.name ?? 'Dakar'}
                </Text>
              </View>
              <PressScale
                scaleTo={0.9}
                onPress={() => navigation.navigate('Notifications')}
                style={styles.notifBtn}
              >
                <Text style={{ fontSize: 16 }}>🔔</Text>
                <Animated.View style={[styles.notifDot, { opacity: liveDot }]} />
              </PressScale>
            </View>

            <View style={styles.keboPill}>
              <Text style={styles.keboPillText}>✦ {business.kebuId ?? business.keboId ?? '—'}</Text>
            </View>

            <Animated.Text style={[styles.balanceAmount, balanceEntrance]}>
              {formatAmount(balance)} <Text style={styles.balanceCurrency}>F</Text>
            </Animated.Text>
            <Text style={styles.balanceLabel}>Solde du commerce</Text>
          </View>

          <View style={styles.actionsRow}>
            {ACTIONS.map((a, i) => (
              <ActionButton
                key={a.label}
                icon={a.icon}
                label={a.label}
                delay={i * 100}
                onPress={() => navigation.navigate(a.route, a.params)}
              />
            ))}
          </View>

          <View style={styles.txSection}>
            <Text style={styles.txLabel}>Transactions récentes</Text>
            {transactions.length === 0 ? (
              <Text style={styles.txEmpty}>Aucune transaction pour l'instant.</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {transactions.slice(0, 5).map((tx) => (
                  <TransactionRow key={tx.key} tx={tx} />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  hero: {
    paddingHorizontal: spacing.huge,
    paddingTop: spacing.xl,
    paddingBottom: spacing.giant,
    backgroundColor: 'rgba(250,216,54,0.06)',
    borderBottomWidth: 1,
    borderBottomColor: colors.goldA20,
    alignItems: 'center',
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, width: '100%', marginBottom: spacing.xl },
  bizAva: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.goldA10, borderWidth: 1.5, borderColor: colors.goldA20, alignItems: 'center', justifyContent: 'center' },
  bizName: { fontFamily: fontFamily.displayBold, fontSize: 15, color: colors.white },
  bizMeta: { fontSize: 11, color: colors.whiteA40, marginTop: 2 },
  notifBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.flagRed, borderWidth: 1.5, borderColor: colors.ink },

  keboPill: { backgroundColor: colors.goldA10, borderWidth: 1, borderColor: colors.goldA20, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginBottom: spacing.xl },
  keboPillText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.flagGold },

  balanceAmount: { fontFamily: fontFamily.displayBlack, fontSize: 40, letterSpacing: -2, color: colors.flagGold },
  balanceCurrency: { fontSize: 15, fontWeight: '400', color: 'rgba(250,216,54,0.5)' },
  balanceLabel: { fontSize: 11, color: colors.whiteA35, marginTop: spacing.xs },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: spacing.huge, paddingVertical: spacing.giant },
  actionItem: { alignItems: 'center', gap: spacing.sm },
  actionIcon: { width: 52, height: 52, borderRadius: radius.xxl, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.whiteA55 },

  txSection: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxxl },
  txLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.lg },
  txEmpty: { fontSize: 11, color: colors.whiteA30 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 9, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg },
  txIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  txSub: { fontSize: 10, color: colors.whiteA40, marginTop: 1 },
  txAmount: { fontFamily: fontFamily.displayBlack, fontSize: 13, letterSpacing: -0.3 },
});

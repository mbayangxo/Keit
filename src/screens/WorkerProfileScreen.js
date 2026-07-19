import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import ScreenHeader from '../components/ScreenHeader';
import ScreenBackground from '../components/ScreenBackground';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { useAppState } from '../state/AppState';
import { useToast } from '../components/Toast';
import {
  activateWorkerProfile,
  getWorkerCreditSummary,
  getWorkerProfile as fetchWorkerProfile,
} from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type } from '../theme';

const MODE_OPTIONS = [
  { key: 'delivery', icon: '🛵', label: 'Livraison', sub: 'Courses et colis' },
  { key: 'seller', icon: '🛍️', label: 'Vente', sub: 'Produits sur Discover' },
  { key: 'gigs', icon: '💼', label: 'Gigs', sub: 'Petits boulots courts' },
];

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function creditTierLabel(tier) {
  if (tier === 'established') return 'Établi';
  if (tier === 'building') return 'En progression';
  return 'Débutant';
}

export default function WorkerProfileScreen({ navigation }) {
  const { profile } = useAppState();
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [worker, setWorker] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedModes, setSelectedModes] = useState(['delivery']);

  const isBusinessAccount = profile.accountType === 'business' || profile.accountType === 'cooperative';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const w = await fetchWorkerProfile();
      setWorker(w);
      if (w) {
        const s = await getWorkerCreditSummary();
        setSummary(s);
      } else {
        setSummary(null);
      }
    } catch (err) {
      if (err?.status === 404) {
        setWorker(null);
        setSummary(null);
      } else {
        showToast(err.message ?? 'Impossible de charger le profil travailleur');
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleMode = (key) => {
    setSelectedModes((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  };

  const onActivate = async () => {
    if (selectedModes.length === 0) {
      showToast('Choisis au moins un mode de travail');
      return;
    }
    setActivating(true);
    try {
      await activateWorkerProfile(selectedModes);
      showToast('Profil travailleur activé ✓');
      await load();
    } catch (err) {
      showToast(err.message ?? 'Activation impossible');
    } finally {
      setActivating(false);
    }
  };

  const shareCreditDoc = async () => {
    if (!summary) return;
    const w = summary.worker;
    const text = [
      'Dossier travailleur K21 — revenus vérifiables',
      `${summary.identity.name} · @${summary.identity.handle}`,
      `ID travailleur : ${w.workerId}`,
      `Niveau crédit : ${creditTierLabel(w.creditTier)} · Réputation ${w.reputationScore}`,
      `90 jours : ${formatAmount(summary.period90Days.earnedNational)} F · ${summary.period90Days.completedJobs} missions`,
      `Total : ${formatAmount(summary.lifetime.earnedNational)} F · ${summary.lifetime.completedJobs} missions`,
      '',
      summary.loanNote,
    ].join('\n');
    try {
      await Share.share({ message: text, title: 'Mon dossier K21' });
    } catch {
      /* dismissed */
    }
  };

  if (isBusinessAccount) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scroll}>
            <ScreenHeader onBack={() => navigation.goBack()} title="Profil travailleur" />
            <View style={styles.blockedCard}>
              <Text style={styles.blockedEmoji}>🏪</Text>
              <Text style={styles.blockedTitle}>Compte business</Text>
              <Text style={styles.blockedText}>
                Le profil travailleur (livraison, gigs, vente perso) s'active depuis un compte personnel K21 — pas depuis un
                compte business.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ScreenHeader onBack={() => navigation.goBack()} title="Profil travailleur" style={styles.header} />

          <Text style={styles.lead}>
            Gagne sur K21, reçois des reçus vérifiables et construis ta réputation pour les prêts.
          </Text>

          {loading ? (
            <ActivityIndicator color={colors.greenDark} style={{ marginTop: spacing.xxl }} />
          ) : !worker ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Activer mon profil travailleur</Text>
              <Text style={styles.cardSub}>Uniquement depuis ton compte personnel — choisis comment tu veux gagner.</Text>
              <View style={styles.modeList}>
                {MODE_OPTIONS.map((opt) => {
                  const on = selectedModes.includes(opt.key);
                  return (
                    <PressScale
                      key={opt.key}
                      scaleTo={0.98}
                      onPress={() => toggleMode(opt.key)}
                      style={[styles.modeRow, on && styles.modeRowOn]}
                    >
                      <Text style={styles.modeIcon}>{opt.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.modeLabel}>{opt.label}</Text>
                        <Text style={styles.modeSub}>{opt.sub}</Text>
                      </View>
                      <Text style={[styles.modeCheck, on && { color: colors.greenDark }]}>{on ? '✓' : '○'}</Text>
                    </PressScale>
                  );
                })}
              </View>
              <GlowButton label={activating ? 'Activation…' : 'Activer mon profil →'} onPress={onActivate} disabled={activating} />
            </View>
          ) : (
            <>
              <View style={styles.statsCard}>
                <Text style={styles.workerId}>✦ {worker.workerId}</Text>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>{creditTierLabel(worker.creditTier)}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{formatAmount(worker.totalEarnedNational)} F</Text>
                    <Text style={styles.statLbl}>Total gagné</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{worker.completedJobs}</Text>
                    <Text style={styles.statLbl}>Missions</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statVal}>{worker.reputationScore}</Text>
                    <Text style={styles.statLbl}>Réputation</Text>
                  </View>
                </View>
                <Text style={styles.modesLine}>
                  Modes : {worker.modes.map((m) => MODE_OPTIONS.find((o) => o.key === m)?.label ?? m).join(' · ')}
                </Text>
              </View>

              {summary?.period90Days ? (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>90 derniers jours</Text>
                  <Text style={styles.periodLine}>
                    {formatAmount(summary.period90Days.earnedNational)} F · {summary.period90Days.completedJobs} reçus
                  </Text>
                  <Text style={styles.loanHint}>{summary.loanNote}</Text>
                  <PressScale scaleTo={0.97} onPress={shareCreditDoc} style={styles.shareBtn}>
                    <Text style={styles.shareBtnText}>Partager mon dossier crédit</Text>
                  </PressScale>
                </View>
              ) : null}

              <Text style={styles.sectionLabel}>Reçus de travail</Text>
              {(summary?.receipts ?? []).length === 0 ? (
                <Text style={styles.empty}>Complète une livraison, vente ou gig pour voir ton premier reçu ici.</Text>
              ) : (
                <View style={styles.receiptList}>
                  {(summary?.receipts ?? []).map((r) => (
                    <View key={r.id} style={styles.receiptRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.receiptTitle}>{r.title}</Text>
                        {r.subtitle ? <Text style={styles.receiptSub}>{r.subtitle}</Text> : null}
                        <Text style={styles.receiptRef}>{r.reference}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.receiptAmt}>+{formatAmount(r.amountNational)} F</Text>
                        {r.koriAmount ? <Text style={styles.receiptKori}>+₭{r.koriAmount}</Text> : null}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <PressScale
                scaleTo={0.98}
                onPress={() => navigation.navigate('Movement', { initialMode: worker.modes.includes('gigs') ? 'gigs' : 'drive' })}
                style={styles.moveLink}
              >
                <Text style={styles.moveLinkText}>Ouvrir Mouvement →</Text>
              </PressScale>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.giant },
  header: { marginBottom: spacing.sm },
  lead: { ...type.bodySmall, color: 'rgba(5,8,5,0.55)', marginBottom: spacing.xl, lineHeight: 18 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xxl,
    padding: spacing.xl,
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardTitle: { fontFamily: fontFamily.displayBold, fontSize: 15, color: colors.ink },
  cardSub: { fontSize: 12, color: 'rgba(5,8,5,0.5)', lineHeight: 17 },
  modeList: { gap: spacing.sm },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.08)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  modeRowOn: { borderColor: colors.greenA25, backgroundColor: colors.greenA08 },
  modeIcon: { fontSize: 22 },
  modeLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  modeSub: { fontSize: 10, color: 'rgba(5,8,5,0.45)' },
  modeCheck: { fontSize: 16, color: 'rgba(5,8,5,0.25)' },
  statsCard: {
    backgroundColor: colors.greenA08,
    borderWidth: 1,
    borderColor: colors.greenA20,
    borderRadius: radius.xxl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  workerId: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.greenDark },
  tierPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(247,183,49,0.2)',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  tierPillText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.goldDark },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  stat: { alignItems: 'center', flex: 1 },
  statVal: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.ink },
  statLbl: { fontSize: 9, color: 'rgba(5,8,5,0.45)', marginTop: 2 },
  modesLine: { fontSize: 11, color: 'rgba(5,8,5,0.5)' },
  periodLine: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.ink },
  loanHint: { fontSize: 10, color: 'rgba(5,8,5,0.45)', lineHeight: 15 },
  shareBtn: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.greenA10,
    borderWidth: 1,
    borderColor: colors.greenA25,
  },
  shareBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.greenDark },
  sectionLabel: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.md },
  empty: { fontSize: 12, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.xl },
  receiptList: { gap: spacing.sm, marginBottom: spacing.xl },
  receiptRow: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.07)',
  },
  receiptTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },
  receiptSub: { fontSize: 10, color: 'rgba(5,8,5,0.45)' },
  receiptRef: { fontSize: 9, color: 'rgba(5,8,5,0.35)', marginTop: 4 },
  receiptAmt: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.greenDark },
  receiptKori: { fontSize: 10, color: colors.greenDark, marginTop: 2 },
  moveLink: { alignSelf: 'center', marginBottom: spacing.xxl },
  moveLinkText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.greenDark },
  blockedCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    gap: spacing.md,
  },
  blockedEmoji: { fontSize: 40 },
  blockedTitle: { fontFamily: fontFamily.displayBold, fontSize: 16, color: colors.ink },
  blockedText: { fontSize: 12, color: 'rgba(5,8,5,0.5)', textAlign: 'center', lineHeight: 18 },
});

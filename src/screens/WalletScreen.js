import { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import ScreenBackground from '../components/ScreenBackground';
import PressScale from '../components/PressScale';
import KoriAmount from '../components/KoriAmount';
import ConfettiBurst from '../components/ConfettiBurst';
import { getTontineGroups, getTransactions } from '../lib/api-client';
import { getLastCelebratedReceiveId, setLastCelebratedReceiveId } from '../lib/celebration-storage';
import { colors, fontFamily, radius, spacing, type } from '../theme';

// One tap deeper than Home: the things you look at when you WANT to check
// on your money — spending breakdown, Natta, full history — not things
// thrown in your face on the main screen every time you open the app.

const SPEND_COLORS = {
  envois: colors.greenDark,
  marche: colors.flagGold,
  autre: colors.terracotta,
};

function computeMonthlySpending(transactions) {
  if (!Array.isArray(transactions) || !transactions.length) return null;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const outflows = transactions.filter((tx) => {
    if (!tx.createdAt || tx.amount >= 0) return false;
    return new Date(tx.createdAt) >= monthStart;
  });
  const total = outflows.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  if (total <= 0) return null;

  const buckets = { envois: 0, marche: 0, autre: 0 };
  for (const tx of outflows) {
    const abs = Math.abs(tx.amount);
    if (tx.type === 'send') buckets.envois += abs;
    else if (['pay_merchant', 'marketplace_purchase', 'ticket_purchase'].includes(tx.type)) buckets.marche += abs;
    else buckets.autre += abs;
  }

  const segments = [
    { label: 'Envois', key: 'envois' },
    { label: 'Marché', key: 'marche' },
    { label: 'Autre', key: 'autre' },
  ]
    .filter(({ key }) => buckets[key] > 0)
    .map(({ label, key }) => ({
      label,
      color: SPEND_COLORS[key],
      pct: Math.round((buckets[key] / total) * 100),
    }));

  const pctSum = segments.reduce((s, seg) => s + seg.pct, 0);
  if (pctSum !== 100 && segments.length) segments[segments.length - 1].pct += 100 - pctSum;

  return { total, segments, monthLabel: now.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase() };
}

function formatNattaDue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

function SpendingRing({ spending }) {
  if (!spending?.segments?.length) {
    return (
      <View style={[styles.spendCard, { justifyContent: 'center' }]}>
        <Text style={styles.emptyText}>Rien dépensé ce mois-ci pour l'instant.</Text>
      </View>
    );
  }
  let acc = 0;
  return (
    <View style={styles.spendCard}>
      <View style={styles.spendRingWrap}>
        <Svg width={124} height={124} viewBox="0 0 124 124">
          <Circle cx="62" cy="62" r="58" stroke="rgba(5,8,5,0.14)" strokeWidth="1.5" strokeDasharray="3 5" fill="none" />
          {spending.segments.map((s) => {
            const dash = (s.pct / 100) * RING_C;
            const offset = -(acc / 100) * RING_C;
            acc += s.pct;
            return (
              <Circle
                key={s.label}
                cx="62" cy="62" r={RING_R}
                stroke={s.color} strokeWidth="13" fill="none" strokeLinecap="round"
                strokeDasharray={`${dash - 4} ${RING_C - dash + 4}`}
                strokeDashoffset={offset}
                transform="rotate(-90 62 62)"
              />
            );
          })}
        </Svg>
        <View style={styles.spendCenter}>
          <Text style={styles.spendMonth}>{spending.monthLabel}</Text>
          <KoriAmount value={spending.total} textStyle={styles.spendTotal} gap={2} style={{ justifyContent: 'center' }} />
        </View>
      </View>
      <View style={styles.spendLegend}>
        <Text style={styles.spendTitle}>Dépenses du mois</Text>
        {spending.segments.map((s) => (
          <View key={s.label} style={styles.spendLegendRow}>
            <View style={[styles.spendDot, { backgroundColor: s.color }]} />
            <Text style={styles.spendLegendLabel}>{s.label}</Text>
            <Text style={styles.spendLegendPct}>{s.pct}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NattaCard({ group, onPress }) {
  const progress = group.expectedPot ? Math.min(100, Math.round((group.potBalance / group.expectedPot) * 100)) : 0;
  const roundLabel = group.memberCount ? `${group.rotationIndex + 1}/${group.memberCount}` : '—';
  const dueLabel = group.nextDueAt ? `Prochain tour · ${formatNattaDue(group.nextDueAt)}` : 'Natta active';

  return (
    <PressScale scaleTo={0.97} onPress={onPress} style={styles.goalCard}>
      <View style={styles.goalRing}>
        <Text style={styles.goalRingText}>{roundLabel}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.goalTitle} numberOfLines={1}>{group.name}</Text>
        <Text style={styles.goalSub}>{dueLabel}</Text>
        <View style={styles.goalBar}>
          <View style={[styles.goalFill, { width: `${progress}%` }]} />
        </View>
      </View>
      <KoriAmount value={group.potBalance || group.expectedPot} textStyle={styles.goalAmountText} gap={2} style={styles.goalAmount} />
    </PressScale>
  );
}

function TransactionRow({ icon, iconBg, title, subtitle, value, positive, amountColor }) {
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txTitle}>{title}</Text>
        <Text style={styles.txSub}>{subtitle}</Text>
      </View>
      <KoriAmount value={value} prefix={positive ? '+' : ''} textStyle={[styles.txAmount, { color: amountColor }]} color={amountColor} gap={2} />
    </View>
  );
}

export default function WalletScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState([]);
  const [nattaGroups, setNattaGroups] = useState([]);
  const [celebrate, setCelebrate] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      Promise.all([getTransactions(100), getTontineGroups()])
        .then(async ([txList, groups]) => {
          if (cancelled) return;
          const list = Array.isArray(txList) ? txList : [];
          setTxs(list);
          setNattaGroups(Array.isArray(groups) ? groups : []);

          // A real pop of confetti the first time you SEE that someone sent
          // you money — not on every visit, and not for your own cash-ins.
          const latestReceive = list.find((tx) => tx.type === 'receive');
          if (latestReceive) {
            const lastCelebrated = await getLastCelebratedReceiveId();
            if (lastCelebrated !== latestReceive.key && !cancelled) {
              setCelebrate(true);
              await setLastCelebratedReceiveId(latestReceive.key);
            }
          }
        })
        .catch(() => {
          if (!cancelled) {
            setTxs([]);
            setNattaGroups([]);
          }
        })
        .finally(() => !cancelled && setLoading(false));
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const spending = computeMonthlySpending(txs);

  return (
    <View style={styles.root}>
      <ScreenBackground />
      {celebrate ? <ConfettiBurst /> : null}
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.ink }}>←</Text>
          </PressScale>
          <Text style={styles.title}>Mon portefeuille</Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.greenDark} style={{ marginTop: spacing.giant }} />
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <SpendingRing spending={spending} />

            {nattaGroups.length > 0 ? (
              <View style={{ gap: spacing.lg }}>
                <Text style={styles.sectionLabel}>Natta</Text>
                {nattaGroups.map((g) => (
                  <NattaCard key={g.id} group={g} onPress={() => navigation.navigate('Tontine')} />
                ))}
              </View>
            ) : null}

            <View>
              <Text style={styles.sectionLabel}>Transactions</Text>
              {txs.length === 0 ? (
                <Text style={styles.emptyText}>Aucune transaction pour l'instant.</Text>
              ) : (
                <View style={{ gap: spacing.sm }}>
                  {txs.map((tx) => (
                    <TransactionRow
                      key={tx.key}
                      icon={tx.icon}
                      iconBg={tx.iconBg}
                      title={tx.title}
                      subtitle={tx.subtitle}
                      value={Math.abs(tx.amount)}
                      positive={tx.amount > 0}
                      amountColor={tx.amount > 0 ? colors.greenDark : colors.terracottaDark}
                    />
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.75)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.ink },

  scroll: { paddingHorizontal: spacing.xxxl, paddingBottom: spacing.giant, gap: spacing.xxl },
  sectionLabel: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.lg },
  emptyText: { fontSize: 12, color: 'rgba(5,8,5,0.45)' },

  spendCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.07)',
    borderRadius: radius.xxxl, borderBottomRightRadius: 12, padding: spacing.xxl, minHeight: 90,
  },
  spendRingWrap: { width: 124, height: 124, alignItems: 'center', justifyContent: 'center' },
  spendCenter: { position: 'absolute', alignItems: 'center' },
  spendMonth: { fontFamily: fontFamily.bodyBold, fontSize: 8, letterSpacing: 1.4, color: 'rgba(5,8,5,0.45)' },
  spendTotal: { fontFamily: fontFamily.displayBlack, fontSize: 19, letterSpacing: -0.8, color: colors.ink },
  spendLegend: { flex: 1, gap: 7 },
  spendTitle: { fontFamily: fontFamily.displayBlack, fontSize: 13.5, letterSpacing: -0.3, color: colors.ink, marginBottom: 3 },
  spendLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spendDot: { width: 9, height: 9, borderRadius: 4.5 },
  spendLegendLabel: { flex: 1, fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: 'rgba(5,8,5,0.65)' },
  spendLegendPct: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },

  goalCard: {
    overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: spacing.xl,
    borderRadius: radius.xxl, borderBottomRightRadius: 11, paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl,
    backgroundColor: colors.flagGold,
  },
  goalRing: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, borderColor: 'rgba(5,8,5,0.35)',
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.22)',
  },
  goalRingText: { fontFamily: fontFamily.displayBlack, fontSize: 12, color: colors.ink },
  goalTitle: { fontFamily: fontFamily.displayBold, fontSize: 13, color: colors.ink },
  goalSub: { fontFamily: fontFamily.bodySemiBold, fontSize: 10.5, color: 'rgba(5,8,5,0.65)', marginBottom: 6 },
  goalBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(5,8,5,0.16)', overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3, backgroundColor: colors.ink },
  goalAmount: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  goalAmountText: { fontFamily: fontFamily.displayBlack, fontSize: 17, letterSpacing: -0.5, color: colors.ink },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.65)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.07)', borderRadius: radius.lg },
  txIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },
  txSub: { ...type.caption, color: 'rgba(5,8,5,0.5)' },
  txAmount: { fontFamily: fontFamily.bodyBold, fontSize: 13 },
});

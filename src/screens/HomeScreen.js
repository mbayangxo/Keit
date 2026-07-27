import { useCallback, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import ScreenBackground from '../components/ScreenBackground';
import PressScale from '../components/PressScale';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAppState } from '../state/AppState';
import { useScreenshotBlock } from '../hooks/useScreenshotBlock';
import { usePlatformFeatures } from '../lib/platform-features';
import { getFriends, getMboloThreads, getMe, getTontineGroups, getTransactions } from '../lib/api-client';
import { colors, fontFamily, radius, spacing, type, motion } from '../theme';
import { navigateFromRoot } from '../lib/root-navigation';
import { formatKori } from '../lib/kori.js';
import {
  useFloatLoop,
  useBlink,
  useScalePulse,
  useColorPulse,
  useEntrance,
} from '../hooks/animations';

const PRIMARY_ACTIONS = [
  { icon: '💸', label: 'Yónnee', gradient: ['#2dff7d', '#0fbc48'], glow: colors.green, route: 'SendMoney' },
  { icon: '📥', label: 'Jël', gradient: ['#ffe45c', '#e8920a'], glow: colors.flagGold, route: 'Receive' },
  { icon: '🏪', label: 'Fey', gradient: ['#ff8c52', '#c44010'], glow: colors.terracotta, route: 'PayMerchant' },
];

const SECONDARY_ACTIONS = [
  { icon: '🏧', label: 'Cash', gradient: ['#baf7d0', '#22d968'], glow: colors.green, route: 'Cash', feature: ['cash', 'available'] },
  { icon: '🏦', label: 'Tontine', gradient: ['#fdf3cd', '#eeda96'], glow: colors.flagGold, route: 'Tontine', feature: ['wallet', 'tontine'] },
  { icon: '📷', label: 'Scan', gradient: ['#ffd4c4', '#e85c1a'], glow: colors.terracotta, route: 'QrScan' },
  { icon: '➕', label: 'Plus', gradient: ['#d4f5e2', '#1a9e52'], glow: colors.green, route: 'MoreActions' },
];

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

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

  return {
    total,
    segments,
    monthLabel: now.toLocaleDateString('fr-FR', { month: 'long' }).toUpperCase(),
  };
}

function formatTontineDue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}

function mbooloThreadPreview(thread, userId) {
  const last = thread.messages?.[0];
  const others = (thread.members ?? []).filter((m) => m.userId !== userId).map((m) => m.user).filter(Boolean);
  const name = thread.name?.trim() || others.map((u) => u.name).join(', ') || 'Conversation';
  const preview =
    last?.kind === 'image' ? '📷 Photo' : last?.kind === 'voice' ? '🎤 Message vocal' : last?.body ?? 'Dis bonjour 👋';
  const avatars = others.slice(0, 3).map((u) => u.avatarEmoji ?? '🧑🏾');
  while (avatars.length < Math.min(3, (thread.members?.length ?? 1) - 1)) avatars.push('🧑🏾');
  return { name, preview, avatars, memberCount: thread.members?.length ?? 0 };
}

function ActionButton({ icon, label, gradient, glow, delay, onPress, compact }) {
  const float = useFloatLoop(delay);
  const handlePress = () => {
    if (typeof onPress === 'function') onPress();
  };
  return (
    <PressScale scaleTo={0.9} onPress={handlePress} style={[styles.haItem, compact && styles.haItemCompact]}>
      <View style={[styles.haBtn, compact && styles.haBtnCompact, { shadowColor: glow }]}>
        <LinearGradient colors={gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.haSheen} />
        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <Text style={[styles.haIcon, compact && styles.haIconCompact]}>{icon}</Text>
        </Animated.View>
      </View>
      <Text style={[styles.haLabel, compact && styles.haLabelCompact]} numberOfLines={2}>{label}</Text>
    </PressScale>
  );
}

function MbooloPulseCard({ thread, userId, onPress }) {
  const borderColor = useColorPulse(colors.terracottaA20, colors.terracottaA45, motion.pulse);
  const badgeScale = useScalePulse(1500, 1.15);

  if (!thread) return null;
  const { name, preview, avatars, memberCount } = mbooloThreadPreview(thread, userId);

  return (
    <PressScale onPress={onPress} scaleTo={0.98} style={[styles.mbooloMini, { borderColor }]}>
      <View style={styles.mmAvaStack}>
        {avatars.length ? (
          avatars.map((emoji, i) => (
            <View key={`${emoji}-${i}`} style={[styles.mmAva, i === 0 && { marginLeft: 0 }]}>
              <Text style={styles.mmAvaText}>{emoji}</Text>
            </View>
          ))
        ) : (
          <View style={[styles.mmAva, { marginLeft: 0 }]}>
            <Text style={styles.mmAvaText}>💬</Text>
          </View>
        )}
      </View>
      <View style={styles.mmBody}>
        <Text style={styles.mmTitle} numberOfLines={1}>{name}</Text>
        <Text style={styles.mmSub} numberOfLines={1}>{preview}</Text>
      </View>
      {memberCount > 1 ? (
        <Animated.View style={[styles.mmBadge, { transform: [{ scale: badgeScale }] }]}>
          <Text style={styles.mmBadgeText}>{memberCount}</Text>
        </Animated.View>
      ) : null}
    </PressScale>
  );
}

const QUICK_SEND_TONES = [
  { bg: 'rgba(26,240,96,0.16)', border: 'rgba(15,188,72,0.45)', text: colors.greenDark },
  { bg: 'rgba(247,183,49,0.18)', border: 'rgba(232,146,10,0.45)', text: colors.goldDark },
  { bg: 'rgba(232,92,26,0.14)', border: 'rgba(232,92,26,0.4)', text: colors.terracottaDark },
];

const QUICK_SEND_LIMIT = 8;

function QuickSendRow({ navigation }) {
  const open = (route, params) => navigateFromRoot(navigation, route, params);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      setLoading(true);
      getFriends()
        .then((list) => {
          if (!cancelled) setFriends(Array.isArray(list) ? list : []);
        })
        .catch(() => {
          if (!cancelled) setFriends([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const quickFriends = friends.slice(0, QUICK_SEND_LIMIT);

  return (
    <View style={styles.qs}>
      <View style={styles.discHead}>
        <Text style={styles.discLabel}>Yónnee rapide</Text>
        {friends.length > QUICK_SEND_LIMIT ? (
          <PressScale scaleTo={0.97} onPress={() => open('Friends')}>
            <Text style={styles.discAll}>Tous</Text>
          </PressScale>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qsRow}>
        <PressScale scaleTo={0.9} onPress={() => open('SendMoney')} style={styles.qsItem}>
          <View style={styles.qsAddDisc}>
            <Text style={styles.qsAddPlus}>+</Text>
          </View>
          <Text style={styles.qsName}>Yónnee</Text>
        </PressScale>
        {loading ? (
          <ActivityIndicator color={colors.greenDark} style={styles.qsLoading} />
        ) : quickFriends.length === 0 ? (
          <PressScale scaleTo={0.97} onPress={() => open('Friends')} style={styles.qsEmpty}>
            <Text style={styles.qsEmptyText}>Ajoute un ami pour envoyer en un tap</Text>
          </PressScale>
        ) : (
          quickFriends.map((friend, i) => {
            const tone = QUICK_SEND_TONES[i % QUICK_SEND_TONES.length];
            const label = friend.name?.trim() || friend.handle;
            return (
              <PressScale
                key={friend.id}
                scaleTo={0.9}
                onPress={() => open('SendMoney', { recipientHandle: friend.handle })}
                style={styles.qsItem}
              >
                <View style={[styles.qsDisc, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                  <ProfileAvatar
                    photoUrl={friend.avatarUrl}
                    initial={label[0]?.toUpperCase() ?? '?'}
                    size={54}
                    style={styles.qsAvatar}
                    textStyle={{ color: tone.text }}
                  />
                </View>
                <Text style={styles.qsName} numberOfLines={2}>{label}</Text>
              </PressScale>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

// "Dépenses du mois" — spending ring from real ledger outflows this month.
const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;

function SpendingRing({ spending }) {
  if (!spending?.segments?.length) return null;
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
          <Text style={styles.spendTotal}>{formatKori(spending.total)}</Text>
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

function TontineGoalCard({ group, open }) {
  if (!group) return null;
  const progress = group.expectedPot ? Math.min(100, Math.round((group.potBalance / group.expectedPot) * 100)) : 0;
  const roundLabel = group.memberCount ? `${group.rotationIndex + 1}/${group.memberCount}` : '—';
  const dueLabel = group.nextDueAt ? `Prochain tour · ${formatTontineDue(group.nextDueAt)}` : 'Tontine active';

  return (
    <PressScale scaleTo={0.98} onPress={() => open('Tontine')} style={styles.goalCard}>
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
      <View style={styles.goalAmount}>
        <Text style={styles.goalAmountText}>{formatKori(group.potBalance || group.expectedPot)}</Text>
      </View>
    </PressScale>
  );
}

function TransactionRow({ icon, iconBg, title, subtitle, amount, amountColor }) {
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: iconBg }]}>
        <Text style={{ fontSize: 16 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txTitle}>{title}</Text>
        <Text style={styles.txSub}>{subtitle}</Text>
      </View>
      <Text style={[styles.txAmount, { color: amountColor }]}>{amount}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  useScreenshotBlock(true);
  const open = (route, params) => navigateFromRoot(navigation, route, params);
  const { feature } = usePlatformFeatures();
  const notifBlink = useBlink();
  const balanceEntrance = useEntrance(0, 1000, 12);
  const { profile, balance, transactions, refreshWallet } = useAppState();
  const firstName = profile.name.split(' ')[0];
  const [recentTxs, setRecentTxs] = useState([]);
  const [tontineGroup, setTontineGroup] = useState(null);
  const [mboloThread, setMbooloThread] = useState(null);
  const [mboloUserId, setMbooloUserId] = useState(null);

  const spending = computeMonthlySpending(recentTxs.length ? recentTxs : transactions);

  useFocusEffect(
    useCallback(() => {
      refreshWallet().catch(() => {});
      let cancelled = false;

      Promise.all([
        getTransactions(100),
        getTontineGroups(),
        getMe(),
        getMboloThreads(),
      ])
        .then(([txList, tontines, me, threads]) => {
          if (cancelled) return;
          const txs = Array.isArray(txList) ? txList : [];
          setRecentTxs(txs);
          const groups = Array.isArray(tontines) ? tontines : [];
          const primary =
            groups.find((g) => g.isMyTurn) ?? groups.find((g) => g.releasing) ?? groups[0] ?? null;
          setTontineGroup(primary);
          setMbooloUserId(me?.id ?? null);
          const threadList = Array.isArray(threads) ? threads : [];
          setMbooloThread(threadList[0] ?? null);
        })
        .catch(() => {
          if (!cancelled) {
            setTontineGroup(null);
            setMbooloThread(null);
          }
        });

      return () => {
        cancelled = true;
      };
    }, [refreshWallet]),
  );

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.locationLabel}>📍 {profile.arrondissement.name} · Dakar</Text>
                  <Text style={styles.greeting}>
                    Salut <Text style={styles.greetingBold}>{firstName}</Text> 👋🏿
                  </Text>
                </View>
                <PressScale scaleTo={0.9} onPress={() => open('Main', { screen: 'NotificationsTab' })} style={styles.notifBtn}>
                  <Text style={{ fontSize: 16 }}>🔔</Text>
                  <Animated.View style={[styles.notifDot, { opacity: notifBlink }]} />
                </PressScale>
              </View>

              <View style={styles.balanceDisplay}>
                <Text style={styles.balanceEye}>👁 Solde</Text>
                <Animated.Text style={[styles.balanceAmount, balanceEntrance]}>
                  {formatKori(balance)}
                </Animated.Text>
                <View style={styles.zeroFeesPill}>
                  <Text style={styles.zeroFeesText}>✦ Zéro frais sur tous tes envois</Text>
                </View>
              </View>

              <View style={styles.homeActions}>
                {PRIMARY_ACTIONS.map((a, i) => (
                  <ActionButton key={a.label} {...a} delay={i * 300} onPress={() => open(a.route)} />
                ))}
              </View>
              <View style={styles.homeActionsSecondary}>
                {SECONDARY_ACTIONS.filter((a) => !a.feature || feature(...a.feature)).map((a, i) => (
                  <ActionButton
                    key={a.label}
                    {...a}
                    compact
                    delay={i * 300 + 900}
                    onPress={() => open(a.route)}
                  />
                ))}
              </View>
              <PressScale scaleTo={0.98} onPress={() => open('Main', { screen: 'MarketplaceTab' })} style={styles.marketplaceCard}>
                <Text style={styles.marketplaceIcon}>🛒</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.marketplaceTitle}>Marketplace</Text>
                  <Text style={styles.marketplaceSub}>Livraison · courses · billets · marchands</Text>
                </View>
                <Text style={styles.marketplaceArrow}>→</Text>
              </PressScale>
            </View>
          </View>

          {/* Flag divider */}
          <View style={styles.flagDiv}>
            <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
            <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
            <View style={[styles.flagSeg, { backgroundColor: colors.terracotta }]} />
          </View>

          <QuickSendRow navigation={navigation} />

          <View style={styles.homeCards}>
            <SpendingRing spending={spending} />
            <TontineGoalCard group={tontineGroup} open={open} />
            <MbooloPulseCard
              thread={mboloThread}
              userId={mboloUserId}
              onPress={() => open('MbooloTab')}
            />
          </View>

          <View style={styles.txSection}>
            <Text style={styles.txLabel}>Transactions récentes</Text>
            {recentTxs.length === 0 ? (
              <Text style={styles.txEmpty}>Aucune transaction pour l'instant.</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {recentTxs.slice(0, 5).map((tx) => (
                  <TransactionRow
                    key={tx.key}
                    icon={tx.icon}
                    iconBg={tx.iconBg}
                    title={tx.title}
                    subtitle={tx.subtitle}
                    amount={`${tx.amount > 0 ? '+' : ''}${formatKori(Math.abs(tx.amount))}`}
                    amountColor={tx.amount > 0 ? colors.greenDark : colors.terracottaDark}
                  />
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
  root: { flex: 1, backgroundColor: colors.appCanvas.base },

  hero: { position: 'relative', overflow: 'hidden', paddingHorizontal: spacing.huge, paddingTop: spacing.giant, paddingBottom: 22 },
  heroContent: { position: 'relative', zIndex: 2 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.huge },
  locationLabel: { ...type.tiny, fontSize: 9, letterSpacing: 1, color: 'rgba(5,8,5,0.45)', textTransform: 'uppercase', marginBottom: 3 },
  greeting: { fontFamily: fontFamily.displayBold, fontSize: 17, letterSpacing: -0.4, color: 'rgba(5,8,5,0.55)' },
  greetingBold: { color: colors.ink, fontFamily: fontFamily.displayBlack },
  notifBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: 'rgba(5,8,5,0.05)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.08)', alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.orange, borderWidth: 1.5, borderColor: colors.appCanvas.base },

  balanceDisplay: { alignItems: 'center', marginBottom: spacing.giant },
  balanceEye: { ...type.bodySmall, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.sm },
  balanceAmount: { ...type.balanceAmount, color: colors.ink, textAlign: 'center', textShadowColor: 'rgba(26,240,96,0.3)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 18 },
  balanceCurrency: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: colors.greenDark },
  zeroFeesPill: { marginTop: spacing.md, alignSelf: 'center', backgroundColor: 'rgba(247,183,49,0.14)', borderWidth: 1, borderColor: 'rgba(232,146,10,0.3)', borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  zeroFeesText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.goldDark },

  homeActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  homeActionsSecondary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
  marketplaceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xl,
    borderBottomRightRadius: 10,
    padding: spacing.lg,
  },
  marketplaceIcon: { fontSize: 28 },
  marketplaceTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: colors.ink },
  marketplaceSub: { fontSize: 10, color: 'rgba(5,8,5,0.5)', marginTop: 2 },
  marketplaceArrow: { fontSize: 16, color: colors.greenDark },
  haItem: { alignItems: 'center', gap: spacing.xs, flex: 1, maxWidth: 88, minHeight: 72 },
  haItemCompact: { maxWidth: 72, minHeight: 68 },
  haBtn: {
    width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 7,
  },
  haBtnCompact: { width: 50, height: 50, borderRadius: 25 },
  haSheen: { position: 'absolute', top: 3, left: 12, right: 12, height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.28)' },
  haIcon: { fontSize: 23 },
  haIconCompact: { fontSize: 20 },
  haLabel: { ...type.actionLabel, color: 'rgba(5,8,5,0.65)', textAlign: 'center' },
  haLabelCompact: { fontSize: 9, lineHeight: 11 },

  flagDiv: { flexDirection: 'row', height: 2, marginVertical: spacing.xxxl },
  flagSeg: { flex: 1 },

  homeCards: { paddingHorizontal: spacing.xxxl, paddingBottom: spacing.xxxl, gap: spacing.lg },

  wakhnaMini: { backgroundColor: 'rgba(247,183,49,0.14)', borderWidth: 1, borderColor: 'rgba(232,146,10,0.28)', borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  wmScore: { ...type.ngorScore, color: colors.goldDark },
  wmBody: { flex: 1 },
  wmLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, color: colors.goldDark, textTransform: 'uppercase', marginBottom: 3 },
  wmRank: { ...type.bodySmall, color: 'rgba(5,8,5,0.55)' },
  wmRankBold: { fontFamily: fontFamily.bodyBold, color: colors.goldDark },
  wmBar: { height: 4, backgroundColor: 'rgba(5,8,5,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: spacing.sm },
  wmStar: { fontSize: 20, color: colors.goldDark },

  mbooloMini: { backgroundColor: 'rgba(232,92,26,0.1)', borderWidth: 1, borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  mmAvaStack: { flexDirection: 'row' },
  mmAva: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.appCanvas.surface, borderWidth: 2, borderColor: colors.appCanvas.base, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  mmAvaText: { fontSize: 13 },
  mmBody: { flex: 1 },
  mmTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.terracottaDark },
  mmSub: { ...type.caption, color: 'rgba(5,8,5,0.5)' },
  mmBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  mmBadgeText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.white },

  qs: { paddingTop: spacing.xl },
  discHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxxl, marginBottom: spacing.md },
  discLabel: { fontFamily: fontFamily.bodyBold, fontSize: 11, letterSpacing: 0.8, color: 'rgba(5,8,5,0.5)', textTransform: 'uppercase' },
  discAll: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.greenDark },
  qsRow: { paddingHorizontal: spacing.xxxl, gap: spacing.xl, paddingBottom: spacing.lg },
  qsItem: { alignItems: 'center', gap: 5 },
  qsAddDisc: {
    width: 54, height: 54, borderRadius: 27, borderBottomRightRadius: 9, backgroundColor: colors.ink,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 5,
  },
  qsAddPlus: { fontSize: 22, color: colors.flagGold, marginTop: -2 },
  qsDisc: {
    width: 54, height: 54, borderRadius: 27, borderBottomRightRadius: 9, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  qsAvatar: { borderWidth: 0, backgroundColor: 'transparent', borderRadius: 27, borderBottomRightRadius: 9 },
  qsName: { fontFamily: fontFamily.bodySemiBold, fontSize: 10.5, color: 'rgba(5,8,5,0.6)', maxWidth: 64, textAlign: 'center', lineHeight: 13 },
  qsLoading: { alignSelf: 'center', marginLeft: spacing.lg },
  qsEmpty: { justifyContent: 'center', paddingHorizontal: spacing.lg, maxWidth: 200 },
  qsEmptyText: { fontFamily: fontFamily.bodySemiBold, fontSize: 11, color: 'rgba(5,8,5,0.45)', lineHeight: 15 },

  spendCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xxl,
    backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.07)',
    borderRadius: radius.xxxl, borderBottomRightRadius: 12, padding: spacing.xxl,
  },
  spendRingWrap: { width: 124, height: 124, alignItems: 'center', justifyContent: 'center' },
  spendCenter: { position: 'absolute', alignItems: 'center' },
  spendMonth: { fontFamily: fontFamily.bodyBold, fontSize: 8, letterSpacing: 1.4, color: 'rgba(5,8,5,0.45)' },
  spendTotal: { fontFamily: fontFamily.displayBlack, fontSize: 19, letterSpacing: -0.8, color: colors.ink },
  spendCurrency: { fontFamily: fontFamily.bodySemiBold, fontSize: 8.5, color: 'rgba(5,8,5,0.45)' },
  spendLegend: { flex: 1, gap: 7 },
  spendTitle: { fontFamily: fontFamily.displayBlack, fontSize: 13.5, letterSpacing: -0.3, color: colors.ink, marginBottom: 3 },
  spendLegendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  spendDot: { width: 9, height: 9, borderRadius: 4.5 },
  spendLegendLabel: { flex: 1, fontFamily: fontFamily.bodySemiBold, fontSize: 12, color: 'rgba(5,8,5,0.65)' },
  spendLegendPct: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },

  goalCard: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xl,
    backgroundColor: 'rgba(247,183,49,0.14)', borderWidth: 1, borderColor: 'rgba(232,146,10,0.28)',
    borderRadius: radius.xxl, borderBottomRightRadius: 10, paddingHorizontal: spacing.xxl, paddingVertical: spacing.xl,
  },
  goalRing: {
    width: 46, height: 46, borderRadius: 23, borderWidth: 2.5, borderColor: colors.goldDark,
    borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
  },
  goalRingText: { fontFamily: fontFamily.displayBlack, fontSize: 12, color: colors.goldDark },
  goalTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  goalSub: { fontFamily: fontFamily.bodyRegular, fontSize: 10.5, color: 'rgba(5,8,5,0.55)', marginBottom: 6 },
  goalBar: { height: 5, borderRadius: 3, backgroundColor: 'rgba(5,8,5,0.08)', overflow: 'hidden' },
  goalFill: { height: '100%', borderRadius: 3, backgroundColor: colors.goldDark },
  goalAmount: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  goalAmountText: { fontFamily: fontFamily.displayBlack, fontSize: 17, letterSpacing: -0.5, color: colors.goldDark },
  goalAmountF: { fontFamily: fontFamily.bodySemiBold, fontSize: 10, color: 'rgba(5,8,5,0.5)' },

  txSection: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxxl },
  txLabel: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.lg },
  txEmpty: { fontSize: 11, color: 'rgba(5,8,5,0.45)' },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 9, backgroundColor: 'rgba(255,255,255,0.65)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.07)', borderRadius: radius.lg },
  txIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },
  txSub: { ...type.caption, color: 'rgba(5,8,5,0.5)' },
  txAmount: { fontFamily: fontFamily.bodyBold, fontSize: 13 },
});

import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
import HomeHeroBackground from '../components/HomeHeroBackground';
import PressScale from '../components/PressScale';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing, type, motion } from '../theme';
import {
  useFloatLoop,
  useBlink,
  useScalePulse,
  useColorPulse,
  useGlowPulse,
  useBarLoop,
  useSpinFlick,
  useEntrance,
  usePopIn,
  useFillIn,
} from '../hooks/animations';

const ACTIONS = [
  { icon: '💸', label: 'Yónnee', bg: colors.greenA12, border: colors.greenA20, route: 'SendMoney' },
  { icon: '📥', label: 'Jël', bg: colors.goldA10, border: colors.goldA20, route: 'Receive' },
  { icon: '🏪', label: 'Fey', bg: colors.orangeA10, border: colors.orangeA20, route: 'PayMerchant' },
  { icon: '⋯', label: 'Plus', bg: colors.whiteA06, border: colors.whiteA10, route: 'MoreActions' },
];

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function ActionButton({ icon, label, bg, border, delay, onPress }) {
  const float = useFloatLoop(delay);
  return (
    <PressScale scaleTo={0.9} onPress={onPress} style={styles.haItem}>
      <View style={[styles.haBtn, { backgroundColor: bg, borderColor: border }]}>
        <Animated.View style={{ transform: [{ translateY: float }] }}>
          <Text style={styles.haIcon}>{icon}</Text>
        </Animated.View>
      </View>
      <Text style={styles.haLabel}>{label}</Text>
    </PressScale>
  );
}

function RectSoundCard() {
  const glow = useGlowPulse(motion.pulseSlow, 0.35);
  const spin = useSpinFlick();
  const dotBlink = useBlink();
  const bar1 = useBarLoop(0);
  const bar2 = useBarLoop(80);
  const bar3 = useBarLoop(160);
  const bar4 = useBarLoop(240);

  return (
    <Animated.View
      style={[
        styles.rectCard,
        {
          shadowColor: colors.green,
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 24,
          shadowOpacity: glow,
          elevation: 4,
        },
      ]}
    >
      <View style={styles.rcTop}>
        <Text style={styles.rcTag}>Rect Sound · 221 Bëgg</Text>
        <View style={styles.rcLive}>
          <Animated.View style={[styles.rcDot, { opacity: dotBlink }]} />
          <Text style={styles.rcLiveText}>LIVE</Text>
        </View>
      </View>
      <View style={styles.rcSong}>
        <Animated.View style={[styles.rcCover, { transform: [{ rotate: spin }] }]}>
          <Text style={{ fontSize: 19 }}>🎵</Text>
        </Animated.View>
        <View style={styles.rcInfo}>
          <Text style={styles.rcTitle} numberOfLines={1}>"Yëkël" — Saliou K.</Text>
          <Text style={styles.rcArtist}>Chart #1 · Médina</Text>
          <Text style={styles.rcChart}>🔥 24 800 Dafa neex aujourd'hui</Text>
        </View>
        <View style={styles.rcBars}>
          <Animated.View style={[styles.rcBar, { height: 8, transform: [{ scaleY: bar1 }] }]} />
          <Animated.View style={[styles.rcBar, { height: 16, transform: [{ scaleY: bar2 }] }]} />
          <Animated.View style={[styles.rcBar, { height: 10, transform: [{ scaleY: bar3 }] }]} />
          <Animated.View style={[styles.rcBar, { height: 18, transform: [{ scaleY: bar4 }] }]} />
        </View>
      </View>
    </Animated.View>
  );
}

function WakhnaMiniCard({ onPress }) {
  const pop = usePopIn(300, 1000, 0.7);
  const fill = useFillIn(72, 500, 1200);
  const starPulse = useScalePulse(2000, 1.15);

  return (
    <PressScale onPress={onPress} scaleTo={0.98} style={styles.wakhnaMini}>
      <Animated.Text style={[styles.wmScore, pop]}>840</Animated.Text>
      <View style={styles.wmBody}>
        <Text style={styles.wmLabel}>Wakhna Score</Text>
        <Text style={styles.wmRank}>Top <Text style={styles.wmRankBold}>12%</Text> Médina · #47</Text>
        <View style={styles.wmBar}>
          <Animated.View style={{ width: fill, height: '100%' }}>
            <LinearGradient
              colors={[colors.green, colors.flagGold]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1, borderRadius: 2 }}
            />
          </Animated.View>
        </View>
      </View>
      <Animated.Text style={[styles.wmStar, { transform: [{ scale: starPulse }] }]}>✦</Animated.Text>
    </PressScale>
  );
}

function MbooloPulseCard({ onPress }) {
  const borderColor = useColorPulse(colors.terracottaA20, colors.terracottaA45, motion.pulse);
  const badgeScale = useScalePulse(1500, 1.15);

  return (
    <PressScale onPress={onPress} scaleTo={0.98} style={[styles.mbooloMini, { borderColor }]}>
      <View style={styles.mmAvaStack}>
        <View style={[styles.mmAva, { marginLeft: 0 }]}><Text style={styles.mmAvaText}>👩🏾</Text></View>
        <View style={styles.mmAva}><Text style={styles.mmAvaText}>👦🏿</Text></View>
        <View style={styles.mmAva}><Text style={styles.mmAvaText}>👩🏿</Text></View>
      </View>
      <View style={styles.mmBody}>
        <Text style={styles.mmTitle}>Médina Squad</Text>
        <Text style={styles.mmSub}>Ibou: Ñu lekk 18h bi 🍖</Text>
      </View>
      <Animated.View style={[styles.mmBadge, { transform: [{ scale: badgeScale }] }]}>
        <Text style={styles.mmBadgeText}>4</Text>
      </Animated.View>
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
  const notifBlink = useBlink();
  const balanceEntrance = useEntrance(0, 1000, 12);
  const { profile, balance, transactions } = useAppState();
  const firstName = profile.name.split(' ')[0];

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(255,255,255,0.025)" size={18} durationMs={motion.waxDrift} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 70 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <HomeHeroBackground />
            <WaxPattern color="rgba(26,240,96,0.04)" size={18} animated={false} />
            <View style={styles.heroContent}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.locationLabel}>📍 {profile.arrondissement.name} · Dakar</Text>
                  <Text style={styles.greeting}>
                    Salut <Text style={styles.greetingBold}>{firstName}</Text> 👋🏿
                  </Text>
                </View>
                <PressScale scaleTo={0.9} onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
                  <Text style={{ fontSize: 16 }}>🔔</Text>
                  <Animated.View style={[styles.notifDot, { opacity: notifBlink }]} />
                </PressScale>
              </View>

              <View style={styles.balanceDisplay}>
                <Text style={styles.balanceEye}>👁 Solde</Text>
                <Animated.Text style={[styles.balanceAmount, balanceEntrance]}>
                  {formatAmount(balance)} <Text style={styles.balanceCurrency}>F</Text>
                </Animated.Text>
                <View style={styles.zeroFeesPill}>
                  <Text style={styles.zeroFeesText}>✦ Zéro frais sur tous tes envois</Text>
                </View>
              </View>

              <View style={styles.homeActions}>
                {ACTIONS.map((a, i) => (
                  <ActionButton key={a.label} {...a} delay={i * 300} onPress={() => navigation.navigate(a.route)} />
                ))}
              </View>
            </View>
          </View>

          {/* Flag divider */}
          <View style={styles.flagDiv}>
            <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
            <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
            <View style={[styles.flagSeg, { backgroundColor: colors.flagRed }]} />
          </View>

          <View style={styles.homeCards}>
            <RectSoundCard />
            <WakhnaMiniCard onPress={() => navigation.navigate('MoiTab')} />
            <MbooloPulseCard onPress={() => navigation.navigate('MbooloTab')} />
          </View>

          <View style={styles.txSection}>
            <Text style={styles.txLabel}>Transactions récentes</Text>
            {transactions.length === 0 ? (
              <Text style={styles.txEmpty}>Aucune transaction pour l'instant.</Text>
            ) : (
              <View style={{ gap: spacing.sm }}>
                {transactions.slice(0, 5).map((tx) => (
                  <TransactionRow
                    key={tx.key}
                    icon={tx.icon}
                    iconBg={tx.iconBg}
                    title={tx.title}
                    subtitle={tx.subtitle}
                    amount={`${tx.amount > 0 ? '+' : ''}${formatAmount(tx.amount)} F`}
                    amountColor={tx.amount > 0 ? colors.green : colors.flagRed}
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
  root: { flex: 1, backgroundColor: colors.ink },

  hero: { position: 'relative', overflow: 'hidden', paddingHorizontal: spacing.huge, paddingTop: spacing.giant, paddingBottom: 22 },
  heroContent: { position: 'relative', zIndex: 2 },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.huge },
  locationLabel: { ...type.tiny, fontSize: 9, letterSpacing: 1, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: 3 },
  greeting: { ...type.bodySmall, color: colors.whiteA40 },
  greetingBold: { color: colors.whiteA70, fontFamily: fontFamily.bodyBold },
  notifBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.flagRed, borderWidth: 1.5, borderColor: colors.ink },

  balanceDisplay: { alignItems: 'center', marginBottom: spacing.giant },
  balanceEye: { ...type.bodySmall, color: colors.whiteA30, marginBottom: spacing.sm },
  balanceAmount: { ...type.balanceAmount, color: colors.green, textAlign: 'center' },
  balanceCurrency: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(26,240,96,0.5)' },
  zeroFeesPill: { marginTop: spacing.md, alignSelf: 'center', backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA18, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  zeroFeesText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: 'rgba(26,240,96,0.8)' },

  homeActions: { flexDirection: 'row', justifyContent: 'space-between' },
  haItem: { alignItems: 'center', gap: spacing.xs },
  haBtn: { width: 52, height: 52, borderRadius: radius.xxl, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  haIcon: { fontSize: 22 },
  haLabel: { ...type.actionLabel, color: colors.whiteA40, textAlign: 'center' },

  flagDiv: { flexDirection: 'row', height: 2, marginVertical: spacing.xxxl },
  flagSeg: { flex: 1 },

  homeCards: { paddingHorizontal: spacing.xxxl, paddingBottom: spacing.xxxl, gap: spacing.lg },

  rectCard: { backgroundColor: '#0a1a0c', borderWidth: 1.5, borderColor: colors.greenA20, borderRadius: radius.xxxl, padding: spacing.xxl },
  rcTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  rcTag: { fontFamily: fontFamily.bodyBold, fontSize: 8, letterSpacing: 1, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase' },
  rcLive: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rcDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.flagRed },
  rcLiveText: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.flagRed },
  rcSong: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  rcCover: { width: 44, height: 44, borderRadius: radius.lg, backgroundColor: '#1a5e30', alignItems: 'center', justifyContent: 'center' },
  rcInfo: { flex: 1, minWidth: 0 },
  rcTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  rcArtist: { ...type.bodySmall, color: colors.whiteA40 },
  rcChart: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.green, marginTop: 2 },
  rcBars: { flexDirection: 'row', gap: 2, alignItems: 'flex-end', height: 20 },
  rcBar: { width: 3, borderRadius: 2, backgroundColor: colors.green },

  wakhnaMini: { backgroundColor: 'rgba(26,240,96,0.07)', borderWidth: 1, borderColor: colors.greenA15, borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  wmScore: { ...type.wakhnaScore, color: colors.green },
  wmBody: { flex: 1 },
  wmLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: 3 },
  wmRank: { ...type.bodySmall, color: colors.whiteA40 },
  wmRankBold: { fontFamily: fontFamily.bodyBold, color: colors.green },
  wmBar: { height: 4, backgroundColor: colors.whiteA08, borderRadius: 2, overflow: 'hidden', marginTop: spacing.sm },
  wmStar: { fontSize: 20, color: colors.green },

  mbooloMini: { backgroundColor: 'rgba(232,92,26,0.1)', borderWidth: 1, borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  mmAvaStack: { flexDirection: 'row' },
  mmAva: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.whiteA08, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  mmAvaText: { fontSize: 13 },
  mmBody: { flex: 1 },
  mmTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: 'rgba(255,180,100,0.9)' },
  mmSub: { ...type.caption, color: colors.whiteA30 },
  mmBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  mmBadgeText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.white },

  txSection: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxxl },
  txLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.lg },
  txEmpty: { fontSize: 11, color: colors.whiteA30 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 9, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg },
  txIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  txSub: { ...type.caption, color: colors.whiteA30 },
  txAmount: { fontFamily: fontFamily.bodyBold, fontSize: 13 },
});

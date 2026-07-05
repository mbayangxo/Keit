import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import WaxPattern from '../components/WaxPattern';
import HomeHeroBackground from '../components/HomeHeroBackground';
import PressScale from '../components/PressScale';
import { useAppState } from '../state/AppState';
import { useScreenshotBlock } from '../hooks/useScreenshotBlock';
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
  { icon: '💸', label: 'Yónnee', gradient: ['#2dff7d', '#0fbc48'], glow: colors.green, route: 'SendMoney' },
  { icon: '📥', label: 'Jël', gradient: ['#ffe45c', '#e8920a'], glow: colors.flagGold, route: 'Receive' },
  { icon: '🏪', label: 'Fey', gradient: ['#ff8c52', '#c44010'], glow: colors.orange, route: 'PayMerchant' },
  { icon: '⋯', label: 'Plus', gradient: ['#212b21', '#0c110c'], glow: colors.whiteA20, route: 'MoreActions' },
];

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function ActionButton({ icon, label, gradient, glow, delay, onPress }) {
  const float = useFloatLoop(delay);
  return (
    <PressScale scaleTo={0.9} onPress={onPress} style={styles.haItem}>
      <View style={[styles.haBtn, { shadowColor: glow }]}>
        <LinearGradient colors={gradient} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.haSheen} />
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

const DISCOVER_CHIPS = [
  { icon: '🎉', label: 'Events', bg: colors.terracottaA10, border: colors.terracottaA25 },
  { icon: '🍽️', label: 'Food', bg: colors.goldA10, border: colors.goldA20 },
  { icon: '🛍️', label: 'Shopping', bg: 'rgba(232,25,44,0.09)', border: 'rgba(232,25,44,0.22)' },
  { icon: '🏖️', label: 'Plages', bg: 'rgba(80,180,255,0.09)', border: 'rgba(80,180,255,0.22)' },
  { icon: '⚽', label: 'Foot', bg: colors.greenA08, border: colors.greenA18 },
  { icon: '🎵', label: 'Musique', bg: colors.orangeA10, border: colors.orangeA20 },
];

function FeaturedEventCard({ onPress }) {
  const glow = useGlowPulse(motion.pulseSlow, 0.4);
  const bar1 = useBarLoop(0);
  const bar2 = useBarLoop(120);
  const bar3 = useBarLoop(240);
  const dotBlink = useBlink();

  return (
    <PressScale scaleTo={0.98} onPress={onPress}>
      <Animated.View
        style={[
          styles.featCard,
          { shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowRadius: 26, shadowOpacity: glow, elevation: 5 },
        ]}
      >
        <LinearGradient colors={['#0d3b1c', '#0a1a0c', colors.ink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <WaxPattern color="rgba(26,240,96,0.05)" size={16} animated={false} />
        <View style={styles.featTop}>
          <View style={styles.featLivePill}>
            <Animated.View style={[styles.featLiveDot, { opacity: dotBlink }]} />
            <Text style={styles.featLiveText}>CE SOIR</Text>
          </View>
          <View style={styles.featBars}>
            <Animated.View style={[styles.featBar, { height: 10, transform: [{ scaleY: bar1 }] }]} />
            <Animated.View style={[styles.featBar, { height: 18, transform: [{ scaleY: bar2 }] }]} />
            <Animated.View style={[styles.featBar, { height: 13, transform: [{ scaleY: bar3 }] }]} />
          </View>
        </View>
        <Text style={styles.featTitle}>Afrobeats{'\n'}Rooftop Party</Text>
        <View style={styles.featMetaRow}>
          <Text style={styles.featMeta}>📍 Almadies · 21h</Text>
          <View style={styles.featTicket}>
            <Text style={styles.featTicketText}>Billets · 5 000 F</Text>
          </View>
        </View>
      </Animated.View>
    </PressScale>
  );
}

function MiniEventCard({ gradient, tag, tagColor, title, meta, onPress }) {
  return (
    <PressScale scaleTo={0.97} onPress={onPress} style={styles.miniCard}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Text style={[styles.miniTag, { color: tagColor }]}>{tag}</Text>
      <Text style={styles.miniTitle} numberOfLines={2}>{title}</Text>
      <Text style={styles.miniMeta}>{meta}</Text>
    </PressScale>
  );
}

function DiscoverSection({ navigation }) {
  const goExplore = () => navigation.navigate('ExplorerTab');
  return (
    <View style={styles.discover}>
      <View style={styles.discHead}>
        <Text style={styles.discLabel}>Découvre Dakar</Text>
        <PressScale scaleTo={0.94} onPress={goExplore}>
          <Text style={styles.discAll}>Voir tout →</Text>
        </PressScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {DISCOVER_CHIPS.map((c) => (
          <PressScale key={c.label} scaleTo={0.93} onPress={goExplore} style={[styles.chip, { backgroundColor: c.bg, borderColor: c.border }]}>
            <Text style={{ fontSize: 13 }}>{c.icon}</Text>
            <Text style={styles.chipText}>{c.label}</Text>
          </PressScale>
        ))}
      </ScrollView>

      <FeaturedEventCard onPress={goExplore} />

      <View style={styles.miniRow}>
        <MiniEventCard
          gradient={['#5c2410', '#3d1608', colors.ink]}
          tag="MARCHÉ"
          tagColor={colors.terracottaLight}
          title="Marché des tissus"
          meta="Sandaga · Sam 10h"
          onPress={goExplore}
        />
        <MiniEventCard
          gradient={['#4d3a08', '#332605', colors.ink]}
          tag="FESTIVAL"
          tagColor={colors.flagGold}
          title="Yoff Beach Festival"
          meta="Yoff · Dim 15h"
          onPress={goExplore}
        />
      </View>
    </View>
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

          <DiscoverSection navigation={navigation} />

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
  greeting: { fontFamily: fontFamily.displayBold, fontSize: 17, letterSpacing: -0.4, color: colors.whiteA55 },
  greetingBold: { color: colors.white, fontFamily: fontFamily.displayBlack },
  notifBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 9, width: 6, height: 6, borderRadius: 3, backgroundColor: colors.flagRed, borderWidth: 1.5, borderColor: colors.ink },

  balanceDisplay: { alignItems: 'center', marginBottom: spacing.giant },
  balanceEye: { ...type.bodySmall, color: colors.whiteA30, marginBottom: spacing.sm },
  balanceAmount: { ...type.balanceAmount, color: colors.white, textAlign: 'center', textShadowColor: 'rgba(26,240,96,0.35)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 24 },
  balanceCurrency: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(26,240,96,0.7)' },
  zeroFeesPill: { marginTop: spacing.md, alignSelf: 'center', backgroundColor: colors.goldA10, borderWidth: 1, borderColor: colors.goldA20, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  zeroFeesText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.flagGold },

  homeActions: { flexDirection: 'row', justifyContent: 'space-between' },
  haItem: { alignItems: 'center', gap: spacing.xs },
  haBtn: {
    width: 58, height: 58, borderRadius: 29, overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 7,
  },
  haSheen: { position: 'absolute', top: 3, left: 12, right: 12, height: 10, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.28)' },
  haIcon: { fontSize: 23 },
  haLabel: { ...type.actionLabel, color: colors.whiteA70, textAlign: 'center' },

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

  wakhnaMini: { backgroundColor: colors.goldA08, borderWidth: 1, borderColor: colors.goldA20, borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  wmScore: { ...type.wakhnaScore, color: colors.flagGold },
  wmBody: { flex: 1 },
  wmLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, color: 'rgba(250,216,54,0.7)', textTransform: 'uppercase', marginBottom: 3 },
  wmRank: { ...type.bodySmall, color: colors.whiteA40 },
  wmRankBold: { fontFamily: fontFamily.bodyBold, color: colors.flagGold },
  wmBar: { height: 4, backgroundColor: colors.whiteA08, borderRadius: 2, overflow: 'hidden', marginTop: spacing.sm },
  wmStar: { fontSize: 20, color: colors.flagGold },

  mbooloMini: { backgroundColor: 'rgba(232,92,26,0.1)', borderWidth: 1, borderRadius: radius.xxl, paddingHorizontal: spacing.xxxl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  mmAvaStack: { flexDirection: 'row' },
  mmAva: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.whiteA08, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  mmAvaText: { fontSize: 13 },
  mmBody: { flex: 1 },
  mmTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: 'rgba(255,180,100,0.9)' },
  mmSub: { ...type.caption, color: colors.whiteA30 },
  mmBadge: { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.terracotta, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  mmBadgeText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.white },

  discover: { paddingBottom: spacing.xxxl },
  discHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.xxxl, marginBottom: spacing.lg },
  discLabel: { fontFamily: fontFamily.displayBlack, fontSize: 15, letterSpacing: -0.4, color: colors.white },
  discAll: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.green },
  chipRow: { paddingHorizontal: spacing.xxxl, gap: spacing.sm, paddingBottom: spacing.lg },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: 7,
  },
  chipText: { fontFamily: fontFamily.bodyBold, fontSize: 11.5, color: colors.whiteA85 },

  featCard: { marginHorizontal: spacing.xxxl, borderRadius: radius.xxxl, borderWidth: 1.5, borderColor: colors.greenA20, padding: spacing.xxl, overflow: 'hidden', marginBottom: spacing.md },
  featTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xl },
  featLivePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(232,25,44,0.15)', borderWidth: 1, borderColor: 'rgba(232,25,44,0.35)', borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3 },
  featLiveDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.flagRed },
  featLiveText: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, color: colors.flagRed },
  featBars: { flexDirection: 'row', gap: 3, alignItems: 'flex-end', height: 18 },
  featBar: { width: 3.5, borderRadius: 2, backgroundColor: colors.green },
  featTitle: { fontFamily: fontFamily.displayBlack, fontSize: 22, lineHeight: 27, letterSpacing: -0.8, color: colors.white, marginBottom: spacing.lg },
  featMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  featMeta: { fontFamily: fontFamily.bodySemiBold, fontSize: 11.5, color: colors.whiteA55 },
  featTicket: { backgroundColor: colors.flagGold, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: 6 },
  featTicketText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.ink },

  miniRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.xxxl },
  miniCard: { flex: 1, borderRadius: radius.xxl, borderWidth: 1, borderColor: colors.whiteA08, padding: spacing.xl, overflow: 'hidden', minHeight: 108 },
  miniTag: { fontFamily: fontFamily.bodyBold, fontSize: 8.5, letterSpacing: 1.2, marginBottom: spacing.sm },
  miniTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13.5, lineHeight: 18, color: colors.white, marginBottom: 4 },
  miniMeta: { fontFamily: fontFamily.bodyRegular, fontSize: 10.5, color: colors.whiteA55 },

  txSection: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxxl },
  txLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.lg },
  txEmpty: { fontSize: 11, color: colors.whiteA30 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: 9, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg },
  txIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  txTitle: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  txSub: { ...type.caption, color: colors.whiteA30 },
  txAmount: { fontFamily: fontFamily.bodyBold, fontSize: 13 },
});

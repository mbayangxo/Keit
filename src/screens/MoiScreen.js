import { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PressScale from '../components/PressScale';
import WaxPattern from '../components/WaxPattern';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useFloatLoop, useFillIn, useScalePulse } from '../hooks/animations';

// design/k21-complete-redesign.html, Profile section — reproduced closely,
// with two Phase 1 adjustments: the "Défis" stat/highlight is swapped for
// "Événements" (Défis itself is excluded from Phase 1), and the "K21
// Junior" student-platform section is replaced with a smaller "K21 Pass"
// student-discount card (Moi's own requested item — the broader K21
// Junior feature set is a separate, excluded item).

const STATUS_ITEMS = [
  { icon: '🎵', text: 'Écoute "Yëkël"', music: true },
  { icon: '📍', text: 'À Médina' },
  { icon: '☕', text: 'En ataya' },
  { icon: '✦', text: 'Wakhna 840', highlight: true },
];

const STATS = [
  { key: 'wakhna', value: '840', label: 'Wakhna', color: colors.green },
  { key: 'mboolo', value: '247', label: 'Mboolo', color: colors.white },
  { key: 'events', value: '9', label: 'Événements', color: colors.flagGold },
  { key: 'cauris', value: '3', label: 'Cauris', color: colors.flagRed },
];

const HIGHLIGHTS = [
  { key: 'concerts', icon: '🎤', name: 'Concerts', ring: ['#e8192c', '#ff6422'] },
  { key: 'evenements', icon: '🎉', name: 'Événements', ring: ['#1af060', '#fad836'] },
  { key: 'vacances', icon: '🌴', name: 'Vacances', ring: ['#fad836', '#00853F'] },
  { key: 'new', icon: '+', name: 'Nouveau', ring: ['#00853F', '#e8192c'] },
];

const SETTINGS = [
  { key: 'accessibility', icon: '👁️', title: 'Accessibilité', subtitle: 'Mode données réduites, grand texte' },
  { key: 'account', icon: '🔐', title: 'Compte & Sécurité', subtitle: 'CNI, biométrie, 2FA pour gros montants' },
  { key: 'wallet', icon: '💳', title: 'Portefeuille', subtitle: 'Comptes liés, historique, limites' },
  { key: 'notifs', icon: '🔔', title: 'Notifications', subtitle: 'Alertes paiements, Mboolo, Wakhna' },
  { key: 'privacy', icon: '🕶️', title: 'Confidentialité', subtitle: 'Qui voit ton profil et ton Wakhna' },
  { key: 'help', icon: '❓', title: 'Aide & Support', subtitle: 'Agents K21, FAQ, contact' },
];

function StatusPill({ item, delay }) {
  const float = useFloatLoop(delay, 2, 1500);
  return (
    <Animated.View style={[styles.scItem, item.highlight && styles.scItemHighlight, { transform: [{ translateY: float }] }]}>
      <Text style={{ fontSize: 13 }}>{item.icon}</Text>
      <Text style={[styles.scText, item.music && { color: 'rgba(26,240,96,0.9)' }, item.highlight && { color: 'rgba(26,240,96,0.9)' }]}>
        {item.text}
      </Text>
    </Animated.View>
  );
}

// `av-pulse`: expanding ring around the avatar, matching the ripple pattern used elsewhere.
function useAvatarPulse(periodMs = 4000) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(val, { toValue: 1, duration: periodMs, easing: Easing.out(Easing.ease), useNativeDriver: false })
    );
    anim.start();
    return () => anim.stop();
  }, [val, periodMs]);
  return val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0, 0] });
}

function HighlightRing({ item }) {
  const wobble = useScalePulse(4000, 1.04);
  return (
    <View style={styles.hiItem}>
      <Animated.View style={{ transform: [{ scale: wobble }] }}>
        <LinearGradient colors={item.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hiRing}>
          <View style={styles.hiInner}>
            <Text style={{ fontSize: 26 }}>{item.icon}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
      <Text style={styles.hiName}>{item.name}</Text>
    </View>
  );
}

function SettingsRow({ item, onPress }) {
  return (
    <PressScale scaleTo={0.98} onPress={onPress} style={styles.settingsRow}>
      <View style={styles.settingsIcon}>
        <Text style={{ fontSize: 18 }}>{item.icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingsTitle}>{item.title}</Text>
        <Text style={styles.settingsSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.settingsArrow}>→</Text>
    </PressScale>
  );
}

function K21PassCard() {
  const scan = useScalePulse(2000, 1.08);
  return (
    <View style={styles.passCard}>
      <View style={styles.passTop}>
        <Text style={{ fontSize: 22 }}>🎓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.passTitle}>K21 Pass Étudiant</Text>
          <Text style={styles.passSub}>Étudiant UCAD · Compte vérifié</Text>
        </View>
        <View style={styles.passBadge}>
          <Text style={styles.passBadgeText}>ACTIF</Text>
        </View>
      </View>
      <View style={styles.passIdCard}>
        <Text style={{ fontSize: 20 }}>🪪</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.passIdTitle}>Carte Étudiant Numérique</Text>
          <Text style={styles.passIdSub}>Scanner pour -15% chez les marchands partenaires</Text>
        </View>
        <Animated.View style={[styles.passScan, { transform: [{ scale: scan }] }]}>
          <Text style={{ fontSize: 14 }}>📲</Text>
        </Animated.View>
      </View>
    </View>
  );
}

export default function MoiScreen({ navigation }) {
  const avatarGlow = useAvatarPulse();
  const wakhnaFill = useFillIn(72, 400, 1200);
  const starSpin = useScalePulse(3000, 1.15);
  const { profile } = useAppState();

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={['rgba(232,25,44,0.18)', 'rgba(26,240,96,0.08)', 'transparent']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.hero}
          >
            <WaxPattern color="rgba(255,255,255,0.025)" size={16} animated={false} />
            <View style={styles.heroContent}>
              <View style={styles.topRow}>
                <View style={styles.leftRow}>
                  <View style={styles.avaWrap}>
                    <Animated.View style={[styles.avaRing, { opacity: avatarGlow }]} />
                    <View style={styles.avatar}>
                      <Text style={{ fontSize: 30 }}>👨🏿</Text>
                      <View style={styles.verifiedBadge}>
                        <Text style={{ fontSize: 9, fontWeight: '900', color: colors.ink }}>✓</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{profile.name}</Text>
                      <View style={styles.pinPhotos}>
                        <Text style={styles.ppImg}>🌅</Text>
                        <Text style={[styles.ppImg, { marginLeft: -4 }]}>🎤</Text>
                        <Text style={[styles.ppImg, { marginLeft: -4 }]}>🏖️</Text>
                      </View>
                    </View>
                    <Text style={styles.handle}>@{profile.handle}</Text>
                    <Text style={styles.location}>📍 {profile.arrondissement.name} · Dakar</Text>
                    {profile.phone ? (
                      <Text style={styles.contactLine}>📱 {profile.phone}</Text>
                    ) : null}
                    {profile.email ? (
                      <Text style={styles.contactLine}>✉️ {profile.email}</Text>
                    ) : null}
                    {profile.afriId ? (
                      <View style={styles.afriPill}>
                        <Text style={styles.afriPillText}>✦ {profile.afriId}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <PressScale
                  scaleTo={0.94}
                  onPress={() => navigation.navigate('EditProfile')}
                  style={styles.editBtn}
                >
                  <Text style={styles.editBtnText}>Modifier</Text>
                </PressScale>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
                {STATUS_ITEMS.map((item, i) => (
                  <StatusPill key={item.text} item={item} delay={i * 400} />
                ))}
              </ScrollView>
            </View>

            <View style={styles.flagStripe}>
              <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
              <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
              <View style={[styles.flagSeg, { backgroundColor: colors.flagRed }]} />
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            {STATS.map((s) => (
              <View key={s.key} style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.wakhnaMini}>
            <Text style={styles.wmScore}>840</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.wmLabel}>Wakhna Score</Text>
              <Text style={styles.wmRank}>
                Top <Text style={styles.wmRankBold}>12%</Text> Médina · Rang #47
              </Text>
              <View style={styles.wmBar}>
                <Animated.View style={{ width: wakhnaFill, height: '100%' }}>
                  <LinearGradient colors={[colors.green, colors.flagGold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 2 }} />
                </Animated.View>
              </View>
            </View>
            <Animated.Text style={[styles.wmStar, { transform: [{ scale: starSpin }] }]}>✦</Animated.Text>
          </View>

          <View style={styles.highlights}>
            <Text style={styles.sectionLabel}>Highlights</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
              {HIGHLIGHTS.map((h) => (
                <HighlightRing key={h.key} item={h} />
              ))}
            </ScrollView>
          </View>

          <View style={{ paddingHorizontal: spacing.huge, marginBottom: spacing.xxl }}>
            <K21PassCard />
          </View>

          <View style={{ paddingHorizontal: spacing.huge, gap: spacing.sm }}>
            <Text style={styles.sectionLabel}>Paramètres</Text>
            {SETTINGS.map((s) => (
              <SettingsRow
                key={s.key}
                item={s}
                onPress={() => {
                  if (s.key === 'account') {
                    navigation.navigate('EditProfile');
                    return;
                  }
                  if (s.key === 'accessibility') {
                    navigation.navigate('Accessibility');
                    return;
                  }
                  if (s.key === 'notifs') {
                    navigation.navigate('Notifications');
                    return;
                  }
                  navigation.navigate('Info', { title: s.title, subtitle: `${s.subtitle} — bientôt disponible.`, icon: s.icon });
                }}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  hero: { position: 'relative', overflow: 'hidden' },
  heroContent: { paddingHorizontal: spacing.xxxl, paddingTop: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xl },
  leftRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl, flex: 1 },
  avaWrap: { position: 'relative' },
  avaRing: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 40, borderWidth: 10, borderColor: 'rgba(232,25,44,0.4)' },
  avatar: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: 'rgba(232,25,44,0.4)', backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 19, height: 19, borderRadius: 10, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 3 },
  name: { fontFamily: fontFamily.displayBlack, fontSize: 16, letterSpacing: -0.4, color: colors.white },
  pinPhotos: { flexDirection: 'row' },
  ppImg: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.ink, backgroundColor: colors.whiteA08, textAlign: 'center', textAlignVertical: 'center', fontSize: 11, overflow: 'hidden' },
  handle: { fontSize: 11, color: colors.green, marginBottom: 2 },
  location: { fontSize: 10, color: colors.whiteA30 },
  contactLine: { fontSize: 10, color: colors.whiteA45, marginTop: 2 },
  afriPill: { alignSelf: 'flex-start', marginTop: spacing.sm, backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 2 },
  afriPillText: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.green },
  editBtn: { height: 30, paddingHorizontal: spacing.xl, borderRadius: radius.round, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 10, fontWeight: '700', color: colors.whiteA55 },

  statusRow: { gap: spacing.sm, paddingBottom: spacing.xl },
  scItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, borderRadius: radius.round, paddingVertical: 5, paddingRight: spacing.lg, paddingLeft: spacing.sm },
  scItemHighlight: { backgroundColor: colors.greenA10, borderColor: colors.greenA20 },
  scText: { fontSize: 10, fontWeight: '600', color: colors.whiteA70 },

  flagStripe: { flexDirection: 'row', height: 2 },
  flagSeg: { flex: 1 },

  statsRow: { flexDirection: 'row', backgroundColor: colors.whiteA04, borderBottomWidth: 1, borderBottomColor: colors.whiteA06 },
  statItem: { flex: 1, paddingVertical: spacing.lg, alignItems: 'center' },
  statValue: { fontFamily: fontFamily.displayBlack, fontSize: 14, letterSpacing: -0.5, color: colors.white },
  statLabel: { fontSize: 10, color: colors.whiteA40, marginTop: 1 },

  wakhnaMini: { margin: spacing.xxl, backgroundColor: 'rgba(26,240,96,0.08)', borderWidth: 1, borderColor: colors.greenA15, borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  wmScore: { fontFamily: fontFamily.displayBlack, fontSize: 26, letterSpacing: -1, color: colors.green },
  wmLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: 2 },
  wmRank: { fontSize: 10, color: colors.whiteA40 },
  wmRankBold: { fontFamily: fontFamily.bodyBold, color: colors.green },
  wmBar: { height: 3, backgroundColor: colors.whiteA08, borderRadius: 2, overflow: 'hidden', marginTop: 5 },
  wmStar: { fontSize: 20, color: colors.green },

  highlights: { paddingHorizontal: spacing.xxl, marginBottom: spacing.xl },
  sectionLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.md },
  hiItem: { width: 70, alignItems: 'center', gap: spacing.xs },
  hiRing: { width: 66, height: 66, borderRadius: 33, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  hiInner: { width: '100%', height: '100%', borderRadius: 31, backgroundColor: colors.whiteA08, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  hiName: { fontSize: 8, fontWeight: '700', color: colors.whiteA40, textAlign: 'center' },

  passCard: { backgroundColor: 'rgba(26,240,96,0.1)', borderWidth: 1.5, borderColor: colors.greenA20, borderRadius: radius.xxl, overflow: 'hidden' },
  passTop: { backgroundColor: 'rgba(26,240,96,0.1)', paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  passTitle: { fontFamily: fontFamily.displayBlack, fontSize: 13, color: colors.green, marginBottom: 2 },
  passSub: { fontSize: 10, color: colors.whiteA40 },
  passBadge: { backgroundColor: colors.green, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3 },
  passBadgeText: { fontSize: 8, fontWeight: '900', color: colors.ink },
  passIdCard: { margin: spacing.md, marginTop: spacing.sm, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  passIdTitle: { fontSize: 12, fontWeight: '700', color: colors.green, marginBottom: 2 },
  passIdSub: { fontSize: 10, color: colors.whiteA35 },
  passScan: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },

  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, padding: spacing.xl },
  settingsIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.whiteA06, alignItems: 'center', justifyContent: 'center' },
  settingsTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  settingsSubtitle: { fontSize: 10, color: colors.whiteA35, marginTop: 2 },
  settingsArrow: { fontSize: 12, color: colors.whiteA30 },
});

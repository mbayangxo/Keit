import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import PressScale from '../components/PressScale';
import AppScreen, { appUi } from '../components/AppScreen';
import ProfileAvatar from '../components/ProfileAvatar';
import { useAppState } from '../state/AppState';
import { useLocale } from '../context/LocaleContext';
import { getMe, getMeSummary } from '../lib/api-client';
import { shareFriendInvite } from '../lib/profile-share';
import { navigateFromRoot } from '../lib/root-navigation';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useFillIn, useScalePulse } from '../hooks/animations';

const SETTINGS = [
  { key: 'accessibility', icon: '👁️', title: 'Accessibilité', subtitle: 'Mode données réduites, grand texte' },
  { key: 'account', icon: '🔐', title: 'Compte & Sécurité', subtitle: 'CNI, biométrie, 2FA pour gros montants' },
  { key: 'wallet', icon: '💳', title: 'Portefeuille', subtitle: 'Comptes liés, historique, limites' },
  { key: 'notifs', icon: '🔔', title: 'Notifications', subtitle: 'Alertes paiements, Mboolo, Ngor' },
  { key: 'privacy', icon: '🕶️', title: 'Confidentialité', subtitle: 'Qui voit ton profil et ton Ngor' },
  { key: 'help', icon: '❓', title: 'Aide & Support', subtitle: 'Agents K21, FAQ, contact' },
];

const EMPTY_SUMMARY = {
  stats: { ngor: 0, mboolo: 0, events: 0, cauris: 0 },
  ngorBarPercent: 0,
  studentPass: { status: 'inactive', schoolName: null, discountPercent: 15, verified: false },
  highlights: [],
};

function HighlightRing({ item, onPress }) {
  const wobble = useScalePulse(4000, 1.04);
  return (
    <PressScale scaleTo={0.96} onPress={onPress} style={styles.hiItem}>
      <Animated.View style={{ transform: [{ scale: wobble }] }}>
        <LinearGradient colors={item.ring} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hiRing}>
          <View style={styles.hiInner}>
            <Text style={{ fontSize: 26 }}>{item.icon}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
      <Text style={styles.hiName}>{item.name}</Text>
    </PressScale>
  );
}

function highlightNavigation(item, open) {
  if (item.type === 'event') {
    open('DiscoverTab', { initialTab: 'Events' });
    return;
  }
  if (item.type === 'tontine') {
    open('Tontine');
    return;
  }
  if (item.type === 'student_pass') {
    open('StudentPass');
  }
}

function useAvatarPulse(periodMs = 4000) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(val, { toValue: 1, duration: periodMs, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    );
    anim.start();
    return () => anim.stop();
  }, [val, periodMs]);
  return val.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.2, 0, 0] });
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

function passBadgeLabel(status) {
  if (status === 'active') return 'ACTIF';
  if (status === 'pending') return 'EN ATTENTE';
  if (status === 'expired') return 'EXPIRÉ';
  return 'INACTIF';
}

function passSubtitle(pass, verifiedTier) {
  if (pass.status === 'active' && pass.schoolName) {
    return `${pass.schoolName} · -${pass.discountPercent ?? 15}% partenaires`;
  }
  if (pass.status === 'pending' && pass.schoolName) {
    return verifiedTier >= 2 ? `${pass.schoolName} · validation en cours` : `${pass.schoolName} · CNI requise`;
  }
  if (pass.status === 'expired' && pass.schoolName) {
    return `${pass.schoolName} · renouveler le pass`;
  }
  return 'Active ton pass étudiant pour les réductions marchands';
}

function K21PassCard({ pass, verifiedTier, onPress }) {
  const scan = useScalePulse(2000, 1.08);
  const active = pass.status === 'active';

  return (
    <PressScale scaleTo={0.98} onPress={onPress} style={styles.passCard}>
      <View style={styles.passTop}>
        <Text style={{ fontSize: 22 }}>🎓</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.passTitle}>K21 Pass Étudiant</Text>
          <Text style={styles.passSub}>{passSubtitle(pass, verifiedTier)}</Text>
        </View>
        <View style={[styles.passBadge, !active && styles.passBadgeMuted]}>
          <Text style={[styles.passBadgeText, !active && { color: colors.appCanvas.textMuted }]}>{passBadgeLabel(pass.status)}</Text>
        </View>
      </View>
      <View style={styles.passIdCard}>
        <Text style={{ fontSize: 20 }}>🪪</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.passIdTitle}>{active ? 'Carte Étudiant Numérique' : 'Activer le Pass Étudiant'}</Text>
          <Text style={styles.passIdSub}>
            {active
              ? `Scanner pour -${pass.discountPercent ?? 15}% chez les marchands partenaires`
              : 'Indique ton établissement · vérification CNI pour activer'}
          </Text>
        </View>
        <Animated.View style={[styles.passScan, !active && styles.passScanMuted, { transform: [{ scale: scan }] }]}>
          <Text style={{ fontSize: 14 }}>{active ? '📲' : '→'}</Text>
        </Animated.View>
      </View>
    </PressScale>
  );
}

export default function MoiScreen({ navigation }) {
  const open = (name, params) => navigateFromRoot(navigation, name, params);
  const avatarGlow = useAvatarPulse();
  const starSpin = useScalePulse(3000, 1.15);
  const { profile, setProfile } = useAppState();
  const { country } = useLocale();
  const insets = useSafeAreaInsets();
  const scrollBottomPad = 70 + insets.bottom;

  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const verifiedTier = profile.verification?.tier ?? 1;
  const isVerified = verifiedTier >= 2;
  const pass = summary.studentPass ?? profile.studentPass ?? EMPTY_SUMMARY.studentPass;

  const ngorScore = summary.stats.ngor ?? summary.stats.kersa ?? summary.stats.wakhna ?? 0;
  const ngorBarTarget = Math.max(5, summary.ngorBarPercent ?? summary.kersaBarPercent ?? summary.wakhnaBarPercent ?? 0);
  const ngorFill = useFillIn(ngorBarTarget, 400, 1200);

  const passStatLabel =
    pass.status === 'active' ? 'Actif' : pass.status === 'pending' ? 'Attente' : '—';

  const stats = useMemo(
    () => [
      { key: 'ngor', value: String(ngorScore), label: 'Ngor', color: colors.green },
      { key: 'mboolo', value: String(summary.stats.mboolo), label: 'Mboolo', color: colors.ink },
      { key: 'events', value: String(summary.stats.events), label: 'Événements', color: colors.flagGold },
      { key: 'pass', value: passStatLabel, label: 'Pass UCAD', color: colors.terracotta },
    ],
    [summary.stats, ngorScore, passStatLabel],
  );

  const statusItems = useMemo(() => {
    const items = [];
    if (profile.arrondissement?.name) {
      items.push({ icon: profile.arrondissement.icon || '📍', text: profile.arrondissement.name });
    }
    if (isVerified) {
      items.push({ icon: '✓', text: 'Compte vérifié', highlight: true });
    }
    if (ngorScore > 0) {
      items.push({ icon: '✦', text: `Ngor ${ngorScore}`, highlight: true });
    }
    return items;
  }, [profile.arrondissement, isVerified, ngorScore]);

  const locationLine = [profile.arrondissement?.name, country?.name].filter(Boolean).join(' · ');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      Promise.all([getMeSummary(), getMe()])
        .then(([sum, me]) => {
          if (cancelled) return;
          setSummary({
            ngorBarPercent: sum.ngorBarPercent ?? sum.kersaBarPercent ?? sum.wakhnaBarPercent ?? 0,
            stats: {
              ...EMPTY_SUMMARY.stats,
              ...(sum.stats ?? {}),
              ngor: sum.stats?.ngor ?? sum.stats?.kersa ?? sum.stats?.wakhna ?? 0,
            },
            studentPass: sum.studentPass ?? me.studentPass ?? EMPTY_SUMMARY.studentPass,
            highlights: Array.isArray(sum.highlights) ? sum.highlights : [],
          });
          setProfile({
            avatarEmoji: me.avatarEmoji,
            avatarUrl: me.avatarUrl ?? null,
            verification: me.verification,
            studentPass: me.studentPass ?? sum.studentPass,
          });
        })
        .catch(() => {
          if (!cancelled) setSummary(EMPTY_SUMMARY);
        });
      return () => {
        cancelled = true;
      };
    }, [setProfile]),
  );

  return (
    <AppScreen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: scrollBottomPad }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <LinearGradient
            colors={['rgba(26,240,96,0.16)', 'rgba(247,183,49,0.12)', 'rgba(255,100,34,0.06)']}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroContent}>
              <View style={styles.topRow}>
                <View style={styles.leftRow}>
                  <View style={styles.avaWrap}>
                    <Animated.View style={[styles.avaRing, { opacity: avatarGlow }]} />
                    <PressScale scaleTo={0.96} onPress={() => open('EditProfile')} style={styles.avatar}>
                      <ProfileAvatar
                        emoji={profile.avatarEmoji}
                        photoUrl={profile.avatarUrl}
                        size={62}
                        style={{ borderWidth: 0 }}
                      />
                      {isVerified ? (
                        <View style={styles.verifiedBadge}>
                          <Text style={{ fontSize: 9, fontWeight: '900', color: colors.ink }}>✓</Text>
                        </View>
                      ) : null}
                    </PressScale>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{profile.name || 'Mon profil'}</Text>
                    </View>
                    <Text style={styles.handle}>@{profile.handle || '…'}</Text>
                    {locationLine ? <Text style={styles.location}>📍 {locationLine}</Text> : null}
                    {profile.phone ? <Text style={styles.contactLine}>📱 {profile.phone}</Text> : null}
                    {profile.email ? <Text style={styles.contactLine}>✉️ {profile.email}</Text> : null}
                    {profile.afriId ? (
                      <View style={styles.afriPill}>
                        <Text style={styles.afriPillText}>✦ {profile.afriId}</Text>
                      </View>
                    ) : null}
                    <View style={styles.qrRow}>
                      <PressScale scaleTo={0.96} onPress={() => open('MyQr')} style={styles.qrBtn}>
                        <Text style={styles.qrBtnText}>📲 Mon QR</Text>
                      </PressScale>
                      <PressScale scaleTo={0.96} onPress={() => open('Friends')} style={styles.qrBtn}>
                        <Text style={styles.qrBtnText}>🧑‍🤝‍🧑 Amis</Text>
                      </PressScale>
                      {profile.handle ? (
                        <PressScale scaleTo={0.96} onPress={() => shareFriendInvite(profile)} style={styles.qrBtn}>
                          <Text style={styles.qrBtnText}>↗ Partager</Text>
                        </PressScale>
                      ) : null}
                    </View>
                  </View>
                </View>
                <PressScale scaleTo={0.94} onPress={() => open('EditProfile')} style={styles.editBtn}>
                  <Text style={styles.editBtnText}>Modifier</Text>
                </PressScale>
              </View>

              {statusItems.length ? (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.statusRow}
                >
                  {statusItems.map((item) => (
                    <View key={item.text} style={[styles.scItem, item.highlight && styles.scItemHighlight]}>
                      <Text style={{ fontSize: 13 }}>{item.icon}</Text>
                      <Text style={[styles.scText, item.highlight && { color: 'rgba(26,240,96,0.9)' }]}>{item.text}</Text>
                    </View>
                  ))}
                </ScrollView>
              ) : null}
            </View>

            <View style={styles.flagStripe}>
              <View style={[styles.flagSeg, { backgroundColor: colors.green }]} />
              <View style={[styles.flagSeg, { backgroundColor: colors.flagGold }]} />
              <View style={[styles.flagSeg, { backgroundColor: colors.terracotta }]} />
            </View>
          </LinearGradient>

          <View style={styles.statsRow}>
            {stats.map((s) => (
              <View key={s.key} style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.ngorMini}>
            <Text style={styles.nmScore}>{ngorScore}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.nmLabel}>Ngor</Text>
              <Text style={styles.nmRank}>
                {ngorScore > 0
                  ? 'Honneur gagné sur tes envois et paiements'
                  : 'Envoie ou paie un marchand pour commencer'}
              </Text>
              <View style={styles.nmBar}>
                <Animated.View style={{ width: ngorFill, height: '100%' }}>
                  <LinearGradient
                    colors={[colors.green, colors.flagGold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1, borderRadius: 2 }}
                  />
                </Animated.View>
              </View>
            </View>
            <Animated.Text style={[styles.nmStar, { transform: [{ scale: starSpin }] }]}>✦</Animated.Text>
          </View>

          <View style={styles.highlights}>
            <Text style={styles.sectionLabel}>Highlights</Text>
            {summary.highlights.length ? (
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.md, paddingRight: spacing.xxl }}
              >
                {summary.highlights.map((h) => (
                  <HighlightRing
                    key={h.key}
                    item={h}
                    onPress={() => highlightNavigation(h, open)}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.hiEmpty}>
                Tes billets, tontines et pass actif apparaîtront ici.
              </Text>
            )}
          </View>

          <View style={{ paddingHorizontal: spacing.huge, marginBottom: spacing.xxl }}>
            <K21PassCard pass={pass} verifiedTier={verifiedTier} onPress={() => open('StudentPass')} />
          </View>

          <View style={[styles.settingsBlock, { paddingBottom: spacing.lg }]}>
            <Text style={styles.sectionLabel}>Paramètres</Text>
            {SETTINGS.map((s) => (
              <SettingsRow
                key={s.key}
                item={s}
                onPress={() => {
                  if (s.key === 'account') {
                    open('EditProfile');
                    return;
                  }
                  if (s.key === 'accessibility') {
                    open('Accessibility');
                    return;
                  }
                  if (s.key === 'notifs') {
                    open('Notifications');
                    return;
                  }
                  open('Info', { title: s.title, subtitle: `${s.subtitle} — bientôt disponible.`, icon: s.icon });
                }}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: { position: 'relative', overflow: 'hidden' },
  heroContent: { paddingHorizontal: spacing.xxxl, paddingTop: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.xl },
  leftRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xl, flex: 1 },
  avaWrap: { position: 'relative' },
  avaRing: { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 40, borderWidth: 10, borderColor: 'rgba(26,240,96,0.35)' },
  avatar: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 19, height: 19, borderRadius: 10, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.appCanvas.base, alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 3 },
  name: { fontFamily: fontFamily.displayBlack, fontSize: 16, letterSpacing: -0.4, color: colors.appCanvas.text },
  handle: { fontSize: 11, color: colors.greenDark, marginBottom: 2 },
  location: { fontSize: 10, color: colors.appCanvas.textMuted },
  contactLine: { fontSize: 10, color: colors.appCanvas.textMuted, marginTop: 2 },
  afriPill: { alignSelf: 'flex-start', marginTop: spacing.sm, backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 2 },
  afriPillText: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.greenDark },
  qrRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, flexWrap: 'wrap' },
  qrBtn: { backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.appCanvas.border, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 4 },
  qrBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.appCanvas.textMuted },
  editBtn: { height: 30, paddingHorizontal: spacing.xl, borderRadius: radius.round, backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.appCanvas.borderStrong, alignItems: 'center', justifyContent: 'center' },
  editBtnText: { fontSize: 10, fontWeight: '700', color: colors.appCanvas.textMuted },

  statusRow: { gap: spacing.sm, paddingBottom: spacing.xl },
  scItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.appCanvas.border, borderRadius: radius.round, paddingVertical: 5, paddingRight: spacing.lg, paddingLeft: spacing.sm },
  scItemHighlight: { backgroundColor: colors.greenA10, borderColor: colors.greenA20 },
  scText: { fontSize: 10, fontWeight: '600', color: colors.appCanvas.textMuted },

  flagStripe: { flexDirection: 'row', height: 2 },
  flagSeg: { flex: 1 },

  statsRow: { flexDirection: 'row', backgroundColor: colors.appCanvas.surface, borderBottomWidth: 1, borderBottomColor: colors.appCanvas.border },
  statItem: { flex: 1, paddingVertical: spacing.lg, alignItems: 'center' },
  statValue: { fontFamily: fontFamily.displayBlack, fontSize: 14, letterSpacing: -0.5, color: colors.appCanvas.text },
  statLabel: { fontSize: 10, color: colors.appCanvas.textFaint, marginTop: 1 },

  ngorMini: { margin: spacing.xxl, backgroundColor: 'rgba(247,183,49,0.16)', borderWidth: 1, borderColor: 'rgba(232,146,10,0.28)', borderRadius: radius.xl, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  nmScore: { fontFamily: fontFamily.displayBlack, fontSize: 28, letterSpacing: -1, color: colors.goldDark },
  nmLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1, color: colors.goldDark, textTransform: 'uppercase', marginBottom: 3 },
  nmRank: { fontSize: 11, color: colors.appCanvas.textMuted },
  nmBar: { height: 4, backgroundColor: 'rgba(5,8,5,0.08)', borderRadius: 2, overflow: 'hidden', marginTop: spacing.sm },
  nmStar: { fontSize: 20, color: colors.goldDark },

  sectionLabel: { ...appUi.sectionLabel, marginBottom: spacing.md },

  highlights: { paddingHorizontal: spacing.xxl, marginBottom: spacing.xl },
  hiItem: { width: 70, alignItems: 'center', gap: spacing.xs },
  hiRing: { width: 66, height: 66, borderRadius: 33, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  hiInner: { width: '100%', height: '100%', borderRadius: 31, backgroundColor: colors.appCanvas.surfaceStrong, borderWidth: 2, borderColor: colors.appCanvas.text, alignItems: 'center', justifyContent: 'center' },
  hiName: { fontSize: 8, fontWeight: '700', color: colors.appCanvas.textMuted, textAlign: 'center' },
  hiEmpty: { fontSize: 11, color: colors.appCanvas.textFaint, lineHeight: 16 },

  passCard: { backgroundColor: colors.greenA10, borderWidth: 1.5, borderColor: colors.greenA20, borderRadius: radius.xxl, overflow: 'hidden' },
  passTop: { backgroundColor: colors.greenA08, paddingHorizontal: spacing.xl, paddingVertical: spacing.xl, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  passTitle: { fontFamily: fontFamily.displayBlack, fontSize: 13, color: colors.greenDark, marginBottom: 2 },
  passSub: { fontSize: 10, color: colors.appCanvas.textMuted },
  passBadge: { backgroundColor: colors.green, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: 3 },
  passBadgeMuted: { backgroundColor: 'rgba(5,8,5,0.12)' },
  passBadgeText: { fontSize: 8, fontWeight: '900', color: colors.ink },
  passIdCard: { margin: spacing.md, marginTop: spacing.sm, backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  passIdTitle: { fontSize: 12, fontWeight: '700', color: colors.greenDark, marginBottom: 2 },
  passIdSub: { fontSize: 10, color: colors.appCanvas.textFaint },
  passScan: { width: 32, height: 32, borderRadius: radius.md, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  passScanMuted: { backgroundColor: 'rgba(5,8,5,0.12)' },

  settingsBlock: { paddingHorizontal: spacing.huge, gap: spacing.sm },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.appCanvas.border, borderRadius: radius.lg, padding: spacing.xl },
  settingsIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.greenA08, alignItems: 'center', justifyContent: 'center' },
  settingsTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.appCanvas.text },
  settingsSubtitle: { fontSize: 10, color: colors.appCanvas.textFaint, marginTop: 2 },
  settingsArrow: { fontSize: 12, color: colors.appCanvas.textFaint },
});

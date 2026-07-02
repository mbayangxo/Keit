import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useEntrance, useFillIn, usePopIn, useSpinLoop } from '../hooks/animations';

// No HTML prototype exists for Tontine Digitale — designed to match the
// established system and mirror Ñu Lekk's pool/member structure, adapted
// for brief §05's rotating-savings model: "Group agrees on amount +
// schedule. K21 collects automatically on agreed day. Releases pot to
// whoever's turn it is. Transparent, automatic, trusted."

const AMOUNT_PER_ROUND = 5000;
const MEMBERS = [
  { key: 'fatou', emoji: '👩🏾', name: 'Fatou', turn: 1, status: 'paid' },
  { key: 'ibou', emoji: '👦🏿', name: 'Ibou', turn: 2, status: 'paid' },
  { key: 'saliou', emoji: '👨🏿', name: 'Toi', turn: 3, status: 'current' },
  { key: 'aminata', emoji: '👩🏿', name: 'Aminata', turn: 4, status: 'waiting' },
  { key: 'cheikh', emoji: '👨🏾', name: 'Cheikh', turn: 5, status: 'waiting' },
  { key: 'awa', emoji: '👩🏽', name: 'Awa', turn: 6, status: 'waiting' },
];

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

function MemberRow({ item, delay }) {
  const entrance = useEntrance(delay, 350, 10, 'x');
  const waitSpin = useSpinLoop(3000);
  const currentPulse = usePopIn(0, 600, 0.9);

  return (
    <Animated.View style={[styles.memberRow, entrance, item.status === 'current' && styles.memberRowCurrent]}>
      <View style={styles.turnBadge}>
        <Text style={styles.turnBadgeText}>{item.turn}</Text>
      </View>
      <View style={styles.memberAva}>
        <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberMeta}>
          {item.status === 'current' ? 'C\'est ton tour ce mois-ci' : item.status === 'paid' ? 'A déjà reçu la cagnotte' : 'En attente de son tour'}
        </Text>
      </View>
      {item.status === 'paid' && (
        <View style={styles.doneDot}>
          <Text style={{ fontSize: 10, fontWeight: '900', color: colors.ink }}>✓</Text>
        </View>
      )}
      {item.status === 'current' && (
        <Animated.View style={[styles.currentDot, currentPulse]}>
          <Text style={{ fontSize: 12 }}>✦</Text>
        </Animated.View>
      )}
      {item.status === 'waiting' && <Animated.View style={[styles.waitDot, { transform: [{ rotate: waitSpin }] }]} />}
    </Animated.View>
  );
}

export default function TontineScreen({ navigation }) {
  const paidCount = MEMBERS.filter((m) => m.status === 'paid').length;
  const progressFill = useFillIn((paidCount / MEMBERS.length) * 100, 300, 1200);
  const potEntrance = useEntrance(0, 500, 8);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['rgba(26,240,96,0.16)', 'transparent']} start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }} style={styles.hero}>
            <View style={styles.topRow}>
              <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
              </PressScale>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>TONTINE DIGITALE</Text>
                <Text style={styles.title}>Médina Squad</Text>
              </View>
            </View>

            <Animated.View style={potEntrance}>
              <Text style={styles.potLabel}>Cagnotte de ce mois</Text>
              <Text style={styles.potAmount}>
                {formatAmount(AMOUNT_PER_ROUND * MEMBERS.length)} <Text style={styles.potCurr}>F CFA</Text>
              </Text>
            </Animated.View>

            <View style={styles.progressTrack}>
              <Animated.View style={{ width: progressFill, height: '100%' }}>
                <LinearGradient colors={[colors.green, colors.flagGold]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, borderRadius: 4 }} />
              </Animated.View>
            </View>
            <Text style={styles.progressLabel}>
              <Text style={styles.progressBold}>{paidCount} sur {MEMBERS.length}</Text> ont reçu leur tour
            </Text>
          </LinearGradient>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>{formatAmount(AMOUNT_PER_ROUND)} F</Text>
              <Text style={styles.infoLabel}>Par personne / mois</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoItem}>
              <Text style={styles.infoValue}>1er du mois</Text>
              <Text style={styles.infoLabel}>Collecte automatique</Text>
            </View>
          </View>

          <View style={styles.members}>
            <Text style={styles.sectionLabel}>Ordre de rotation</Text>
            {MEMBERS.map((m, i) => (
              <MemberRow key={m.key} item={m} delay={i * 60} />
            ))}
          </View>

          <View style={styles.trustNote}>
            <Text style={{ fontSize: 16 }}>🔒</Text>
            <Text style={styles.trustText}>
              K21 collecte automatiquement le jour convenu et verse la cagnotte à la bonne personne — transparent et sécurisé.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <GlowButton label={`Contribuer ${formatAmount(AMOUNT_PER_ROUND)} F →`} onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  hero: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.giant },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.eyebrow, color: colors.green, marginBottom: 2 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 18, color: colors.white },

  potLabel: { fontSize: 10, color: colors.whiteA35, marginBottom: spacing.xs },
  potAmount: { fontFamily: fontFamily.displayBlack, fontSize: 32, letterSpacing: -1.5, color: colors.green },
  potCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 14, fontWeight: '400', color: colors.whiteA40 },

  progressTrack: { height: 8, backgroundColor: colors.whiteA08, borderRadius: 4, overflow: 'hidden', marginTop: spacing.xl, marginBottom: spacing.sm },
  progressLabel: { fontSize: 11, color: colors.whiteA40 },
  progressBold: { fontFamily: fontFamily.bodyBold, color: colors.green },

  infoRow: { flexDirection: 'row', backgroundColor: colors.whiteA04, borderBottomWidth: 1, borderBottomColor: colors.whiteA06 },
  infoItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.xl },
  infoValue: { fontFamily: fontFamily.displayBlack, fontSize: 14, color: colors.white, letterSpacing: -0.3 },
  infoLabel: { fontSize: 9, color: colors.whiteA30, marginTop: 2, textAlign: 'center' },
  infoDivider: { width: 1, backgroundColor: colors.whiteA06 },

  members: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, gap: spacing.sm },
  sectionLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.xs },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, padding: spacing.xl },
  memberRowCurrent: { backgroundColor: colors.greenA08, borderColor: colors.greenA25 },
  turnBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  turnBadgeText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.whiteA55 },
  memberAva: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  memberMeta: { fontSize: 10, color: colors.whiteA35, marginTop: 1 },
  doneDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  currentDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  waitDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.whiteA20, borderStyle: 'dashed' },

  trustNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.huge, marginTop: spacing.xxl, marginBottom: spacing.xl, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, padding: spacing.xl },
  trustText: { flex: 1, fontSize: 11, color: colors.whiteA40, lineHeight: 16 },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
});

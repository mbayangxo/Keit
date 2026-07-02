import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import WaxPattern from '../components/WaxPattern';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useBlink, useEntrance, useFillIn } from '../hooks/animations';

// design/k21-four-flows.html, FLOW 1 — TONTINE DIGITALE (Screens T1-T3):
// My Tontines list -> Create Group -> Pot Release.

const GROUPS = [
  {
    key: 'medina',
    icon: '🏆',
    iconBg: 'rgba(232,25,44,0.12)',
    name: 'Médina Squad',
    members: 8,
    perMonth: 25000,
    total: 200000,
    totalLabel: 'F ce mois',
    totalColor: colors.flagRed,
    progress: 100,
    progressColor: colors.flagRed,
    releasing: true,
  },
  {
    key: 'ucad',
    icon: '🎓',
    iconBg: 'rgba(26,240,96,0.08)',
    name: 'UCAD Promo 2025',
    members: 10,
    perMonth: 15000,
    total: 150000,
    totalLabel: 'F total',
    totalColor: colors.green,
    progress: 60,
    progressColor: colors.green,
    releasing: false,
  },
  {
    key: 'diallo',
    icon: '👨‍👩‍👧‍👦',
    iconBg: 'rgba(250,216,54,0.08)',
    name: 'Famille Diallo',
    members: 6,
    perMonth: 50000,
    total: 300000,
    totalLabel: 'F total',
    totalColor: colors.flagGold,
    progress: 33,
    progressColor: colors.flagGold,
    releasing: false,
  },
];

const AMOUNT_CHIPS = ['10k F', '25k F', '50k F', '100k F'];
const FREQ_OPTIONS = ['Hebdo', 'Mensuel', 'Bi-mensuel'];
const NEW_MEMBERS = [
  { key: 'fatou', emoji: '👩🏾', bg: 'rgba(26,240,96,0.1)', name: 'Fatou', order: '1er' },
  { key: 'ibou', emoji: '👦🏿', bg: 'rgba(232,25,44,0.1)', name: 'Ibou', order: '2e' },
  { key: 'aminata', emoji: '👩🏿', bg: 'rgba(250,216,54,0.1)', name: 'Aminata', order: '3e' },
];

const POT_MEMBERS = [
  { key: 'saliou', order: '1', ava: '👨🏿', name: 'Saliou (toi)', status: 'now', label: 'Ce mois' },
  { key: 'fatou', order: '2', ava: '👩🏾', name: 'Fatou', status: 'wait', label: 'Avril' },
  { key: 'ibou', order: '3', ava: '👦🏿', name: 'Ibou', status: 'wait', label: 'Mai' },
  { key: 'aminata', order: '✓', ava: '👩🏿', name: 'Aminata', status: 'done', label: 'Reçu' },
];

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

function GroupItem({ item, delay, onPress }) {
  const entrance = useEntrance(delay, 350, 10);
  const fill = useFillIn(item.progress, delay + 150, 700);

  return (
    <Animated.View style={entrance}>
      <PressScale scaleTo={0.98} onPress={onPress} style={[styles.groupItem, item.releasing && styles.groupItemReleasing]}>
        <View style={[styles.groupHeader, item.releasing && styles.groupHeaderReleasing]}>
          <View style={[styles.groupIcon, { backgroundColor: item.iconBg }]}>
            <Text style={{ fontSize: 18 }}>{item.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{item.name}</Text>
            <View style={styles.groupMetaRow}>
              <Text style={styles.groupMeta}>
                {item.members} membres · {formatAmount(item.perMonth)} F/mois
              </Text>
              {item.releasing && (
                <View style={styles.releaseBadge}>
                  <Text style={styles.releaseBadgeText}>TON TOUR !</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.groupAmountBox}>
            <Text style={[styles.groupAmount, { color: item.totalColor }]}>{formatAmount(item.total)}</Text>
            <Text style={styles.groupAmountLabel}>{item.totalLabel}</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={{ width: fill, height: '100%', backgroundColor: item.progressColor }} />
        </View>
      </PressScale>
    </Animated.View>
  );
}

function HomeStep({ onOpenGroup, onCreate, onBack }) {
  const heroEntrance = useEntrance(0, 400, 10);
  const receivedThisMonth = GROUPS.filter((g) => g.releasing).reduce((s) => s + 75000, 0);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(26,240,96,0.18)', 'rgba(26,240,96,0.04)', 'transparent']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.hero}
        >
          <WaxPattern color="rgba(255,255,255,0.06)" size={18} animated={false} />
          <View style={styles.topRow}>
            <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
              <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
            </PressScale>
          </View>
          <Animated.View style={heroEntrance}>
            <View style={styles.flagStripe}>
              <View style={[styles.flagBar, { backgroundColor: colors.green }]} />
              <View style={[styles.flagBar, { backgroundColor: colors.flagGold }]} />
              <View style={[styles.flagBar, { backgroundColor: colors.flagRed }]} />
            </View>
            <Text style={styles.eyebrow}>TONTINE DIGITALE</Text>
            <Text style={styles.title}>Mes groupes</Text>
            <Text style={styles.sub}>Épargne collective · Automatique</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>{GROUPS.length}</Text>
                <Text style={styles.statLabel}>Tontines actives</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.flagRed, fontSize: 13 }]}>Ce mois</Text>
                <Text style={styles.statLabel}>{formatAmount(receivedThisMonth)} F reçu</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNum}>24</Text>
                <Text style={styles.statLabel}>Membres total</Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.groupsList}>
          {GROUPS.map((g, i) => (
            <GroupItem key={g.key} item={g} delay={200 + i * 80} onPress={() => onOpenGroup(g)} />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PressScale scaleTo={0.97} onPress={onCreate} style={styles.createBtn}>
          <Text style={styles.createBtnText}>＋ Créer une tontine</Text>
        </PressScale>
      </View>
    </View>
  );
}

function CreateStep({ onBack, onCreate }) {
  const [name, setName] = useState('Médina Squad 2');
  const [amountChip, setAmountChip] = useState('25k F');
  const [freq, setFreq] = useState('Mensuel');

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.createScroll}>
        <View style={styles.createHead}>
          <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
          <Text style={styles.createTitle}>Nouvelle tontine</Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nom du groupe</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            style={[styles.fieldInput, name.length > 0 && styles.fieldInputFilled]}
            placeholderTextColor={colors.whiteA30}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Montant par personne</Text>
          <View style={styles.chipsRow}>
            {AMOUNT_CHIPS.map((c) => (
              <PressScale key={c} scaleTo={0.94} onPress={() => setAmountChip(c)} style={[styles.chip, amountChip === c && styles.chipOn]}>
                <Text style={[styles.chipText, amountChip === c && styles.chipTextOnGreen]}>{c}</Text>
              </PressScale>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Fréquence</Text>
          <View style={styles.freqRow}>
            {FREQ_OPTIONS.map((f) => (
              <PressScale key={f} scaleTo={0.94} onPress={() => setFreq(f)} style={[styles.freqOpt, freq === f && styles.freqOptOn]}>
                <Text style={[styles.freqText, freq === f && styles.freqTextOn]}>{f}</Text>
              </PressScale>
            ))}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Membres (6)</Text>
          <View style={styles.memberList}>
            {NEW_MEMBERS.map((m) => (
              <View key={m.key} style={styles.memberItem}>
                <View style={[styles.memberAva, { backgroundColor: m.bg }]}>
                  <Text style={{ fontSize: 14 }}>{m.emoji}</Text>
                </View>
                <Text style={styles.memberName}>{m.name}</Text>
                <View style={styles.memberOrder}>
                  <Text style={styles.memberOrderText}>{m.order}</Text>
                </View>
              </View>
            ))}
          </View>
          <PressScale scaleTo={0.97} onPress={() => {}} style={styles.addMember}>
            <View style={styles.addMemberIcon}>
              <Text style={{ fontSize: 16, color: colors.whiteA55 }}>+</Text>
            </View>
            <Text style={styles.addMemberText}>Inviter un membre</Text>
          </PressScale>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Pot mensuel</Text>
            <Text style={[styles.previewValue, { color: colors.green }]}>150 000 F</Text>
          </View>
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Ton tour</Text>
            <Text style={styles.previewValue}>Mois 1 (Janv.)</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewRow}>
            <Text style={styles.previewLabel}>Collecte auto</Text>
            <Text style={[styles.previewValue, { color: colors.green }]}>✓ Activée</Text>
          </View>
        </View>

        <GlowButton label="Créer et inviter les membres →" onPress={onCreate} />
      </ScrollView>
    </View>
  );
}

function ReleaseStep({ onBack, onReceive }) {
  const blink = useBlink(800);
  const heroEntrance = useEntrance(0, 400, 10);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.releaseHero}>
          <WaxPattern color="rgba(255,255,255,0.06)" size={18} animated={false} />
          <View style={styles.topRow}>
            <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
              <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
            </PressScale>
          </View>
          <Animated.View style={[{ alignItems: 'center' }, heroEntrance]}>
            <View style={styles.releaseBadgeBig}>
              <Animated.View style={[styles.releaseDot, { opacity: blink }]} />
              <Text style={styles.releaseBadgeBigText}>C'est ton tour !</Text>
            </View>
            <Text style={styles.releaseName}>Médina Squad · Mars 2026</Text>
            <Text style={styles.releaseAmount}>
              200 000 <Text style={styles.releaseCurr}>F</Text>
            </Text>
            <Text style={styles.releaseRecipient}>
              Envoyé à <Text style={styles.releaseRecipientBold}>Saliou @saliou_medina</Text>
            </Text>
          </Animated.View>
        </View>

        <View style={styles.potMembers}>
          <Text style={styles.potMembersLabel}>Ordre de rotation</Text>
          {POT_MEMBERS.map((m) => (
            <View key={m.key} style={[styles.potMemberItem, m.status === 'now' && styles.potMemberCurrent]}>
              <View style={[styles.potOrder, m.status === 'now' && styles.potOrderNow, m.status === 'done' && styles.potOrderDone]}>
                <Text style={[styles.potOrderText, m.status === 'now' && { color: colors.ink }, m.status === 'done' && { color: colors.green }]}>
                  {m.order}
                </Text>
              </View>
              <Text style={{ fontSize: 18 }}>{m.ava}</Text>
              <Text style={styles.potMemberName}>{m.name}</Text>
              <View
                style={[
                  styles.potStatus,
                  m.status === 'now' && styles.potStatusNow,
                  m.status === 'done' && styles.potStatusDone,
                  m.status === 'wait' && styles.potStatusWait,
                ]}
              >
                <Text
                  style={[
                    styles.potStatusText,
                    m.status === 'now' && { color: colors.ink },
                    m.status === 'done' && { color: colors.green },
                    m.status === 'wait' && { color: colors.whiteA30 },
                  ]}
                >
                  {m.label}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PressScale scaleTo={0.97} onPress={onReceive} style={styles.receiveBtn}>
          <Text style={styles.receiveBtnText}>Recevoir 200 000 F →</Text>
        </PressScale>
        <Text style={styles.releaseFootnote}>Tous les membres ont contribué · Automatique</Text>
      </View>
    </View>
  );
}

export default function TontineScreen({ navigation }) {
  const [step, setStep] = useState('home');

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'home' && (
          <HomeStep
            onOpenGroup={(g) =>
              g.releasing
                ? setStep('release')
                : navigation.navigate('Info', { title: g.name, subtitle: `${g.members} membres · Ce n'est pas encore ton tour.`, icon: g.icon })
            }
            onCreate={() => setStep('create')}
            onBack={() => navigation.goBack()}
          />
        )}
        {step === 'create' && <CreateStep onBack={() => setStep('home')} onCreate={() => setStep('home')} />}
        {step === 'release' && <ReleaseStep onBack={() => setStep('home')} onReceive={() => setStep('home')} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  topRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.huge, paddingTop: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },

  // Home / list
  hero: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxl, position: 'relative', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: colors.greenA15 },
  flagStripe: { flexDirection: 'row', height: 2, borderRadius: 1, overflow: 'hidden', width: 48, marginTop: spacing.xl, marginBottom: spacing.lg },
  flagBar: { flex: 1 },
  eyebrow: { ...type.eyebrow, color: colors.green, marginBottom: spacing.xs },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 22, letterSpacing: -0.8, color: colors.white, marginBottom: 2 },
  sub: { fontSize: 12, color: colors.whiteA40 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xl },
  statBox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: colors.greenA15, borderRadius: radius.lg, padding: spacing.md, alignItems: 'center' },
  statNum: { fontFamily: fontFamily.displayBlack, fontSize: 18, fontWeight: '900', color: colors.green, letterSpacing: -0.5 },
  statLabel: { fontSize: 9, color: colors.whiteA30, marginTop: 2, textAlign: 'center' },

  groupsList: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md, gap: spacing.md },
  groupItem: { borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.whiteA08 },
  groupItemReleasing: { borderColor: 'rgba(232,25,44,0.3)' },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md, backgroundColor: 'rgba(255,255,255,0.03)' },
  groupHeaderReleasing: { backgroundColor: 'rgba(232,25,44,0.1)' },
  groupIcon: { width: 40, height: 40, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white, marginBottom: 2 },
  groupMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  groupMeta: { fontSize: 10, color: colors.whiteA35 },
  releaseBadge: { backgroundColor: colors.flagRed, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  releaseBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5, color: colors.white, textTransform: 'uppercase' },
  groupAmountBox: { alignItems: 'flex-end' },
  groupAmount: { fontFamily: fontFamily.displayBlack, fontSize: 14, fontWeight: '900' },
  groupAmountLabel: { fontSize: 9, color: colors.whiteA30 },
  progressTrack: { height: 3, backgroundColor: colors.whiteA08 },

  footer: { paddingHorizontal: spacing.huge, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  createBtn: { marginHorizontal: 0, height: 48, borderRadius: radius.xl, backgroundColor: colors.greenA08, borderWidth: 1.5, borderColor: colors.greenA20, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontFamily: fontFamily.displayBlack, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, color: colors.green },

  // Create
  createScroll: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.giant, gap: 0 },
  createHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xxl },
  createTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: colors.white },
  fieldGroup: { marginBottom: spacing.lg },
  fieldLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.sm },
  fieldInput: { width: '100%', height: 50, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xl, fontFamily: fontFamily.bodyRegular, fontSize: 14, color: colors.white },
  fieldInputFilled: { borderColor: colors.greenA25 },
  chipsRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { height: 36, paddingHorizontal: spacing.lg, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.greenA10, borderColor: colors.greenA30 },
  chipText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  chipTextOnGreen: { color: colors.green },
  freqRow: { flexDirection: 'row', gap: spacing.sm },
  freqOpt: { flex: 1, height: 44, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  freqOptOn: { backgroundColor: 'rgba(250,216,54,0.1)', borderColor: 'rgba(250,216,54,0.3)' },
  freqText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.white },
  freqTextOn: { color: colors.flagGold },
  memberList: { gap: spacing.xs, marginBottom: spacing.sm },
  memberItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.whiteA06, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  memberAva: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  memberName: { flex: 1, fontFamily: fontFamily.bodyMedium, fontSize: 12, color: colors.white },
  memberOrder: { backgroundColor: colors.greenA10, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  memberOrderText: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.green },
  addMember: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderWidth: 1.5, borderColor: colors.whiteA12, borderStyle: 'dashed', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  addMemberIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  addMemberText: { fontSize: 12, color: colors.whiteA35 },
  previewCard: { backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.xl, padding: spacing.lg, marginBottom: spacing.lg },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  previewLabel: { fontSize: 10, color: colors.whiteA30 },
  previewValue: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  previewDivider: { height: 1, backgroundColor: colors.whiteA08, marginVertical: spacing.sm },

  // Release
  releaseHero: { paddingBottom: spacing.xxl, position: 'relative', overflow: 'hidden', backgroundColor: 'rgba(232,25,44,0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(232,25,44,0.2)' },
  releaseBadgeBig: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.flagRed, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.xxl, marginBottom: spacing.xl },
  releaseDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.white },
  releaseBadgeBigText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: colors.white, textTransform: 'uppercase' },
  releaseName: { fontFamily: fontFamily.displayBlack, fontSize: 14, fontWeight: '900', color: colors.white, marginBottom: spacing.md },
  releaseAmount: { fontFamily: fontFamily.displayBlack, fontSize: 44, fontWeight: '900', letterSpacing: -2, color: colors.flagRed, lineHeight: 44 },
  releaseCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(232,25,44,0.5)' },
  releaseRecipient: { fontSize: 12, color: colors.whiteA40, marginTop: spacing.md },
  releaseRecipientBold: { fontFamily: fontFamily.bodyBold, color: colors.white },

  potMembers: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.xl, gap: spacing.sm },
  potMembersLabel: { ...type.eyebrow, color: colors.whiteA25, marginBottom: spacing.xs },
  potMemberItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  potMemberCurrent: { backgroundColor: colors.greenA08 /* matches .pm-item.current */, borderColor: colors.greenA20 },
  potOrder: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  potOrderNow: { backgroundColor: colors.green },
  potOrderDone: { backgroundColor: colors.greenA15 },
  potOrderText: { fontSize: 10, fontWeight: '700', color: colors.whiteA30 },
  potMemberName: { flex: 1, fontFamily: fontFamily.bodyMedium, fontSize: 12, color: colors.white },
  potStatus: { borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  potStatusNow: { backgroundColor: colors.green },
  potStatusDone: { backgroundColor: colors.greenA10 },
  potStatusWait: { backgroundColor: colors.whiteA06 },
  potStatusText: { fontSize: 9, fontWeight: '700' },

  receiveBtn: { height: 50, borderRadius: radius.xl, backgroundColor: colors.flagRed, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  receiveBtnText: { fontFamily: fontFamily.displayBlack, fontSize: 12, fontWeight: '900', color: colors.white },
  releaseFootnote: { fontSize: 11, color: colors.whiteA30, textAlign: 'center' },
});

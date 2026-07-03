import { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import StepTransition from '../components/StepTransition';
import ScreenHeader from '../components/ScreenHeader';
import AmountChips from '../components/AmountChips';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useBlink, useEntrance, usePopIn, useSuccessHaptic } from '../hooks/animations';

// No HTML prototype exists for Receive (Jël) — only the Home Dashboard
// action label. Designed to mirror Send Money's structure per brief §05:
// "Request money with context... one-tap payment for the person receiving
// the request." The second step previews what the other person sees.

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000];

const CONTACTS = [
  { key: 'fatou', name: 'Fatou Diallo', handle: '@fatou_medina', emoji: '👩🏾' },
  { key: 'ibou', name: 'Ibou Ndiaye', handle: '@ibou_ndiaye', emoji: '👦🏿' },
  { key: 'aminata', name: 'Aminata Sarr', handle: '@aminata_s', emoji: '👩🏿' },
];

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

function AmountCursor() {
  const blink = useBlink(1000, 0);
  return <Animated.View style={[styles.ahCursor, { opacity: blink }]} />;
}

function RequestStep({ amount, setAmount, reason, setReason, contact, setContact, onSend, onBack }) {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const popIn = usePopIn(0, 400, 0.8);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ScreenHeader onBack={onBack} title="Demander" style={styles.topRow} />

          <View style={styles.amountHero}>
            <Text style={styles.ahLbl}>Combien demander ?</Text>
            <PressScale scaleTo={0.98} onPress={() => inputRef.current?.focus()}>
              <Animated.View style={[popIn, styles.ahRow]}>
                <Text style={styles.ahNum}>
                  {formatAmount(amount)} <Text style={styles.ahCurr}>F</Text>
                </Text>
                {!focused && <AmountCursor />}
              </Animated.View>
            </PressScale>
            <TextInput
              ref={inputRef}
              value={String(amount)}
              onChangeText={(t) => setAmount(Math.min(999999, Number(t.replace(/[^0-9]/g, '')) || 0))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              keyboardType="number-pad"
              style={styles.hiddenInput}
            />
          </View>

          <AmountChips
            options={QUICK_AMOUNTS}
            value={amount}
            onChange={setAmount}
            accentBg={colors.goldA10}
            accentBorder="rgba(250,216,54,0.4)"
            accentText={colors.flagGold}
            style={styles.quickRow}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.lbl}>À qui demander ?</Text>
          {CONTACTS.map((c) => (
            <PressScale key={c.key} scaleTo={0.98} onPress={() => setContact(c)} style={[styles.contactRow, contact?.key === c.key && styles.contactRowOn]}>
              <View style={styles.contactAva}>
                <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{c.name}</Text>
                <Text style={styles.contactHandle}>{c.handle}</Text>
              </View>
              {contact?.key === c.key && (
                <View style={styles.checkDot}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: colors.ink }}>✓</Text>
                </View>
              )}
            </PressScale>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.lbl}>Pour quoi ? (optionnel)</Text>
          <TextInput
            style={styles.reasonField}
            placeholder="Pour le taxi, pour manger..."
            placeholderTextColor={colors.whiteA30}
            value={reason}
            onChangeText={setReason}
          />
          <Text style={styles.reasonHint}>Le contexte enlève la gêne de demander de l'argent.</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GlowButton label={`Demander ${formatAmount(amount)} F →`} onPress={onSend} disabled={!contact || amount <= 0} />
      </View>
    </View>
  );
}

function SentStep({ amount, reason, contact, name, onDone }) {
  useSuccessHaptic();
  const ring = usePopIn(0, 500, 0.3);
  const title = useEntrance(200, 500, 10);
  const previewEntrance = useEntrance(400, 500, 10);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.sentRoot} showsVerticalScrollIndicator={false}>
      <Animated.View style={[styles.ssRing, ring]}>
        <Text style={{ fontSize: 32 }}>📥</Text>
      </Animated.View>
      <Animated.Text style={[styles.ssTitle, title]}>Demande envoyée !</Animated.Text>
      <Animated.Text style={[styles.ssSub, title]}>
        {contact.name.split(' ')[0]} peut payer en un tap.{'\n'}Tu seras notifié dès que c'est fait.
      </Animated.Text>

      <Animated.View style={[styles.previewCard, previewEntrance]}>
        <Text style={styles.previewLabel}>Aperçu — ce que {contact.name.split(' ')[0]} voit</Text>
        <View style={styles.previewNotif}>
          <View style={styles.previewAva}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.previewText}>
              <Text style={{ fontFamily: fontFamily.bodyBold }}>{name}</Text> te demande {formatAmount(amount)} F
            </Text>
            {reason ? <Text style={styles.previewReason}>{reason}</Text> : null}
          </View>
        </View>
        <View style={styles.previewPayBtn}>
          <Text style={styles.previewPayText}>Payer en un tap →</Text>
        </View>
      </Animated.View>

      <View style={{ width: '100%', marginTop: spacing.giant }}>
        <GlowButton label="Retour à l'accueil" onPress={onDone} />
      </View>
    </ScrollView>
  );
}

export default function ReceiveScreen({ navigation }) {
  const [step, setStep] = useState('request');
  const [amount, setAmount] = useState(2000);
  const [reason, setReason] = useState('Pour le taxi 🚕');
  const [contact, setContact] = useState(null);
  const { profile } = useAppState();

  const finish = () => {
    setStep('request');
    setAmount(2000);
    setReason('Pour le taxi 🚕');
    setContact(null);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'request' && (
          <StepTransition>
            <RequestStep
              amount={amount}
              setAmount={setAmount}
              reason={reason}
              setReason={setReason}
              contact={contact}
              setContact={setContact}
              onSend={() => setStep('sent')}
              onBack={() => navigation.goBack()}
            />
          </StepTransition>
        )}
        {step === 'sent' && contact && (
          <StepTransition>
            <SentStep amount={amount} reason={reason} contact={contact} name={profile.name.split(' ')[0]} onDone={finish} />
          </StepTransition>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  hero: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.huge, backgroundColor: colors.goldA08, borderBottomWidth: 1, borderBottomColor: 'rgba(250,216,54,0.12)' },
  topRow: { marginBottom: spacing.giant },

  amountHero: { alignItems: 'center' },
  ahLbl: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: 'rgba(250,216,54,0.7)', textTransform: 'uppercase', marginBottom: spacing.lg },
  ahRow: { flexDirection: 'row', alignItems: 'center' },
  ahNum: { fontFamily: fontFamily.displayBlack, fontSize: 48, letterSpacing: -3, lineHeight: 48, color: colors.flagGold },
  ahCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(250,216,54,0.5)' },
  ahCursor: { width: 2, height: 36, backgroundColor: colors.flagGold, marginLeft: 4 },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },

  quickRow: { justifyContent: 'center', marginTop: spacing.xl },

  section: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl, gap: spacing.sm },
  lbl: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.xs },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, borderRadius: radius.xxl, padding: spacing.xl },
  contactRowOn: { borderColor: 'rgba(250,216,54,0.4)', backgroundColor: colors.goldA08 },
  contactAva: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.goldA10, alignItems: 'center', justifyContent: 'center' },
  contactName: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.white },
  contactHandle: { fontSize: 11, color: colors.flagGold, marginTop: 1 },
  checkDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.flagGold, alignItems: 'center', justifyContent: 'center' },

  reasonField: { width: '100%', height: 48, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontFamily: fontFamily.bodyRegular, fontSize: 13, color: colors.white },
  reasonHint: { fontSize: 10, color: colors.whiteA30, marginTop: spacing.xs },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },

  sentRoot: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.giant },
  ssRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.goldA10, borderWidth: 3, borderColor: colors.flagGold, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl },
  ssTitle: { fontFamily: fontFamily.displayBlack, fontSize: 22, letterSpacing: -0.6, color: colors.white, marginBottom: spacing.md, textAlign: 'center' },
  ssSub: { fontSize: 12, color: colors.whiteA40, marginBottom: spacing.giant, lineHeight: 19, textAlign: 'center' },

  previewCard: { width: '100%', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA10, borderRadius: radius.xxl, padding: spacing.xxl },
  previewLabel: { ...type.eyebrow, color: colors.whiteA30, marginBottom: spacing.lg },
  previewNotif: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.xl },
  previewAva: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  previewText: { fontSize: 12, color: colors.white, lineHeight: 17 },
  previewReason: { fontSize: 10, color: colors.whiteA35, marginTop: 2 },
  previewPayBtn: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: spacing.lg, alignItems: 'center' },
  previewPayText: { fontFamily: fontFamily.displayBlack, fontSize: 11, color: colors.ink },
});

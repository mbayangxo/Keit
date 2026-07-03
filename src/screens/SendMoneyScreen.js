import { useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaxPattern from '../components/WaxPattern';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import StepTransition from '../components/StepTransition';
import Keypad from '../components/Keypad';
import ScreenHeader from '../components/ScreenHeader';
import AmountChips from '../components/AmountChips';
import ReceiptCard from '../components/ReceiptCard';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useEntrance, usePopIn, useSuccessHaptic } from '../hooks/animations';
import ReceiptShareButtons from '../components/ReceiptShareButtons';
import UndoTransferBar from '../components/UndoTransferBar';
import { usePreferences } from '../context/PreferencesContext';
import { useScreenshotBlock } from '../hooks/useScreenshotBlock';
import { useToast } from '../components/Toast';
import { transferSend } from '../lib/api-client';

// design/k21-remaining-flows.html, Flow 02 (Send Money) — three steps in one
// screen: amount entry -> confirm/safety -> success. The safety screen is
// the brief's §05 requirement (large photo, full name, phone, arrondissement,
// confirm/cancel) before any money moves.

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];

const RECENT_HANDLES = [
  { name: 'Fatou', handle: 'fatou_medina', emoji: '👩🏾', bg: colors.greenA08, border: colors.greenA20 },
  { name: 'Ibou', handle: 'ibou_dakar', emoji: '👦🏿', bg: colors.goldA08, border: 'rgba(250,216,54,0.15)' },
  { name: 'Aminata', handle: 'aminata_hlm', emoji: '👩🏿', bg: colors.redA08, border: 'rgba(232,25,44,0.15)' },
];

function displayHandle(handle) {
  const h = String(handle).replace(/^@/, '');
  return h ? `@${h}` : '';
}

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ | /g, ' ');
}

function AmountStep({ amount, setAmount, reason, setReason, recipientHandle, setRecipientHandle, onContinue, onBack, reduceMotion }) {
  const popIn = usePopIn(0, 400, 0.8);
  const pressDigit = (d) => setAmount((prev) => Math.min(999999, Number(`${prev === 0 ? '' : prev}${d}`)));
  const pressBackspace = () => setAmount((prev) => Math.floor(prev / 10));

  return (
    <View style={{ flex: 1 }}>
      <WaxPattern color="rgba(26,240,96,0.04)" size={18} animated={!reduceMotion} />
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.sendHero}>
          <ScreenHeader onBack={onBack} title="Envoyer" style={styles.shTop} />

          <View style={styles.amountHero}>
            <Text style={styles.ahLbl}>Combien ?</Text>
            <Animated.View style={[popIn, styles.ahRow]}>
              <Text style={styles.ahNum}>
                {formatAmount(amount)} <Text style={styles.ahCurr}>F</Text>
              </Text>
            </Animated.View>
          </View>

          <AmountChips options={QUICK_AMOUNTS} value={amount} onChange={setAmount} style={styles.quickRow} />

          <View style={styles.keypadWrap}>
            <Keypad onDigit={pressDigit} onBackspace={pressBackspace} />
          </View>
        </View>

        <View style={styles.recipientSection}>
          <Text style={styles.lbl}>À qui ? (handle K21)</Text>
          <View style={styles.recCard}>
            <View style={styles.recAva}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <TextInput
              style={styles.handleField}
              placeholder="@handle"
              placeholderTextColor={colors.whiteA30}
              autoCapitalize="none"
              autoCorrect={false}
              value={recipientHandle}
              onChangeText={(t) => setRecipientHandle(t.replace(/^@/, '').replace(/[^a-z0-9_]/gi, '').toLowerCase())}
            />
          </View>
          {recipientHandle.length >= 3 ? (
            <Text style={styles.recHandle}>{displayHandle(recipientHandle)}</Text>
          ) : null}
        </View>

        <View style={styles.reasonWrap}>
          <Text style={styles.lbl}>Pour quoi ? (optionnel)</Text>
          <TextInput
            style={styles.reasonField}
            placeholder="Pour le taxi, pour manger..."
            placeholderTextColor={colors.whiteA30}
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.huge, paddingBottom: spacing.giant }}>
          <GlowButton label="Continuer →" onPress={onContinue} disabled={recipientHandle.length < 3 || amount <= 0} />
        </View>

        <View style={{ paddingHorizontal: spacing.huge, paddingBottom: spacing.giant }}>
          <Text style={[styles.lbl, { marginBottom: spacing.lg }]}>Contacts récents</Text>
          <View style={{ flexDirection: 'row', gap: spacing.xl }}>
            {RECENT_HANDLES.map((c) => (
              <PressScale key={c.handle} scaleTo={0.9} onPress={() => setRecipientHandle(c.handle)} style={styles.contactItem}>
                <View style={[styles.contactAva, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                </View>
                <Text style={styles.contactLabel}>{c.name}</Text>
              </PressScale>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ConfirmStep({ amount, reason, balance, recipientHandle, onConfirm, onCancel, submitting }) {
  const solde = balance - amount;
  const label = displayHandle(recipientHandle);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.csHero}>
        <WaxPattern color="rgba(26,240,96,0.03)" size={18} animated={false} />
        <View style={styles.csAva}>
          <Text style={{ fontSize: 28 }}>👤</Text>
        </View>
        <Text style={styles.csName}>{label}</Text>
        <Text style={styles.csHandle}>Destinataire K21</Text>
        <Text style={styles.csAmount}>
          {formatAmount(amount)} <Text style={{ fontSize: 20, fontWeight: '400', color: 'rgba(26,240,96,0.4)' }}>F</Text>
        </Text>
        <View style={styles.csFree}>
          <Text style={styles.csFreeText}>✦ Zéro frais{reason ? ` · ${reason}` : ''}</Text>
        </View>

        <View style={styles.csConfirmPhoto}>
          <Text style={{ fontSize: 18 }}>🔒</Text>
          <Text style={styles.cspText}>
            <Text style={{ fontFamily: fontFamily.bodyBold, color: colors.whiteA85 }}>Oui c'est bien {label} ?</Text>
            {'\n'}
            Vérifie le handle avant d'envoyer.
          </Text>
        </View>
      </View>

      <View style={styles.csBody}>
        <View style={styles.csRow}>
          <Text style={styles.csrL}>Destinataire</Text>
          <Text style={styles.csrR}>{label}</Text>
        </View>
        <View style={styles.csRow}>
          <Text style={styles.csrL}>Montant</Text>
          <Text style={[styles.csrR, { color: colors.green }]}>{formatAmount(amount)} F CFA</Text>
        </View>
        <View style={styles.csRow}>
          <Text style={styles.csrL}>Frais</Text>
          <Text style={[styles.csrR, { color: colors.green }]}>0 F ✦</Text>
        </View>
        <View style={[styles.csRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.csrL}>Solde après</Text>
          <Text style={[styles.csrR, { color: colors.whiteA55 }]}>{formatAmount(solde)} F</Text>
        </View>
      </View>

      <View style={styles.csActions}>
        <GlowButton label={submitting ? 'Envoi…' : `Oui — Envoyer ${formatAmount(amount)} F →`} onPress={onConfirm} disabled={submitting} />
        <PressScale scaleTo={0.96} onPress={onCancel} disabled={submitting}>
          <Text style={styles.csNo}>Ce n'est pas la bonne personne</Text>
        </PressScale>
      </View>
    </View>
  );
}

function SuccessStep({ amount, reason, reference, recipientHandle, onDone, onMarkedUndone, onShareMbolo, undone }) {
  useSuccessHaptic();
  const ring = usePopIn(0, 500, 0.3);
  const title = useEntrance(200, 500, 10);
  const sub = useEntrance(300, 500, 10);
  const receipt = useEntrance(400, 500, 10);
  const bonus = useEntrance(500, 500, 10);
  const label = displayHandle(recipientHandle);

  return (
    <View style={styles.successRoot}>
      <View style={styles.successBg} />
      <View style={styles.successContent}>
        <Animated.View style={[styles.ssRing, ring]}>
          <Text style={{ fontSize: 38, color: colors.green }}>{undone ? '↩' : '✓'}</Text>
        </Animated.View>
        <Animated.Text style={[styles.ssTitle, title]}>{undone ? 'Annulé' : 'Envoyé !'}</Animated.Text>
        <Animated.Text style={[styles.ssSub, sub]}>
          {undone
            ? 'L\'argent est revenu sur ton compte.'
            : `${label} a reçu ton argent\nen quelques secondes.`}
        </Animated.Text>

        {!undone && (
          <UndoTransferBar reference={reference} amount={amount} onUndone={onMarkedUndone} />
        )}

        <Animated.View style={receipt}>
          <ReceiptCard
            style={{ marginBottom: spacing.lg }}
            rows={[
              { key: 'to', label: 'À', value: label },
              { key: 'amount', label: 'Montant', value: `${formatAmount(amount)} F CFA`, color: colors.green },
              { key: 'fee', label: 'Frais', value: '0 F ✦', color: colors.green },
              { key: 'reason', label: 'Motif', value: reason || '—' },
              { key: 'ref', label: 'Référence', value: reference, small: true },
            ]}
          />
          {!undone && (
            <ReceiptShareButtons
              amount={amount}
              counterparty={label}
              reference={reference}
              note={reason}
              onShareMbolo={onShareMbolo}
              style={{ marginBottom: spacing.lg }}
            />
          )}
        </Animated.View>

        {!undone && (
          <Animated.View style={[styles.wakhnaBonus, bonus]}>
            <Text style={{ fontSize: 16 }}>✦</Text>
            <Text style={styles.wbText}>
              <Text style={{ fontFamily: fontFamily.bodyBold, color: colors.green }}>+10 Wakhna</Text> pour cet envoi
            </Text>
          </Animated.View>
        )}

        <GlowButton label={undone ? 'Retour à l\'accueil' : 'Terminer'} onPress={onDone} />
      </View>
    </View>
  );
}

export default function SendMoneyScreen({ navigation }) {
  useScreenshotBlock(true);
  const { reduceMotion } = usePreferences();
  const showToast = useToast();
  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState(5000);
  const [reason, setReason] = useState('');
  const [recipientHandle, setRecipientHandle] = useState('');
  const [reference, setReference] = useState('');
  const [undone, setUndone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { balance, refreshWallet, setPendingMboloShare } = useAppState();

  const confirm = async () => {
    setSubmitting(true);
    try {
      const result = await transferSend({
        recipientHandle,
        amount,
        note: reason,
      });
      setReference(result.reference);
      setUndone(false);
      await refreshWallet();
      setStep('success');
    } catch (err) {
      showToast(err.message ?? 'Envoi impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndone = async () => {
    setUndone(true);
    await refreshWallet();
  };

  const shareMbolo = (text) => {
    setPendingMboloShare(text);
    navigation.navigate('Main', { screen: 'MbooloTab' });
  };

  const finish = () => {
    setStep('amount');
    setAmount(5000);
    setReason('');
    setRecipientHandle('');
    setUndone(false);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'amount' && (
          <StepTransition>
            <AmountStep
              amount={amount}
              setAmount={setAmount}
              reason={reason}
              setReason={setReason}
              recipientHandle={recipientHandle}
              setRecipientHandle={setRecipientHandle}
              onContinue={() => setStep('confirm')}
              onBack={() => navigation.goBack()}
              reduceMotion={reduceMotion}
            />
          </StepTransition>
        )}
        {step === 'confirm' && (
          <StepTransition>
            <ConfirmStep amount={amount} reason={reason} balance={balance} recipientHandle={recipientHandle} onConfirm={confirm} onCancel={() => setStep('amount')} submitting={submitting} />
          </StepTransition>
        )}
        {step === 'success' && (
          <StepTransition>
            <SuccessStep
              amount={amount}
              reason={reason}
              reference={reference}
              recipientHandle={recipientHandle}
              onDone={finish}
              onMarkedUndone={handleUndone}
              onShareMbolo={shareMbolo}
              undone={undone}
            />
          </StepTransition>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  // Amount step
  sendHero: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.huge, position: 'relative', overflow: 'hidden' },
  shTop: { marginBottom: spacing.giant },

  amountHero: { alignItems: 'center' },
  ahLbl: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: spacing.lg },
  ahRow: { flexDirection: 'row', alignItems: 'center' },
  ahNum: { fontFamily: fontFamily.displayBlack, fontSize: 52, letterSpacing: -3, lineHeight: 52, color: colors.green },
  ahCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(26,240,96,0.4)' },
  keypadWrap: { marginTop: spacing.xxl },

  quickRow: { justifyContent: 'center', marginTop: spacing.xl },

  recipientSection: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
  lbl: { ...type.eyebrow, color: colors.whiteA30 },
  recCard: { backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, borderRadius: radius.xxl, padding: spacing.xxl, flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginTop: spacing.sm },
  handleField: { flex: 1, fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.white },
  recAva: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(26,240,96,0.1)', borderWidth: 2, borderColor: colors.greenA25, alignItems: 'center', justifyContent: 'center' },
  recName: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.white },
  recHandle: { fontFamily: fontFamily.bodyRegular, fontSize: 11, color: colors.green },
  recArr: { fontSize: 11, color: colors.whiteA40 },

  reasonWrap: { paddingHorizontal: spacing.huge, paddingBottom: spacing.xxl },
  reasonField: { width: '100%', height: 48, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontFamily: fontFamily.bodyRegular, fontSize: 13, color: colors.white, marginTop: spacing.sm },

  contactItem: { alignItems: 'center', gap: spacing.xs },
  contactAva: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, color: colors.whiteA40 },


  // Confirm step
  csHero: { paddingHorizontal: spacing.giant, paddingTop: spacing.giant + 4, paddingBottom: spacing.giant, alignItems: 'center', position: 'relative', overflow: 'hidden', borderBottomWidth: 1, borderBottomColor: colors.greenA12 },
  csAva: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: colors.greenA30, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  csName: { fontFamily: fontFamily.displayBlack, fontSize: 15, color: colors.white },
  csHandle: { fontFamily: fontFamily.bodyRegular, fontSize: 11, color: colors.green, marginBottom: spacing.xs },
  csArr: { fontSize: 11, color: colors.whiteA35 },
  csAmount: { fontFamily: fontFamily.displayBlack, fontSize: 54, letterSpacing: -3, lineHeight: 54, color: colors.green, marginTop: spacing.xxl, marginBottom: spacing.xs },
  csFree: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs, marginTop: spacing.sm },
  csFreeText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: 'rgba(26,240,96,0.8)' },
  csConfirmPhoto: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.greenA06, borderWidth: 1, borderColor: colors.greenA15, borderRadius: radius.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg, marginTop: spacing.xxl, width: '100%' },
  cspText: { flex: 1, fontFamily: fontFamily.bodyRegular, fontSize: 11, color: colors.whiteA55, lineHeight: 16.5 },

  csBody: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
  csRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.whiteA06 },
  csrL: { fontSize: 11, color: colors.whiteA35 },
  csrR: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },

  csActions: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant, paddingTop: spacing.lg, gap: spacing.md, marginTop: 'auto' },
  csNo: { textAlign: 'center', fontSize: 11, color: colors.flagRed, fontFamily: fontFamily.bodySemiBold },

  // Success step
  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl + 14 },
  successBg: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.ink },
  successContent: { alignItems: 'center', width: '100%' },
  ssRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenA08, borderWidth: 3, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl, shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 50, elevation: 8 },
  ssTitle: { fontFamily: fontFamily.displayBlack, fontSize: 24, letterSpacing: -0.8, color: colors.white, marginBottom: spacing.md, textAlign: 'center' },
  ssSub: { fontSize: 12, color: colors.whiteA40, marginBottom: spacing.giant + 2, lineHeight: 20.4, textAlign: 'center' },
  wakhnaBonus: { backgroundColor: colors.greenA05, borderWidth: 1, borderColor: colors.greenA15, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxxl, alignSelf: 'stretch' },
  wbText: { fontSize: 11, color: colors.whiteA40 },
});

import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import WaxPattern from '../components/WaxPattern';
import StepTransition from '../components/StepTransition';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useCountUp, useEntrance, usePopIn, useSuccessHaptic } from '../hooks/animations';

// design/k21-four-flows.html, FLOW 4 — MERCHANT QR PAYMENT (Screens M1-M3):
// Scan QR (merchant card + scanner + amount) -> Confirm payment -> Payment done.

const QUICK_AMOUNTS = [
  { key: '500', value: 500, label: '500 F' },
  { key: '1k', value: 1000, label: '1k F' },
  { key: '2500', value: 2500, label: '2 500 F' },
  { key: '5k', value: 5000, label: '5k F' },
];

const MERCHANT = {
  name: 'Dibiterie Chez Papa',
  arr: 'Médina · Dakar',
  emoji: '🍖',
};

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

// `qsa-scan-line`: top 25% -> 70% -> 25%, ease-in-out, infinite.
function useScanLine(frameSize, periodMs = 2000) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val, periodMs]);
  return val.interpolate({ inputRange: [0, 1], outputRange: [frameSize * 0.25, frameSize * 0.7] });
}

const FRAME_SIZE = 200;

function ScanStep({ amount, setAmount, onBack, onContinue }) {
  const scanY = useScanLine(FRAME_SIZE);
  const entrance = useEntrance(0, 350, 10);
  const historyEntrance = useEntrance(150, 350, 10);
  const { transactions } = useAppState();
  const history = transactions.filter((tx) => tx.title === MERCHANT.name).slice(0, 3);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['rgba(26,240,96,0.18)', 'rgba(250,216,54,0.12)', 'rgba(232,25,44,0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.payHero}
        >
          <WaxPattern color="rgba(255,255,255,0.06)" size={18} animated={false} />
          <View style={styles.payHeroTop}>
            <PressScale scaleTo={0.9} onPress={onBack} style={styles.iconBtn}>
              <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
            </PressScale>
            <Text style={styles.payHeroTitle}>Payer un marchand</Text>
          </View>

          <Animated.View style={[styles.merchantCard, entrance]}>
            <View style={styles.merchantIcon}>
              <Text style={{ fontSize: 22 }}>{MERCHANT.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.merchantName}>{MERCHANT.name}</Text>
              <Text style={styles.merchantArr}>📍 {MERCHANT.arr}</Text>
            </View>
            <View style={styles.verifiedPill}>
              <Text style={styles.verifiedPillText}>✓ K21</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.scannerArea}>
          <Text style={styles.scannerBackdrop}>🏪</Text>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            <Animated.View style={[styles.scanLine, { top: scanY }]} />
          </View>
          <Text style={styles.scannerLabel}>Pointe vers le QR code du marchand</Text>
        </View>

        <View style={styles.amountSection}>
          <Text style={styles.amountSectionLabel}>Montant à payer</Text>
          <View style={styles.amountDisplay}>
            <Text style={styles.amountNum}>{formatAmount(amount)}</Text>
            <Text style={styles.amountCurr}>F CFA</Text>
            <View style={styles.amountCursor} />
          </View>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <PressScale key={q.key} scaleTo={0.92} onPress={() => setAmount(q.value)} style={[styles.chip, amount === q.value && styles.chipOn]}>
                <Text style={[styles.chipText, amount === q.value && styles.chipTextOn]}>{q.label}</Text>
              </PressScale>
            ))}
          </View>
        </View>

        <Animated.View style={[styles.historySection, historyEntrance]}>
          <Text style={styles.historyLabel}>Historique avec ce marchand</Text>
          {history.length === 0 ? (
            <View style={styles.historyEmpty}>
              <Text style={{ fontSize: 16 }}>🆕</Text>
              <Text style={styles.historyEmptyText}>Ton premier paiement chez {MERCHANT.name}</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {history.map((tx) => (
                <View key={tx.key} style={styles.historyRow}>
                  <View style={styles.historyIcon}>
                    <Text style={{ fontSize: 14 }}>{tx.icon}</Text>
                  </View>
                  <Text style={styles.historySub}>{tx.subtitle}</Text>
                  <Text style={styles.historyAmount}>{formatAmount(Math.abs(tx.amount))} F</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <GlowButton label="Continuer →" onPress={onContinue} disabled={amount <= 0} />
      </View>
    </View>
  );
}

function ConfirmStep({ amount, balance, onPay, onCancel }) {
  const entrance = useEntrance(0, 350, 10);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmHero}>
          <WaxPattern color="rgba(255,255,255,0.06)" size={18} animated={false} />
          <Animated.View style={[{ alignItems: 'center' }, entrance]}>
            <View style={styles.confirmAva}>
              <Text style={{ fontSize: 28 }}>{MERCHANT.emoji}</Text>
            </View>
            <Text style={styles.confirmMerchantName}>{MERCHANT.name}</Text>
            <Text style={styles.confirmMerchantArr}>📍 Médina · Marchand vérifié K21</Text>
            <Text style={styles.confirmAmount}>
              {formatAmount(amount)} <Text style={styles.confirmCurr}>F</Text>
            </Text>
            <View style={styles.freePill}>
              <Text style={styles.freePillText}>✦ Zéro frais sur ce paiement</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.confirmBody}>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmRowLabel}>Marchand</Text>
            <Text style={styles.confirmRowVal}>{MERCHANT.name}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmRowLabel}>Montant</Text>
            <Text style={[styles.confirmRowVal, { color: colors.green }]}>{formatAmount(amount)} F CFA</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmRowLabel}>Frais</Text>
            <Text style={[styles.confirmRowVal, { color: colors.green }]}>0 F ✦</Text>
          </View>
          <View style={[styles.confirmRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.confirmRowLabel}>Ton solde après</Text>
            <Text style={styles.confirmRowBal}>{formatAmount(balance - amount)} F</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.confirmActions}>
        <View style={styles.warnBox}>
          <Text style={{ fontSize: 13 }}>🔒</Text>
          <Text style={styles.warnText}>Paiement sécurisé K21. Marchand vérifié. Transaction irréversible une fois confirmée.</Text>
        </View>
        <GlowButton label={`Confirmer · Payer ${formatAmount(amount)} F →`} onPress={onPay} />
        <PressScale scaleTo={0.96} onPress={onCancel} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </PressScale>
      </View>
    </View>
  );
}

function SuccessStep({ amount, oldBalance, newBalance, onDone }) {
  useSuccessHaptic();
  const ring = usePopIn(0, 500, 0.4);
  const title = useEntrance(200, 500, 10);
  const sub = useEntrance(300, 500, 10);
  const receipt = useEntrance(400, 500, 10);
  const bonus = useEntrance(500, 500, 10);
  const balanceCount = useCountUp(oldBalance, newBalance, 700);
  const reference = 'K21-2603-8F4A';

  return (
    <View style={styles.successRoot}>
      <WaxPattern color="rgba(255,255,255,0.03)" size={18} animated={false} />
      <Animated.View style={[styles.ssRing, ring]}>
        <Text style={{ fontSize: 38, color: colors.green }}>✓</Text>
      </Animated.View>
      <Animated.Text style={[styles.ssTitle, title]}>Payé !</Animated.Text>
      <Animated.Text style={[styles.ssSub, sub]}>
        {MERCHANT.name} a reçu{'\n'}ton paiement instantanément.
      </Animated.Text>

      <Animated.View style={[styles.ssReceipt, receipt]}>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Marchand</Text>
          <Text style={styles.ssrR}>Chez Papa</Text>
        </View>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Montant</Text>
          <Text style={[styles.ssrR, { color: colors.green }]}>{formatAmount(amount)} F CFA</Text>
        </View>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Frais</Text>
          <Text style={[styles.ssrR, { color: colors.green }]}>0 F ✦</Text>
        </View>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Nouveau solde</Text>
          <Text style={styles.ssrR}>{formatAmount(balanceCount)} F</Text>
        </View>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Référence</Text>
          <Text style={[styles.ssrR, { fontSize: 9, color: colors.whiteA30 }]}>{reference}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.wakhnaBonus, bonus]}>
        <Text style={{ fontSize: 16 }}>✦</Text>
        <Text style={styles.wakhnaBonusText}>
          <Text style={{ fontFamily: fontFamily.bodyBold, color: colors.green }}>+5 points Wakhna</Text> pour ce paiement marchand
        </Text>
      </Animated.View>

      <PressScale scaleTo={0.97} onPress={() => {}} style={styles.shareBtn}>
        <Text style={styles.shareBtnText}>📤 Partager le reçu</Text>
      </PressScale>
      <GlowButton label="Retour à l'accueil" onPress={onDone} />
    </View>
  );
}

export default function PayMerchantScreen({ navigation }) {
  const [step, setStep] = useState('scan');
  const [amount, setAmount] = useState(2500);
  const [oldBalance, setOldBalance] = useState(0);
  const [newBalance, setNewBalance] = useState(0);
  const { balance, addTransaction } = useAppState();

  const pay = () => {
    addTransaction({ icon: '🏪', iconBg: colors.orangeA08, title: MERCHANT.name, subtitle: "À l'instant", amount: -amount });
    setOldBalance(balance);
    setNewBalance(balance - amount);
    setStep('success');
  };

  const finish = () => {
    setStep('scan');
    setAmount(2500);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'scan' && (
          <StepTransition>
            <ScanStep amount={amount} setAmount={setAmount} onBack={() => navigation.goBack()} onContinue={() => setStep('confirm')} />
          </StepTransition>
        )}
        {step === 'confirm' && (
          <StepTransition>
            <ConfirmStep amount={amount} balance={balance} onPay={pay} onCancel={() => setStep('scan')} />
          </StepTransition>
        )}
        {step === 'success' && (
          <StepTransition>
            <SuccessStep amount={amount} oldBalance={oldBalance} newBalance={newBalance} onDone={finish} />
          </StepTransition>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  // Scan step
  payHero: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xl, position: 'relative', overflow: 'hidden' },
  payHeroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  iconBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  payHeroTitle: { fontFamily: fontFamily.displayBold, fontSize: 13, color: colors.white },
  merchantCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: colors.whiteA12, borderRadius: radius.xl, padding: spacing.lg },
  merchantIcon: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  merchantName: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.white, marginBottom: 2 },
  merchantArr: { fontSize: 10, color: colors.whiteA40 },
  verifiedPill: { backgroundColor: colors.greenA15, borderWidth: 1, borderColor: colors.greenA30, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  verifiedPillText: { fontSize: 8, fontWeight: '700', color: colors.green },

  scannerArea: { marginHorizontal: spacing.xl, marginTop: spacing.lg, borderRadius: radius.xxl, overflow: 'hidden', backgroundColor: '#111', height: 220, alignItems: 'center', justifyContent: 'center' },
  scannerBackdrop: { position: 'absolute', fontSize: 140, opacity: 0.05 },
  viewfinder: { position: 'absolute', top: 18, left: 18, right: 18, bottom: 18 },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: colors.green },
  cornerTL: { top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 3 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 3 },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: colors.green, shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
  scannerLabel: { position: 'absolute', bottom: 12, fontSize: 10, color: colors.whiteA55 },

  amountSection: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg, paddingBottom: spacing.md },

  historySection: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  historyLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.sm },
  historyEmpty: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  historyEmptyText: { flex: 1, fontSize: 11, color: colors.whiteA35 },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  historyIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.orangeA08, alignItems: 'center', justifyContent: 'center' },
  historySub: { flex: 1, fontSize: 11, color: colors.whiteA35 },
  historyAmount: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  amountSectionLabel: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.sm },
  amountDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, marginBottom: spacing.md },
  amountNum: { fontFamily: fontFamily.displayBlack, fontSize: 34, fontWeight: '900', letterSpacing: -1.5, color: colors.white, flex: 1 },
  amountCurr: { fontSize: 13, color: colors.whiteA30 },
  amountCursor: { width: 2, height: 30, backgroundColor: colors.green, borderRadius: 1 },
  quickRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { height: 34, paddingHorizontal: spacing.lg, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.greenA10, borderColor: colors.greenA30 },
  chipText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.white },
  chipTextOn: { color: colors.green },

  footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl },

  // Confirm step
  confirmHero: { paddingHorizontal: spacing.giant, paddingTop: spacing.xxl, paddingBottom: spacing.xl, backgroundColor: colors.greenA08, borderBottomWidth: 1, borderBottomColor: colors.greenA15, position: 'relative', overflow: 'hidden' },
  confirmAva: { width: 64, height: 64, borderRadius: radius.xxl, backgroundColor: colors.whiteA08, borderWidth: 2, borderColor: colors.greenA25, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  confirmMerchantName: { fontFamily: fontFamily.displayBlack, fontSize: 14, fontWeight: '900', color: colors.white, textAlign: 'center' },
  confirmMerchantArr: { fontSize: 11, color: colors.whiteA35, marginTop: 2 },
  confirmAmount: { fontFamily: fontFamily.displayBlack, fontSize: 48, fontWeight: '900', letterSpacing: -2.5, color: colors.green, lineHeight: 52, marginTop: spacing.lg },
  confirmCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(26,240,96,0.5)' },
  freePill: { backgroundColor: colors.greenA10, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.round, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs, marginTop: spacing.md },
  freePillText: { fontSize: 10, fontWeight: '700', color: colors.green },

  confirmBody: { paddingHorizontal: spacing.giant, paddingVertical: spacing.xl, gap: 0 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.whiteA06 },
  confirmRowLabel: { fontSize: 11, color: colors.whiteA35 },
  confirmRowVal: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  confirmRowBal: { fontSize: 11, color: colors.whiteA30 },

  confirmActions: { paddingHorizontal: spacing.giant, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.sm },
  warnBox: { flexDirection: 'row', gap: spacing.sm, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.xs },
  warnText: { flex: 1, fontSize: 10, color: colors.whiteA30, lineHeight: 15 },
  cancelBtn: { height: 42, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { fontSize: 12, color: colors.whiteA40 },

  // Success step
  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.giant },
  ssRing: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.greenA10, borderWidth: 3, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxl, shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 50, elevation: 8 },
  ssTitle: { fontFamily: fontFamily.displayBlack, fontSize: 22, fontWeight: '900', letterSpacing: -0.8, color: colors.white, marginBottom: spacing.sm, textAlign: 'center' },
  ssSub: { fontSize: 12, color: colors.whiteA40, marginBottom: spacing.xxl, lineHeight: 19.2, textAlign: 'center' },
  ssReceipt: { width: '100%', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA10, borderRadius: radius.xxl, padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.xl },
  ssrRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ssrL: { fontSize: 11, color: colors.whiteA30 },
  ssrR: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  wakhnaBonus: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.greenA06, borderWidth: 1, borderColor: 'rgba(26,240,96,0.18)', borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginBottom: spacing.lg },
  wakhnaBonusText: { flex: 1, fontSize: 11, color: colors.whiteA40 },
  shareBtn: { width: '100%', height: 44, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  shareBtnText: { fontSize: 12, fontWeight: '600', color: colors.whiteA55 },
});

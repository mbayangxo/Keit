import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import WaxPattern from '../components/WaxPattern';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useEntrance, usePopIn, useSuccessHaptic } from '../hooks/animations';

// No HTML prototype exists for the Pay Merchant QR (Fey) flow — only the
// "Fey" action label appears on the Home Dashboard. Designed to match the
// established system exactly and mirror Send Money's structure per brief
// §05 (QR at merchants, offline payment token, merchant sound + notification).

const QUICK_AMOUNTS = [500, 1000, 2500, 5000];

const MERCHANT = {
  name: 'Dibiterie Chez Papa',
  category: 'Restauration · Médina',
  emoji: '🏪',
};

const BALANCE = 47000;

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

// `scan-line`: translateY 0 -> frameSize -> 0, linear, infinite.
function useScanLine(size, periodMs = 2200) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: size, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(val, { toValue: 0, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val, size, periodMs]);
  return val;
}

// Corner-bracket ripple, matching the app's `ava-pop`/`scan-pulse` glow language.
function useCornerPulse(periodMs = 2000) {
  const val = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(val, { toValue: 1, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(val, { toValue: 0, duration: periodMs / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [val, periodMs]);
  return val.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
}

const FRAME_SIZE = 220;

function Corner({ style }) {
  return <View style={[styles.corner, style]} />;
}

function ScanStep({ onScan, onBack, onImportImage }) {
  const scanY = useScanLine(FRAME_SIZE - 3);
  const cornerOpacity = useCornerPulse();
  const [torchOn, setTorchOn] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.scanHeader}>
        <PressScale scaleTo={0.9} onPress={onBack} style={styles.scanBackBtn}>
          <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
        </PressScale>
        <Text style={styles.scanTitle}>Scanner</Text>
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <PressScale scaleTo={0.9} onPress={() => setTorchOn((v) => !v)} style={[styles.scanIconBtn, torchOn && styles.scanIconBtnOn]}>
            <Text style={{ fontSize: 15 }}>🔦</Text>
          </PressScale>
          <PressScale
            scaleTo={0.9}
            onPress={() => onImportImage()}
            style={styles.scanIconBtn}
          >
            <Text style={{ fontSize: 15 }}>🖼️</Text>
          </PressScale>
        </View>
      </View>

      <View style={styles.scanBody}>
        <Text style={styles.scanBackdrop}>🏪</Text>
        <PressScale scaleTo={0.98} onPress={onScan}>
          <View style={styles.viewfinder}>
            <Animated.View style={[styles.corner, styles.cornerTL, { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerTR, { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerBL, { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.corner, styles.cornerBR, { opacity: cornerOpacity }]} />
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />
          </View>
        </PressScale>
        <Text style={styles.scanHint}>Vise le QR code du marchand</Text>
        <Text style={styles.scanNote}>✦ Zéro connexion nécessaire · Token sécurisé</Text>
      </View>
    </View>
  );
}

function ConfirmStep({ amount, setAmount, onPay, onCancel }) {
  const entrance = useEntrance(0, 350, 10);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.confirmHero}>
          <WaxPattern color="rgba(255,100,34,0.04)" size={18} animated={false} />
          <PressScale scaleTo={0.9} onPress={onCancel} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>

          <Animated.View style={[styles.merchantCard, entrance]}>
            <View style={styles.merchantAva}>
              <Text style={{ fontSize: 28 }}>{MERCHANT.emoji}</Text>
            </View>
            <Text style={styles.merchantName}>{MERCHANT.name}</Text>
            <Text style={styles.merchantMeta}>📍 {MERCHANT.category} · Vérifié K21</Text>
          </Animated.View>

          <Text style={styles.amountLbl}>Combien payer ?</Text>
          <Text style={styles.amountNum}>
            {formatAmount(amount)} <Text style={styles.amountCurr}>F</Text>
          </Text>

          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map((q) => (
              <PressScale key={q} scaleTo={0.92} onPress={() => setAmount(q)} style={[styles.chip, amount === q && styles.chipOn]}>
                <Text style={[styles.chipText, amount === q && styles.chipTextOn]}>{formatAmount(q)}</Text>
              </PressScale>
            ))}
          </View>

          <View style={styles.securePill}>
            <Text style={styles.securePillText}>🔒 Paiement sécurisé · Zéro frais</Text>
          </View>
        </View>

        <View style={styles.csBody}>
          <View style={styles.csRow}>
            <Text style={styles.csrL}>Marchand</Text>
            <Text style={styles.csrR}>{MERCHANT.name}</Text>
          </View>
          <View style={styles.csRow}>
            <Text style={styles.csrL}>Montant</Text>
            <Text style={[styles.csrR, { color: colors.green }]}>{formatAmount(amount)} F CFA</Text>
          </View>
          <View style={[styles.csRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.csrL}>Solde après</Text>
            <Text style={[styles.csrR, { color: colors.whiteA55 }]}>{formatAmount(BALANCE - amount)} F</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <GlowButton label={`Payer ${formatAmount(amount)} F →`} onPress={onPay} disabled={amount <= 0} />
      </View>
    </View>
  );
}

function SuccessStep({ amount, onDone }) {
  useSuccessHaptic();
  const ring = usePopIn(0, 500, 0.3);
  const title = useEntrance(200, 500, 10);
  const sub = useEntrance(300, 500, 10);
  const receipt = useEntrance(400, 500, 10);
  const note = useEntrance(500, 500, 10);
  const reference = 'K21-QR-7D41';

  return (
    <View style={styles.successRoot}>
      <Animated.View style={[styles.ssRing, ring]}>
        <Text style={{ fontSize: 38, color: colors.green }}>✓</Text>
      </Animated.View>
      <Animated.Text style={[styles.ssTitle, title]}>Payé !</Animated.Text>
      <Animated.Text style={[styles.ssSub, sub]}>
        {MERCHANT.name} a reçu ton paiement{'\n'}instantanément.
      </Animated.Text>

      <Animated.View style={[styles.ssReceipt, receipt]}>
        <View style={styles.ssrRow}>
          <Text style={styles.ssrL}>Marchand</Text>
          <Text style={styles.ssrR}>{MERCHANT.name}</Text>
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
          <Text style={styles.ssrL}>Référence</Text>
          <Text style={[styles.ssrR, { fontSize: 9, color: colors.whiteA30 }]}>{reference}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.merchantNotifNote, note]}>
        <Text style={{ fontSize: 16 }}>🔔</Text>
        <Text style={styles.merchantNotifText}>Le marchand a reçu un son K21 + notification</Text>
      </Animated.View>

      <GlowButton label="Retour à l'accueil" onPress={onDone} />
    </View>
  );
}

export default function PayMerchantScreen({ navigation }) {
  const [step, setStep] = useState('scan');
  const [amount, setAmount] = useState(1000);

  const finish = () => {
    setStep('scan');
    setAmount(1000);
    navigation.goBack();
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'scan' && (
          <ScanStep
            onScan={() => setStep('confirm')}
            onBack={() => navigation.goBack()}
            onImportImage={() => navigation.navigate('Info', { title: 'Importer un QR', subtitle: 'Scanner depuis une image arrive bientôt.', icon: '🖼️' })}
          />
        )}
        {step === 'confirm' && (
          <ConfirmStep amount={amount} setAmount={setAmount} onPay={() => setStep('success')} onCancel={() => setStep('scan')} />
        )}
        {step === 'success' && <SuccessStep amount={amount} onDone={finish} />}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  // Scan step
  scanHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  scanBackBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  scanTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: colors.white },
  scanIconBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  scanIconBtnOn: { backgroundColor: colors.greenA20, borderColor: colors.greenA30 },

  scanBody: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.giant },
  scanBackdrop: { position: 'absolute', fontSize: 220, opacity: 0.04 },
  viewfinder: { width: FRAME_SIZE, height: FRAME_SIZE, alignItems: 'center', justifyContent: 'flex-start', overflow: 'hidden', borderRadius: radius.xxl },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: colors.green },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: radius.lg },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: radius.lg },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: radius.lg },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: radius.lg },
  scanLine: { position: 'absolute', left: 8, right: 8, height: 3, borderRadius: 2, backgroundColor: colors.green, shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },
  scanHint: { marginTop: spacing.giant, fontSize: 12, color: colors.whiteA55, textAlign: 'center' },
  scanNote: { marginTop: spacing.sm, fontSize: 10, color: colors.whiteA30, textAlign: 'center' },

  // Confirm step
  confirmHero: { alignItems: 'center', paddingHorizontal: spacing.giant, paddingTop: spacing.xxl, paddingBottom: spacing.giant, borderBottomWidth: 1, borderBottomColor: colors.orangeA10, position: 'relative', overflow: 'hidden' },
  backBtn: { alignSelf: 'flex-start', width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  merchantCard: { alignItems: 'center', marginBottom: spacing.xxl },
  merchantAva: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.orangeA10, borderWidth: 3, borderColor: colors.orangeA20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  merchantName: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.white, textAlign: 'center' },
  merchantMeta: { fontSize: 11, color: colors.whiteA35, marginTop: spacing.xs },

  amountLbl: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: 'rgba(26,240,96,0.6)', textTransform: 'uppercase', marginBottom: spacing.lg },
  amountNum: { fontFamily: fontFamily.displayBlack, fontSize: 44, letterSpacing: -2.5, lineHeight: 44, color: colors.green },
  amountCurr: { fontFamily: fontFamily.bodyRegular, fontSize: 16, fontWeight: '400', color: 'rgba(26,240,96,0.4)' },

  quickRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginTop: spacing.xl, flexWrap: 'wrap' },
  chip: { height: 34, paddingHorizontal: spacing.xxl, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: colors.greenA10, borderColor: colors.greenA30 },
  chipText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.white },
  chipTextOn: { color: colors.green },

  securePill: { marginTop: spacing.xxl, backgroundColor: colors.greenA08, borderWidth: 1, borderColor: colors.greenA20, borderRadius: radius.round, paddingHorizontal: spacing.xl, paddingVertical: spacing.xs },
  securePillText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: 'rgba(26,240,96,0.8)' },

  csBody: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
  csRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.whiteA06 },
  csrL: { fontSize: 11, color: colors.whiteA35 },
  csrR: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },

  // Success step
  successRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl + 14 },
  ssRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.greenA08, borderWidth: 3, borderColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xxxl, shadowColor: colors.green, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.2, shadowRadius: 50, elevation: 8 },
  ssTitle: { fontFamily: fontFamily.displayBlack, fontSize: 24, letterSpacing: -0.8, color: colors.white, marginBottom: spacing.md, textAlign: 'center' },
  ssSub: { fontSize: 12, color: colors.whiteA40, marginBottom: spacing.giant + 2, lineHeight: 20.4, textAlign: 'center' },
  ssReceipt: { width: '100%', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA10, borderRadius: radius.xxl, padding: spacing.xxl, gap: spacing.md, marginBottom: spacing.giant },
  ssrRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ssrL: { fontSize: 11, color: colors.whiteA30 },
  ssrR: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  merchantNotifNote: { width: '100%', backgroundColor: colors.orangeA08, borderWidth: 1, borderColor: colors.orangeA20, borderRadius: radius.md, paddingHorizontal: spacing.xl, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.xxxl },
  merchantNotifText: { fontSize: 11, color: colors.whiteA55, flex: 1 },
});

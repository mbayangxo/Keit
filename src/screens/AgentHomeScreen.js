import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import GlowButton from '../components/GlowButton';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import ReceiptCard from '../components/ReceiptCard';
import { useToast } from '../components/Toast';
import { agentConfirmDeposit, agentScanDeposit, agentScanWithdraw, agentConfirmWithdraw, getAgentMe, getAgentPayouts } from '../lib/api-client';
import { parseK21Qr } from '../lib/k21-qr';
import KoriAmount from '../components/KoriAmount';
import { colors, fontFamily, radius, spacing, type } from '../theme';

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

export default function AgentHomeScreen({ navigation, route }) {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [agentData, setAgentData] = useState(null);
  const [qrInput, setQrInput] = useState('');
  const [operation, setOperation] = useState('deposit');
  const [pending, setPending] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [payoutInfo, setPayoutInfo] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [me, payouts] = await Promise.all([getAgentMe(), getAgentPayouts().catch(() => null)]);
      setAgentData(me);
      setPayoutInfo(payouts);
    } catch (err) {
      showToast(err.message ?? 'Accès agent refusé');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, showToast]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const scanned = route.params?.scannedQr;
    if (scanned) {
      setQrInput(String(scanned));
      navigation.setParams?.({ scannedQr: undefined });
    }
  }, [route.params?.scannedQr, navigation]);

  const handleScan = async () => {
    const parsed = parseK21Qr(qrInput.trim());
    const depositToken = parsed?.kind === 'agent_deposit' ? parsed.token : null;
    const withdrawToken = parsed?.kind === 'agent_withdraw' ? parsed.token : null;
    const token = depositToken ?? withdrawToken ?? qrInput.trim();
    if (!token || token.length < 8) {
      showToast('Colle le QR agent-deposit ou agent-withdraw');
      return;
    }
    setConfirming(true);
    try {
      if (withdrawToken || operation === 'withdraw') {
        const { withdrawal } = await agentScanWithdraw({ token });
        setPending(withdrawal);
        setOperation('withdraw');
      } else {
        const { deposit } = await agentScanDeposit({ token });
        setPending(deposit);
        setOperation('deposit');
      }
    } catch (err) {
      showToast(err.message ?? 'QR invalide');
    } finally {
      setConfirming(false);
    }
  };

  const handleConfirm = async () => {
    if (!pending?.id) return;
    setConfirming(true);
    try {
      if (operation === 'withdraw') {
        const result = await agentConfirmWithdraw(pending.id);
        setLastReceipt({
          user: result.user ?? pending.user,
          amount: pending.amountXof,
          floatBalance: result.agent?.floatBalance,
          kind: 'withdraw',
        });
        showToast('Retrait confirmé — cash remis');
      } else {
        const result = await agentConfirmDeposit(pending.id);
        setLastReceipt({
          user: result.user ?? pending.user,
          amount: pending.amountXof,
          floatBalance: result.agent?.floatBalance,
          kind: 'deposit',
        });
        showToast('Dépôt confirmé — wallet crédité');
      }
      setPending(null);
      setQrInput('');
      await reload();
    } catch (err) {
      showToast(err.message ?? 'Confirmation impossible');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={styles.center}>
          <ActivityIndicator color={colors.greenDark} size="large" />
        </SafeAreaView>
      </View>
    );
  }

  const agent = agentData?.agent;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow="MODE AGENT"
            title={agent?.displayName ?? 'Point K21'}
            style={styles.header}
          />

          <View style={styles.floatCard}>
            <Text style={styles.floatLabel}>Float disponible</Text>
            <Text style={styles.floatValue}>{formatAmount(agent?.floatBalance ?? 0)} F</Text>
            <Text style={styles.floatMeta}>
              {agent?.agentCode} · limite {formatAmount(agent?.floatLimit ?? 0)} F
            </Text>
            {agent?.locationLabel ? <Text style={styles.floatMeta}>{agent.locationLabel}</Text> : null}
          </View>

          {payoutInfo?.currentMonthPreview ? (
            <View style={styles.payoutCard}>
              <Text style={styles.payoutTitle}>Prime mensuelle (estimation)</Text>
              <Text style={styles.payoutValue}>
                {formatAmount(payoutInfo.currentMonthPreview.totalPaidXof ?? 0)} F
              </Text>
              <Text style={styles.payoutMeta}>
                Volume ce mois · {formatAmount(payoutInfo.currentMonthPreview.totalVolumeXof ?? 0)} F
                {' · '}
                {payoutInfo.currentMonthPreview.depositCount ?? 0} dépôts
              </Text>
              <Text style={styles.payoutHint}>
                Forfait {formatAmount(payoutInfo.terms?.flatFeeXof ?? 25_000)} F si ≥{' '}
                {formatAmount(payoutInfo.terms?.minVolumeForFlatFee ?? 100_000)} F +{' '}
                {(payoutInfo.terms?.volumeBonusBps ?? 50) / 100}% du volume. Payé le 1er sur ton wallet.
              </Text>
            </View>
          ) : null}

          {lastReceipt ? (
            <ReceiptCard
              style={{ marginBottom: spacing.xl }}
              rows={[
                { key: 'u', label: 'Client', value: lastReceipt.user?.name || lastReceipt.user?.phone },
                { key: 'a', label: 'Montant', value: `${formatAmount(lastReceipt.amount)} F`, color: colors.greenDark },
                { key: 'f', label: 'Float restant', value: `${formatAmount(lastReceipt.floatBalance ?? 0)} F` },
              ]}
            />
          ) : null}

          <View style={styles.modeRow}>
            {[
              { key: 'deposit', label: 'Dépôt client' },
              { key: 'withdraw', label: 'Retrait client' },
            ].map((m) => (
              <PressScale
                key={m.key}
                scaleTo={0.95}
                onPress={() => { setOperation(m.key); setPending(null); }}
                style={[styles.modeChip, operation === m.key && styles.modeChipOn]}
              >
                <Text style={[styles.modeChipText, operation === m.key && styles.modeChipTextOn]}>{m.label}</Text>
              </PressScale>
            ))}
          </View>

          {pending ? (
            <View style={styles.pendingCard}>
              <Text style={styles.pendingTitle}>
                {operation === 'withdraw' ? 'Confirmer le retrait' : 'Confirmer le dépôt'}
              </Text>
              <Text style={styles.pendingRow}>Client · {pending.user?.name || pending.user?.phone}</Text>
              <Text style={styles.pendingRow}>Montant · {formatAmount(pending.amountXof)} F CFA</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: spacing.xs }}>
                <Text style={[styles.pendingRow, { marginBottom: 0 }]}>Kori · </Text>
                <KoriAmount value={Math.floor(pending.amountXof / 10)} textStyle={[styles.pendingRow, { marginBottom: 0 }]} />
              </View>
              {pending.user?.verified ? (
                <Text style={styles.verified}>✓ Identité vérifiée K21</Text>
              ) : (
                <Text style={styles.unverified}>Tier 1 — vérifie la pièce si gros montant</Text>
              )}
              <GlowButton
                label={confirming ? 'Confirmation…' : operation === 'withdraw' ? 'J’ai remis le cash — confirmer' : 'J’ai reçu le cash — confirmer'}
                onPress={handleConfirm}
                disabled={confirming}
                style={{ marginTop: spacing.lg }}
              />
              <PressScale onPress={() => setPending(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Annuler</Text>
              </PressScale>
            </View>
          ) : (
            <>
              <Text style={styles.scanLabel}>Scanner le QR du client</Text>
              <TextInput
                value={qrInput}
                onChangeText={setQrInput}
                placeholder="k21://agent-deposit/… ou agent-withdraw/…"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />
              <GlowButton
                label={confirming ? 'Lecture…' : 'Lire le QR'}
                onPress={handleScan}
                disabled={confirming || !qrInput.trim()}
              />
              <PressScale onPress={() => navigation.navigate('QrScan', { mode: 'agent' })} style={styles.scanLink}>
                <Text style={styles.scanLinkText}>📷 Ouvrir le scanner</Text>
              </PressScale>
            </>
          )}

          {agentData?.recentFloatEntries?.length ? (
            <View style={styles.history}>
              <Text style={styles.historyTitle}>Mouvements float</Text>
              {agentData.recentFloatEntries.slice(0, 8).map((e) => (
                <View key={e.id} style={styles.historyRow}>
                  <Text style={styles.historyType}>{e.type}</Text>
                  <Text style={[styles.historyAmt, e.amountXof < 0 && { color: colors.terracotta }]}>
                    {e.amountXof > 0 ? '+' : ''}
                    {formatAmount(e.amountXof)} F
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant },
  header: { marginTop: spacing.lg, marginBottom: spacing.xl },
  floatCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  floatLabel: { ...type.caption, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  floatValue: { fontFamily: fontFamily.display, fontSize: 32, color: colors.greenDark, marginTop: spacing.xs },
  floatMeta: { ...type.caption, color: colors.muted, marginTop: spacing.xs },
  payoutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  payoutTitle: { ...type.caption, color: colors.muted, textTransform: 'uppercase', letterSpacing: 1 },
  payoutValue: { fontFamily: fontFamily.display, fontSize: 26, color: colors.ink, marginTop: spacing.xs },
  payoutMeta: { ...type.caption, color: colors.muted, marginTop: spacing.sm },
  payoutHint: { ...type.caption, color: colors.muted, marginTop: spacing.sm, lineHeight: 18 },
  modeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  modeChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  modeChipOn: { borderColor: colors.green, backgroundColor: 'rgba(26,240,96,0.08)' },
  modeChipText: { ...type.caption, color: colors.muted, fontFamily: fontFamily.medium },
  modeChipTextOn: { color: colors.greenDark },
  scanLabel: { ...type.body, color: colors.ink, fontFamily: fontFamily.semibold, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    color: colors.ink,
    fontFamily: fontFamily.mono,
    fontSize: 13,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  scanLink: { alignItems: 'center', marginTop: spacing.lg },
  scanLinkText: { ...type.body, color: colors.greenDark, fontFamily: fontFamily.medium },
  pendingCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.green,
  },
  pendingTitle: { fontFamily: fontFamily.display, fontSize: 22, color: colors.ink, marginBottom: spacing.md },
  pendingRow: { ...type.body, color: colors.ink, marginBottom: spacing.xs },
  verified: { ...type.caption, color: colors.greenDark, marginTop: spacing.sm },
  unverified: { ...type.caption, color: colors.terracotta, marginTop: spacing.sm },
  cancelBtn: { alignItems: 'center', marginTop: spacing.md },
  cancelText: { ...type.body, color: colors.muted },
  history: { marginTop: spacing.xxl },
  historyTitle: { ...type.caption, color: colors.muted, marginBottom: spacing.md, textTransform: 'uppercase' },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  historyType: { ...type.caption, color: colors.ink },
  historyAmt: { ...type.caption, color: colors.greenDark, fontFamily: fontFamily.medium },
});

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import K21QrCode from '../components/K21QrCode';
import GlowButton from '../components/GlowButton';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import { useScreenshotBlock } from '../hooks/useScreenshotBlock';
import { useToast } from '../components/Toast';
import { createAgentWithdraw, getAgentWithdrawStatus } from '../lib/api-client';
import { formatKori } from '../lib/kori.js';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, spacing, type } from '../theme';

function formatAmount(n) {
  return Math.round(n).toLocaleString('fr-FR').replace(/ /g, ' ');
}

function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export default function AgentWithdrawQrScreen({ navigation, route }) {
  useScreenshotBlock(true);
  const showToast = useToast();
  const { refreshWallet } = useAppState();
  const amount = route.params?.amount ?? 5000;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remainingMs, setRemainingMs] = useState(0);
  const [confirmed, setConfirmed] = useState(false);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await createAgentWithdraw({ amount });
      setSession(data);
      setRemainingMs(new Date(data.expiresAt).getTime() - Date.now());
    } catch (err) {
      showToast(err.message ?? 'Impossible de créer le QR');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [amount, navigation, showToast]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!session?.expiresAt || confirmed) return undefined;
    const tick = setInterval(() => {
      const left = new Date(session.expiresAt).getTime() - Date.now();
      setRemainingMs(left);
      if (left <= 0) clearInterval(tick);
    }, 1000);
    return () => clearInterval(tick);
  }, [session?.expiresAt, confirmed]);

  useEffect(() => {
    if (!session?.reference || confirmed) return undefined;
    const poll = setInterval(async () => {
      try {
        const status = await getAgentWithdrawStatus(session.reference);
        if (status.status === 'confirmed') {
          setConfirmed(true);
          await refreshWallet();
          clearInterval(poll);
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [session?.reference, confirmed, refreshWallet]);

  if (loading) {
    return (
      <View style={styles.root}>
        <ScreenBackground />
        <SafeAreaView style={styles.center}>
          <ActivityIndicator size="large" color={colors.greenDark} />
          <Text style={styles.loadingText}>Préparation du QR…</Text>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow="RETRAIT AGENT"
            title={confirmed ? 'Retrait confirmé' : 'Montre ce QR à l’agent'}
            style={styles.header}
          />

          {session?.requiresBusinessAgent ? (
            <Text style={styles.businessHint}>
              Gros montant — va chez un agent business K21 (BAG-…).
            </Text>
          ) : null}

          {confirmed ? (
            <View style={styles.successBlock}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Cash reçu</Text>
              <Text style={styles.successSub}>
                −{formatAmount(amount)} F · {formatKori(Math.floor(amount / 10))}
              </Text>
              <GlowButton label="Terminer" onPress={() => navigation.popToTop()} style={{ marginTop: spacing.xxl }} />
            </View>
          ) : (
            <>
              <Text style={styles.amount}>{formatAmount(amount)} F CFA</Text>
              <Text style={styles.hint}>
                L’agent scanne, te remet le cash, puis confirme. Expire dans {formatCountdown(remainingMs)}.
              </Text>
              <View style={styles.qrWrap}>
                {session?.qrUrl ? <K21QrCode value={session.qrUrl} size={200} /> : null}
              </View>
              <Text style={styles.ref}>{session?.reference}</Text>
              {remainingMs <= 0 ? (
                <GlowButton label="Générer un nouveau QR" onPress={loadSession} style={{ marginTop: spacing.xl }} />
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  loadingText: { ...type.body, color: colors.appCanvas.textMuted, fontFamily: fontFamily.bodyMedium },
  scroll: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant },
  header: { marginTop: spacing.lg, marginBottom: spacing.xl },
  businessHint: {
    ...type.caption,
    color: colors.terracotta,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 18,
  },
  amount: { fontFamily: fontFamily.displayBlack, fontSize: 36, color: colors.ink, textAlign: 'center', marginBottom: spacing.md },
  hint: { ...type.body, color: colors.appCanvas.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: spacing.xl },
  qrWrap: { alignItems: 'center', marginBottom: spacing.lg },
  ref: { ...type.caption, color: colors.appCanvas.textMuted, textAlign: 'center' },
  successBlock: { alignItems: 'center', paddingTop: spacing.giant },
  successIcon: { fontSize: 48, color: colors.greenDark, marginBottom: spacing.lg },
  successTitle: { fontFamily: fontFamily.displayBlack, fontSize: 28, color: colors.ink },
  successSub: { ...type.body, color: colors.terracotta, marginTop: spacing.sm },
});

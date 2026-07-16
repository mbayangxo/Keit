import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import GlowButton from '../components/GlowButton';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import { useToast } from '../components/Toast';
import { parseK21Qr } from '../lib/k21-qr';
import { addFriend, lookupUser, getBusinesses, vouchForUser } from '../lib/api-client';
import { colors, fontFamily, radius, spacing } from '../theme';

export default function QrScanScreen({ navigation, route }) {
  const mode = route.params?.mode ?? 'pay';
  const showToast = useToast();
  const [raw, setRaw] = useState(route.params?.prefill ?? route.params?.prefilled ?? '');
  const [loading, setLoading] = useState(false);

  const title =
    mode === 'merchant'
      ? 'Scanner marchand'
      : mode === 'friend'
        ? 'Ajouter un ami'
        : mode === 'tontine_member'
          ? 'Scanner un membre'
          : 'Scanner pour envoyer';

  const handleSubmit = async () => {
    const parsed = parseK21Qr(raw);
    if (!parsed) {
      showToast('Code QR ou @handle invalide');
      return;
    }

    setLoading(true);
    try {
      if (parsed.kind === 'pay_merchant' || mode === 'merchant') {
        const businessId = parsed.businessId ?? parsed.handle;
        const list = await getBusinesses();
        const merchant = (Array.isArray(list) ? list : []).find((b) => b.id === businessId);
        navigation.replace('PayMerchant', {
          merchantId: businessId,
          merchantName: merchant?.name,
        });
        return;
      }

      if (mode === 'vouch') {
        const handle = parsed?.handle ?? raw.replace(/^@/, '').trim();
        const result = await vouchForUser(handle);
        showToast(
          result.newlyConfirmed
            ? `${result.target?.name ?? 'Membre'} confirmé 🛡️`
            : `${result.target?.name ?? 'Membre'} était déjà confirmé ✓`,
        );
        navigation.goBack();
        return;
      }

      if (parsed.kind === 'add_user' || mode === 'friend') {
        const result = await addFriend(parsed.handle);
        showToast(
          result.alreadyFriends
            ? 'Déjà dans tes amis ✓'
            : result.autoAccepted || result.accepted
              ? `${result.friend?.name ?? 'Nouvel ami'} ajouté ✓`
              : 'Demande envoyée ✓ — en attente de sa réponse',
        );
        navigation.goBack();
        return;
      }

      if (mode === 'tontine_member') {
        const handle = parsed?.handle ?? raw.replace(/^@/, '').trim();
        const profile = await lookupUser(handle);
        navigation.navigate('Tontine', { pickedMember: profile });
        return;
      }

      const profile = await lookupUser(parsed.handle);
      navigation.replace('SendMoney', {
        recipientHandle: profile.handle,
        prefilledAmount: route.params?.amount,
      });
    } catch (err) {
      showToast(err.message ?? 'Scan impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader onBack={() => navigation.goBack()} title={title} style={styles.header} />

          <View style={styles.scanFrame}>
            <Text style={styles.frameIcon}>📷</Text>
            <Text style={styles.frameHint}>
              Colle un lien k21://, un @handle, ou scanne le QR d'un ami ou marchand avec ton appareil photo — puis colle ici.
            </Text>
          </View>

          <Text style={styles.label}>Code ou @handle</Text>
          <TextInput
            style={styles.input}
            value={raw}
            onChangeText={setRaw}
            placeholder="k21://pay/@fatou ou @fatou"
            placeholderTextColor={'rgba(5,8,5,0.45)'}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <GlowButton label={loading ? 'Chargement…' : 'Continuer →'} onPress={handleSubmit} disabled={loading || raw.trim().length < 3} />

          {mode === 'pay' && (
            <PressScale scaleTo={0.97} onPress={() => navigation.navigate('QrScan', { mode: 'friend' })} style={styles.altLink}>
              <Text style={styles.altLinkText}>Ou ajouter comme ami →</Text>
            </PressScale>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.giant },
  header: { marginBottom: spacing.xl },
  scanFrame: {
    borderWidth: 2,
    borderColor: colors.greenA25,
    borderStyle: 'dashed',
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xxl,
    backgroundColor: colors.greenA08,
  },
  frameIcon: { fontSize: 40, marginBottom: spacing.md },
  frameHint: { fontSize: 12, color: 'rgba(5,8,5,0.5)', textAlign: 'center', lineHeight: 18 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, color: 'rgba(5,8,5,0.45)', textTransform: 'uppercase', marginBottom: spacing.sm },
  input: {
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1.5,
    borderColor: 'rgba(5,8,5,0.1)',
    paddingHorizontal: spacing.xl,
    color: colors.ink,
    fontSize: 14,
    marginBottom: spacing.xl,
  },
  altLink: { alignSelf: 'center', marginTop: spacing.lg },
  altLinkText: { fontSize: 12, color: colors.greenDark, fontFamily: fontFamily.bodyBold },
});

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import K21QrCode from '../components/K21QrCode';
import ProfileShareButtons from '../components/ProfileShareButtons';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import { useAppState } from '../state/AppState';
import {
  buildUserPayUrl,
  buildUserProfileUrl,
  buildWebFriendUrl,
  buildWebPayUrl,
  buildMerchantPayUrl,
} from '../lib/k21-qr';
import { colors, fontFamily, radius, spacing } from '../theme';

export default function MyQrScreen({ navigation }) {
  const { profile } = useAppState();
  const isBusiness = profile.accountType === 'business' || profile.business?.kebuId;
  const payUrl = profile.handle ? buildUserPayUrl(profile.handle) : null;
  const friendUrl = profile.handle ? buildUserProfileUrl(profile.handle) : null;
  const webFriend = profile.handle ? buildWebFriendUrl(profile.handle) : null;
  const webPay = profile.handle ? buildWebPayUrl(profile.handle) : null;
  const merchantUrl = profile.business?.id ? buildMerchantPayUrl(profile.business.id) : null;

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader onBack={() => navigation.goBack()} title="Mon QR K21" style={styles.header} />

          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.handle}>@{String(profile.handle ?? '').replace(/^@+/, '')}</Text>

          {profile.afriId ? (
            <View style={styles.idPill}>
              <Text style={styles.idPillText}>✦ AFRI · {profile.afriId}</Text>
            </View>
          ) : null}
          {profile.business?.kebuId ? (
            <View style={[styles.idPill, styles.kebuPill]}>
              <Text style={[styles.idPillText, { color: colors.terracotta }]}>🏪 KEBU · {profile.business.kebuId}</Text>
            </View>
          ) : null}

          <View style={styles.qrBlock}>
            <Text style={styles.qrLabel}>Ajoute-moi comme ami</Text>
            {friendUrl ? <K21QrCode value={friendUrl} size={180} /> : <Text style={styles.missing}>Complète ton profil pour activer ton QR</Text>}
            {webFriend ? <Text style={styles.qrUrl}>{webFriend}</Text> : null}
            {profile.handle ? (
              <ProfileShareButtons profile={profile} mode="friend" style={styles.shareRow} />
            ) : null}
          </View>

          <View style={styles.qrBlock}>
            <Text style={styles.qrLabel}>Scanner pour m'envoyer de l'argent</Text>
            {payUrl ? <K21QrCode value={payUrl} size={160} /> : null}
            {webPay ? <Text style={styles.qrUrl}>{webPay}</Text> : null}
            {profile.handle ? (
              <ProfileShareButtons profile={profile} mode="pay" style={styles.shareRow} />
            ) : null}
          </View>

          {isBusiness && merchantUrl ? (
            <View style={styles.qrBlock}>
              <Text style={styles.qrLabel}>QR marchand — paiement en boutique</Text>
              <K21QrCode value={merchantUrl} size={160} />
              <Text style={styles.qrUrl}>{merchantUrl}</Text>
            </View>
          ) : null}

          <PressScale scaleTo={0.97} onPress={() => navigation.navigate('QrScan', { mode: 'friend' })} style={styles.scanBtn}>
            <Text style={styles.scanBtnText}>📷 Scanner le QR de quelqu'un</Text>
          </PressScale>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing.giant, alignItems: 'center' },
  header: { alignSelf: 'stretch', marginBottom: spacing.lg },
  name: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.ink, marginBottom: 4 },
  handle: { fontSize: 13, color: 'rgba(5,8,5,0.5)', marginBottom: spacing.md },
  idPill: {
    backgroundColor: colors.greenA08,
    borderWidth: 1,
    borderColor: colors.greenA20,
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  kebuPill: { backgroundColor: 'rgba(255,138,0,0.1)', borderColor: 'rgba(255,138,0,0.25)' },
  idPillText: { fontFamily: fontFamily.bodyBold, fontSize: 10, color: colors.greenDark },
  qrBlock: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.lg, gap: spacing.md, alignSelf: 'stretch' },
  qrLabel: { fontSize: 11, color: 'rgba(5,8,5,0.45)', textAlign: 'center' },
  qrUrl: { fontSize: 10, color: 'rgba(5,8,5,0.4)', textAlign: 'center' },
  shareRow: { paddingHorizontal: spacing.sm },
  missing: { fontSize: 12, color: 'rgba(5,8,5,0.5)' },
  scanBtn: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.greenA25,
    backgroundColor: colors.greenA08,
  },
  scanBtnText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.greenDark },
});

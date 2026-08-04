import { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import GlowButton from '../components/GlowButton';
import PressScale from '../components/PressScale';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import { useToast } from '../components/Toast';
import { getInviteShare } from '../lib/api-client';
import { shareViaWhatsApp } from '../lib/profile-share';
import { colors, fontFamily, radius, spacing, type } from '../theme';

export default function InviteFriendsScreen({ navigation }) {
  const showToast = useToast();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInviteShare();
      setShare(data);
    } catch (err) {
      showToast(err.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const openShare = async () => {
    if (!share?.message) return;
    try {
      await Share.share({ message: share.message, title: share.title ?? 'K21' });
    } catch {
      /* dismissed */
    }
  };

  const openWhatsApp = async () => {
    if (!share?.message) return;
    await shareViaWhatsApp(share.message);
  };

  const openSms = async () => {
    if (!share?.smsBody) return;
    const url = `sms:?body=${encodeURIComponent(share.smsBody)}`;
    const can = await Linking.canOpenURL(url);
    if (can) await Linking.openURL(url);
    else await Share.share({ message: share.smsBody });
  };

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <ScreenHeader
            onBack={() => navigation.goBack()}
            eyebrow="INVITER"
            title="Partage K21"
            subtitle="Aide tes proches à créer un compte"
          />

          {loading ? <ActivityIndicator color={colors.green} style={{ marginVertical: spacing.xl }} /> : null}

          {!loading && share?.ready === false ? (
            <Text style={styles.hint}>{share.message}</Text>
          ) : null}

          {!loading && share?.ready !== false ? (
            <>
              <View style={styles.preview}>
                <Text style={styles.previewText}>{share.message}</Text>
              </View>

              <GlowButton label="Partager…" onPress={openShare} />
              <PressScale scaleTo={0.97} onPress={openWhatsApp} style={styles.altBtn}>
                <Text style={styles.altBtnText}>WhatsApp</Text>
              </PressScale>
              <PressScale scaleTo={0.97} onPress={openSms} style={styles.altBtn}>
                <Text style={styles.altBtnText}>SMS / Messages</Text>
              </PressScale>

              {share.joinUrl ? (
                <Text style={styles.url} selectable>
                  {share.joinUrl}
                </Text>
              ) : null}
            </>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  scroll: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant, gap: spacing.md },
  hint: { ...type.body, color: colors.appCanvas.textMuted, lineHeight: 22 },
  preview: {
    backgroundColor: colors.appCanvas.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.appCanvas.border,
    marginBottom: spacing.lg,
  },
  previewText: { ...type.body, color: colors.ink, lineHeight: 22 },
  altBtn: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.appCanvas.border,
    backgroundColor: colors.appCanvas.surface,
  },
  altBtnText: { ...type.body, color: colors.greenDark, fontFamily: fontFamily.bodySemiBold },
  url: { ...type.caption, color: colors.appCanvas.textMuted, textAlign: 'center', marginTop: spacing.lg },
});

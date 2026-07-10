import { Platform, Share, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { buildFriendInviteMessage, buildPayInviteMessage, shareViaWhatsApp } from '../lib/profile-share';

export default function ProfileShareButtons({ profile, mode = 'friend', style }) {
  const message =
    mode === 'pay'
      ? buildPayInviteMessage(profile)
      : buildFriendInviteMessage(profile);

  const shareGeneric = async () => {
    try {
      await Share.share({ message, title: mode === 'pay' ? 'Me payer' : 'Mon K21' });
    } catch {
      /* dismissed */
    }
  };

  return (
    <View style={[styles.row, style]}>
      <PressScale scaleTo={0.96} onPress={() => shareViaWhatsApp(message)} style={styles.btnWa}>
        <Text style={styles.btnWaText}>WhatsApp</Text>
      </PressScale>
      <PressScale scaleTo={0.96} onPress={shareGeneric} style={styles.btnShare}>
        <Text style={styles.btnShareText}>{Platform.OS === 'web' ? 'Copier / partager' : 'Partager'}</Text>
      </PressScale>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  btnWa: {
    flex: 1,
    backgroundColor: 'rgba(37,211,102,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.35)',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  btnWaText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: '#25d366' },
  btnShare: {
    flex: 1,
    backgroundColor: colors.greenA10,
    borderWidth: 1,
    borderColor: colors.greenA25,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  btnShareText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.green },
});

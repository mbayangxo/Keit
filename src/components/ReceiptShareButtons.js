import { Linking, Platform, Share, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { formatReceiptText, whatsAppShareUrl } from '../lib/receipt-share';
import { usePreferences } from '../context/PreferencesContext';
import { scaleFont } from '../lib/type-scale';

export default function ReceiptShareButtons({
  type = 'send',
  amount,
  counterparty,
  reference,
  note,
  onShareMbolo,
  style,
}) {
  const { largeText } = usePreferences();
  const text = formatReceiptText({ type, amount, counterparty, reference, note });

  const shareGeneric = async () => {
    try {
      await Share.share({ message: text, title: 'Reçu K21' });
    } catch {
      /* user dismissed */
    }
  };

  const shareWhatsApp = async () => {
    const url = whatsAppShareUrl(text);
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
    await shareGeneric();
  };

  const labelSize = scaleFont(11, largeText);

  return (
    <View style={[styles.row, style]}>
      <PressScale scaleTo={0.96} onPress={shareWhatsApp} style={styles.btn}>
        <Text style={[styles.btnText, { fontSize: labelSize }]}>WhatsApp</Text>
      </PressScale>
      <PressScale
        scaleTo={0.96}
        onPress={() => (onShareMbolo ? onShareMbolo(text) : shareGeneric())}
        style={[styles.btn, styles.btnMbolo]}
      >
        <Text style={[styles.btnText, styles.btnMboloText, { fontSize: labelSize }]}>Mboolo</Text>
      </PressScale>
      {Platform.OS !== 'web' && (
        <PressScale scaleTo={0.96} onPress={shareGeneric} style={styles.btnGhost}>
          <Text style={[styles.btnGhostText, { fontSize: labelSize }]}>Autre</Text>
        </PressScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch', marginBottom: spacing.xl },
  btn: {
    flex: 1,
    backgroundColor: 'rgba(37,211,102,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.35)',
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  btnText: { fontFamily: fontFamily.bodyBold, color: '#25d366' },
  btnMbolo: { backgroundColor: colors.terracottaA10, borderColor: colors.terracottaA25 },
  btnMboloText: { color: colors.terracotta },
  btnGhost: {
    paddingHorizontal: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.15)',
    justifyContent: 'center',
  },
  btnGhostText: { fontFamily: fontFamily.bodySemiBold, color: 'rgba(5,8,5,0.6)' },
});

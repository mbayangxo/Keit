import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, spacing } from '../theme';

export default function DeviceSecurityBanner({ risk }) {
  if (!risk?.warning) return null;
  return (
    <View style={styles.banner}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.text}>{risk.warning}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(232,25,44,0.12)',
    borderColor: 'rgba(232,25,44,0.25)',
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
  },
  icon: { fontSize: 16 },
  text: { flex: 1, fontFamily: fontFamily.body, fontSize: 12, color: colors.whiteA85 },
});

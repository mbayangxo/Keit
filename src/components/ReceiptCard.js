import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../theme';

// Shared label/value receipt block used on every success screen (Send,
// Pay Merchant, Cash) — was three near-identical implementations that
// only differed in row content, not structure.
// `rows`: [{ key, label, value, color?, small? }]
export default function ReceiptCard({ rows, style }) {
  return (
    <View style={[styles.card, style]}>
      {rows.map((r) => (
        <View key={r.key ?? r.label} style={styles.row}>
          <Text style={styles.label}>{r.label}</Text>
          <Text style={[styles.value, r.color && { color: r.color }, r.small && styles.valueSmall]}>{r.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA10, borderRadius: radius.xxl, padding: spacing.xxl, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: colors.whiteA30 },
  value: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.white },
  valueSmall: { fontSize: 9, color: colors.whiteA30 },
});

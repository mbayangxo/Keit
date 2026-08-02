import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, spacing } from '../theme';
import { usePreferences } from '../context/PreferencesContext';
import { scaleFont } from '../lib/type-scale';
import KoriAmount from './KoriAmount';

// Shared label/value receipt block used on every success screen (Send,
// Pay Merchant, Cash) — was three near-identical implementations that
// only differed in row content, not structure.
// `rows`: [{ key, label, value, color?, small?, kori? }] — pass `kori` (a
// number) instead of `value` to render the Cauris shell glyph.
export default function ReceiptCard({ rows, style }) {
  const { largeText } = usePreferences();
  const labelSize = scaleFont(11, largeText);
  const valueSize = scaleFont(12, largeText);
  const valueSmallSize = scaleFont(9, largeText);

  return (
    <View style={[styles.card, style]}>
      {rows.map((r) => (
        <View key={r.key ?? r.label} style={styles.row}>
          <Text style={[styles.label, { fontSize: labelSize }]}>{r.label}</Text>
          {r.kori != null ? (
            <KoriAmount
              value={r.kori}
              color={r.color ?? colors.ink}
              textStyle={[
                styles.value,
                { fontSize: r.small ? valueSmallSize : valueSize },
                r.color && { color: r.color },
                r.small && styles.valueSmall,
              ]}
            />
          ) : (
            <Text
              style={[
                styles.value,
                { fontSize: r.small ? valueSmallSize : valueSize },
                r.color && { color: r.color },
                r.small && styles.valueSmall,
              ]}
            >
              {r.value}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1, borderColor: 'rgba(5,8,5,0.1)', borderRadius: radius.xxl, padding: spacing.xxl, gap: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 11, color: 'rgba(5,8,5,0.5)' },
  value: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.ink },
  valueSmall: { fontSize: 9, color: 'rgba(5,8,5,0.5)' },
});

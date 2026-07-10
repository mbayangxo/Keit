import { StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';

// Shared quick-amount chip row used on Send, Pay Merchant, Cash In/Out,
// Receive, and Tontine's create step — same shape everywhere, only the
// accent color (green vs gold) and label format differed per screen.
// `options`: either plain numbers (rendered as "5k") or { value, label }.
export default function AmountChips({
  options,
  value,
  onChange,
  accentBg = colors.greenA10,
  accentBorder = colors.greenA30,
  accentText = colors.greenDark,
  style,
}) {
  return (
    <View style={[styles.row, style]}>
      {options.map((opt) => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        const label = typeof opt === 'object' ? opt.label : `${opt / 1000}k`;
        const active = value === optValue;
        return (
          <PressScale
            key={label}
            scaleTo={0.92}
            onPress={() => onChange(optValue)}
            style={[styles.chip, active && { backgroundColor: accentBg, borderColor: accentBorder }]}
          >
            <Text style={[styles.chipText, active && { color: accentText }]}>{label}</Text>
          </PressScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  chip: { height: 34, paddingHorizontal: spacing.xxl, borderRadius: radius.round, backgroundColor: 'rgba(255,255,255,0.72)', borderWidth: 1.5, borderColor: 'rgba(5,8,5,0.1)', alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: colors.ink },
});

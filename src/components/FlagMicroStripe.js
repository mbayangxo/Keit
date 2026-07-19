import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

/** Brief §04 — green / gold / terracotta micro-stripe divider. */
export default function FlagMicroStripe({ width = 56, style }) {
  return (
    <View style={[styles.row, { width }, style]}>
      <View style={[styles.seg, { backgroundColor: colors.greenDark }]} />
      <View style={[styles.seg, { backgroundColor: colors.flagGold }]} />
      <View style={[styles.seg, { backgroundColor: colors.terracotta }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', height: 3, borderRadius: 2, overflow: 'hidden' },
  seg: { flex: 1 },
});

import { StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily } from '../theme';

/**
 * Cauris currency mark — uppercase C with a horizontal bar through the center.
 * Use wherever a plain "C" would look wrong (balances, amount heroes).
 */
export default function CaurisGlyph({ size = 18, color = colors.ink, weight = 'displayBlack', style }) {
  const font =
    weight === 'bodyBold'
      ? fontFamily.bodyBold
      : weight === 'displayBlack'
        ? fontFamily.displayBlack
        : fontFamily.bodySemiBold;
  const barHeight = Math.max(1.5, Math.round(size * 0.09));
  const width = Math.round(size * 0.62);

  return (
    <View style={[styles.wrap, { width, height: size }, style]} accessibilityLabel="Cauris">
      <Text style={[styles.letter, { fontSize: size, lineHeight: size, color, fontFamily: font }]}>C</Text>
      <View
        style={[
          styles.bar,
          {
            width: width * 0.92,
            height: barHeight,
            backgroundColor: color,
            top: size / 2 - barHeight / 2,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  letter: { includeFontPadding: false, textAlignVertical: 'center' },
  bar: { position: 'absolute', left: '4%', borderRadius: 1 },
});

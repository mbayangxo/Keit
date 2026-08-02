import { View, Text } from 'react-native';
import CaurisSymbol from './CaurisSymbol';
import { colors } from '../theme';

/**
 * Renders a Kori/Cauris amount as [shell glyph] + number — React Native
 * can't reliably inline an SVG inside a Text run, so this lays the two out
 * as a tight row instead of relying on formatKori()'s plain "C 1 234" string.
 */
export default function KoriAmount({ value, prefix = '', textStyle, color, size, gap = 4, style }) {
  const n = Number(value) || 0;
  const formatted = n.toLocaleString('fr-FR').replace(/\s/g, ' ');
  const flatStyle = Array.isArray(textStyle) ? Object.assign({}, ...textStyle) : textStyle;
  const fontSize = flatStyle?.fontSize ?? 16;
  const iconSize = size ?? fontSize * 0.86;
  const iconColor = color ?? flatStyle?.color ?? colors.ink;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>
      <CaurisSymbol size={iconSize} color={iconColor} />
      <Text style={textStyle}>{prefix}{formatted}</Text>
    </View>
  );
}

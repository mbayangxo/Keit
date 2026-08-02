import Svg, { Ellipse, Line } from 'react-native-svg';
import { colors } from '../theme';

/**
 * K21's real currency mark: a cowrie shell (cauris), not the plain letter
 * "C". A cauris is, by nature, an oval shell with a toothed slit down its
 * center — so the glyph is a line running through the middle of a shell
 * outline, exactly like the real object it's named after.
 */
export default function CaurisSymbol({ size = 16, color = colors.ink, strokeWidth }) {
  const sw = strokeWidth ?? Math.max(1.2, size * 0.085);
  const teeth = [-7, -4.1, -1.35, 1.35, 4.1, 7];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Ellipse cx="12" cy="12" rx="8.4" ry="10.4" stroke={color} strokeWidth={sw * 1.25} fill="none" />
      <Line x1="12" y1="2.8" x2="12" y2="21.2" stroke={color} strokeWidth={sw} strokeLinecap="round" />
      {teeth.map((dy) => (
        <Line
          key={dy}
          x1={12 - 2.6} y1={12 + dy} x2={12 + 2.6} y2={12 + dy}
          stroke={color} strokeWidth={sw} strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

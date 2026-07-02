import { Animated, StyleSheet, Text } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius } from '../theme';
import { useGlowPulse } from '../hooks/animations';

// The `.btn-g` primary CTA used everywhere in the prototypes: full-width
// green button, Unbounded 900 label, pulsing glow shadow (box-shadow
// 0 4px 20px rgba(26,240,96,.3) <-> 0 4px 32px rgba(26,240,96,.55), 2.5s infinite).
export default function GlowButton({ label, onPress, style, disabled = false }) {
  const glow = useGlowPulse(2500, 0.25);
  return (
    <PressScale
      scaleTo={0.96}
      onPress={disabled ? undefined : onPress}
      style={[styles.btn, disabled && styles.btnDisabled, style, { shadowOpacity: Animated.add(0.3, glow) }]}
    >
      <Text style={styles.label}>{label}</Text>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fontFamily.displayBlack,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.ink,
  },
});

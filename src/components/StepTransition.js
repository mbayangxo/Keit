import { Animated } from 'react-native';
import { useEntrance } from '../hooks/animations';

// Wraps each step of a multi-step flow (amount -> confirm -> success, etc.)
// so switching steps crossfades + slides in instead of hard-cutting — the
// step components already unmount/remount on switch, this just animates
// the mount.
export default function StepTransition({ children, style, distance = 16 }) {
  const entrance = useEntrance(0, 280, distance);
  return <Animated.View style={[{ flex: 1 }, entrance, style]}>{children}</Animated.View>;
}

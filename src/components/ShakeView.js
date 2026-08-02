import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

/** Wraps children and shakes horizontally when `trigger` increments. */
export default function ShakeView({ children, trigger = 0, style, intensity = 10 }) {
  const val = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!trigger) return;
    val.setValue(0);
    Animated.sequence([
      Animated.timing(val, { toValue: intensity, duration: 45, useNativeDriver: true }),
      Animated.timing(val, { toValue: -intensity, duration: 45, useNativeDriver: true }),
      Animated.timing(val, { toValue: intensity * 0.6, duration: 45, useNativeDriver: true }),
      Animated.timing(val, { toValue: -intensity * 0.6, duration: 45, useNativeDriver: true }),
      Animated.timing(val, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }, [trigger, val, intensity]);

  return (
    <Animated.View style={[style, { transform: [{ translateX: val }] }]}>
      {children}
    </Animated.View>
  );
}

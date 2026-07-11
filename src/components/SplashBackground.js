import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, Polygon } from 'react-native-svg';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// design/k21-logo-alive.html's `.bg-canvas` — warm Dakar-afternoon radial
// warmth, wax-print diamonds, and a breathing center glow behind the mark.
export default function SplashBackground() {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const glowOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <RadialGradient id="warm1" cx="20%" cy="15%" r="50%">
          <Stop offset="0%" stopColor="#c4500a" stopOpacity={1} />
          <Stop offset="100%" stopColor="#c4500a" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="warm2" cx="80%" cy="80%" r="55%">
          <Stop offset="0%" stopColor="#8b2200" stopOpacity={1} />
          <Stop offset="100%" stopColor="#8b2200" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="warm3" cx="60%" cy="20%" r="40%">
          <Stop offset="0%" stopColor="#e8820a" stopOpacity={1} />
          <Stop offset="100%" stopColor="#e8820a" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="warm4" cx="30%" cy="75%" r="45%">
          <Stop offset="0%" stopColor="#1a5c10" stopOpacity={1} />
          <Stop offset="100%" stopColor="#1a5c10" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <Stop offset="30%" stopColor="#0a0804" stopOpacity={0} />
          <Stop offset="100%" stopColor="#06050a" stopOpacity={0.85} />
        </RadialGradient>
        <RadialGradient id="centerGlow" cx="50%" cy="50%" r="35%">
          <Stop offset="0%" stopColor="#0a0a05" stopOpacity={0.85} />
          <Stop offset="100%" stopColor="#0a0a05" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Rect width="100" height="100" fill="#6b2800" />
      <Rect width="100" height="100" fill="url(#warm1)" />
      <Rect width="100" height="100" fill="url(#warm2)" />
      <Rect width="100" height="100" fill="url(#warm3)" />
      <Rect width="100" height="100" fill="url(#warm4)" />

      {/* Wax print diamonds */}
      <Polygon points="8,4 15,10 8,16 1,10" fill="#fad836" opacity={0.09} />
      <Polygon points="25,2 32,8 25,14 18,8" fill="#e85c1a" opacity={0.09} />
      <Polygon points="42,5 49,11 42,17 35,11" fill="#1af060" opacity={0.09} />
      <Polygon points="70,3 77,9 70,15 63,9" fill="#fad836" opacity={0.09} />
      <Polygon points="88,6 95,12 88,18 81,12" fill="#e85c1a" opacity={0.09} />
      <Polygon points="12,36 19,42 12,48 5,42" fill="#e85c1a" opacity={0.08} />
      <Polygon points="83,32 90,38 83,44 76,38" fill="#1af060" opacity={0.08} />
      <Polygon points="50,26 57,32 50,38 43,32" fill="#fad836" opacity={0.08} />
      <Polygon points="6,80 13,86 6,92 -1,86" fill="#1af060" opacity={0.08} />
      <Polygon points="29,84 36,90 29,96 22,90" fill="#e85c1a" opacity={0.08} />
      <Polygon points="67,82 74,88 67,94 60,88" fill="#fad836" opacity={0.08} />
      <Polygon points="92,78 99,84 92,90 85,84" fill="#1af060" opacity={0.08} />

      <Rect width="100" height="100" fill="url(#vignette)" />
      <AnimatedRect width="100" height="100" fill="url(#centerGlow)" opacity={glowOpacity} />
    </Svg>
  );
}

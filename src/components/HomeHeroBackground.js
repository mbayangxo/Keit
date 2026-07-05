import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import { motion } from '../theme';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

// Home hero background — matches `.hh-bg` in k21remainingflows.html:
//   radial-gradient(ellipse at 25% 20%, rgba(26,240,96,.14) 0%, transparent 50%),
//   radial-gradient(ellipse at 75% 80%, rgba(250,216,54,.10) 0%, transparent 50%),
//   radial-gradient(ellipse at 50% 50%, rgba(232,25,44,.06) 0%, transparent 60%),
//   linear-gradient(160deg, #0d1f0f 0%, #050805 100%)
// `hh-breathe` (7s ease-in-out infinite, alternates 0%/100% <-> 50%) intensifies
// each bloom's opacity at the midpoint — reproduced by animating rect opacity.
export default function HomeHeroBackground() {
  const breathe = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: motion.breatheSlowest / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: motion.breatheSlowest / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breathe]);

  const greenOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const goldOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const redOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] });

  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="hhBase" x1="35%" y1="0%" x2="65%" y2="100%">
          <Stop offset="0%" stopColor="#0d1f0f" stopOpacity={1} />
          <Stop offset="100%" stopColor="#050805" stopOpacity={1} />
        </LinearGradient>
        <RadialGradient id="hhGreen" cx="25%" cy="20%" r="50%">
          <Stop offset="0%" stopColor="#1af060" stopOpacity={0.11} />
          <Stop offset="100%" stopColor="#1af060" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="hhGold" cx="80%" cy="30%" r="55%">
          <Stop offset="0%" stopColor="#fad836" stopOpacity={0.16} />
          <Stop offset="100%" stopColor="#fad836" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="hhRed" cx="50%" cy="85%" r="65%">
          <Stop offset="0%" stopColor="#e85c1a" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#e85c1a" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100" height="100" fill="url(#hhBase)" />
      <AnimatedRect width="100" height="100" fill="url(#hhGreen)" opacity={greenOpacity} />
      <AnimatedRect width="100" height="100" fill="url(#hhGold)" opacity={goldOpacity} />
      <AnimatedRect width="100" height="100" fill="url(#hhRed)" opacity={redOpacity} />
    </Svg>
  );
}

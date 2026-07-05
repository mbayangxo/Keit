import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import WaxPattern from './WaxPattern';
import { motion } from '../theme';

// The one K21 canvas — every screen sits on this same BRIGHT base so the
// whole app reads as one place: airy warm light with soft blooms of the
// brand palette (green, gold, terracotta) and the drifting wax texture.
// Never dark, never a single flat color.
export default function ScreenBackground({ wax = true }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sbBase" x1="30%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor="#f9fdf4" stopOpacity={1} />
            <Stop offset="100%" stopColor="#edf6e4" stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id="sbGreen" cx="20%" cy="15%" r="55%">
            <Stop offset="0%" stopColor="#1af060" stopOpacity={0.14} />
            <Stop offset="100%" stopColor="#1af060" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbGold" cx="85%" cy="25%" r="55%">
            <Stop offset="0%" stopColor="#fad836" stopOpacity={0.18} />
            <Stop offset="100%" stopColor="#fad836" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbTerra" cx="50%" cy="92%" r="60%">
            <Stop offset="0%" stopColor="#e85c1a" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#e85c1a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#sbBase)" />
        <Rect width="100" height="100" fill="url(#sbGreen)" />
        <Rect width="100" height="100" fill="url(#sbGold)" />
        <Rect width="100" height="100" fill="url(#sbTerra)" />
      </Svg>
      {wax && <WaxPattern color="rgba(5,8,5,0.03)" size={20} durationMs={motion.waxDrift} />}
    </View>
  );
}

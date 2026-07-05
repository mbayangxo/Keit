import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import WaxPattern from './WaxPattern';
import { motion } from '../theme';

// The one K21 canvas — every screen sits on this same base so the whole
// app reads as one place: near-black ink with the Dakar-dusk blooms
// (gold high, terracotta low, green soft) plus the drifting wax texture.
export default function ScreenBackground({ wax = true }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sbBase" x1="35%" y1="0%" x2="65%" y2="100%">
            <Stop offset="0%" stopColor="#0d1f0f" stopOpacity={1} />
            <Stop offset="100%" stopColor="#050805" stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id="sbGreen" cx="25%" cy="20%" r="50%">
            <Stop offset="0%" stopColor="#1af060" stopOpacity={0.1} />
            <Stop offset="100%" stopColor="#1af060" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbGold" cx="80%" cy="28%" r="55%">
            <Stop offset="0%" stopColor="#fad836" stopOpacity={0.13} />
            <Stop offset="100%" stopColor="#fad836" stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbTerra" cx="50%" cy="88%" r="65%">
            <Stop offset="0%" stopColor="#e85c1a" stopOpacity={0.11} />
            <Stop offset="100%" stopColor="#e85c1a" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#sbBase)" />
        <Rect width="100" height="100" fill="url(#sbGreen)" />
        <Rect width="100" height="100" fill="url(#sbGold)" />
        <Rect width="100" height="100" fill="url(#sbTerra)" />
      </Svg>
      {wax && <WaxPattern color="rgba(255,255,255,0.025)" size={20} durationMs={motion.waxDrift} />}
    </View>
  );
}

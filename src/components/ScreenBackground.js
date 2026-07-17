import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import WaxPattern from './WaxPattern';
import { colors, motion } from '../theme';

// One K21 canvas everywhere: bright green-tinted base with vivid green,
// gold, and orange blooms — black ink text, same vibe on every tab.
//
// `soft` = the splash/onboarding treatment: one continuous color with only
// faint sunrise light, no texture — first impressions stay calm and clean.
export default function ScreenBackground({ wax = true, soft = false }) {
  const c = colors.appCanvas;
  // Soft = sunnier but calmer: wider, warmer light on the same flat base.
  const glow = soft
    ? { green: 0.15, gold: 0.2, orange: 0.08 }
    : { green: 0.22, gold: 0.24, orange: 0.18 };
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sbBase" x1="30%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor={c.base} stopOpacity={1} />
            <Stop offset="100%" stopColor={soft ? c.base : c.baseDeep} stopOpacity={1} />
          </LinearGradient>
          <LinearGradient id="sbSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={colors.gold} stopOpacity={0.1} />
            <Stop offset="14%" stopColor={colors.gold} stopOpacity={0.04} />
            <Stop offset="30%" stopColor={colors.gold} stopOpacity={0} />
          </LinearGradient>
          <RadialGradient id="sbGreen" cx="18%" cy="12%" r={soft ? '72%' : '58%'}>
            <Stop offset="0%" stopColor={colors.green} stopOpacity={glow.green} />
            <Stop offset="100%" stopColor={colors.green} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbGold" cx="88%" cy="22%" r={soft ? '68%' : '58%'}>
            <Stop offset="0%" stopColor={colors.gold} stopOpacity={glow.gold} />
            <Stop offset="55%" stopColor={colors.gold} stopOpacity={soft ? glow.gold * 0.35 : glow.gold * 0.45} />
            <Stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbOrange" cx="52%" cy="95%" r="62%">
            <Stop offset="0%" stopColor={colors.orange} stopOpacity={glow.orange} />
            <Stop offset="100%" stopColor={colors.orange} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#sbBase)" />
        <Rect width="100" height="100" fill="url(#sbGreen)" />
        <Rect width="100" height="100" fill="url(#sbGold)" />
        {soft && <Rect width="100" height="100" fill="url(#sbSky)" />}
        <Rect width="100" height="100" fill="url(#sbOrange)" />
      </Svg>
      {wax && !soft && <WaxPattern color="rgba(5,8,5,0.035)" size={20} durationMs={motion.waxDrift} />}
    </View>
  );
}

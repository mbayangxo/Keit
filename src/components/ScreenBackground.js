import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop, LinearGradient } from 'react-native-svg';
import WaxPattern from './WaxPattern';
import { colors, motion } from '../theme';

// One K21 canvas everywhere: bright green-tinted base with vivid green,
// gold, and orange blooms — black ink text, same vibe on every tab.
export default function ScreenBackground({ wax = true }) {
  const c = colors.appCanvas;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="sbBase" x1="30%" y1="0%" x2="70%" y2="100%">
            <Stop offset="0%" stopColor={c.base} stopOpacity={1} />
            <Stop offset="100%" stopColor={c.baseDeep} stopOpacity={1} />
          </LinearGradient>
          <RadialGradient id="sbGreen" cx="18%" cy="12%" r="58%">
            <Stop offset="0%" stopColor={colors.green} stopOpacity={0.22} />
            <Stop offset="100%" stopColor={colors.green} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbGold" cx="88%" cy="22%" r="58%">
            <Stop offset="0%" stopColor={colors.gold} stopOpacity={0.24} />
            <Stop offset="100%" stopColor={colors.gold} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="sbOrange" cx="52%" cy="95%" r="62%">
            <Stop offset="0%" stopColor={colors.orange} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={colors.orange} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#sbBase)" />
        <Rect width="100" height="100" fill="url(#sbGreen)" />
        <Rect width="100" height="100" fill="url(#sbGold)" />
        <Rect width="100" height="100" fill="url(#sbOrange)" />
      </Svg>
      {wax && <WaxPattern color="rgba(5,8,5,0.035)" size={20} durationMs={motion.waxDrift} />}
    </View>
  );
}

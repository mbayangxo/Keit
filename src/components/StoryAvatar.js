import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSpinLoop } from '../hooks/animations';
import ProfileAvatar from './ProfileAvatar';
import { colors } from '../theme';

/**
 * K21's answer to the Instagram "story ring" — but it's OUR tricolor, not a
 * borrowed gradient, and it never claims something false (no fake "online"
 * dot). `ring` on means "this is a real person, right here" — the signature
 * frame used anywhere a friend/contact avatar appears (Home, Mboolo, Moi,
 * profiles). Off means a plain avatar (e.g. yourself, or a muted contact).
 */
export default function StoryAvatar({
  photoUrl,
  emoji,
  initial,
  size = 64,
  ring = true,
  spin = true,
  seen = false,
  style,
  avatarStyle,
  textStyle,
}) {
  const angle = useSpinLoop(9000);
  const strokeW = Math.max(2.5, size * 0.045);
  const r = size / 2 - strokeW;
  const c = 2 * Math.PI * r;
  const segLen = c / 3;
  const gap = size * 0.09;
  const inset = strokeW + size * 0.06;

  return (
    <View style={[{ width: size, height: size }, style]}>
      {ring ? (
        seen ? (
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
            <Circle
              cx={size / 2} cy={size / 2} r={r}
              stroke="rgba(5,8,5,0.18)" strokeWidth={strokeW} fill="none"
            />
          </Svg>
        ) : (
          <Svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={[StyleSheet.absoluteFill, spin ? { transform: [{ rotate: angle }] } : null]}
          >
            <Circle
              cx={size / 2} cy={size / 2} r={r}
              stroke={colors.green} strokeWidth={strokeW} fill="none" strokeLinecap="round"
              strokeDasharray={`${segLen - gap} ${gap}`}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <Circle
              cx={size / 2} cy={size / 2} r={r}
              stroke={colors.gold} strokeWidth={strokeW} fill="none" strokeLinecap="round"
              strokeDasharray={`${segLen - gap} ${gap}`}
              strokeDashoffset={-segLen}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
            <Circle
              cx={size / 2} cy={size / 2} r={r}
              stroke={colors.orange} strokeWidth={strokeW} fill="none" strokeLinecap="round"
              strokeDasharray={`${segLen - gap} ${gap}`}
              strokeDashoffset={-segLen * 2}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          </Svg>
        )
      ) : null}
      <View style={{ position: 'absolute', top: inset, left: inset }}>
        <ProfileAvatar
          photoUrl={photoUrl}
          emoji={emoji}
          initial={initial}
          size={size - inset * 2}
          style={[{ borderWidth: 0 }, avatarStyle]}
          textStyle={textStyle}
        />
      </View>
    </View>
  );
}

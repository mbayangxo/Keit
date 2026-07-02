import { useRef } from 'react';
import { Animated, Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Matches the `:active{transform:scale(x)}` press-feedback used on every
// tappable element across the prototypes (buttons, cards, avatars, pills),
// plus the brief's §03 "every meaningful moment has haptic feedback."
//
// A single animated Pressable (not a Pressable wrapping a separately-styled
// Animated.View) — otherwise layout-affecting styles like `position:
// absolute` on `style` would apply to an inner box while the outer
// Pressable (which actually participates in layout) stays unstyled.
export default function PressScale({ children, style, onPress, scaleTo = 0.9, haptic = 'light' }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.timing(scale, { toValue: scaleTo, duration: 100, useNativeDriver: true }).start();
    if (haptic && Platform.OS !== 'web') {
      const impactStyle =
        haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : haptic === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(impactStyle);
    }
  };
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  return (
    <AnimatedPressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} style={[style, { transform: [{ scale }] }]}>
      {children}
    </AnimatedPressable>
  );
}

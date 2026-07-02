import { useRef } from 'react';
import { Animated, Platform, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';

// Matches the `:active{transform:scale(x)}` press-feedback used on every
// tappable element across the prototypes (buttons, cards, avatars, pills),
// plus the brief's §03 "every meaningful moment has haptic feedback."
export default function PressScale({ children, style, onPress, scaleTo = 0.9, haptic = 'light' }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.timing(scale, { toValue: scaleTo, duration: 100, useNativeDriver: true }).start();
    if (haptic && Platform.OS !== 'web') {
      const style =
        haptic === 'medium'
          ? Haptics.ImpactFeedbackStyle.Medium
          : haptic === 'heavy'
            ? Haptics.ImpactFeedbackStyle.Heavy
            : Haptics.ImpactFeedbackStyle.Light;
      Haptics.impactAsync(style);
    }
  };
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

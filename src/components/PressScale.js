import { useRef } from 'react';
import { Animated, Pressable } from 'react-native';

// Matches the `:active{transform:scale(x)}` press-feedback used on every
// tappable element across the prototypes (buttons, cards, avatars, pills).
export default function PressScale({ children, style, onPress, scaleTo = 0.9 }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.timing(scale, { toValue: scaleTo, duration: 100, useNativeDriver: true }).start();
  const pressOut = () => Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

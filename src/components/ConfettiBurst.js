import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

const PALETTE = [colors.green, colors.greenDark, colors.gold, colors.goldDark, colors.orange];
const SHAPES = ['square', 'circle'];

function Piece({ piece }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: piece.duration,
      delay: piece.delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [progress, piece.duration, piece.delay]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.fall] });
  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [0, piece.drift] });
  const rotate = progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] });
  const opacity = progress.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] });

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          left: piece.left,
          top: piece.top,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          borderRadius: piece.shape === 'circle' ? piece.size / 2 : 2,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate }],
        },
      ]}
    />
  );
}

/**
 * A one-shot confetti burst — mount it, it plays once, done. Used to
 * celebrate a real event that just happened (money sent, money received),
 * never as ambient decoration.
 */
export default function ConfettiBurst({ count = 46 }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        key: i,
        left: `${Math.random() * 100}%`,
        top: -20 - Math.random() * 40,
        size: 6 + Math.random() * 7,
        color: PALETTE[i % PALETTE.length],
        shape: SHAPES[i % SHAPES.length],
        fall: 380 + Math.random() * 260,
        drift: (Math.random() - 0.5) * 140,
        spin: 180 + Math.random() * 540,
        duration: 1400 + Math.random() * 900,
        delay: Math.random() * 220,
      })),
    [count],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((p) => (
        <Piece key={p.key} piece={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute' },
});

import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

// Diagonal crosshatch texture used throughout the prototypes:
//   background-image: repeating-linear-gradient(45deg, color 0px, color 1px, transparent 1px, transparent Npx),
//                      repeating-linear-gradient(-45deg, ...same...);
//   background-size: NxN
// Reproduced as a tiled SVG "X" pattern, oversized and translated to drift
// exactly like the CSS `animation: wd Ns linear infinite` background-position tween.
export default function WaxPattern({ size = 18, color = 'rgba(255,255,255,0.025)', durationMs = 28000, animated = true }) {
  const drift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const loop = Animated.loop(
      Animated.timing(drift, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animated, drift, durationMs]);

  const translate = drift.interpolate({ inputRange: [0, 1], outputRange: [0, size * 2] });

  const cols = 30;
  const rows = 80;
  const w = cols * size;
  const h = rows * size;
  const lines = [];
  for (let i = 0; i < cols + rows; i++) {
    const x0 = i * size;
    lines.push(
      <Line key={`a${i}`} x1={x0} y1={0} x2={x0 - h} y2={h} stroke={color} strokeWidth={1} />,
      <Line key={`b${i}`} x1={x0} y1={0} x2={x0 + h} y2={h} stroke={color} strokeWidth={1} />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={{
          position: 'absolute',
          top: -size * 2,
          left: -size * 2,
          width: w,
          height: h,
          transform: [{ translateX: translate }, { translateY: translate }],
        }}
      >
        <Svg width={w} height={h}>
          {lines}
        </Svg>
      </Animated.View>
    </View>
  );
}

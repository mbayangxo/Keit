import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import SplashBackground from '../components/SplashBackground';
import K21Logo from '../components/K21Logo';
import { fontFamily } from '../theme';

const DOTS = [
  { size: 80, color: '#ff8c00', opacity: 0.18, top: '8%', left: '12%' },
  { size: 60, color: '#ffd700', opacity: 0.14, top: '15%', right: '15%' },
  { size: 100, color: '#1af060', opacity: 0.1, bottom: '10%', left: '8%' },
  { size: 70, color: '#ff6422', opacity: 0.16, bottom: '18%', right: '10%' },
];

// The animated brand moment shown once fonts are ready, before onboarding —
// design/k21-logo-alive.html's primary lockup: the K21 mark breathing over
// a warm "Dakar alive" background. Calls onFinish after its beat.
export default function SplashScreen({ onFinish }) {
  const entrance = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(entrance, { toValue: 1, duration: 700, easing: Easing.out(Easing.back(1.2)), useNativeDriver: true }),
      Animated.timing(tagline, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(700),
    ]).start(({ finished }) => {
      if (finished) onFinish?.();
    });
  }, [entrance, tagline, onFinish]);

  return (
    <View style={styles.root}>
      <SplashBackground />
      {DOTS.map((d, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            { width: d.size, height: d.size, borderRadius: d.size / 2, backgroundColor: d.color, opacity: d.opacity, top: d.top, bottom: d.bottom, left: d.left, right: d.right },
          ]}
        />
      ))}

      <Animated.View
        style={{
          opacity: entrance,
          transform: [{ scale: entrance.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        }}
      >
        <K21Logo size={140} />
      </Animated.View>
      <Animated.Text style={[styles.tagline, { opacity: tagline }]}>African Youth Wallet</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#050805' },
  dot: { position: 'absolute' },
  tagline: { marginTop: 18, fontFamily: fontFamily.bodySemiBold, fontSize: 12, letterSpacing: 2, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' },
});

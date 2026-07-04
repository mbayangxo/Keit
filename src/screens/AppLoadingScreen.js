import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import SplashBackground from '../components/SplashBackground';
import K21Logo from '../components/K21Logo';

// The actual first-paint loading state (shown while session/auth bootstraps)
// — the warm, alive dark mark from design/k21-logo-alive.html, not a bare
// spinner on a flat background.
export default function AppLoadingScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <View style={styles.root}>
      <SplashBackground />
      <Animated.View style={{ opacity: fade }}>
        <K21Logo size={140} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

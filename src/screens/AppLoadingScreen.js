import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import OnboardingShell from '../components/OnboardingShell';
import K21Logo from '../components/K21Logo';

export default function AppLoadingScreen() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fade]);

  return (
    <OnboardingShell edges={[]}>
      <View style={styles.center}>
        <Animated.View style={{ opacity: fade }}>
          <K21Logo size={140} />
        </Animated.View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

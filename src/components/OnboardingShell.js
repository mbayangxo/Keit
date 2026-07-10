import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import WaxPattern from '../components/WaxPattern';
import { colors } from '../theme';

/** Shared warm-orange background for signup / onboarding — no black screens. */
export default function OnboardingShell({ children, edges = ['top'] }) {
  const ob = colors.onboarding;
  return (
    <View style={styles.root}>
      <LinearGradient colors={[ob.bg, ob.bgDeep, ob.bg]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <WaxPattern color="rgba(232,92,26,0.05)" size={20} durationMs={32000} />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.onboarding.bg },
});

import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackground from './ScreenBackground';

/**
 * Shared canvas for splash-side screens (onboarding, signup, PIN, recovery):
 * one continuous bright color with faint sunrise light — no texture, no
 * pattern lines. Same base as the rest of the app, calmer treatment.
 */
export default function OnboardingShell({ children, edges = ['top'] }) {
  return (
    <View style={styles.root}>
      <ScreenBackground soft />
      <SafeAreaView style={{ flex: 1 }} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
});

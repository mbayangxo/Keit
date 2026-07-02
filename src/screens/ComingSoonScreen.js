import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';

// Placeholder for screens/tabs not yet built in this phase (or explicitly
// out of Phase 1 scope, e.g. Rect Sound, Défis, Ataya Rooms) — keeps every
// nav destination reachable instead of leaving a dead button.
export default function ComingSoonScreen({ route, navigation }) {
  const {
    title = 'Bientôt disponible',
    subtitle = 'Cet écran arrive dans une prochaine phase.',
    icon = '✦',
    showBack = true,
  } = route?.params ?? {};

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {showBack && (
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
        )}
        <View style={styles.content}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.huge, marginTop: spacing.xl },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.giant },
  icon: { fontSize: 40, marginBottom: spacing.xl, opacity: 0.6 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 18, color: colors.white, marginBottom: spacing.sm, textAlign: 'center' },
  subtitle: { fontSize: 12, color: colors.whiteA40, textAlign: 'center', lineHeight: 18 },
});

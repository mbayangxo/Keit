import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import { colors, fontFamily, radius, spacing, type } from '../theme';

// Destination for Home's "Plus" quick action — the grid of secondary money
// actions that don't fit in the four-button row. No prototype exists for
// this screen; designed to match the established system.
const ACTIONS = [
  { key: 'cash', icon: '🏧', title: 'Cash In / Out', subtitle: 'Déposer ou retirer chez un agent Julaya', route: 'Cash' },
  { key: 'tontine', icon: '🏦', title: 'Tontine Digitale', subtitle: 'Épargne collective automatique', route: 'Tontine' },
  { key: 'nulekk', icon: '🍖', title: 'Ñu Lekk', subtitle: 'Cagnotte de groupe pour manger ensemble', route: 'NuLekk' },
];

export default function MoreActionsScreen({ navigation }) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
          <Text style={styles.title}>Plus d'actions</Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: spacing.huge, gap: spacing.md }}>
          {ACTIONS.map((a) => (
            <PressScale key={a.key} scaleTo={0.98} onPress={() => navigation.navigate(a.route)} style={styles.row}>
              <View style={styles.rowIcon}>
                <Text style={{ fontSize: 22 }}>{a.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{a.title}</Text>
                <Text style={styles.rowSubtitle}>{a.subtitle}</Text>
              </View>
              <Text style={styles.rowArrow}>→</Text>
            </PressScale>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: colors.white },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA12, borderRadius: radius.xxl, padding: spacing.xxl },
  rowIcon: { width: 48, height: 48, borderRadius: radius.xl, backgroundColor: colors.greenA10, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.white },
  rowSubtitle: { ...type.bodySmall, color: colors.whiteA40, marginTop: 2 },
  rowArrow: { fontSize: 14, color: colors.whiteA30 },
});

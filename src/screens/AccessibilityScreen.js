import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import { usePreferences } from '../context/PreferencesContext';
import { colors, fontFamily, radius, spacing } from '../theme';
import { scaleFont } from '../lib/type-scale';

function SettingRow({ title, subtitle, value, onValueChange, largeText }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: spacing.xl }}>
        <Text style={[styles.title, { fontSize: scaleFont(14, largeText) }]}>{title}</Text>
        <Text style={[styles.sub, { fontSize: scaleFont(11, largeText) }]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: 'rgba(5,8,5,0.1)', true: colors.greenA30 }}
        thumbColor={value ? colors.green : 'rgba(5,8,5,0.5)'}
      />
    </View>
  );
}

export default function AccessibilityScreen({ navigation }) {
  const { lowDataMode, largeText, setLowDataMode, setLargeText } = usePreferences();

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.body}>
          <ScreenHeader onBack={() => navigation.goBack()} title="Accessibilité" />
          <Text style={[styles.intro, { fontSize: scaleFont(12, largeText) }]}>
            Pour les connexions lentes et les utilisateurs qui préfèrent un texte plus grand.
          </Text>

          <SettingRow
            title="Mode données réduites"
            subtitle="Moins d'animations, requêtes plus légères, meilleur sur 2G/3G instable"
            value={lowDataMode}
            onValueChange={setLowDataMode}
            largeText={largeText}
          />
          <SettingRow
            title="Grand texte"
            subtitle="Police plus grande partout dans l'app — idéal pour les aînés"
            value={largeText}
            onValueChange={setLargeText}
            largeText={largeText}
          />

          <View style={styles.note}>
            <Text style={[styles.noteText, { fontSize: scaleFont(11, largeText) }]}>
              La vérification K21 reste simple : téléphone + code SMS pour commencer. La CNI peut attendre pour les petits montants.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
  body: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant },
  intro: { color: 'rgba(5,8,5,0.5)', marginBottom: spacing.xxl, lineHeight: 20 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: { fontFamily: fontFamily.bodyBold, color: colors.ink },
  sub: { color: 'rgba(5,8,5,0.45)', marginTop: 4, lineHeight: 16 },
  note: {
    marginTop: spacing.xxl,
    padding: spacing.xl,
    backgroundColor: colors.greenA06,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.greenA15,
  },
  noteText: { color: 'rgba(5,8,5,0.6)', lineHeight: 18 },
});

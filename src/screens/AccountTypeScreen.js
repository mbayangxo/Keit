import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import WaxPattern from '../components/WaxPattern';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance } from '../hooks/animations';
import { useLocale } from '../context/LocaleContext';
import { t } from '../i18n/translations';

function OptionCard({ opt, delay, onPress }) {
  const entrance = useEntrance(delay, 350, 10);
  return (
    <PressScale scaleTo={0.98} onPress={onPress} style={entrance}>
      <View style={[styles.card, { backgroundColor: opt.accentBg, borderColor: opt.accentBorder }]}>
        <View style={[styles.iconWrap, { backgroundColor: opt.accentBg, borderColor: opt.accentBorder }]}>
          <Text style={{ fontSize: 26 }}>{opt.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{opt.title}</Text>
          <Text style={styles.cardSub}>{opt.sub}</Text>
          <View style={[styles.idPill, { borderColor: opt.accentBorder }]}>
            <Text style={[styles.idPillText, { color: opt.accent }]}>✦ {opt.idLabel}</Text>
          </View>
        </View>
        <Text style={[styles.arrow, { color: opt.accent }]}>→</Text>
      </View>
    </PressScale>
  );
}

export default function AccountTypeScreen({ onSelect }) {
  const { langCode } = useLocale();

  const options = [
    {
      key: 'personal',
      icon: '👤',
      title: t(langCode, 'accountPersonalTitle'),
      sub: t(langCode, 'accountPersonalSub'),
      idLabel: t(langCode, 'accountPersonalId'),
      accent: colors.green,
      accentBg: colors.greenA08,
      accentBorder: colors.greenA20,
    },
    {
      key: 'business',
      icon: '🏪',
      title: t(langCode, 'accountBusinessTitle'),
      sub: t(langCode, 'accountBusinessSub'),
      idLabel: t(langCode, 'accountBusinessId'),
      accent: colors.flagGold,
      accentBg: colors.goldA08,
      accentBorder: colors.goldA20,
    },
  ];

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(255,255,255,0.03)" size={18} animated={false} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>{t(langCode, 'accountEyebrow')}</Text>
            <Text style={styles.title}>{t(langCode, 'accountTitle')}</Text>
          </View>

          <View style={{ gap: spacing.lg }}>
            {options.map((opt, i) => (
              <OptionCard key={opt.key} opt={opt} delay={150 + i * 120} onPress={() => onSelect(opt.key)} />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.giant },
  header: { marginBottom: spacing.giant + 6 },
  eyebrow: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: colors.green, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 24, letterSpacing: -0.8, lineHeight: 30, color: colors.white },

  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, borderWidth: 1.5, borderRadius: radius.xxl, padding: spacing.xl },
  iconWrap: { width: 52, height: 52, borderRadius: radius.xl, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: colors.white, marginBottom: 3 },
  cardSub: { fontSize: 11, color: colors.whiteA40, lineHeight: 16 },
  idPill: { alignSelf: 'flex-start', marginTop: spacing.sm, borderWidth: 1, borderRadius: radius.round, paddingHorizontal: spacing.md, paddingVertical: 3 },
  idPillText: { fontFamily: fontFamily.bodyBold, fontSize: 9 },
  arrow: { fontSize: 16 },
});

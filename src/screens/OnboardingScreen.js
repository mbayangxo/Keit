import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import WaxPattern from '../components/WaxPattern';
import { colors, fontFamily, radius, spacing, type } from '../theme';
import { useEntrance } from '../hooks/animations';
import { COUNTRIES } from '../i18n/countries';
import { LANGUAGES } from '../i18n/languages';
import { t } from '../i18n/translations';
import { useLocale } from '../context/LocaleContext';

// No HTML prototype exists for onboarding — this screen is a new addition
// designed to match the established system exactly (dark #050805 shell,
// green accent, Unbounded display font, same card/row/button conventions
// as every other screen) rather than a pixel-fidelity conversion.

function Row({ leading, title, subtitle, selected, delay, onPress }) {
  const entrance = useEntrance(delay, 300, 8);
  return (
    <PressScale scaleTo={0.98} onPress={onPress}>
      <View style={[styles.row, selected && styles.rowSelected]}>
        <View style={styles.rowLeading}>
          <Text style={{ fontSize: 22 }}>{leading}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        {selected && (
          <View style={styles.checkDot}>
            <Text style={{ fontSize: 10, fontWeight: '900', color: colors.ink }}>✓</Text>
          </View>
        )}
      </View>
    </PressScale>
  );
}

function CountryStep({ lang, query, setQuery, selected, onSelect, onContinue }) {
  const filtered = useMemo(
    () => COUNTRIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [query]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{t(lang, 'countryLabel')}</Text>
        <Text style={styles.title}>{t(lang, 'countryTitle')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder={t(lang, 'countrySearchPlaceholder')}
          placeholderTextColor={colors.whiteA30}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
        {filtered.map((c, i) => (
          <Row
            key={c.code}
            leading={c.flag}
            title={c.name}
            selected={selected?.code === c.code}
            delay={i * 30}
            onPress={() => onSelect(c)}
          />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <GlowButton label={`${t(lang, 'continueLabel')} →`} onPress={onContinue} disabled={!selected} />
      </View>
    </View>
  );
}

function LanguageStep({ lang, country, query, setQuery, selected, onSelect, onBack, onFinish }) {
  const uiLang = selected?.code ?? lang;
  const suggested = (country?.languages ?? []).map((code) => LANGUAGES.find((l) => l.code === code)).filter(Boolean);
  const suggestedCodes = new Set(suggested.map((l) => l.code));
  const filtered = useMemo(
    () =>
      LANGUAGES.filter(
        (l) => !suggestedCodes.has(l.code) && (l.name.toLowerCase().includes(query.trim().toLowerCase()) || l.native.toLowerCase().includes(query.trim().toLowerCase()))
      ),
    [query, country]
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
          </PressScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t(lang, 'languageLabel')}</Text>
            <Text style={styles.title}>{t(lang, 'languageTitle')}</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{t(lang, 'languageSubtitle')}</Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false}>
        {suggested.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t(lang, 'suggestedLabel')}</Text>
            {suggested.map((l, i) => (
              <Row key={l.code} leading="🗣️" title={l.native} subtitle={l.name} selected={selected?.code === l.code} delay={i * 30} onPress={() => onSelect(l)} />
            ))}
          </>
        )}

        <Text style={[styles.sectionLabel, { marginTop: spacing.xxl }]}>{t(lang, 'allLanguagesLabel')}</Text>
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            placeholder={t(lang, 'searchLanguagePlaceholder')}
            placeholderTextColor={colors.whiteA30}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        {filtered.map((l, i) => (
          <Row key={l.code} leading="🗣️" title={l.native} subtitle={l.name} selected={selected?.code === l.code} delay={i * 20} onPress={() => onSelect(l)} />
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <GlowButton label={`${t(uiLang, 'continueLabel')} →`} onPress={onFinish} disabled={!selected} />
      </View>
    </View>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const { langCode, country: savedCountry, language: savedLanguage, setCountry, setLanguage } = useLocale();
  const [step, setStep] = useState('country');
  const [country, setCountryLocal] = useState(savedCountry);
  const [language, setLanguageLocal] = useState(savedLanguage);
  const [countryQuery, setCountryQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');

  const finish = async () => {
    if (country) await setCountry(country);
    if (language) await setLanguage(language);
    onComplete?.({ country, language });
  };

  return (
    <View style={styles.root}>
      <WaxPattern color="rgba(26,240,96,0.03)" size={18} animated={false} />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'country' ? (
          <CountryStep
            lang={langCode}
            query={countryQuery}
            setQuery={setCountryQuery}
            selected={country}
            onSelect={setCountryLocal}
            onContinue={() => setStep('language')}
          />
        ) : (
          <LanguageStep
            lang={langCode}
            country={country}
            query={languageQuery}
            setQuery={setLanguageQuery}
            selected={language}
            onSelect={setLanguageLocal}
            onBack={() => setStep('country')}
            onFinish={finish}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },

  header: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginBottom: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { ...type.eyebrow, color: colors.green, marginBottom: 4 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 22, color: colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.whiteA40, marginTop: spacing.xs },

  searchWrap: { paddingHorizontal: spacing.huge, marginBottom: spacing.lg },
  searchInput: { height: 44, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontFamily: fontFamily.bodyRegular, fontSize: 13, color: colors.white },

  sectionLabel: { ...type.eyebrow, color: colors.whiteA30, paddingHorizontal: spacing.huge, marginBottom: spacing.sm },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginHorizontal: spacing.huge, marginBottom: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06 },
  rowSelected: { backgroundColor: colors.greenA10, borderColor: colors.greenA30 },
  rowLeading: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.whiteA06 },
  rowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  rowSubtitle: { fontSize: 10, color: colors.whiteA30, marginTop: 1 },
  checkDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
});

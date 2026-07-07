import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import OnboardingShell from '../components/OnboardingShell';
import ExpandableSearch from '../components/ExpandableSearch';
import { fontFamily, radius, spacing, type } from '../theme';
import { ob } from '../theme/onboarding';
import { useEntrance } from '../hooks/animations';
import { COUNTRIES, getCountryDisplayName } from '../i18n/countries';
import { LANGUAGES } from '../i18n/languages';
import { t } from '../i18n/translations';
import { useLocale } from '../context/LocaleContext';

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
            <Text style={{ fontSize: 10, fontWeight: '900', color: ob.ink }}>✓</Text>
          </View>
        )}
      </View>
    </PressScale>
  );
}

function CountryStep({ lang, query, setQuery, selected, onSelect, onContinue, onBack }) {
  const [listOpen, setListOpen] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        getCountryDisplayName(c, lang).toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.nameEn ?? '').toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query, lang]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
            <Text style={{ fontSize: 14, color: ob.ink }}>←</Text>
          </PressScale>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t(lang, 'countryLabel')}</Text>
            <Text style={styles.title}>{t(lang, 'countryTitle')}</Text>
          </View>
          <ExpandableSearch
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setListOpen(true);
            }}
            placeholder={t(lang, 'countrySearchPlaceholder')}
          />
        </View>

        <PressScale scaleTo={0.98} onPress={() => setListOpen((o) => !o)} style={styles.selectedPill}>
          <Text style={{ fontSize: 20 }}>{selected?.flag ?? '🌍'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pillLabel}>{selected ? getCountryDisplayName(selected, lang) : t(lang, 'countryPickOne')}</Text>
            <Text style={styles.pillSub}>{selected?.dial ?? t(lang, 'countryTapList')}</Text>
          </View>
          <Text style={styles.pillChevron}>{listOpen ? '▴' : '▾'}</Text>
        </PressScale>
      </View>

      {listOpen ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {filtered.map((c, i) => (
            <Row
              key={c.code}
              leading={c.flag}
              title={getCountryDisplayName(c, lang)}
              subtitle={c.dial}
              selected={selected?.code === c.code}
              delay={Math.min(i * 20, 200)}
              onPress={() => {
                onSelect(c);
                setListOpen(false);
                setQuery('');
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <View style={styles.footer}>
        <GlowButton label={`${t(lang, 'continueLabel')} →`} onPress={onContinue} disabled={!selected} />
      </View>
    </View>
  );
}

function LanguageStep({ lang, query, setQuery, selected, onSelect, onContinue, showBack, onBack }) {
  const uiLang = selected?.code ?? lang;
  const [listOpen, setListOpen] = useState(true);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LANGUAGES;
    return LANGUAGES.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          {showBack ? (
            <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
              <Text style={{ fontSize: 14, color: ob.ink }}>←</Text>
            </PressScale>
          ) : (
            <View style={{ width: 36 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>{t(uiLang, 'languageLabel')}</Text>
            <Text style={styles.title}>{t(uiLang, 'languageTitle')}</Text>
          </View>
          <ExpandableSearch
            value={query}
            onChangeText={(v) => {
              setQuery(v);
              setListOpen(true);
            }}
            placeholder={t(uiLang, 'searchLanguagePlaceholder')}
          />
        </View>
        <Text style={styles.subtitle}>{t(uiLang, 'languageSubtitle')}</Text>

        <PressScale scaleTo={0.98} onPress={() => setListOpen((o) => !o)} style={styles.selectedPill}>
          <Text style={{ fontSize: 20 }}>🗣️</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.pillLabel}>{selected?.native ?? t(uiLang, 'languagePickOne')}</Text>
            <Text style={styles.pillSub}>{selected?.name ?? t(uiLang, 'languageTapList')}</Text>
          </View>
          <Text style={styles.pillChevron}>{listOpen ? '▴' : '▾'}</Text>
        </PressScale>
      </View>

      {listOpen ? (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.giant }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {filtered.map((l, i) => (
            <Row
              key={l.code}
              leading="🗣️"
              title={l.native}
              subtitle={l.name}
              selected={selected?.code === l.code}
              delay={Math.min(i * 15, 180)}
              onPress={() => {
                onSelect(l);
                setListOpen(false);
                setQuery('');
              }}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }} />
      )}

      <View style={styles.footer}>
        <GlowButton label={`${t(uiLang, 'continueLabel')} →`} onPress={onContinue} disabled={!selected} />
      </View>
    </View>
  );
}

export default function OnboardingScreen({ onComplete }) {
  const { langCode, country: savedCountry, language: savedLanguage, setCountry, setLanguage } = useLocale();
  const [step, setStep] = useState('language');
  const [country, setCountryLocal] = useState(savedCountry);
  const [language, setLanguageLocal] = useState(savedLanguage);
  const [countryQuery, setCountryQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');

  const activeLang = language?.code ?? langCode;

  const finish = async () => {
    if (country) await setCountry(country);
    if (language) await setLanguage(language);
    onComplete?.({ country, language });
  };

  const continueFromLanguage = async () => {
    if (language) await setLanguage(language);
    setStep('country');
  };

  return (
    <OnboardingShell>
      {step === 'language' ? (
        <LanguageStep
          lang={activeLang}
          query={languageQuery}
          setQuery={setLanguageQuery}
          selected={language}
          onSelect={setLanguageLocal}
          showBack={false}
          onContinue={continueFromLanguage}
        />
      ) : (
        <CountryStep
          lang={activeLang}
          query={countryQuery}
          setQuery={setCountryQuery}
          selected={country}
          onSelect={setCountryLocal}
          onBack={() => setStep('language')}
          onContinue={finish}
        />
      )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.lg },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: ob.orangeSoft, borderWidth: 1, borderColor: ob.orangeBorder, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  eyebrow: { ...type.eyebrow, color: ob.green, marginBottom: 4 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 22, color: ob.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: ob.muted, marginBottom: spacing.md },

  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: ob.surface,
    borderWidth: 1.5,
    borderColor: ob.border,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  pillLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: ob.ink },
  pillSub: { fontSize: 10, color: ob.muted, marginTop: 2 },
  pillChevron: { fontSize: 12, color: ob.muted },

  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, marginHorizontal: spacing.huge, marginBottom: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.lg, borderRadius: radius.lg, backgroundColor: ob.surface, borderWidth: 1, borderColor: ob.border },
  rowSelected: { backgroundColor: ob.greenSoft, borderColor: ob.greenBorder },
  rowLeading: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ob.orangeSoft },
  rowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: ob.ink },
  rowSubtitle: { fontSize: 10, color: ob.faint, marginTop: 1 },
  checkDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: ob.green, alignItems: 'center', justifyContent: 'center' },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
});

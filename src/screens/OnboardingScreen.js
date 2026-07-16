import { useEffect, useMemo, useState } from 'react';
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
import { getDefaultRegion, getRegionsForCountry } from '../i18n/regions';
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

function PickerSection({ eyebrow, selectedLabel, selectedSub, leading, open, onToggle, search, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <PressScale scaleTo={0.98} onPress={onToggle} style={[styles.selectedPill, open && styles.selectedPillOpen]}>
        <Text style={{ fontSize: 20 }}>{leading}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.pillLabel}>{selectedLabel}</Text>
          <Text style={styles.pillSub}>{selectedSub}</Text>
        </View>
        <Text style={styles.pillChevron}>{open ? '▴' : '▾'}</Text>
      </PressScale>
      {open && search ? <View style={styles.sectionSearch}>{search}</View> : null}
      {open ? <View style={styles.sectionList}>{children}</View> : null}
    </View>
  );
}

export default function OnboardingScreen({ onComplete, onBack }) {
  const { langCode, country: savedCountry, language: savedLanguage, region: savedRegion, setCountry, setLanguage, setRegion } = useLocale();
  const [country, setCountryLocal] = useState(savedCountry);
  const [language, setLanguageLocal] = useState(savedLanguage);
  const [region, setRegionLocal] = useState(savedRegion ?? getDefaultRegion(savedCountry?.code));
  const [openSection, setOpenSection] = useState('language');
  const [countryQuery, setCountryQuery] = useState('');
  const [languageQuery, setLanguageQuery] = useState('');
  const [regionQuery, setRegionQuery] = useState('');

  const activeLang = language?.code ?? langCode;

  useEffect(() => {
    if (!country?.code) return;
    const regions = getRegionsForCountry(country.code);
    setRegionLocal((prev) => regions.find((r) => r.key === prev?.key) ?? regions[0] ?? null);
  }, [country?.code]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        getCountryDisplayName(c, activeLang).toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.nameEn ?? '').toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [countryQuery, activeLang]);

  const filteredLanguages = useMemo(() => {
    const q = languageQuery.trim().toLowerCase();
    let list = LANGUAGES;
    if (country?.languages?.length) {
      const suggested = country.languages
        .map((code) => LANGUAGES.find((l) => l.code === code))
        .filter(Boolean);
      const rest = LANGUAGES.filter((l) => !country.languages.includes(l.code));
      list = [...suggested, ...rest];
    }
    if (!q) return list;
    return list.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.native.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q),
    );
  }, [languageQuery, country]);

  const regions = useMemo(() => getRegionsForCountry(country?.code), [country?.code]);

  const filteredRegions = useMemo(() => {
    const q = regionQuery.trim().toLowerCase();
    if (!q) return regions;
    return regions.filter((r) => r.name.toLowerCase().includes(q) || r.key.toLowerCase().includes(q));
  }, [regionQuery, regions]);

  const toggleSection = (section) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const finish = async () => {
    if (country) await setCountry(country);
    if (language) await setLanguage(language);
    if (region) await setRegion(region);
    onComplete?.({ country, language, region });
  };

  const canContinue = Boolean(country && language && region);

  return (
    <OnboardingShell>
      <View style={{ flex: 1 }}>
        <View style={styles.header}>
          {onBack ? (
            <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
              <Text style={{ fontSize: 15, color: ob.ink }}>←</Text>
            </PressScale>
          ) : null}
          <Text style={styles.eyebrow}>{t(activeLang, 'onboardingUnifiedEyebrow')}</Text>
          <Text style={styles.title}>{t(activeLang, 'onboardingUnifiedTitle')}</Text>
          <Text style={styles.subtitle}>{t(activeLang, 'onboardingUnifiedSubtitle')}</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <PickerSection
            eyebrow={t(activeLang, 'languageLabel')}
            selectedLabel={language?.native ?? t(activeLang, 'languagePickOne')}
            selectedSub={language?.name ?? t(activeLang, 'languageTapList')}
            leading="🗣️"
            open={openSection === 'language'}
            onToggle={() => toggleSection('language')}
            search={
              <ExpandableSearch
                value={languageQuery}
                onChangeText={setLanguageQuery}
                placeholder={t(activeLang, 'searchLanguagePlaceholder')}
              />
            }
          >
            {filteredLanguages.map((l, i) => (
              <Row
                key={l.code}
                leading="🗣️"
                title={l.native}
                subtitle={l.name}
                selected={language?.code === l.code}
                delay={Math.min(i * 12, 160)}
                onPress={() => {
                  setLanguageLocal(l);
                  setLanguageQuery('');
                  setOpenSection('country');
                }}
              />
            ))}
          </PickerSection>

          <PickerSection
            eyebrow={t(activeLang, 'countryLabel')}
            selectedLabel={country ? getCountryDisplayName(country, activeLang) : t(activeLang, 'countryPickOne')}
            selectedSub={country?.dial ?? t(activeLang, 'countryTapList')}
            leading={country?.flag ?? '🌍'}
            open={openSection === 'country'}
            onToggle={() => toggleSection('country')}
            search={
              <ExpandableSearch
                value={countryQuery}
                onChangeText={setCountryQuery}
                placeholder={t(activeLang, 'countrySearchPlaceholder')}
              />
            }
          >
            {filteredCountries.map((c, i) => (
              <Row
                key={c.code}
                leading={c.flag}
                title={getCountryDisplayName(c, activeLang)}
                subtitle={c.dial}
                selected={country?.code === c.code}
                delay={Math.min(i * 12, 160)}
                onPress={() => {
                  setCountryLocal(c);
                  setCountryQuery('');
                  const nextRegions = getRegionsForCountry(c.code);
                  setRegionLocal(nextRegions[0] ?? null);
                  setOpenSection('region');
                }}
              />
            ))}
          </PickerSection>

          <PickerSection
            eyebrow={t(activeLang, 'regionLabel')}
            selectedLabel={region?.name ?? t(activeLang, 'regionPickOne')}
            selectedSub={country ? getCountryDisplayName(country, activeLang) : t(activeLang, 'regionTapList')}
            leading={region?.icon ?? '📍'}
            open={openSection === 'region'}
            onToggle={() => toggleSection('region')}
            search={
              <ExpandableSearch
                value={regionQuery}
                onChangeText={setRegionQuery}
                placeholder={t(activeLang, 'regionSearchPlaceholder')}
              />
            }
          >
            {filteredRegions.map((r, i) => (
              <Row
                key={r.key}
                leading={r.icon ?? '📍'}
                title={r.name}
                subtitle={getCountryDisplayName(country, activeLang)}
                selected={region?.key === r.key}
                delay={Math.min(i * 12, 160)}
                onPress={() => {
                  setRegionLocal(r);
                  setRegionQuery('');
                  setOpenSection(null);
                }}
              />
            ))}
          </PickerSection>
        </ScrollView>

        <View style={styles.footer}>
          <GlowButton label={`${t(activeLang, 'continueLabel')} →`} onPress={finish} disabled={!canContinue} />
        </View>
      </View>
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.huge, paddingTop: spacing.xxl, paddingBottom: spacing.md },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  eyebrow: { ...type.eyebrow, color: ob.green, marginBottom: 4 },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 22, color: ob.ink, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: ob.muted, marginTop: spacing.sm, lineHeight: 17 },

  scrollContent: { paddingBottom: spacing.xxl },

  section: { marginBottom: spacing.lg },
  sectionEyebrow: { ...type.eyebrow, color: ob.green, marginBottom: spacing.sm, paddingHorizontal: spacing.huge },
  sectionSearch: { paddingHorizontal: spacing.huge, marginBottom: spacing.sm },
  sectionList: { paddingTop: spacing.xs },

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
    marginHorizontal: spacing.huge,
  },
  selectedPillOpen: { borderColor: ob.greenBorder, backgroundColor: ob.greenSoft },
  pillLabel: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: ob.ink },
  pillSub: { fontSize: 10, color: ob.muted, marginTop: 2 },
  pillChevron: { fontSize: 12, color: ob.muted },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xl,
    marginHorizontal: spacing.huge,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: ob.surface,
    borderWidth: 1,
    borderColor: ob.border,
  },
  rowSelected: { backgroundColor: ob.greenSoft, borderColor: ob.greenBorder },
  rowLeading: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ob.orangeSoft },
  rowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: ob.ink },
  rowSubtitle: { fontSize: 10, color: ob.faint, marginTop: 1 },
  checkDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: ob.green, alignItems: 'center', justifyContent: 'center' },

  footer: { paddingHorizontal: spacing.huge, paddingVertical: spacing.xxl },
});

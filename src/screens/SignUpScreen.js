import { useState } from 'react';
import { ActivityIndicator, Animated, Modal, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance } from '../hooks/animations';
import { useLocale } from '../context/LocaleContext';
import { authPhone, authVerify, authCompleteProfile, getMe } from '../lib/api-client';
import { saveSessionTokens } from '../lib/secure-storage';
import { toE164, isValidLocalPhone } from '../lib/phone';
import { t } from '../i18n/translations';
import { COUNTRIES, getCountryDisplayName } from '../i18n/countries';

// Backend-driven signup: phone → OTP (API) → profile → intent → arrondissement → fund (optional).
// CNI deferred to KYC flow (POST /api/kyc/cni/submit).
const ARRONDISSEMENTS = [
  { key: 'medina', icon: '🏘️', name: 'Médina', count: '4 821 K21' },
  { key: 'plateau', icon: '🏙️', name: 'Plateau', count: '3 204 K21' },
  { key: 'parcelles', icon: '🌆', name: 'Parcelles Assainies', count: '5 112 K21' },
  { key: 'hlm', icon: '🌇', name: 'HLM', count: '2 987 K21' },
  { key: 'ouakam', icon: '🌃', name: 'Ouakam', count: '2 341 K21' },
];
const FUND_METHOD = { key: 'mobile_money', icon: '💳', bg: colors.greenA08, name: 'Mobile Money', sub: 'Transfert depuis ton opérateur mobile', badge: 'SÉCURISÉ', badgeStyle: 'free' };
const FUND_AMOUNTS = [5000, 10000, 25000, 50000];
const INTENTS = [
  { key: 'send_money', icon: '💸', title: 'Envoyer de l\'argent', sub: 'Transfers et paiements' },
  { key: 'mbolo', icon: '🧑‍🤝‍🧑', title: 'Communauté', sub: 'Mboolo — groupes et collectes' },
  { key: 'discover', icon: '📍', title: 'Découvrir', sub: 'Événements et vie locale' },
  { key: 'business', icon: '🏪', title: 'Mon business', sub: 'Vendre et être payé' },
];
const STEP_ORDER = ['phone', 'otp', 'profile', 'intent', 'arrondissement', 'fund'];
const STEP_NUM = { phone: 1, otp: 2, profile: 3, intent: 4, arrondissement: 5 };

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

function phonePlaceholder(country) {
  if (country?.code === 'US') return '555 123 4567';
  if (country?.code === 'FR') return '6 12 34 56 78';
  if (country?.code === 'SN') return '77 000 00 00';
  return '000 000 000';
}

function StepHeader({ lang, title, step, onBack }) {
  return (
    <>
      <View style={styles.headRow}>
        <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
        </PressScale>
        <Text style={styles.headTitle}>{title}</Text>
      </View>
      <View style={styles.stepRow}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepTrack}>
            <View style={[styles.stepFill, s <= step && { width: '100%' }, s === step && step === 4 && { backgroundColor: colors.flagGold }]} />
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>{t(lang, 'signupStepLabel', { n: step, total: 4 })}</Text>
    </>
  );
}

function PhoneStep({ lang, country, phone, setPhone, loading, onNext, onBack, onCountryChange }) {
  const entrance = useEntrance(0, 350, 8);
  const [showCountries, setShowCountries] = useState(false);
  const valid = isValidLocalPhone(country, phone);

  const pickCountry = (c) => {
    onCountryChange?.(c);
    setShowCountries(false);
  };

  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader lang={lang} title={t(lang, 'signupCreateAccount')} step={STEP_NUM.phone} onBack={onBack} />
      <Text style={styles.headline}>
        {t(lang, 'signupPhoneHead')}{'\n'}
        <Text style={styles.g}>{t(lang, 'signupPhoneTitle')}</Text>
      </Text>
      <Text style={styles.sub}>{t(lang, 'signupPhoneSub')}</Text>

      <View style={styles.phoneRow}>
        <PressScale scaleTo={0.96} onPress={() => setShowCountries(true)} style={styles.countrySel} accessibilityLabel={t(lang, 'signupChangeCountry')}>
          <Text style={{ fontSize: 18 }}>{country?.flag ?? '🇸🇳'}</Text>
          <Text style={styles.countryCode}>{country?.dial ?? '+221'}</Text>
          <Text style={styles.countryChevron}>▾</Text>
        </PressScale>
        <TextInput
          style={[styles.phoneField, valid && styles.phoneFieldFilled]}
          placeholder={phonePlaceholder(country)}
          placeholderTextColor={colors.whiteA20}
          keyboardType="number-pad"
          value={phone}
          onChangeText={(v) => setPhone(v.replace(/[^0-9]/g, ''))}
          maxLength={country?.phoneMax ?? 12}
        />
      </View>
      <Text style={styles.fieldNote}>{t(lang, 'signupPhoneNote')}</Text>

      <View style={{ flex: 1 }} />
      <GlowButton label={loading ? t(lang, 'signupSending') : t(lang, 'signupSendCode')} onPress={onNext} disabled={!valid || loading} />
      {loading && <ActivityIndicator color={colors.green} style={{ marginTop: spacing.md }} />}

      <Modal visible={showCountries} animationType="slide" transparent onRequestClose={() => setShowCountries(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t(lang, 'signupSelectCountry')}</Text>
            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              {COUNTRIES.map((c) => (
                <PressScale key={c.code} scaleTo={0.98} onPress={() => pickCountry(c)} style={[styles.modalRow, country?.code === c.code && styles.modalRowOn]}>
                  <Text style={{ fontSize: 20 }}>{c.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalRowTitle}>{getCountryDisplayName(c, lang)}</Text>
                    <Text style={styles.modalRowSub}>{c.dial}</Text>
                  </View>
                  {country?.code === c.code ? <Text style={{ color: colors.green, fontWeight: '800' }}>✓</Text> : null}
                </PressScale>
              ))}
            </ScrollView>
            <PressScale scaleTo={0.96} onPress={() => setShowCountries(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>{t(lang, 'backLabel')}</Text>
            </PressScale>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

function OtpStep({ lang, displayPhone, otp, setOtp, loading, devHint, onResend, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  const boxes = [0, 1, 2, 3, 4, 5];
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader lang={lang} title={t(lang, 'signupVerification')} step={STEP_NUM.otp} onBack={onBack} />
      <Text style={styles.headline}>
        {t(lang, 'signupOtpHeadPrefix')}{'\n'}
        <Text style={styles.g}>{t(lang, 'signupOtpHead')}</Text>
      </Text>
      <Text style={styles.otpSentTo}>
        {t(lang, 'signupOtpSent')}{' '}
        <Text style={{ fontFamily: fontFamily.bodyBold, color: colors.whiteA70 }}>{displayPhone}</Text>
        {'\n'}{t(lang, 'signupOtpValid')}
      </Text>
      {devHint ? <Text style={styles.devOtpHint}>Code: {devHint}</Text> : null}

      {/* The real input is stretched invisibly over the boxes: tapping a box
          taps the input, so the keyboard opens from a genuine user gesture —
          mobile browsers block programmatic autofocus, which froze this step
          on phones (code visible, no way to type it). */}
      <View style={{ position: 'relative' }}>
        <View style={styles.otpRow}>
          {boxes.map((i) => (
            <View key={i} style={[styles.otpBox, otp.length > i && styles.otpBoxFilled, otp.length === i && styles.otpBoxActive]}>
              <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
            </View>
          ))}
        </View>
        <TextInput
          style={styles.otpTouchInput}
          value={otp}
          onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          caretHidden
        />
      </View>

      <PressScale scaleTo={0.95} onPress={onResend} style={{ alignSelf: 'center' }}>
        <Text style={styles.resendText}>
          {t(lang, 'signupResend')}{' '}
          <Text style={{ color: colors.green, fontFamily: fontFamily.bodyBold }}>{t(lang, 'signupResendAction')}</Text>
        </Text>
      </PressScale>

      <View style={styles.secNote}>
        <Text style={{ fontSize: 14 }}>🛡️</Text>
        <Text style={styles.secText}>
          <Text style={{ color: colors.whiteA70, fontFamily: fontFamily.bodyBold }}>Ne partage jamais ce code</Text> — même si quelqu'un dit travailler pour K21. On ne te demandera jamais ton code.
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton label={loading ? t(lang, 'signupVerifying') : t(lang, 'signupVerify')} onPress={onNext} disabled={otp.length < 6 || loading} />
      {loading && <ActivityIndicator color={colors.green} style={{ marginTop: spacing.md }} />}
    </Animated.View>
  );
}

function ProfileStep({ name, setName, handle, setHandle, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Mon profil" step={STEP_NUM.profile} onBack={onBack} />
      <Text style={styles.headline}>
        Crée ton{'\n'}
        <Text style={styles.g}>identité K21</Text>
      </Text>

      <View style={styles.avatarPick}>
        <View style={styles.avatarCircle}>
          <Text style={{ fontSize: 32 }}>👤</Text>
          <View style={styles.avatarAdd}>
            <Text style={{ fontSize: 12, fontWeight: '900', color: colors.ink }}>+</Text>
          </View>
        </View>
        <Text style={styles.avatarHint}>Ajouter une photo</Text>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.igLabel}>Prénom et nom</Text>
        <TextInput style={styles.igField} placeholder="Saliou Diallo" placeholderTextColor={colors.whiteA20} value={name} onChangeText={setName} />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.igLabel}>Ton handle</Text>
        <View style={{ position: 'relative' }}>
          <Text style={styles.handleAt}>@</Text>
          <TextInput
            style={[styles.igField, styles.handleField]}
            value={handle}
            onChangeText={(t) => setHandle(t.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
          />
          {handle.length > 2 && (
            <View style={styles.handleAvail}>
              <Text style={styles.handleAvailText}>✓ Dispo</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton label="Continuer →" onPress={onNext} disabled={!name.trim() || handle.length < 3} />
    </Animated.View>
  );
}

function IntentStep({ lang, intent, setIntent, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Ton objectif" step={STEP_NUM.intent} onBack={onBack} />
      <Text style={styles.headline}>
        {t(lang, 'signupIntentHeadPrefix')}{'\n'}
        <Text style={styles.g}>{t(lang, 'signupIntentHead')}</Text>
      </Text>
      <Text style={styles.sub}>{t(lang, 'signupIntentSub')}</Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          {INTENTS.map((opt) => (
            <PressScale key={opt.key} scaleTo={0.98} onPress={() => setIntent(opt.key)} style={[styles.cniOpt, intent === opt.key && styles.cniOptOn]}>
              <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.coTitle}>{opt.title}</Text>
                <Text style={styles.coSub}>{opt.sub}</Text>
              </View>
              {intent === opt.key && (
                <View style={styles.aiCheck}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.ink }}>✓</Text>
                </View>
              )}
            </PressScale>
          ))}
        </View>
      </ScrollView>

      <GlowButton label="Continuer →" onPress={onNext} disabled={!intent} />
    </Animated.View>
  );
}

function ArrondissementStep({ arrondissement, setArrondissement, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  const [query, setQuery] = useState('');
  const filtered = ARRONDISSEMENTS.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Animated.View style={[styles.body, entrance]}>
      <View style={styles.headRow}>
        <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
        </PressScale>
        <Text style={styles.headTitle}>Mon quartier</Text>
      </View>
      <Text style={[styles.headline, { fontSize: 18, marginBottom: spacing.sm }]}>
        Ton <Text style={styles.g}>arrondissement</Text>
      </Text>
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>Ton identité culturelle sur K21. Le classement de ton quartier dépend de toi.</Text>

      <View style={styles.arrSearch}>
        <Text style={{ fontSize: 14, opacity: 0.4 }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 13, color: colors.white }}
          placeholder="Chercher mon arrondissement..."
          placeholderTextColor={colors.whiteA25}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <Text style={styles.arrSectionLabel}>Populaires</Text>
        <View style={{ gap: spacing.sm }}>
          {filtered.map((a) => (
            <PressScale key={a.key} scaleTo={0.98} onPress={() => setArrondissement(a)} style={[styles.arrItem, arrondissement?.key === a.key && styles.arrItemOn]}>
              <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              <Text style={styles.aiName}>{a.name}</Text>
              <Text style={styles.aiCount}>{a.count}</Text>
              {arrondissement?.key === a.key && (
                <View style={styles.aiCheck}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.ink }}>✓</Text>
                </View>
              )}
            </PressScale>
          ))}
        </View>
      </ScrollView>

      <GlowButton label={arrondissement ? `${arrondissement.name} — C'est mon quartier ✓` : 'Choisis ton quartier'} onPress={onNext} disabled={!arrondissement} />
    </Animated.View>
  );
}

function FundStep({ lang, amount, setAmount, method, setMethod, loading, onNext, onSkip }) {
  const entrance = useEntrance(0, 350, 8);
  const m = FUND_METHOD;
  return (
    <Animated.View style={[styles.body, entrance]}>
      <View style={styles.headRow}>
        <View style={[styles.backBtn, { opacity: 0.3 }]}>
          <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
        </View>
        <Text style={styles.headTitle}>Alimenter mon compte</Text>
      </View>
      <Text style={[styles.headline, { fontSize: 18, marginBottom: spacing.sm }]}>
        Ajoute de <Text style={styles.g}>l'argent</Text>
      </Text>
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>{t(lang, 'signupFundSub')}</Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          <PressScale key={m.key} scaleTo={0.98} onPress={() => setMethod(m.key)} style={[styles.fmItem, method === m.key && styles.fmItemOn]}>
            <View style={[styles.fmIco, { backgroundColor: m.bg }]}>
              <Text style={{ fontSize: 20 }}>{m.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fmName}>{m.name}</Text>
              <Text style={styles.fmSub}>{m.sub}</Text>
            </View>
            <View style={[styles.fmBadge, styles.badgeFree]}>
              <Text style={[styles.fmBadgeText, { color: colors.green }]}>{m.badge}</Text>
            </View>
          </PressScale>
        </View>

        <Text style={styles.fasLabel}>Montant rapide</Text>
        <View style={styles.fasAmounts}>
          {FUND_AMOUNTS.map((a) => (
            <PressScale key={a} scaleTo={0.92} onPress={() => setAmount(a)} style={[styles.faChip, amount === a && styles.faChipOn]}>
              <Text style={[styles.faChipText, amount === a && { color: colors.green }]}>{a / 1000}k F</Text>
            </PressScale>
          ))}
        </View>
      </ScrollView>

      <PressScale scaleTo={0.96} onPress={onSkip} disabled={loading} style={{ alignSelf: 'center', marginBottom: spacing.md }}>
        <Text style={styles.skipFund}>ou <Text style={{ color: colors.whiteA55 }}>Commencer sans argent pour l'instant</Text></Text>
      </PressScale>
      <GlowButton label={loading ? t(lang, 'signupCreating') : `Ajouter ${formatAmount(amount)} F →`} onPress={onNext} disabled={loading} />
    </Animated.View>
  );
}

export default function SignUpScreen({ mode = 'signup', onComplete, onLoginComplete, onCancel }) {
  const { country, langCode, setOnboardingIntent, setCountry } = useLocale();
  const showToast = useToast();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [intent, setIntent] = useState(null);
  const [arrondissement, setArrondissement] = useState(ARRONDISSEMENTS[0]);
  const [fundMethod, setFundMethod] = useState('mobile_money');
  const [fundAmount, setFundAmount] = useState(10000);
  const [loading, setLoading] = useState(false);

  const goTo = (s) => setStep(s);
  const back = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  };

  const displayPhone = e164Phone || (country ? `${country.dial} ${phone}` : phone);

  const requestOtp = async () => {
    const normalized = toE164(country, phone);
    setLoading(true);
    try {
      const res = await authPhone(normalized);
      setE164Phone(normalized);
      if (res.otp && (process.env.EXPO_PUBLIC_ALLOW_BETA_OTP === 'true' || __DEV__)) {
        setDevOtpHint(res.otp);
      }
      goTo('otp');
    } catch (err) {
      showToast(err.code === 'db_unavailable' ? t(langCode, 'signupDbUnavailable') : (err.message ?? t(langCode, 'signupSendFailed')));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!e164Phone) return;
    setLoading(true);
    try {
      const res = await authPhone(e164Phone);
      if (res.otp && (process.env.EXPO_PUBLIC_ALLOW_BETA_OTP === 'true' || __DEV__)) {
        setDevOtpHint(res.otp);
      }
      showToast('Code renvoyé ✓');
    } catch (err) {
      showToast(err.message ?? t(langCode, 'signupResendFailed'));
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    try {
      const res = await authVerify(e164Phone, otp);
      await saveSessionTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      if (!res.isNewUser) {
        const me = await getMe();
        if (me.name?.length >= 2 && me.handle?.length >= 3 && mode === 'login') {
          onLoginComplete?.();
          return;
        }
      }
      goTo('profile');
    } catch (err) {
      showToast(err.message ?? t(langCode, 'signupInvalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = async (amount) => {
    setLoading(true);
    try {
      if (intent) await setOnboardingIntent(intent);
      const res = await authCompleteProfile({
        name: name.trim(),
        handle,
        arrondissement: { key: arrondissement.key, icon: arrondissement.icon, name: arrondissement.name },
        fundAmount: 0, // Beta: real top-up via /api/cash/in when Julaya is live
        identityChoice: intent,
        isDiaspora: country?.code !== 'SN',
        countryCode: country?.code,
      });
      const balance = res.nationalBalance ?? res.balance ?? 0;
      onComplete?.({
        phone: e164Phone,
        name,
        handle,
        arrondissement,
        fundAmount: balance,
        intent,
        profile: res.profile,
        transactions: res.transactions,
      });
    } catch (err) {
      showToast(err.message ?? t(langCode, 'signupProfileFailed'));
    } finally {
      setLoading(false);
    }
  };

  const phoneBack = mode === 'login' ? onCancel : onCancel;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'phone' && (
          <PhoneStep lang={langCode} country={country} phone={phone} setPhone={setPhone} loading={loading} onNext={requestOtp} onBack={phoneBack} onCountryChange={setCountry} />
        )}
        {step === 'otp' && (
          <OtpStep
            lang={langCode}
            displayPhone={displayPhone}
            otp={otp}
            setOtp={setOtp}
            loading={loading}
            devHint={devOtpHint}
            onResend={resendOtp}
            onNext={verifyOtp}
            onBack={back}
          />
        )}
        {step === 'profile' && (
          <ProfileStep name={name} setName={setName} handle={handle} setHandle={setHandle} onNext={() => goTo('intent')} onBack={back} />
        )}
        {step === 'intent' && (
          <IntentStep lang={langCode} intent={intent} setIntent={setIntent} onNext={() => goTo('arrondissement')} onBack={back} />
        )}
        {step === 'arrondissement' && (
          <ArrondissementStep arrondissement={arrondissement} setArrondissement={setArrondissement} onNext={() => goTo('fund')} onBack={back} />
        )}
        {step === 'fund' && (
          <FundStep
            lang={langCode}
            amount={fundAmount}
            setAmount={setFundAmount}
            method={fundMethod}
            setMethod={setFundMethod}
            loading={loading}
            onNext={() => finishSignup(fundAmount)}
            onSkip={() => finishSignup(0)}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  body: { flex: 1, paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingTop: spacing.md, marginBottom: spacing.xxl },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: colors.white },

  stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  stepTrack: { height: 3, flex: 1, borderRadius: 2, backgroundColor: colors.whiteA08, overflow: 'hidden' },
  stepFill: { height: '100%', width: 0, borderRadius: 2, backgroundColor: colors.green },
  stepLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.xl },

  headline: { fontFamily: fontFamily.displayBlack, fontSize: 22, letterSpacing: -0.6, lineHeight: 27, color: colors.white, marginBottom: spacing.sm },
  g: { color: colors.green },
  sub: { fontSize: 12, color: colors.whiteA35, marginBottom: spacing.giant, lineHeight: 18 },

  phoneRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  countrySel: { height: 52, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  countryCode: { fontSize: 13, fontWeight: '700', color: colors.white },
  countryChevron: { fontSize: 10, color: colors.whiteA40, marginLeft: 2 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.ink, borderTopLeftRadius: radius.xxl, borderTopRightRadius: radius.xxl, padding: spacing.xxl, borderWidth: 1, borderColor: colors.whiteA08 },
  modalTitle: { fontFamily: fontFamily.displayBold, fontSize: 16, color: colors.white, marginBottom: spacing.lg },
  modalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingVertical: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radius.lg, marginBottom: spacing.xs },
  modalRowOn: { backgroundColor: colors.greenA10 },
  modalRowTitle: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  modalRowSub: { fontSize: 11, color: colors.whiteA35, marginTop: 2 },
  modalClose: { marginTop: spacing.lg, alignItems: 'center', paddingVertical: spacing.lg },
  modalCloseText: { fontSize: 13, fontWeight: '700', color: colors.whiteA50 },
  phoneField: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontSize: 16, fontWeight: '600', letterSpacing: 0.5, color: colors.white },
  phoneFieldFilled: { borderColor: colors.greenA30 },
  fieldNote: { fontSize: 10, color: colors.whiteA25, marginBottom: spacing.giant, lineHeight: 15.5 },

  quickNumsRow: { gap: spacing.md, marginBottom: spacing.xxl },
  qn: { height: 34, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.whiteA06, borderWidth: 1, borderColor: colors.whiteA08, alignItems: 'center', justifyContent: 'center' },
  qnText: { fontSize: 12, fontWeight: '600', color: colors.whiteA40 },

  secNote: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA08, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.xl },
  secText: { flex: 1, fontSize: 10, color: colors.whiteA30, lineHeight: 15 },

  otpSentTo: { fontSize: 12, color: colors.whiteA35, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 18 },
  otpRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.xl },
  otpBox: { width: 42, height: 54, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  otpBoxFilled: { backgroundColor: colors.greenA06, borderColor: colors.greenA30 },
  otpBoxActive: { borderColor: colors.green },
  otpDigit: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.green },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  otpTouchInput: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.02, color: 'transparent', fontSize: 1, textAlign: 'center',
  },
  resendText: { fontSize: 11, color: colors.whiteA30, marginBottom: spacing.xxl },
  devOtpHint: { fontSize: 10, color: colors.flagGold, textAlign: 'center', marginBottom: spacing.md },

  avatarPick: { alignItems: 'center', marginBottom: spacing.xl },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.greenA10, borderWidth: 2, borderColor: colors.greenA25, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarAdd: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  avatarHint: { fontSize: 10, color: colors.green },

  inputGroup: { marginBottom: spacing.xl },
  igLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.sm },
  igField: { width: '100%', height: 50, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontSize: 14, color: colors.white },
  handleAt: { position: 'absolute', left: spacing.xxxl, top: 0, bottom: 0, textAlignVertical: 'center', fontSize: 14, fontWeight: '700', color: colors.green, zIndex: 1 },
  handleField: { paddingLeft: spacing.giant + 8 },
  handleAvail: { position: 'absolute', right: spacing.lg, top: 0, bottom: 0, justifyContent: 'center' },
  handleAvailText: { fontSize: 9, fontWeight: '700', backgroundColor: colors.greenA10, borderWidth: 1, borderColor: colors.greenA20, color: colors.green, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 2, overflow: 'hidden' },

  cniHero: { backgroundColor: 'rgba(247,183,49,0.06)', borderWidth: 1, borderColor: 'rgba(247,183,49,0.14)', borderRadius: radius.xxl, padding: spacing.xxl, alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xl },
  cniTitle: { fontFamily: fontFamily.displayBlack, fontSize: 14, color: colors.white },
  cniBody: { fontSize: 11, color: colors.whiteA35, lineHeight: 18, textAlign: 'center' },
  cniReason: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, backgroundColor: colors.whiteA04, borderWidth: 1, borderColor: colors.whiteA06, borderRadius: radius.md, padding: spacing.lg },
  crText: { flex: 1, fontSize: 11, color: colors.whiteA55, lineHeight: 16.5 },
  cniOpt: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, borderRadius: radius.xl, padding: spacing.xl },
  cniOptOn: { backgroundColor: colors.greenA06, borderColor: colors.greenA30 },
  coTitle: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: 2 },
  coSub: { fontSize: 10, color: colors.whiteA35 },
  skipCni: { fontSize: 11, color: colors.whiteA25 },

  arrSearch: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  arrSectionLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA25, textTransform: 'uppercase', marginBottom: spacing.md },
  arrItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: 'transparent', borderRadius: radius.lg, padding: spacing.xl },
  arrItemOn: { backgroundColor: colors.greenA06, borderColor: colors.greenA25 },
  aiName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.white },
  aiCount: { fontSize: 10, color: colors.whiteA30 },
  aiCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },

  fmItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, borderRadius: radius.xl, padding: spacing.xl },
  fmItemOn: { backgroundColor: colors.greenA06, borderColor: colors.greenA25 },
  fmIco: { width: 42, height: 42, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  fmName: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: 2 },
  fmSub: { fontSize: 10, color: colors.whiteA35 },
  fmBadge: { borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  fmBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  badgeFree: { backgroundColor: colors.greenA12, borderWidth: 1, borderColor: colors.greenA20 },
  badgeFast: { backgroundColor: 'rgba(247,183,49,0.1)', borderWidth: 1, borderColor: 'rgba(247,183,49,0.2)' },

  fasLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.md },
  fasAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  faChip: { height: 36, paddingHorizontal: spacing.xl, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  faChipOn: { backgroundColor: colors.greenA10, borderColor: colors.greenA30 },
  faChipText: { fontSize: 12, fontWeight: '700', color: colors.white },
  skipFund: { fontSize: 11, color: colors.whiteA30 },
});

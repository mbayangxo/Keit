import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import OnboardingShell from '../components/OnboardingShell';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { authPhone, authVerify, authCompleteProfile, createBusiness, depositNational, getWallet } from '../lib/api-client';
import { saveSessionTokens } from '../lib/secure-storage';
import { toE164 } from '../lib/phone';
import { colors, fontFamily, radius, spacing } from '../theme';
import { ob } from '../theme/onboarding';
import { useEntrance } from '../hooks/animations';

// Business-account equivalent of SignUpScreen.js: phone -> OTP -> business
// profile -> arrondissement -> AFRI ID confirm -> fund wallet.
// Business needs AFRI ID (personal) + KEBU ID (commerce) at Tier 1 — no address verification.

const CATEGORIES = [
  { key: 'restaurant', icon: '🍽️', name: 'Restaurant / Dibiterie' },
  { key: 'boutique', icon: '🛍️', name: 'Boutique / Retail' },
  { key: 'supermarche', icon: '🛒', name: 'Supermarché / Épicerie' },
  { key: 'mode', icon: '👗', name: 'Mode / Fashion' },
  { key: 'services', icon: '🔧', name: 'Services' },
  { key: 'autre', icon: '✦', name: 'Autre' },
];

const ARRONDISSEMENTS = [
  { key: 'medina', icon: '🏘️', name: 'Médina', count: '4 821 K21' },
  { key: 'plateau', icon: '🏙️', name: 'Plateau', count: '3 204 K21' },
  { key: 'parcelles', icon: '🌆', name: 'Parcelles Assainies', count: '5 112 K21' },
  { key: 'hlm', icon: '🌇', name: 'HLM', count: '2 987 K21' },
  { key: 'ouakam', icon: '🌃', name: 'Ouakam', count: '2 341 K21' },
];

const FUND_METHODS = [
  { key: 'orange', icon: '🟠', bg: colors.orangeA10, name: 'Orange Money', sub: 'Transfert instantané', badge: 'GRATUIT' },
  { key: 'free', icon: '💚', bg: colors.greenA08, name: 'Free Money', sub: 'Transfert instantané', badge: 'GRATUIT' },
  { key: 'wave', icon: '〰️', bg: 'rgba(100,180,255,0.08)', name: 'Wave', sub: 'Depuis ton compte Wave', badge: 'RAPIDE' },
];
const FUND_AMOUNTS = [10000, 25000, 50000, 100000];

const SN_COUNTRY = { code: 'SN', dial: '+221' };

function businessHandleFromName(name) {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 18);
  return `${base || 'shop'}_${Math.random().toString(36).slice(2, 6)}`;
}

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

function StepHeader({ title, step, onBack, total = 6 }) {
  return (
    <>
      <View style={styles.headRow}>
        <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
          <Text style={{ fontSize: 14, color: ob.ink }}>←</Text>
        </PressScale>
        <Text style={styles.headTitle}>{title}</Text>
      </View>
      <View style={styles.stepRow}>
        {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
          <View key={s} style={styles.stepTrack}>
            <View style={[styles.stepFill, s <= step && { width: '100%' }]} />
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>Étape {step} sur {total}</Text>
    </>
  );
}

function PhoneStep({ phone, setPhone, onNext, onBack, loading }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Compte business" step={1} onBack={onBack} />
      <Text style={styles.headline}>
        Numéro de{'\n'}
        <Text style={styles.g}>contact business</Text>
      </Text>
      <Text style={styles.sub}>On t'envoie un code pour vérifier que c'est bien toi.</Text>

      <View style={styles.phoneRow}>
        <View style={styles.countrySel}>
          <Text style={{ fontSize: 18 }}>🇸🇳</Text>
          <Text style={styles.countryCode}>+221</Text>
        </View>
        <TextInput
          style={[styles.phoneField, phone.length >= 8 && styles.phoneFieldFilled]}
          placeholder="77 000 00 00"
          placeholderTextColor={ob.faint}
          keyboardType="number-pad"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
          maxLength={9}
        />
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton
        label={loading ? 'Envoi…' : 'Recevoir mon code →'}
        onPress={onNext}
        disabled={phone.length < 8 || loading}
        style={{ backgroundColor: ob.orange }}
      />
    </Animated.View>
  );
}

function OtpStep({ phone, otp, setOtp, onNext, onBack, onResend, devOtpHint, loading }) {
  const entrance = useEntrance(0, 350, 8);
  const boxes = [0, 1, 2, 3, 4, 5];
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Vérification" step={2} onBack={onBack} />
      <Text style={styles.headline}>
        Saisis le{'\n'}
        <Text style={styles.g}>code reçu</Text>
      </Text>
      <Text style={styles.otpSentTo}>
        Code envoyé au <Text style={{ fontFamily: fontFamily.bodyBold, color: ob.ink }}>+221 {phone}</Text>
        {'\n'}par SMS · valide 10 minutes
      </Text>
      {devOtpHint && (
        <Text style={[styles.resendText, { color: ob.orange, marginBottom: spacing.md }]}>
          Beta OTP: {devOtpHint}
        </Text>
      )}

      <View style={styles.otpRow}>
        {boxes.map((i) => (
          <View key={i} style={[styles.otpBox, otp.length > i && styles.otpBoxFilled, otp.length === i && styles.otpBoxActive]}>
            <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput style={styles.hiddenInput} value={otp} onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus maxLength={6} />

      <PressScale scaleTo={0.95} onPress={onResend} style={{ alignSelf: 'center' }}>
        <Text style={styles.resendText}>Tu n'as rien reçu ? <Text style={{ color: ob.orange, fontFamily: fontFamily.bodyBold }}>Renvoyer le code</Text></Text>
      </PressScale>

      <View style={{ flex: 1 }} />
      <GlowButton label={loading ? 'Vérification…' : 'Vérifier →'} onPress={onNext} disabled={otp.length < 6 || loading} style={{ backgroundColor: ob.orange }} />
    </Animated.View>
  );
}

function BusinessProfileStep({ businessName, setBusinessName, category, setCategory, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Mon commerce" step={3} onBack={onBack} />
      <Text style={styles.headline}>
        Crée ton{'\n'}
        <Text style={styles.g}>profil business</Text>
      </Text>

      <View style={styles.inputGroup}>
        <Text style={styles.igLabel}>Nom du commerce</Text>
        <TextInput
          style={styles.igField}
          placeholder="Dibiterie Chez Papa"
          placeholderTextColor={ob.faint}
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>

      <Text style={styles.igLabel}>Catégorie</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((c) => (
          <PressScale key={c.key} scaleTo={0.96} onPress={() => setCategory(c)} style={[styles.categoryChip, category?.key === c.key && styles.categoryChipOn]}>
            <Text style={{ fontSize: 16 }}>{c.icon}</Text>
            <Text style={[styles.categoryChipText, category?.key === c.key && { color: ob.orange }]}>{c.name}</Text>
          </PressScale>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton
        label="Continuer →"
        onPress={onNext}
        disabled={!businessName.trim() || !category}
        style={{ backgroundColor: ob.orange }}
      />
    </Animated.View>
  );
}

function ArrondissementStep({ arrondissement, setArrondissement, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  const [query, setQuery] = useState('');
  const filtered = ARRONDISSEMENTS.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Emplacement" step={4} onBack={onBack} />
      <Text style={[styles.headline, { fontSize: 18, marginBottom: spacing.sm }]}>
        Où se trouve{'\n'}
        <Text style={styles.g}>ton commerce ?</Text>
      </Text>
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>Les clients découvrent ton commerce par arrondissement sur Discover.</Text>

      <View style={styles.arrSearch}>
        <Text style={{ fontSize: 14, opacity: 0.4 }}>🔍</Text>
        <TextInput
          style={{ flex: 1, fontSize: 13, color: ob.ink }}
          placeholder="Chercher un arrondissement..."
          placeholderTextColor={ob.faint}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          {filtered.map((a) => (
            <PressScale key={a.key} scaleTo={0.98} onPress={() => setArrondissement(a)} style={[styles.arrItem, arrondissement?.key === a.key && styles.arrItemOn]}>
              <Text style={{ fontSize: 18 }}>{a.icon}</Text>
              <Text style={styles.aiName}>{a.name}</Text>
              <Text style={styles.aiCount}>{a.count}</Text>
              {arrondissement?.key === a.key && (
                <View style={styles.aiCheck}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: ob.ink }}>✓</Text>
                </View>
              )}
            </PressScale>
          ))}
        </View>
      </ScrollView>

      <GlowButton
        label={arrondissement ? `${arrondissement.name} — C'est confirmé ✓` : 'Choisis ton arrondissement'}
        onPress={onNext}
        disabled={!arrondissement}
        style={{ backgroundColor: ob.orange }}
      />
    </Animated.View>
  );
}

function AfriStep({ afriId, loading, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Identité AFRI" step={5} onBack={onBack} />
      <Text style={styles.headline}>
        Ton{'\n'}
        <Text style={styles.g}>AFRI ID</Text>
      </Text>
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>
        Identité personnelle africaine — obligatoire avant d'ouvrir un commerce KEBU. Pas besoin de vérifier ton adresse (Tier 1).
      </Text>

      <View style={styles.afriCard}>
        <Text style={styles.afriCardLabel}>TON AFRI ID</Text>
        {loading ? (
          <Text style={styles.afriCardValue}>Création…</Text>
        ) : (
          <Text style={styles.afriCardValue}>{afriId || '—'}</Text>
        )}
      </View>

      <View style={styles.afriExplain}>
        <Text style={styles.afriExplainRow}>✦ <Text style={styles.afriBold}>AFRI ID</Text> — toi, la personne</Text>
        <Text style={styles.afriExplainRow}>🏪 <Text style={styles.afriBold}>KEBU ID</Text> — ton commerce (étape suivante)</Text>
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton label="Continuer vers KEBU →" onPress={onNext} disabled={!afriId || loading} style={{ backgroundColor: ob.orange }} />
    </Animated.View>
  );
}

function FundStep({ amount, setAmount, method, setMethod, onNext, onSkip, loading }) {
  const betaCredits = process.env.EXPO_PUBLIC_ALLOW_BETA_DEPOSITS === 'true';
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <View style={styles.headRow}>
        <View style={[styles.backBtn, { opacity: 0.3 }]}>
          <Text style={{ fontSize: 14, color: ob.ink }}>←</Text>
        </View>
        <Text style={styles.headTitle}>Alimenter mon compte business</Text>
      </View>
      <Text style={[styles.headline, { fontSize: 18, marginBottom: spacing.sm }]}>
        Ajoute de <Text style={styles.g}>l'argent</Text>
      </Text>
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>
        {betaCredits
          ? 'Beta : crédits test K21 (pas de vrai Orange/Wave pour l’instant).'
          : 'Les rails mobile money arrivent bientôt — tu peux commencer sans solde.'}
      </Text>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
          {FUND_METHODS.map((m) => (
            <PressScale key={m.key} scaleTo={0.98} onPress={() => setMethod(m.key)} style={[styles.fmItem, method === m.key && styles.fmItemOn]}>
              <View style={[styles.fmIco, { backgroundColor: m.bg }]}>
                <Text style={{ fontSize: 20 }}>{m.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fmName}>{m.name}</Text>
                <Text style={styles.fmSub}>{m.sub}</Text>
              </View>
              <View style={styles.fmBadge}>
                <Text style={styles.fmBadgeText}>{m.badge}</Text>
              </View>
            </PressScale>
          ))}
        </View>

        <Text style={styles.fasLabel}>Montant rapide</Text>
        <View style={styles.fasAmounts}>
          {FUND_AMOUNTS.map((a) => (
            <PressScale key={a} scaleTo={0.92} onPress={() => setAmount(a)} style={[styles.faChip, amount === a && styles.faChipOn]}>
              <Text style={[styles.faChipText, amount === a && { color: ob.orange }]}>{a / 1000}k F</Text>
            </PressScale>
          ))}
        </View>
      </ScrollView>

      <PressScale scaleTo={0.96} onPress={onSkip} disabled={loading} style={{ alignSelf: 'center', marginBottom: spacing.md }}>
        <Text style={styles.skipFund}>ou <Text style={{ color: ob.muted }}>Commencer sans argent pour l'instant</Text></Text>
      </PressScale>
      <GlowButton
        label={loading ? 'Création…' : `Ajouter ${formatAmount(amount)} F →`}
        onPress={onNext}
        disabled={loading}
        style={{ backgroundColor: ob.orange }}
      />
    </Animated.View>
  );
}

const STEP_ORDER = ['phone', 'otp', 'profile', 'arrondissement', 'afri', 'fund'];

export default function BusinessSignUpScreen({ onComplete, onCancel }) {
  const showToast = useToast();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [e164Phone, setE164Phone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtpHint, setDevOtpHint] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(null);
  const [arrondissement, setArrondissement] = useState(null);
  const [afriId, setAfriId] = useState('');
  const [ownerHandle, setOwnerHandle] = useState('');
  const [fundMethod, setFundMethod] = useState('orange');
  const [fundAmount, setFundAmount] = useState(25000);
  const [loading, setLoading] = useState(false);

  const goTo = (s) => setStep(s);
  const back = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  };

  const requestOtp = async () => {
    const normalized = toE164(SN_COUNTRY, phone);
    setLoading(true);
    try {
      const res = await authPhone(normalized);
      setE164Phone(normalized);
      if (res.otp) {
        setDevOtpHint(String(res.otp));
      }
      goTo('otp');
    } catch (err) {
      showToast(err.message ?? 'Envoi impossible');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!e164Phone) return;
    setLoading(true);
    try {
      const res = await authPhone(e164Phone);
      if (res.otp) {
        setDevOtpHint(String(res.otp));
      }
      showToast('Code renvoyé ✓');
    } catch (err) {
      showToast(err.message ?? 'Renvoi impossible');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const phoneForVerify = e164Phone || toE164(SN_COUNTRY, phone);
    setLoading(true);
    try {
      const res = await authVerify(phoneForVerify, otp.replace(/\D/g, ''));
      await saveSessionTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
      goTo('profile');
    } catch (err) {
      showToast(err.message ?? 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  const savePersonalProfile = async () => {
    if (!businessName.trim() || !category || !arrondissement) return;
    setLoading(true);
    try {
      const handle = businessHandleFromName(businessName);
      const res = await authCompleteProfile({
        name: businessName.trim(),
        handle,
        arrondissement: { key: arrondissement.key, icon: arrondissement.icon, name: arrondissement.name },
        fundAmount: 0,
        countryCode: 'SN',
        isDiaspora: false,
      });
      setOwnerHandle(handle);
      setAfriId(res.profile?.afriId ?? '');
      goTo('afri');
    } catch (err) {
      showToast(err.message ?? 'Profil impossible');
    } finally {
      setLoading(false);
    }
  };

  const finishSignup = async (amount) => {
    if (!businessName.trim() || !category || !arrondissement || !afriId) return;
    setLoading(true);
    try {
      const handle = ownerHandle || businessHandleFromName(businessName);
      const business = await createBusiness({
        name: businessName.trim(),
        category: category.key,
        arrondissement: arrondissement.name,
      });

      let balance = 0;
      if (amount > 0 && process.env.EXPO_PUBLIC_ALLOW_BETA_DEPOSITS === 'true') {
        try {
          const deposited = await depositNational({ amount, source: 'signup' });
          balance = deposited.nationalBalance ?? deposited.balance ?? amount;
        } catch (depositErr) {
          showToast(depositErr.message ?? 'Crédits test indisponibles — tu peux ajouter plus tard');
          const wallet = await getWallet();
          balance = wallet.nationalBalance ?? wallet.balance ?? 0;
        }
      } else if (amount > 0) {
        showToast('Dépôt mobile money bientôt — compte créé sans solde');
        const wallet = await getWallet();
        balance = wallet.nationalBalance ?? wallet.balance ?? 0;
      }

      onComplete?.({
        phone: e164Phone,
        businessName: businessName.trim(),
        category: category.name,
        arrondissement,
        fundAmount: balance,
        businessId: business.id,
        handle,
        afriId,
        kebuId: business.kebuId,
      });
    } catch (err) {
      showToast(err.message ?? 'Création impossible');
    } finally {
      setLoading(false);
    }
  };

  return (
    <OnboardingShell>
        {step === 'phone' && (
          <PhoneStep phone={phone} setPhone={setPhone} onNext={requestOtp} onBack={onCancel} loading={loading} />
        )}
        {step === 'otp' && (
          <OtpStep
            phone={phone}
            otp={otp}
            setOtp={setOtp}
            onNext={verifyOtp}
            onBack={back}
            onResend={resendOtp}
            devOtpHint={devOtpHint}
            loading={loading}
          />
        )}
        {step === 'profile' && (
          <BusinessProfileStep
            businessName={businessName}
            setBusinessName={setBusinessName}
            category={category}
            setCategory={setCategory}
            onNext={() => goTo('arrondissement')}
            onBack={back}
          />
        )}
        {step === 'arrondissement' && (
          <ArrondissementStep
            arrondissement={arrondissement}
            setArrondissement={setArrondissement}
            onNext={savePersonalProfile}
            onBack={back}
          />
        )}
        {step === 'afri' && (
          <AfriStep afriId={afriId} loading={loading} onNext={() => goTo('fund')} onBack={back} />
        )}
        {step === 'fund' && (
          <FundStep
            amount={fundAmount}
            setAmount={setFundAmount}
            method={fundMethod}
            setMethod={setFundMethod}
            onNext={() => finishSignup(fundAmount)}
            onSkip={() => finishSignup(0)}
            loading={loading}
          />
        )}
    </OnboardingShell>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, paddingHorizontal: spacing.xxl, paddingBottom: spacing.xl },

  headRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, paddingTop: spacing.md, marginBottom: spacing.xxl },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: ob.orangeSoft, borderWidth: 1, borderColor: ob.orangeBorder, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontFamily: fontFamily.displayBold, fontSize: 14, color: ob.ink },

  stepRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl },
  stepTrack: { height: 3, flex: 1, borderRadius: 2, backgroundColor: ob.orangeSoft, overflow: 'hidden' },
  stepFill: { height: '100%', width: 0, borderRadius: 2, backgroundColor: ob.orange },
  stepLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: ob.faint, textTransform: 'uppercase', marginBottom: spacing.xl },

  headline: { fontFamily: fontFamily.displayBlack, fontSize: 22, letterSpacing: -0.6, lineHeight: 27, color: ob.ink, marginBottom: spacing.sm },
  g: { color: ob.orange },
  sub: { fontSize: 12, color: ob.muted, marginBottom: spacing.giant, lineHeight: 18 },

  phoneRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  countrySel: { height: 52, borderRadius: radius.lg, backgroundColor: ob.surface, borderWidth: 1, borderColor: ob.border, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  countryCode: { fontSize: 13, fontWeight: '700', color: ob.ink },
  phoneField: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: ob.surface, borderWidth: 1, borderColor: ob.border, paddingHorizontal: spacing.xxxl, fontSize: 16, fontWeight: '600', letterSpacing: 0.5, color: ob.ink },
  phoneFieldFilled: { borderColor: ob.orangeBorder },

  otpSentTo: { fontSize: 12, color: ob.muted, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 18 },
  otpRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.xl },
  otpBox: { width: 42, height: 54, borderRadius: radius.lg, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: ob.border, alignItems: 'center', justifyContent: 'center' },
  otpBoxFilled: { backgroundColor: ob.orangeSoft, borderColor: ob.orangeBorder },
  otpBoxActive: { borderColor: ob.orange },
  otpDigit: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: ob.orange },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  resendText: { fontSize: 11, color: ob.faint, marginBottom: spacing.xxl },

  inputGroup: { marginBottom: spacing.xl },
  igLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: ob.faint, textTransform: 'uppercase', marginBottom: spacing.sm },
  igField: { width: '100%', height: 50, borderRadius: radius.lg, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: ob.border, paddingHorizontal: spacing.xxxl, fontSize: 14, color: ob.ink },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 38, paddingHorizontal: spacing.lg, borderRadius: radius.round, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: ob.border },
  categoryChipOn: { backgroundColor: ob.orangeSoft, borderColor: ob.orangeBorder },
  categoryChipText: { fontSize: 11, fontWeight: '600', color: ob.ink },

  arrSearch: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: ob.border, borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  arrItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: 'transparent', borderRadius: radius.lg, padding: spacing.xl },
  arrItemOn: { backgroundColor: ob.orangeSoft, borderColor: ob.orangeBorder },
  aiName: { flex: 1, fontSize: 13, fontWeight: '600', color: ob.ink },
  aiCount: { fontSize: 10, color: ob.faint },
  aiCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: ob.orange, alignItems: 'center', justifyContent: 'center' },

  fmItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: ob.border, borderRadius: radius.xl, padding: spacing.xl },
  fmItemOn: { backgroundColor: ob.orangeSoft, borderColor: ob.orangeBorder },
  fmIco: { width: 42, height: 42, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  fmName: { fontSize: 13, fontWeight: '700', color: ob.ink, marginBottom: 2 },
  fmSub: { fontSize: 10, color: ob.muted },
  fmBadge: { backgroundColor: ob.orangeSoft, borderWidth: 1, borderColor: ob.orangeBorder, borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  fmBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: ob.orange },

  fasLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: ob.faint, textTransform: 'uppercase', marginBottom: spacing.md },
  fasAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  faChip: { height: 36, paddingHorizontal: spacing.xl, borderRadius: radius.round, backgroundColor: ob.surface, borderWidth: 1.5, borderColor: ob.border, alignItems: 'center', justifyContent: 'center' },
  faChipOn: { backgroundColor: ob.orangeSoft, borderColor: ob.orangeBorder },
  faChipText: { fontSize: 12, fontWeight: '700', color: ob.ink },
  skipFund: { fontSize: 11, color: ob.faint },
  afriCard: {
    backgroundColor: ob.orangeSoft,
    borderWidth: 1.5,
    borderColor: ob.orangeBorder,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  afriCardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: ob.faint, marginBottom: spacing.sm },
  afriCardValue: { fontFamily: fontFamily.displayBlack, fontSize: 16, color: ob.orange },
  afriExplain: { gap: spacing.sm, marginBottom: spacing.xl },
  afriExplainRow: { fontSize: 12, color: ob.muted, lineHeight: 18 },
  afriBold: { fontFamily: fontFamily.bodyBold, color: ob.ink },
});

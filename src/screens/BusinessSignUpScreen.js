import { useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { useToast } from '../components/Toast';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance } from '../hooks/animations';

// Business-account equivalent of SignUpScreen.js: phone -> OTP -> business
// profile -> arrondissement -> fund wallet. Mirrors the personal flow's
// visual system exactly but skips the CNI step (that's a personal-identity
// concept) and ends by generating a KEBU ID instead of an AFRI ID.

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

function formatAmount(n) {
  return n.toLocaleString('fr-FR').replace(/ /g, ' ');
}

function StepHeader({ title, step, onBack }) {
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
            <View style={[styles.stepFill, s <= step && { width: '100%' }]} />
          </View>
        ))}
      </View>
      <Text style={styles.stepLabel}>Étape {step} sur 4</Text>
    </>
  );
}

function PhoneStep({ phone, setPhone, onNext, onBack }) {
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
          placeholderTextColor={colors.whiteA20}
          keyboardType="number-pad"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
          maxLength={9}
        />
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton label="Recevoir mon code →" onPress={onNext} disabled={phone.length < 8} style={{ backgroundColor: colors.flagGold }} />
    </Animated.View>
  );
}

function OtpStep({ phone, otp, setOtp, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  const boxes = [0, 1, 2, 3, 4, 5];
  const showToast = useToast();
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Vérification" step={2} onBack={onBack} />
      <Text style={styles.headline}>
        Saisis le{'\n'}
        <Text style={styles.g}>code reçu</Text>
      </Text>
      <Text style={styles.otpSentTo}>
        Code envoyé au <Text style={{ fontFamily: fontFamily.bodyBold, color: colors.whiteA70 }}>+221 {phone}</Text>
        {'\n'}par SMS · valide 10 minutes
      </Text>

      <View style={styles.otpRow}>
        {boxes.map((i) => (
          <View key={i} style={[styles.otpBox, otp.length > i && styles.otpBoxFilled, otp.length === i && styles.otpBoxActive]}>
            <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput style={styles.hiddenInput} value={otp} onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus maxLength={6} />

      <PressScale scaleTo={0.95} onPress={() => showToast('Code renvoyé ✓')} style={{ alignSelf: 'center' }}>
        <Text style={styles.resendText}>Tu n'as rien reçu ? <Text style={{ color: colors.flagGold, fontFamily: fontFamily.bodyBold }}>Renvoyer le code</Text></Text>
      </PressScale>

      <View style={{ flex: 1 }} />
      <GlowButton label="Vérifier →" onPress={onNext} disabled={otp.length < 6} style={{ backgroundColor: colors.flagGold }} />
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
          placeholderTextColor={colors.whiteA20}
          value={businessName}
          onChangeText={setBusinessName}
        />
      </View>

      <Text style={styles.igLabel}>Catégorie</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((c) => (
          <PressScale key={c.key} scaleTo={0.96} onPress={() => setCategory(c)} style={[styles.categoryChip, category?.key === c.key && styles.categoryChipOn]}>
            <Text style={{ fontSize: 16 }}>{c.icon}</Text>
            <Text style={[styles.categoryChipText, category?.key === c.key && { color: colors.flagGold }]}>{c.name}</Text>
          </PressScale>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton
        label="Continuer →"
        onPress={onNext}
        disabled={!businessName.trim() || !category}
        style={{ backgroundColor: colors.flagGold }}
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
          style={{ flex: 1, fontSize: 13, color: colors.white }}
          placeholder="Chercher un arrondissement..."
          placeholderTextColor={colors.whiteA25}
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
                  <Text style={{ fontSize: 9, fontWeight: '900', color: colors.ink }}>✓</Text>
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
        style={{ backgroundColor: colors.flagGold }}
      />
    </Animated.View>
  );
}

function FundStep({ amount, setAmount, method, setMethod, onNext, onSkip }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <View style={styles.headRow}>
        <View style={[styles.backBtn, { opacity: 0.3 }]}>
          <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
        </View>
        <Text style={styles.headTitle}>Alimenter mon compte business</Text>
      </View>
      <Text style={[styles.headline, { fontSize: 18, marginBottom: spacing.sm }]}>
        Ajoute de <Text style={styles.g}>l'argent</Text>
      </Text>
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>Pour commencer à recevoir des paiements clients dès aujourd'hui.</Text>

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
              <Text style={[styles.faChipText, amount === a && { color: colors.flagGold }]}>{a / 1000}k F</Text>
            </PressScale>
          ))}
        </View>
      </ScrollView>

      <PressScale scaleTo={0.96} onPress={onSkip} style={{ alignSelf: 'center', marginBottom: spacing.md }}>
        <Text style={styles.skipFund}>ou <Text style={{ color: colors.whiteA55 }}>Commencer sans argent pour l'instant</Text></Text>
      </PressScale>
      <GlowButton label={`Ajouter ${formatAmount(amount)} F →`} onPress={onNext} style={{ backgroundColor: colors.flagGold }} />
    </Animated.View>
  );
}

const STEP_ORDER = ['phone', 'otp', 'profile', 'arrondissement', 'fund'];

export default function BusinessSignUpScreen({ onComplete }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState(null);
  const [arrondissement, setArrondissement] = useState(null);
  const [fundMethod, setFundMethod] = useState('orange');
  const [fundAmount, setFundAmount] = useState(25000);

  const goTo = (s) => setStep(s);
  const back = () => {
    const i = STEP_ORDER.indexOf(step);
    if (i > 0) setStep(STEP_ORDER[i - 1]);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'phone' && <PhoneStep phone={phone} setPhone={setPhone} onNext={() => goTo('otp')} onBack={onComplete} />}
        {step === 'otp' && <OtpStep phone={phone} otp={otp} setOtp={setOtp} onNext={() => goTo('profile')} onBack={back} />}
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
          <ArrondissementStep arrondissement={arrondissement} setArrondissement={setArrondissement} onNext={() => goTo('fund')} onBack={back} />
        )}
        {step === 'fund' && (
          <FundStep
            amount={fundAmount}
            setAmount={setFundAmount}
            method={fundMethod}
            setMethod={setFundMethod}
            onNext={() => onComplete?.({ phone, businessName, category: category?.name, arrondissement, fundAmount })}
            onSkip={() => onComplete?.({ phone, businessName, category: category?.name, arrondissement, fundAmount: 0 })}
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
  stepFill: { height: '100%', width: 0, borderRadius: 2, backgroundColor: colors.flagGold },
  stepLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.xl },

  headline: { fontFamily: fontFamily.displayBlack, fontSize: 22, letterSpacing: -0.6, lineHeight: 27, color: colors.white, marginBottom: spacing.sm },
  g: { color: colors.flagGold },
  sub: { fontSize: 12, color: colors.whiteA35, marginBottom: spacing.giant, lineHeight: 18 },

  phoneRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.md },
  countrySel: { height: 52, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg },
  countryCode: { fontSize: 13, fontWeight: '700', color: colors.white },
  phoneField: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontSize: 16, fontWeight: '600', letterSpacing: 0.5, color: colors.white },
  phoneFieldFilled: { borderColor: 'rgba(250,216,54,0.4)' },

  otpSentTo: { fontSize: 12, color: colors.whiteA35, textAlign: 'center', marginBottom: spacing.xl, lineHeight: 18 },
  otpRow: { flexDirection: 'row', gap: spacing.md, justifyContent: 'center', marginBottom: spacing.xl },
  otpBox: { width: 42, height: 54, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  otpBoxFilled: { backgroundColor: colors.goldA08, borderColor: 'rgba(250,216,54,0.4)' },
  otpBoxActive: { borderColor: colors.flagGold },
  otpDigit: { fontFamily: fontFamily.displayBlack, fontSize: 20, color: colors.flagGold },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  resendText: { fontSize: 11, color: colors.whiteA30, marginBottom: spacing.xxl },

  inputGroup: { marginBottom: spacing.xl },
  igLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.sm },
  igField: { width: '100%', height: 50, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xxxl, fontSize: 14, color: colors.white },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xl },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, height: 38, paddingHorizontal: spacing.lg, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10 },
  categoryChipOn: { backgroundColor: colors.goldA08, borderColor: 'rgba(250,216,54,0.4)' },
  categoryChipText: { fontSize: 11, fontWeight: '600', color: colors.white },

  arrSearch: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.whiteA08, borderWidth: 1.5, borderColor: colors.whiteA12, borderRadius: radius.lg, height: 48, paddingHorizontal: spacing.xl, marginBottom: spacing.xl },
  arrItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: 'transparent', borderRadius: radius.lg, padding: spacing.xl },
  arrItemOn: { backgroundColor: colors.goldA08, borderColor: 'rgba(250,216,54,0.4)' },
  aiName: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.white },
  aiCount: { fontSize: 10, color: colors.whiteA30 },
  aiCheck: { width: 18, height: 18, borderRadius: 9, backgroundColor: colors.flagGold, alignItems: 'center', justifyContent: 'center' },

  fmItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, borderRadius: radius.xl, padding: spacing.xl },
  fmItemOn: { backgroundColor: colors.goldA08, borderColor: 'rgba(250,216,54,0.4)' },
  fmIco: { width: 42, height: 42, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  fmName: { fontSize: 13, fontWeight: '700', color: colors.white, marginBottom: 2 },
  fmSub: { fontSize: 10, color: colors.whiteA35 },
  fmBadge: { backgroundColor: 'rgba(250,216,54,0.1)', borderWidth: 1, borderColor: 'rgba(250,216,54,0.2)', borderRadius: 6, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  fmBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, color: colors.flagGold },

  fasLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 1.5, color: colors.whiteA30, textTransform: 'uppercase', marginBottom: spacing.md },
  fasAmounts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  faChip: { height: 36, paddingHorizontal: spacing.xl, borderRadius: radius.round, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA10, alignItems: 'center', justifyContent: 'center' },
  faChipOn: { backgroundColor: colors.goldA08, borderColor: 'rgba(250,216,54,0.4)' },
  faChipText: { fontSize: 12, fontWeight: '700', color: colors.white },
  skipFund: { fontSize: 11, color: colors.whiteA30 },
});

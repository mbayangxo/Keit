import { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance } from '../hooks/animations';

// design/k21-onboarding.html, Screens 3-8 — phone -> OTP -> profile -> CNI
// -> arrondissement -> fund wallet. The CNI step matches brief §05's
// "tied to CNI, not SIM" identity model in UI terms only — real document
// scanning/verification needs a licensed KYC vendor and a backend, so
// tapping through it here just records the choice, it doesn't verify one.

const CARRIERS = ['📱 Orange', '📱 Free', '📱 Expresso'];
const ARRONDISSEMENTS = [
  { key: 'medina', icon: '🏘️', name: 'Médina', count: '4 821 K21' },
  { key: 'plateau', icon: '🏙️', name: 'Plateau', count: '3 204 K21' },
  { key: 'parcelles', icon: '🌆', name: 'Parcelles Assainies', count: '5 112 K21' },
  { key: 'hlm', icon: '🌇', name: 'HLM', count: '2 987 K21' },
  { key: 'ouakam', icon: '🌃', name: 'Ouakam', count: '2 341 K21' },
];
const FUND_METHODS = [
  { key: 'orange', icon: '🟠', bg: colors.orangeA10, name: 'Orange Money', sub: 'Transfert instantané', badge: 'GRATUIT', badgeStyle: 'free' },
  { key: 'free', icon: '💚', bg: colors.greenA08, name: 'Free Money', sub: 'Transfert instantané', badge: 'GRATUIT', badgeStyle: 'free' },
  { key: 'wave', icon: '〰️', bg: 'rgba(100,180,255,0.08)', name: 'Wave', sub: 'Depuis ton compte Wave', badge: 'RAPIDE', badgeStyle: 'fast' },
];
const FUND_AMOUNTS = [5000, 10000, 25000, 50000];

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
            <View style={[styles.stepFill, s <= step && { width: '100%' }, s === step && step === 4 && { backgroundColor: colors.flagGold }]} />
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
      <StepHeader title="Créer mon compte" step={1} onBack={onBack} />
      <Text style={styles.headline}>
        Ton numéro{'\n'}
        <Text style={styles.g}>de téléphone</Text>
      </Text>
      <Text style={styles.sub}>On t'envoie un code pour vérifier que c'est bien toi. Rien d'autre.</Text>

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
      <Text style={styles.fieldNote}>
        Ton numéro est lié à <Text style={{ color: colors.whiteA55, fontFamily: fontFamily.bodyBold }}>ton identité K21</Text>, pas à ta SIM. Si tu perds ton téléphone, ton argent reste en sécurité.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickNumsRow}>
        {CARRIERS.map((c) => (
          <View key={c} style={styles.qn}>
            <Text style={styles.qnText}>{c}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.secNote}>
        <Text style={{ fontSize: 14 }}>🔒</Text>
        <Text style={styles.secText}>Ton numéro ne sera jamais partagé avec des tiers ni utilisé à des fins publicitaires.</Text>
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton label="Recevoir mon code →" onPress={onNext} disabled={phone.length < 8} />
    </Animated.View>
  );
}

function OtpStep({ phone, otp, setOtp, onNext, onBack }) {
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

      <PressScale scaleTo={0.95} style={{ alignSelf: 'center' }}>
        <Text style={styles.resendText}>Tu n'as rien reçu ? <Text style={{ color: colors.green, fontFamily: fontFamily.bodyBold }}>Renvoyer le code</Text></Text>
      </PressScale>

      <View style={styles.secNote}>
        <Text style={{ fontSize: 14 }}>🛡️</Text>
        <Text style={styles.secText}>
          <Text style={{ color: colors.whiteA70, fontFamily: fontFamily.bodyBold }}>Ne partage jamais ce code</Text> — même si quelqu'un dit travailler pour K21. On ne te demandera jamais ton code.
        </Text>
      </View>

      <View style={{ flex: 1 }} />
      <GlowButton label="Vérifier →" onPress={onNext} disabled={otp.length < 6} />
    </Animated.View>
  );
}

function ProfileStep({ name, setName, handle, setHandle, onNext, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Mon profil" step={3} onBack={onBack} />
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

function CniStep({ cniType, setCniType, onNext, onSkip, onBack }) {
  const entrance = useEntrance(0, 350, 8);
  return (
    <Animated.View style={[styles.body, entrance]}>
      <StepHeader title="Identité" step={4} onBack={onBack} />

      <View style={styles.cniHero}>
        <Text style={{ fontSize: 40 }}>🪪</Text>
        <Text style={styles.cniTitle}>Vérifie ton identité</Text>
        <Text style={styles.cniBody}>Chez K21, ton compte est lié à toi — pas à ta SIM. Si tu perds ton téléphone, ton argent ne disparaît jamais.</Text>
      </View>

      <View style={{ gap: spacing.sm, marginBottom: spacing.xxl }}>
        <View style={styles.cniReason}>
          <Text style={{ fontSize: 16 }}>🔐</Text>
          <Text style={styles.crText}><Text style={{ color: colors.white, fontFamily: fontFamily.bodySemiBold }}>Ton argent reste à toi.</Text> Même si quelqu'un d'autre prend ton numéro.</Text>
        </View>
        <View style={styles.cniReason}>
          <Text style={{ fontSize: 16 }}>⚡</Text>
          <Text style={styles.crText}><Text style={{ color: colors.white, fontFamily: fontFamily.bodySemiBold }}>Récupération en 5 min.</Text> Va chez un agent K21 avec ta CNI.</Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm, marginBottom: spacing.xl }}>
        {[
          { key: 'cni', icon: '🪪', title: 'Carte Nationale d’Identité', sub: 'Recommandé · Plus rapide' },
          { key: 'passport', icon: '📘', title: 'Passeport', sub: 'Accepté' },
        ].map((opt) => (
          <PressScale key={opt.key} scaleTo={0.98} onPress={() => setCniType(opt.key)} style={[styles.cniOpt, cniType === opt.key && styles.cniOptOn]}>
            <Text style={{ fontSize: 22 }}>{opt.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.coTitle}>{opt.title}</Text>
              <Text style={styles.coSub}>{opt.sub}</Text>
            </View>
            <Text style={{ fontSize: 14, color: colors.whiteA30 }}>→</Text>
          </PressScale>
        ))}
      </View>

      <PressScale scaleTo={0.96} onPress={onSkip} style={{ alignSelf: 'center', marginBottom: spacing.xl }}>
        <Text style={styles.skipCni}>Faire ça plus tard · <Text style={{ color: colors.whiteA40, textDecorationLine: 'underline' }}>Limites de compte s'appliquent</Text></Text>
      </PressScale>

      <GlowButton label="Scanner ma CNI →" onPress={onNext} style={{ backgroundColor: colors.flagGold }} />
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

function FundStep({ amount, setAmount, method, setMethod, onNext, onSkip }) {
  const entrance = useEntrance(0, 350, 8);
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
      <Text style={[styles.sub, { marginBottom: spacing.xl }]}>Transfère depuis Orange Money, Free Money ou Wave en quelques secondes.</Text>

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
              <View style={[styles.fmBadge, m.badgeStyle === 'free' ? styles.badgeFree : styles.badgeFast]}>
                <Text style={[styles.fmBadgeText, { color: m.badgeStyle === 'free' ? colors.green : colors.flagGold }]}>{m.badge}</Text>
              </View>
            </PressScale>
          ))}
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

      <PressScale scaleTo={0.96} onPress={onSkip} style={{ alignSelf: 'center', marginBottom: spacing.md }}>
        <Text style={styles.skipFund}>ou <Text style={{ color: colors.whiteA55 }}>Commencer sans argent pour l'instant</Text></Text>
      </PressScale>
      <GlowButton label={`Ajouter ${formatAmount(amount)} F →`} onPress={onNext} />
    </Animated.View>
  );
}

const STEP_ORDER = ['phone', 'otp', 'profile', 'cni', 'arrondissement', 'fund'];

export default function SignUpScreen({ onComplete }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('saliou_medina');
  const [cniType, setCniType] = useState('cni');
  const [arrondissement, setArrondissement] = useState(ARRONDISSEMENTS[0]);
  const [fundMethod, setFundMethod] = useState('orange');
  const [fundAmount, setFundAmount] = useState(10000);

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
          <ProfileStep name={name} setName={setName} handle={handle} setHandle={setHandle} onNext={() => goTo('cni')} onBack={back} />
        )}
        {step === 'cni' && (
          <CniStep cniType={cniType} setCniType={setCniType} onNext={() => goTo('arrondissement')} onSkip={() => goTo('arrondissement')} onBack={back} />
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
            onNext={() => onComplete?.({ phone, name, handle, arrondissement, fundAmount })}
            onSkip={() => onComplete?.({ phone, name, handle, arrondissement, fundAmount: 0 })}
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
  resendText: { fontSize: 11, color: colors.whiteA30, marginBottom: spacing.xxl },

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

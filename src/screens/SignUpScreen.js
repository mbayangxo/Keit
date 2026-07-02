import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import { colors, fontFamily, radius, spacing } from '../theme';
import { useEntrance } from '../hooks/animations';

// No prototype exists for sign-up. Kept intentionally light for a Phase 1
// demo — phone -> OTP -> name/avatar — rather than the full CNI-linked
// identity flow described in brief §05 (agent verification, biometrics),
// which needs a real backend and is out of scope here.

const AVATARS = ['👨🏿', '👩🏾', '👦🏿', '👩🏿', '👨🏾', '👩🏽'];

function PhoneStep({ phone, setPhone, onNext }) {
  const entrance = useEntrance(0, 400, 10);
  return (
    <Animated.View style={[styles.stepBody, entrance]}>
      <Text style={styles.eyebrow}>ÉTAPE 1 SUR 3</Text>
      <Text style={styles.title}>Ton numéro ?</Text>
      <Text style={styles.subtitle}>On t'envoie un code pour vérifier que c'est bien toi.</Text>

      <View style={styles.phoneRow}>
        <View style={styles.dialCode}>
          <Text style={styles.dialCodeText}>🇸🇳 +221</Text>
        </View>
        <TextInput
          style={styles.phoneInput}
          placeholder="77 000 00 00"
          placeholderTextColor={colors.whiteA30}
          keyboardType="number-pad"
          value={phone}
          onChangeText={(t) => setPhone(t.replace(/[^0-9]/g, ''))}
          maxLength={9}
        />
      </View>

      <View style={styles.footer}>
        <GlowButton label="Recevoir le code →" onPress={onNext} disabled={phone.length < 8} />
      </View>
    </Animated.View>
  );
}

function OtpStep({ phone, otp, setOtp, onNext, onBack }) {
  const entrance = useEntrance(0, 400, 10);
  const boxes = [0, 1, 2, 3];

  return (
    <Animated.View style={[styles.stepBody, entrance]}>
      <PressScale scaleTo={0.9} onPress={onBack} style={styles.backBtn}>
        <Text style={{ fontSize: 14, color: colors.white }}>←</Text>
      </PressScale>
      <Text style={styles.eyebrow}>ÉTAPE 2 SUR 3</Text>
      <Text style={styles.title}>Code reçu par SMS</Text>
      <Text style={styles.subtitle}>Envoyé au +221 {phone}</Text>

      <View style={styles.otpRow}>
        {boxes.map((i) => (
          <View key={i} style={[styles.otpBox, otp.length === i && styles.otpBoxActive]}>
            <Text style={styles.otpDigit}>{otp[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.hiddenInput}
        value={otp}
        onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 4))}
        keyboardType="number-pad"
        autoFocus
        maxLength={4}
      />

      <PressScale scaleTo={0.95} style={{ alignSelf: 'center', marginTop: spacing.xl }}>
        <Text style={styles.resendText}>Renvoyer le code</Text>
      </PressScale>

      <View style={styles.footer}>
        <GlowButton label="Vérifier →" onPress={onNext} disabled={otp.length < 4} />
      </View>
    </Animated.View>
  );
}

function ProfileStep({ name, setName, avatar, setAvatar, onFinish }) {
  const entrance = useEntrance(0, 400, 10);
  return (
    <Animated.View style={[styles.stepBody, entrance]}>
      <Text style={styles.eyebrow}>ÉTAPE 3 SUR 3</Text>
      <Text style={styles.title}>Comment on t'appelle ?</Text>
      <Text style={styles.subtitle}>Choisis ton avatar et ton prénom.</Text>

      <View style={styles.avatarRow}>
        {AVATARS.map((a) => (
          <PressScale key={a} scaleTo={0.9} onPress={() => setAvatar(a)} style={[styles.avatarChoice, avatar === a && styles.avatarChoiceOn]}>
            <Text style={{ fontSize: 26 }}>{a}</Text>
          </PressScale>
        ))}
      </View>

      <TextInput
        style={styles.nameInput}
        placeholder="Ton prénom"
        placeholderTextColor={colors.whiteA30}
        value={name}
        onChangeText={setName}
      />

      <View style={styles.footer}>
        <GlowButton label="Terminer →" onPress={onFinish} disabled={!name.trim()} />
      </View>
    </Animated.View>
  );
}

export default function SignUpScreen({ onComplete }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {step === 'phone' && <PhoneStep phone={phone} setPhone={setPhone} onNext={() => setStep('otp')} />}
        {step === 'otp' && <OtpStep phone={phone} otp={otp} setOtp={setOtp} onNext={() => setStep('profile')} onBack={() => setStep('phone')} />}
        {step === 'profile' && (
          <ProfileStep name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} onFinish={() => onComplete?.({ phone, name, avatar })} />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink },
  stepBody: { flex: 1, paddingHorizontal: spacing.huge, paddingTop: spacing.giant },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.whiteA08, borderWidth: 1, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl },
  eyebrow: { fontFamily: fontFamily.bodyBold, fontSize: 9, letterSpacing: 1.5, color: colors.green, textTransform: 'uppercase', marginBottom: spacing.sm },
  title: { fontFamily: fontFamily.displayBlack, fontSize: 22, color: colors.white, letterSpacing: -0.5, marginBottom: spacing.md },
  subtitle: { fontSize: 12, color: colors.whiteA40, marginBottom: spacing.giant, lineHeight: 18 },

  phoneRow: { flexDirection: 'row', gap: spacing.md },
  dialCode: { height: 52, paddingHorizontal: spacing.xl, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  dialCodeText: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.white },
  phoneInput: { flex: 1, height: 52, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xl, fontFamily: fontFamily.bodyRegular, fontSize: 15, color: colors.white, letterSpacing: 1 },

  otpRow: { flexDirection: 'row', gap: spacing.lg, justifyContent: 'center' },
  otpBox: { width: 52, height: 60, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, alignItems: 'center', justifyContent: 'center' },
  otpBoxActive: { borderColor: colors.greenA30 },
  otpDigit: { fontFamily: fontFamily.displayBlack, fontSize: 22, color: colors.white },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  resendText: { fontSize: 12, fontWeight: '600', color: colors.green },

  avatarRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
  avatarChoice: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.whiteA06, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  avatarChoiceOn: { borderColor: colors.green, backgroundColor: colors.greenA10 },
  nameInput: { height: 52, borderRadius: radius.lg, backgroundColor: colors.whiteA06, borderWidth: 1.5, borderColor: colors.whiteA12, paddingHorizontal: spacing.xl, fontFamily: fontFamily.bodyRegular, fontSize: 15, color: colors.white },

  footer: { marginTop: 'auto', paddingBottom: spacing.xxl },
});

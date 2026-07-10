import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PressScale from '../components/PressScale';
import GlowButton from '../components/GlowButton';
import ProfileAvatar from '../components/ProfileAvatar';
import AppScreen, { appUi } from '../components/AppScreen';
import { useToast } from '../components/Toast';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing } from '../theme';
import { COUNTRIES } from '../i18n/countries';
import { toE164, isValidLocalPhone } from '../lib/phone';

function countryFromProfilePhone(phone) {
  if (phone?.startsWith('+1')) return COUNTRIES.find((c) => c.code === 'US') ?? COUNTRIES[0];
  if (phone?.startsWith('+33')) return COUNTRIES.find((c) => c.code === 'FR') ?? COUNTRIES[0];
  if (phone?.startsWith('+221')) return COUNTRIES.find((c) => c.code === 'SN') ?? COUNTRIES[0];
  return COUNTRIES.find((c) => c.code === 'SN') ?? COUNTRIES[0];
}
import { mePhoneConfirm, mePhoneRequest, patchMe } from '../lib/api-client';
import { pickProfilePhoto } from '../lib/profile-photo';

function formatPhoneDisplay(phone) {
  if (!phone) return '—';
  return phone.replace(/(\+\d{1,3})(\d+)/, '$1 $2');
}

export default function EditProfileScreen({ navigation }) {
  const { profile, setProfile } = useAppState();
  const { showToast } = useToast();
  const [email, setEmail] = useState(profile.email ?? '');
  const [country] = useState(countryFromProfilePhone(profile.phone));
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState('idle');
  const [pendingPhone, setPendingPhone] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const changePhoto = async () => {
    setPhotoLoading(true);
    try {
      const dataUrl = await pickProfilePhoto();
      if (!dataUrl) return;
      const updated = await patchMe({ avatarUrl: dataUrl });
      setProfile({ avatarUrl: updated.avatarUrl ?? dataUrl, avatarEmoji: updated.avatarEmoji });
      showToast('Photo enregistrée ✓');
    } catch (err) {
      showToast(err.message ?? 'Photo impossible');
    } finally {
      setPhotoLoading(false);
    }
  };

  const removePhoto = async () => {
    setPhotoLoading(true);
    try {
      const updated = await patchMe({ avatarUrl: null });
      setProfile({ avatarUrl: updated.avatarUrl ?? null });
      showToast('Photo retirée');
    } catch (err) {
      showToast(err.message ?? 'Mise à jour impossible');
    } finally {
      setPhotoLoading(false);
    }
  };

  const saveEmail = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      showToast('Email invalide');
      return;
    }
    setLoading(true);
    try {
      const updated = await patchMe({ email: trimmed });
      setProfile({ email: updated.email });
      showToast('Email enregistré ✓');
    } catch (err) {
      showToast(err.message ?? 'Mise à jour impossible');
    } finally {
      setLoading(false);
    }
  };

  const requestPhoneChange = async () => {
    if (!isValidLocalPhone(country, newPhone)) {
      showToast('Numéro invalide');
      return;
    }
    const normalized = toE164(country, newPhone);
    setLoading(true);
    try {
      const res = await mePhoneRequest(normalized);
      setPendingPhone(res.phoneNormalized ?? normalized);
      if (res.otp) setDevOtp(String(res.otp));
      setPhoneStep('otp');
      showToast('Code envoyé au nouveau numéro');
    } catch (err) {
      showToast(err.message ?? 'Envoi impossible');
    } finally {
      setLoading(false);
    }
  };

  const confirmPhoneChange = async () => {
    if (otp.replace(/\D/g, '').length !== 6) {
      showToast('Entre les 6 chiffres');
      return;
    }
    setLoading(true);
    try {
      const updated = await mePhoneConfirm(pendingPhone, otp.replace(/\D/g, ''));
      setProfile({ phone: updated.phone });
      setPhoneStep('idle');
      setNewPhone('');
      setOtp('');
      setDevOtp(null);
      showToast('Numéro mis à jour ✓');
    } catch (err) {
      showToast(err.message ?? 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <PressScale scaleTo={0.9} onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{ fontSize: 16, color: colors.appCanvas.text }}>←</Text>
          </PressScale>
          <Text style={styles.headerTitle}>Mon compte</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Photo de profil</Text>
          <View style={[styles.card, styles.photoCard]}>
            <PressScale scaleTo={0.96} onPress={changePhoto} disabled={photoLoading} style={styles.photoWrap}>
              <ProfileAvatar emoji={profile.avatarEmoji} photoUrl={profile.avatarUrl} size={88} />
              <View style={styles.photoAdd}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: colors.ink }}>+</Text>
              </View>
            </PressScale>
            <Text style={styles.hint}>Visible sur ton profil Moi et l&apos;écran de confirmation avant envoi.</Text>
            <GlowButton
              label={photoLoading ? '…' : profile.avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
              onPress={changePhoto}
              disabled={photoLoading}
            />
            {profile.avatarUrl ? (
              <PressScale scaleTo={0.95} onPress={removePhoto} style={{ alignSelf: 'center' }}>
                <Text style={styles.link}>Retirer la photo</Text>
              </PressScale>
            ) : null}
          </View>

          <Text style={styles.sectionLabel}>Identité</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Nom</Text>
            <Text style={styles.fieldValue}>{profile.name || '—'}</Text>
            <Text style={styles.fieldLabel}>@handle</Text>
            <Text style={styles.fieldValue}>@{String(profile.handle ?? '').replace(/^@+/, '') || '—'}</Text>
          </View>

          <Text style={styles.sectionLabel}>Téléphone</Text>
          <View style={styles.card}>
            <Text style={styles.fieldLabel}>Numéro actuel</Text>
            <Text style={styles.fieldValue}>{formatPhoneDisplay(profile.phone)}</Text>
            <Text style={styles.hint}>
              Tu as changé de SIM ? Mets à jour ton numéro ici. On envoie un code au nouveau numéro pour confirmer.
            </Text>

            {phoneStep === 'idle' ? (
              <>
                <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Nouveau numéro</Text>
                <View style={styles.phoneRow}>
                  <Text style={styles.dial}>{country?.dial ?? '+221'}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="77 000 00 00"
                    placeholderTextColor={'rgba(5,8,5,0.4)'}
                    keyboardType="number-pad"
                    value={newPhone}
                    onChangeText={(v) => setNewPhone(v.replace(/[^0-9]/g, ''))}
                    maxLength={country?.code === 'US' ? 11 : 12}
                  />
                </View>
                <GlowButton
                  label={loading ? 'Envoi…' : 'Envoyer le code au nouveau numéro'}
                  onPress={requestPhoneChange}
                  disabled={loading || !newPhone}
                />
              </>
            ) : (
              <>
                <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Code SMS · {pendingPhone}</Text>
                {devOtp ? (
                  <View style={styles.devOtp}>
                    <Text style={styles.devOtpLabel}>Code beta</Text>
                    <Text style={styles.devOtpCode}>{devOtp}</Text>
                  </View>
                ) : null}
                <TextInput
                  style={styles.input}
                  placeholder="000000"
                  placeholderTextColor={'rgba(5,8,5,0.4)'}
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                />
                <GlowButton label={loading ? '…' : 'Confirmer le nouveau numéro'} onPress={confirmPhoneChange} disabled={loading} />
                <PressScale scaleTo={0.95} onPress={() => setPhoneStep('idle')} style={{ alignSelf: 'center', marginTop: spacing.md }}>
                  <Text style={styles.link}>Annuler</Text>
                </PressScale>
              </>
            )}
          </View>

          <Text style={styles.sectionLabel}>Email</Text>
          <View style={styles.card}>
            <Text style={styles.hint}>Utilise ton email pour te reconnecter si tu changes de numéro.</Text>
            <TextInput
              style={styles.input}
              placeholder="ton@email.com"
              placeholderTextColor={'rgba(5,8,5,0.4)'}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
            <GlowButton label={loading ? '…' : 'Enregistrer l\'email'} onPress={saveEmail} disabled={loading} />
          </View>

          <Text style={styles.sectionLabel}>Solde par SMS</Text>
          <View style={styles.card}>
            <Text style={styles.hint}>
              Envoie <Text style={styles.bold}>SOLDE</Text> au numéro K21 pour voir ton solde — on ne t'envoie pas de SMS sauf si tu le demandes.
            </Text>
          </View>

          {loading ? <ActivityIndicator color={colors.green} style={{ marginTop: spacing.lg }} /> : null}
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: spacing.xxl, paddingVertical: spacing.lg },
  backBtn: { width: 36, height: 36, borderRadius: radius.lg, backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.appCanvas.border, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: fontFamily.displayBold, fontSize: 16, color: colors.appCanvas.text },
  body: { padding: spacing.xxl, paddingBottom: spacing.giant, gap: spacing.md },
  sectionLabel: { ...appUi.sectionLabel, marginTop: spacing.md },
  card: { backgroundColor: colors.appCanvas.surface, borderWidth: 1, borderColor: colors.appCanvas.border, borderRadius: radius.xl, padding: spacing.xl, gap: spacing.sm },
  photoCard: { alignItems: 'center' },
  photoWrap: { position: 'relative', marginBottom: spacing.sm },
  photoAdd: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.appCanvas.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: { fontSize: 10, color: colors.appCanvas.textFaint, fontWeight: '700' },
  fieldValue: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.appCanvas.text, marginBottom: spacing.sm },
  hint: { fontSize: 11, color: colors.appCanvas.textMuted, lineHeight: 16, marginBottom: spacing.sm },
  bold: { fontFamily: fontFamily.bodyBold, color: colors.greenDark },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  dial: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.appCanvas.text },
  input: {
    flex: 1,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.appCanvas.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.appCanvas.border,
    paddingHorizontal: spacing.lg,
    fontSize: 15,
    color: colors.appCanvas.text,
    marginBottom: spacing.md,
  },
  devOtp: { backgroundColor: colors.orangeA10, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md },
  devOtpLabel: { fontSize: 10, color: colors.orange, fontWeight: '700' },
  devOtpCode: { fontFamily: fontFamily.displayBlack, fontSize: 24, color: colors.orange, letterSpacing: 4 },
  link: { fontSize: 12, color: colors.greenDark, fontWeight: '700' },
});

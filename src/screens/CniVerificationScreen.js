import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import ScreenBackground from '../components/ScreenBackground';
import ScreenHeader from '../components/ScreenHeader';
import GlowButton from '../components/GlowButton';
import PressScale from '../components/PressScale';
import { useToast } from '../components/Toast';
import { kycStatus, kycSubmitCni } from '../lib/api-client';
import { pickMboloImage, takeMboloPhoto } from '../lib/mbolo-media';
import { useAppState } from '../state/AppState';
import { colors, fontFamily, radius, spacing, type } from '../theme';

const TIER_LABELS = {
  1: 'Téléphone seulement',
  2: 'CNI vérifiée',
  3: 'Adresse vérifiée',
};

function PhotoSlot({ label, hint, value, onPick, onCamera }) {
  return (
    <View style={styles.photoSlot}>
      <Text style={styles.photoLabel}>{label}</Text>
      <Text style={styles.photoHint}>{hint}</Text>
      {value ? (
        <View style={styles.photoDone}>
          <Text style={styles.photoDoneText}>✓ Photo prête</Text>
          <PressScale scaleTo={0.97} onPress={onPick}>
            <Text style={styles.photoRetake}>Changer</Text>
          </PressScale>
        </View>
      ) : (
        <View style={styles.photoActions}>
          <PressScale scaleTo={0.96} onPress={onCamera} style={styles.photoBtn}>
            <Text style={styles.photoBtnIcon}>📷</Text>
            <Text style={styles.photoBtnText}>Caméra</Text>
          </PressScale>
          <PressScale scaleTo={0.96} onPress={onPick} style={styles.photoBtn}>
            <Text style={styles.photoBtnIcon}>🖼️</Text>
            <Text style={styles.photoBtnText}>Galerie</Text>
          </PressScale>
        </View>
      )}
    </View>
  );
}

export default function CniVerificationScreen({ navigation }) {
  const showToast = useToast();
  const { refreshWallet } = useAppState();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [selfieImage, setSelfieImage] = useState(null);

  const reloadStatus = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await kycStatus());
    } catch (err) {
      showToast(err.message ?? 'Statut KYC indisponible');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    reloadStatus();
  }, [reloadStatus]);

  const pickImage = async (setter, useCamera = false) => {
    try {
      if (Platform.OS !== 'web') {
        const perm = useCamera
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          showToast('Autorise la caméra ou les photos dans les réglages');
          return;
        }
      }
      const dataUrl = useCamera ? await takeMboloPhoto() : await pickMboloImage();
      if (dataUrl) setter(dataUrl);
    } catch (err) {
      showToast(err.message ?? 'Photo impossible');
    }
  };

  const submit = async () => {
    if (!frontImage || !backImage) {
      showToast('Ajoute le recto et le verso de ta CNI');
      return;
    }
    setSubmitting(true);
    try {
      const result = await kycSubmitCni({ frontImage, backImage, selfieImage: selfieImage ?? undefined });
      await reloadStatus();
      await refreshWallet().catch(() => {});
      showToast(result.message ?? 'Vérification envoyée');
      if (result.status === 'approved') {
        navigation.goBack();
      }
    } catch (err) {
      showToast(err.message ?? 'Envoi CNI impossible');
    } finally {
      setSubmitting(false);
    }
  };

  const tier = status?.verificationTier ?? 1;
  const verified = tier >= 2;
  const pending = status?.verificationStatus === 'cni_pending' || status?.latestCniJob?.status === 'pending';

  return (
    <View style={styles.root}>
      <ScreenBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ScreenHeader onBack={() => navigation.goBack()} eyebrow="COMPTE & SÉCURITÉ" title="Vérifier ta CNI" />

          {loading ? (
            <ActivityIndicator color={colors.greenDark} style={{ marginTop: spacing.xxl }} />
          ) : (
            <>
              <View style={styles.statusCard}>
                <Text style={styles.statusTier}>Tier {tier} · {TIER_LABELS[tier] ?? '—'}</Text>
                {verified ? (
                  <Text style={styles.statusOk}>✓ Identité vérifiée — retraits et envois illimités</Text>
                ) : pending ? (
                  <Text style={styles.statusPending}>⏳ Vérification en cours — sous 24h en général</Text>
                ) : (
                  <Text style={styles.statusHint}>
                    Sans CNI : envois limités à 10 000 F/jour · pas de retrait Cash.
                  </Text>
                )}
                {status?.latestCniJob?.failureReason ? (
                  <Text style={styles.statusError}>{status.latestCniJob.failureReason}</Text>
                ) : null}
              </View>

              {!verified && !pending ? (
                <>
                  <Text style={styles.sectionTitle}>Photos de ta carte nationale</Text>
                  <PhotoSlot
                    label="Recto CNI"
                    hint="Photo nette, sans reflet"
                    value={frontImage}
                    onPick={() => pickImage(setFrontImage, false)}
                    onCamera={() => pickImage(setFrontImage, true)}
                  />
                  <PhotoSlot
                    label="Verso CNI"
                    hint="Toutes les informations visibles"
                    value={backImage}
                    onPick={() => pickImage(setBackImage, false)}
                    onCamera={() => pickImage(setBackImage, true)}
                  />
                  <PhotoSlot
                    label="Selfie (optionnel)"
                    hint="Renforce la vérification"
                    value={selfieImage}
                    onPick={() => pickImage(setSelfieImage, false)}
                    onCamera={() => pickImage(setSelfieImage, true)}
                  />

                  <GlowButton
                    label={submitting ? 'Envoi…' : 'Envoyer pour vérification →'}
                    onPress={submit}
                    disabled={submitting || !frontImage || !backImage}
                    style={{ marginTop: spacing.xl }}
                  />

                  <PressScale scaleTo={0.97} onPress={() => navigation.goBack()} style={styles.skipBtn}>
                    <Text style={styles.skipText}>Plus tard — je reste au Tier 1</Text>
                  </PressScale>
                </>
              ) : verified ? (
                <GlowButton label="Retour" onPress={() => navigation.goBack()} style={{ marginTop: spacing.xl }} />
              ) : (
                <GlowButton label="Actualiser" onPress={reloadStatus} style={{ marginTop: spacing.xl }} />
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
  scroll: { paddingHorizontal: spacing.huge, paddingBottom: spacing.giant },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },
  statusTier: { ...type.eyebrow, color: colors.greenDark },
  statusOk: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.greenDark, lineHeight: 18 },
  statusPending: { fontSize: 13, color: colors.goldDark, lineHeight: 18 },
  statusHint: { fontSize: 12, color: 'rgba(5,8,5,0.55)', lineHeight: 18 },
  statusError: { fontSize: 11, color: colors.terracottaDark, marginTop: spacing.sm },
  sectionTitle: { ...type.eyebrow, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.lg },
  photoSlot: {
    backgroundColor: 'rgba(255,255,255,0.65)',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.08)',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  photoLabel: { fontFamily: fontFamily.bodyBold, fontSize: 13, color: colors.ink },
  photoHint: { fontSize: 10, color: 'rgba(5,8,5,0.45)', marginBottom: spacing.sm },
  photoActions: { flexDirection: 'row', gap: spacing.md },
  photoBtn: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.greenA08,
    borderWidth: 1,
    borderColor: colors.greenA20,
  },
  photoBtnIcon: { fontSize: 22 },
  photoBtnText: { fontSize: 11, fontFamily: fontFamily.bodyBold, color: colors.greenDark },
  photoDone: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoDoneText: { fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.greenDark },
  photoRetake: { fontSize: 11, color: colors.terracottaDark, fontFamily: fontFamily.bodyBold },
  skipBtn: { alignSelf: 'center', marginTop: spacing.xl, padding: spacing.md },
  skipText: { fontSize: 12, color: 'rgba(5,8,5,0.45)' },
});

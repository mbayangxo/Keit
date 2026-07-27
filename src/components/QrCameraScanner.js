import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import PressScale from './PressScale';
import GlowButton from './GlowButton';
import { colors, fontFamily, radius, spacing } from '../theme';

/**
 * Live QR scanner — native iOS/Android. Web falls back to paste-only (no getUserMedia in export).
 */
export default function QrCameraScanner({ onScan, paused = false }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const lastScanRef = useRef(0);

  const handleBarcode = useCallback(
    ({ data }) => {
      if (paused || !data) return;
      const now = Date.now();
      if (now - lastScanRef.current < 1800) return;
      lastScanRef.current = now;
      onScan?.(String(data).trim());
    },
    [onScan, paused],
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webFallback}>
        <Text style={styles.webIcon}>📷</Text>
        <Text style={styles.webText}>
          Scanner caméra disponible sur l’app mobile K21. Sur le web, colle le code QR ci-dessous.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.greenDark} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permBox}>
        <Text style={styles.permTitle}>Accès caméra</Text>
        <Text style={styles.permSub}>K21 a besoin de la caméra pour scanner les QR de paiement et dépôt agent.</Text>
        <GlowButton label="Autoriser la caméra" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={paused ? undefined : handleBarcode}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Cadre le QR dans le carré</Text>
        <PressScale scaleTo={0.94} onPress={() => setTorch((t) => !t)} style={styles.torchBtn}>
          <Text style={styles.torchText}>{torch ? '🔦 Lampe · ON' : '🔦 Lampe'}</Text>
        </PressScale>
      </View>
    </View>
  );
}

const FRAME = 220;

const styles = StyleSheet.create({
  wrap: { height: 280, borderRadius: radius.xl, overflow: 'hidden', backgroundColor: colors.ink, marginBottom: spacing.lg },
  center: { height: 280, alignItems: 'center', justifyContent: 'center' },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.green,
    backgroundColor: 'transparent',
    shadowColor: colors.green,
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  hint: {
    position: 'absolute',
    bottom: spacing.lg,
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  torchBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: radius.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  torchText: { fontFamily: fontFamily.bodyBold, fontSize: 11, color: '#fff' },
  permBox: {
    height: 280,
    borderRadius: radius.xl,
    backgroundColor: colors.greenA08,
    borderWidth: 1,
    borderColor: colors.greenA20,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  permTitle: { fontFamily: fontFamily.display, fontSize: 18, color: colors.ink, marginBottom: spacing.sm },
  permSub: { fontFamily: fontFamily.body, fontSize: 12, color: colors.appCanvas.textMuted, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
  webFallback: {
    borderRadius: radius.xl,
    backgroundColor: colors.greenA08,
    borderWidth: 1,
    borderColor: colors.greenA20,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  webIcon: { fontSize: 32, marginBottom: spacing.sm },
  webText: { fontFamily: fontFamily.body, fontSize: 12, color: colors.appCanvas.textMuted, textAlign: 'center', lineHeight: 18 },
});

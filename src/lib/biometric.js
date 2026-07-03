import * as LocalAuthentication from 'expo-local-authentication';

export async function canUseBiometrics() {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function authenticateWithBiometrics(prompt = 'Déverrouille K21') {
  const can = await canUseBiometrics();
  if (!can) return { success: false, reason: 'unavailable' };

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: prompt,
    cancelLabel: 'Utiliser le PIN',
    disableDeviceFallback: true,
    fallbackLabel: 'PIN',
  });

  return { success: result.success, reason: result.error };
}

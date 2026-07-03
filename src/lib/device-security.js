import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Jailbreak/root detection requires native modules in production EAS builds.
 * This check flags emulators and documents the risk for real devices.
 */
export async function assessDeviceRisk() {
  if (!Device.isDevice) {
    return {
      compromised: false,
      warning: 'Simulateur détecté — certaines protections sont désactivées.',
      level: 'simulator',
    };
  }

  // Placeholder for production: integrate jail-monkey or equivalent via config plugin.
  return { compromised: false, warning: null, level: 'ok' };
}

export function DeviceRiskBanner({ risk }) {
  if (!risk?.warning) return null;
  return risk;
}

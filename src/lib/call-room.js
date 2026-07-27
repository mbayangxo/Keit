import { Platform } from 'react-native';

/**
 * Native Mboolo calls need @livekit/react-native + a custom dev build (not Expo Go).
 * Web uses call-room.web.js via Metro platform resolution.
 */

export const callsSupported = Platform.OS === 'web';

export function createCallSession() {
  if (Platform.OS === 'web') {
    throw new Error('call-room.web.js should be used on web');
  }
  throw new Error(
    'Les appels Mboolo fonctionnent sur K21 web (navigateur). Sur l’app mobile, ouvre keit-six.vercel.app dans Chrome ou Safari.',
  );
}

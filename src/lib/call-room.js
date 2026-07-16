/**
 * Native fallback for Mboolo calls. livekit-client needs browser WebRTC —
 * on iOS/Android that requires @livekit/react-native + a custom dev build
 * (not Expo Go). Until that build exists, native shows an honest message
 * and web carries the calls. Same API surface as call-room.web.js.
 */

export const callsSupported = false;

export function createCallSession() {
  throw new Error('Les appels arrivent sur mobile — utilise K21 web pour l’instant.');
}

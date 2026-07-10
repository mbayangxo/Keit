import { Alert, Platform } from 'react-native';
import { pickMboloImage, takeMboloPhoto } from './mbolo-media';

/** Pick a square profile photo — library or camera. Returns data URL or null. */
export function pickProfilePhoto() {
  if (Platform.OS === 'web') {
    return pickMboloImage();
  }

  return new Promise((resolve) => {
    Alert.alert('Photo de profil', 'Choisis une source', [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(null) },
      {
        text: 'Galerie',
        onPress: () => {
          pickMboloImage().then(resolve).catch(() => resolve(null));
        },
      },
      {
        text: 'Caméra',
        onPress: () => {
          takeMboloPhoto().then(resolve).catch(() => resolve(null));
        },
      },
    ]);
  });
}

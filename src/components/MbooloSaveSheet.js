import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';

export default function MbooloSaveSheet({ visible, onClose, onSaveVault, onSaveProfile, onEphemeral }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Enregistrer ce média</Text>
          <Text style={styles.sub}>Choisis où garder ce souvenir — lié à ton Rec K21</Text>
          <PressScale scaleTo={0.98} onPress={onSaveVault} style={styles.btn}>
            <Text style={styles.btnText}>📦 Sauver dans Rec</Text>
            <Text style={styles.btnSub}>Coffre privé — compte dans ton quota</Text>
          </PressScale>
          <PressScale scaleTo={0.98} onPress={onSaveProfile} style={styles.btn}>
            <Text style={styles.btnText}>✨ Afficher sur mon profil</Text>
            <Text style={styles.btnSub}>Visible sur ton Rec public</Text>
          </PressScale>
          {onEphemeral ? (
            <PressScale scaleTo={0.98} onPress={onEphemeral} style={styles.btnMuted}>
              <Text style={styles.btnText}>⏱ Disparaît en 24h</Text>
            </PressScale>
          ) : null}
          <PressScale scaleTo={0.98} onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Annuler</Text>
          </PressScale>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.mboolo.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  title: { fontFamily: fontFamily.bold, fontSize: 17, color: colors.mboolo.ink },
  sub: { fontSize: 12, color: colors.mboolo.ink3, marginBottom: spacing.sm },
  btn: {
    backgroundColor: colors.mboolo.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.mboolo.terraSoft,
  },
  btnMuted: {
    backgroundColor: colors.mboolo.bg,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  btnText: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.mboolo.ink },
  btnSub: { fontSize: 11, color: colors.mboolo.ink3, marginTop: 2 },
  cancel: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { fontFamily: fontFamily.semibold, color: colors.mboolo.ink2 },
});

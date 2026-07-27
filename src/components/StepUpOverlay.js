import { Modal, StyleSheet, View } from 'react-native';
import PinGateScreen from '../screens/PinGateScreen';

/** Full-screen PIN re-auth for large transfers (step-up). */
export default function StepUpOverlay({ visible, onCancel, onVerified }) {
  if (!visible) return null;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <View style={styles.root}>
        <PinGateScreen
          mode="stepup"
          title="Confirme ton PIN"
          subtitle="Montant élevé — entre ton PIN pour continuer."
          onSuccess={(stepUpToken) => onVerified?.(stepUpToken)}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f8ec' },
});

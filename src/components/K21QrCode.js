import { View, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { colors, radius } from '../theme';

export default function K21QrCode({ value, size = 200 }) {
  if (!value) return null;
  return (
    <View style={[styles.wrap, { width: size + 24, height: size + 24 }]}>
      <QRCode value={value} size={size} color={colors.ink} backgroundColor="#ffffff" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 12,
  },
});

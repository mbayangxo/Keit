import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fontFamily } from '../theme';

// The locked K21 mark from design/k21-logo-alive.html: K in green, a
// green->gold->orange gradient divider, "21" with 2 in gold and 1 in orange.
export default function K21Logo({ size = 96 }) {
  const kSize = size * 0.375;
  const lineWidth = size * 0.56;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.k, { fontSize: kSize, letterSpacing: -kSize * 0.05, lineHeight: kSize * 0.95 }]}>K</Text>
      <LinearGradient
        colors={['#1af060', '#fad836', '#e85c1a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.line, { width: lineWidth, height: Math.max(2, size * 0.03) }]}
      />
      <View style={styles.numsRow}>
        <Text style={[styles.num2, { fontSize: kSize, letterSpacing: -kSize * 0.04, lineHeight: kSize * 0.9 }]}>2</Text>
        <Text style={[styles.num1, { fontSize: kSize, lineHeight: kSize * 0.9 }]}>1</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  k: { fontFamily: fontFamily.displayBlack, color: '#1af060' },
  line: { borderRadius: 3, marginVertical: 6 },
  numsRow: { flexDirection: 'row', gap: 2 },
  num2: { fontFamily: fontFamily.displayBlack, color: '#fad836' },
  num1: { fontFamily: fontFamily.displayBlack, color: '#e85c1a' },
});

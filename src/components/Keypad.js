import { StyleSheet, Text, View } from 'react-native';
import PressScale from './PressScale';
import { colors, fontFamily, radius, spacing } from '../theme';
import { ob } from '../theme/onboarding';

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

export default function Keypad({ onDigit, onBackspace, variant = 'dark' }) {
  const light = variant === 'onboarding';
  return (
    <View style={styles.grid}>
      {ROWS.map((row, i) => (
        <View key={i} style={styles.row}>
          {row.map((key, j) => {
            if (key === '') return <View key={j} style={styles.key} />;
            const isBackspace = key === '⌫';
            return (
              <PressScale
                key={j}
                scaleTo={0.92}
                haptic={isBackspace ? 'medium' : 'light'}
                onPress={() => (isBackspace ? onBackspace() : onDigit(key))}
                style={[styles.key, light && styles.keyLight]}
              >
                <Text style={[styles.keyText, light && styles.keyTextLight, isBackspace && (light ? styles.backspaceLight : styles.backspaceText)]}>{key}</Text>
              </PressScale>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { width: '100%', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: {
    flex: 1,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.whiteA06,
    borderWidth: 1,
    borderColor: colors.whiteA08,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyLight: { backgroundColor: ob.surface, borderColor: ob.border },
  keyText: { fontFamily: fontFamily.displayBold, fontSize: 18, color: colors.white },
  keyTextLight: { color: ob.ink },
  backspaceText: { fontSize: 16, color: colors.whiteA55 },
  backspaceLight: { fontSize: 16, color: ob.muted },
});

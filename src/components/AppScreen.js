import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import ScreenBackground from './ScreenBackground';

/** Standard K21 screen shell — shared bright canvas on every screen. */
export default function AppScreen({ children, style, wax = true }) {
  return (
    <View style={[styles.root, style]}>
      <ScreenBackground wax={wax} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.appCanvas.base },
});

export const appUi = {
  text: { color: colors.appCanvas.text },
  textMuted: { color: colors.appCanvas.textMuted },
  textFaint: { color: colors.appCanvas.textFaint },
  card: {
    backgroundColor: colors.appCanvas.surface,
    borderWidth: 1,
    borderColor: colors.appCanvas.border,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.appCanvas.textFaint,
    textTransform: 'uppercase',
  },
};

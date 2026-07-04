import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, shadow } from '../theme';

const PHONE_MAX = 430;
const DESKTOP_BREAK = 768;

/** Centers the app in a phone frame on desktop web; full-bleed on mobile. */
export default function WebAppShell({ children }) {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= DESKTOP_BREAK;

  if (!isDesktopWeb) {
    return <View style={styles.mobile}>{children}</View>;
  }

  return (
    <View style={styles.desktopOuter}>
      <LinearGradient
        colors={['#0a1a0d', '#020402', '#050805']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.desktopFrame}>
        <View style={styles.phone}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: { flex: 1, backgroundColor: colors.ink, width: '100%' },
  desktopOuter: {
    flex: 1,
    backgroundColor: '#020402',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  desktopFrame: {
    width: '100%',
    maxWidth: PHONE_MAX + 32,
    paddingVertical: 24,
    paddingHorizontal: 16,
    flex: 1,
    maxHeight: 920,
    justifyContent: 'center',
  },
  phone: {
    flex: 1,
    maxHeight: 860,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.ink,
    borderWidth: 1,
    borderColor: colors.whiteA12,
    ...shadow.phoneFrame,
  },
});

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
        colors={['#f9fdf4', '#edf6e4', '#e2eed6']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.desktopFrame}>
        <View style={styles.phone}>{children}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mobile: { flex: 1, backgroundColor: '#f2f8ec', width: '100%' },
  desktopOuter: {
    flex: 1,
    backgroundColor: '#f2f8ec',
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
    backgroundColor: '#f2f8ec',
    borderWidth: 1,
    borderColor: 'rgba(5,8,5,0.12)',
    ...shadow.phoneFrame,
  },
});

import { useCallback, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { colors, fontsToLoad } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import { AppStateProvider } from './src/state/AppState';
import { PreferencesProvider } from './src/context/PreferencesContext';
import { LocaleProvider } from './src/context/LocaleContext';
import { SessionProvider } from './src/context/SessionContext';
import { SecurityProvider, useSecurity } from './src/context/SecurityContext';
import PinGateScreen from './src/screens/PinGateScreen';
import DeviceSecurityBanner from './src/components/DeviceSecurityBanner';
import { ToastProvider } from './src/components/Toast';
import { navigationIntegration, Sentry } from './src/lib/sentry';

function AppShell() {
  const { locked, pinReady, deviceRisk } = useSecurity();

  if (locked && pinReady) {
    return <PinGateScreen mode="unlock" onSuccess={() => {}} />;
  }

  return (
    <>
      <DeviceSecurityBanner risk={deviceRisk} />
      <RootNavigator />
    </>
  );
}

ExpoSplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.ink, card: colors.ink, border: colors.whiteA08 },
};

export default Sentry.wrap(function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const navigationRef = useRef(null);

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      await ExpoSplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayout}>
        <StatusBar style="light" />
        <NavigationContainer
          ref={navigationRef}
          theme={navTheme}
          onReady={() => navigationIntegration.registerNavigationContainer(navigationRef)}
        >
          <AppStateProvider>
            <SessionProvider>
              <PreferencesProvider>
                <LocaleProvider>
                  <SecurityProvider>
                    <ToastProvider>
                      <AppShell />
                    </ToastProvider>
                  </SecurityProvider>
                </LocaleProvider>
              </PreferencesProvider>
            </SessionProvider>
          </AppStateProvider>
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
});

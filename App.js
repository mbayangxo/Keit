import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { colors, fontsToLoad } from './src/theme';
import RootNavigator from './src/navigation/RootNavigator';
import BrandSplashScreen from './src/screens/SplashScreen';

ExpoSplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.ink, card: colors.ink, border: colors.whiteA08 },
};

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [brandSplashDone, setBrandSplashDone] = useState(false);

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
        {!brandSplashDone ? (
          <BrandSplashScreen onFinish={() => setBrandSplashDone(true)} />
        ) : (
          <NavigationContainer theme={navTheme}>
            <RootNavigator />
          </NavigationContainer>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
});

import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { colors, fontsToLoad } from './src/theme';
import HomeScreen from './src/screens/HomeScreen';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts(fontsToLoad);
  const [ready, setReady] = useState(false);

  const onLayout = useCallback(async () => {
    if (fontsLoaded) {
      setReady(true);
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <View style={styles.root} onLayout={onLayout}>
        <StatusBar style="light" />
        {ready && <HomeScreen />}
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

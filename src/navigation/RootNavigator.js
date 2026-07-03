import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignUpScreen from '../screens/SignUpScreen';
import WelcomeCelebrationScreen from '../screens/WelcomeCelebrationScreen';
import MainTabs from './MainTabs';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import PayMerchantScreen from '../screens/PayMerchantScreen';
import CashScreen from '../screens/CashScreen';
import MoreActionsScreen from '../screens/MoreActionsScreen';
import NuLekkScreen from '../screens/NuLekkScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import TontineScreen from '../screens/TontineScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import AccessibilityScreen from '../screens/AccessibilityScreen';
import PinGateScreen from '../screens/PinGateScreen';
import { useAppState } from '../state/AppState';
import { useSession } from '../context/SessionContext';
import { fetchSessionPayload } from '../lib/session';
import { isPinConfigured } from '../lib/secure-storage';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const { bootstrapped, hasSession, markSignedIn } = useSession();
  const { initAccount, hydrateFromApi } = useAppState();

  const enterApp = async (navigation) => {
    markSignedIn();
    const pin = await isPinConfigured();
    navigation.reset({
      index: 0,
      routes: [{ name: pin ? 'Main' : 'PinSetup' }],
    });
  };

  if (!bootstrapped) {
    return (
      <View style={bootStyles.root}>
        <ActivityIndicator color={colors.green} size="large" />
      </View>
    );
  }

  const stackKey = hasSession ? 'session' : 'guest';
  const initialRoute = hasSession ? 'Main' : 'Splash';

  return (
    <Stack.Navigator key={stackKey} screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Splash">
        {({ navigation }) => (
          <SplashScreen
            onCreateAccount={() => navigation.navigate('Welcome')}
            onHaveAccount={() => navigation.navigate('SignUp', { mode: 'login' })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Welcome">
        {({ navigation }) => <WelcomeScreen onComplete={() => navigation.navigate('Onboarding')} />}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {({ navigation }) => <OnboardingScreen onComplete={() => navigation.navigate('SignUp', { mode: 'signup' })} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {({ navigation, route }) => (
          <SignUpScreen
            mode={route.params?.mode ?? 'signup'}
            onCancel={() => navigation.goBack()}
            onLoginComplete={async () => {
              const payload = await fetchSessionPayload();
              hydrateFromApi(payload);
              await enterApp(navigation);
            }}
            onComplete={(profile) => {
              initAccount(profile);
              markSignedIn();
              navigation.replace('Celebration', profile);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Celebration">
        {({ navigation, route }) => (
          <WelcomeCelebrationScreen
            {...route.params}
            onEnter={() => navigation.replace('PinSetup')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PinSetup">
        {({ navigation }) => (
          <PinGateScreen
            mode="setup"
            onSetupComplete={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
      <Stack.Screen name="PayMerchant" component={PayMerchantScreen} />
      <Stack.Screen name="Cash" component={CashScreen} />
      <Stack.Screen name="MoreActions" component={MoreActionsScreen} />
      <Stack.Screen name="NuLekk" component={NuLekkScreen} />
      <Stack.Screen name="Receive" component={ReceiveScreen} />
      <Stack.Screen name="Tontine" component={TontineScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Accessibility" component={AccessibilityScreen} />
      <Stack.Screen name="Info" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}

const bootStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
});

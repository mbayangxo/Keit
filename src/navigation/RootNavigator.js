import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AccountTypeScreen from '../screens/AccountTypeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignUpScreen from '../screens/SignUpScreen';
import BusinessSignUpScreen from '../screens/BusinessSignUpScreen';
import WelcomeCelebrationScreen from '../screens/WelcomeCelebrationScreen';
import BusinessDashboardScreen from '../screens/BusinessDashboardScreen';
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
  const { profile, initAccount, initBusinessAccount, hydrateFromApi } = useAppState();

  const mainRouteFor = (accountType) => (accountType === 'business' ? 'BusinessMain' : 'Main');

  const enterApp = async (navigation, accountType = profile.accountType) => {
    markSignedIn();
    const pin = await isPinConfigured();
    const mainRoute = mainRouteFor(accountType);
    navigation.reset({
      index: 0,
      routes: [{ name: pin ? mainRoute : 'PinSetup' }],
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
  const initialRoute = hasSession ? mainRouteFor(profile.accountType) : 'Splash';

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
        {({ navigation }) => <WelcomeScreen onComplete={() => navigation.navigate('AccountType')} />}
      </Stack.Screen>
      <Stack.Screen name="AccountType">
        {({ navigation }) => (
          <AccountTypeScreen onSelect={(accountType) => navigation.navigate('Onboarding', { accountType })} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {({ navigation, route }) => (
          <OnboardingScreen
            onComplete={() =>
              route.params?.accountType === 'business' ? navigation.navigate('BusinessSignUp') : navigation.navigate('SignUp', { mode: 'signup' })
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {({ navigation, route }) => (
          <SignUpScreen
            mode={route.params?.mode ?? 'signup'}
            onCancel={() => navigation.goBack()}
            onLoginComplete={async () => {
              const payload = await fetchSessionPayload();
              hydrateFromApi(payload);
              await enterApp(navigation, payload.profile?.accountType);
            }}
            onComplete={(signupProfile) => {
              initAccount(signupProfile);
              markSignedIn();
              navigation.replace('Celebration', signupProfile);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="BusinessSignUp">
        {({ navigation }) => (
          <BusinessSignUpScreen
            onComplete={(signupProfile) => {
              initBusinessAccount(signupProfile);
              markSignedIn();
              navigation.replace('Celebration', { ...signupProfile, accountType: 'business', businessName: signupProfile.businessName });
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Celebration">
        {({ navigation, route }) => (
          <WelcomeCelebrationScreen
            {...route.params}
            accountType={route.params?.accountType ?? profile.accountType}
            afriId={profile.afriId}
            keboId={profile.business?.keboId}
            onEnter={() => navigation.replace('PinSetup')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="PinSetup">
        {({ navigation }) => (
          <PinGateScreen
            mode="setup"
            onSetupComplete={() =>
              navigation.reset({ index: 0, routes: [{ name: mainRouteFor(profile.accountType) }] })
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="BusinessMain" component={BusinessDashboardScreen} />
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

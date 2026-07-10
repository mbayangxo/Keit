import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AppLoadingScreen from '../screens/AppLoadingScreen';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import AccountTypeScreen from '../screens/AccountTypeScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignUpScreen from '../screens/SignUpScreen';
import BusinessSignUpScreen from '../screens/BusinessSignUpScreen';
import WelcomeCelebrationScreen from '../screens/WelcomeCelebrationScreen';
import BusinessHubScreen from '../screens/BusinessHubScreen';
import AccessibilityScreen from '../screens/AccessibilityScreen';
import MainTabs from './MainTabs';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import PayMerchantScreen from '../screens/PayMerchantScreen';
import CashScreen from '../screens/CashScreen';
import MoreActionsScreen from '../screens/MoreActionsScreen';
import MovementScreen from '../screens/MovementScreen';
import NuLekkScreen from '../screens/NuLekkScreen';
import ReceiveScreen from '../screens/ReceiveScreen';
import TontineScreen from '../screens/TontineScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import QrScanScreen from '../screens/QrScanScreen';
import MyQrScreen from '../screens/MyQrScreen';
import FriendsScreen from '../screens/FriendsScreen';
import StudentPassScreen from '../screens/StudentPassScreen';
import PinGateScreen from '../screens/PinGateScreen';
import ForgotAccessScreen from '../screens/ForgotAccessScreen';
import { useAppState } from '../state/AppState';
import { useSession } from '../context/SessionContext';
import { fetchSessionPayload } from '../lib/session';
import { isPinConfigured } from '../lib/secure-storage';

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
    return <AppLoadingScreen />;
  }

  const stackKey = hasSession ? 'session' : 'guest';
  const initialRoute = hasSession ? mainRouteFor(profile.accountType) : 'Splash';

  return (
    <Stack.Navigator key={stackKey} screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen name="Splash">
        {({ navigation }) => (
          <SplashScreen
            onCreateAccount={() => navigation.navigate('Welcome')}
            onHaveAccount={() => navigation.replace('SignUp', { mode: 'login' })}
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
            key={route.params?.mode ?? 'signup'}
            mode={route.params?.mode ?? 'signup'}
            onCancel={() => navigation.goBack()}
            onForgot={() => navigation.navigate('ForgotAccess')}
            onSwitchToSignup={() => navigation.replace('SignUp', { mode: 'signup' })}
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
      <Stack.Screen name="ForgotAccess">
        {({ navigation }) => (
          <ForgotAccessScreen
            onCancel={() => navigation.goBack()}
            onRecovered={async () => {
              const payload = await fetchSessionPayload();
              hydrateFromApi(payload);
              markSignedIn();
              navigation.replace('PinSetup');
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="BusinessSignUp">
        {({ navigation }) => (
          <BusinessSignUpScreen
            onCancel={() => navigation.goBack()}
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
            keboId={route.params?.kebuId ?? route.params?.keboId ?? profile.business?.kebuId}
            afriId={route.params?.afriId ?? profile.afriId}
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
      <Stack.Screen name="BusinessMain" component={BusinessHubScreen} />
      <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
      <Stack.Screen name="PayMerchant" component={PayMerchantScreen} />
      <Stack.Screen name="Cash" component={CashScreen} />
      <Stack.Screen name="MoreActions" component={MoreActionsScreen} />
      <Stack.Screen name="Movement" component={MovementScreen} />
      <Stack.Screen name="NuLekk" component={NuLekkScreen} />
      <Stack.Screen name="Receive" component={ReceiveScreen} />
      <Stack.Screen name="Tontine" component={TontineScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Accessibility" component={AccessibilityScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="QrScan" component={QrScanScreen} />
      <Stack.Screen name="MyQr" component={MyQrScreen} />
      <Stack.Screen name="StudentPass" component={StudentPassScreen} />
      <Stack.Screen name="Friends" component={FriendsScreen} />
      <Stack.Screen name="Info" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}

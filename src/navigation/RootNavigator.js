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
import { useAppState } from '../state/AppState';

const Stack = createNativeStackNavigator();

// First-run sequence, matching design/k21-onboarding.html's 9 screens:
// Splash -> Welcome (3 value-prop slides) -> AccountType (personal vs
// business — new branch point, not in any prototype) -> Onboarding
// (country + language) -> SignUp or BusinessSignUp -> Celebration ->
// Main or BusinessMain. No persistence yet, so this always runs on cold
// start; `navigation.reset` on completion clears it all from the back stack.
export default function RootNavigator() {
  const { profile, initAccount, initBusinessAccount } = useAppState();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
      <Stack.Screen name="Splash">
        {({ navigation }) => (
          <SplashScreen
            onCreateAccount={() => navigation.navigate('Welcome')}
            onHaveAccount={() =>
              navigation.navigate('Info', { title: 'Se connecter', subtitle: 'La connexion à un compte existant arrive bientôt — crée un compte pour l’instant.', icon: '🔑' })
            }
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
              route.params?.accountType === 'business' ? navigation.navigate('BusinessSignUp') : navigation.navigate('SignUp')
            }
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {({ navigation }) => (
          <SignUpScreen
            onComplete={(signupProfile) => {
              initAccount(signupProfile);
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
              navigation.replace('Celebration', signupProfile);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Celebration">
        {({ navigation, route }) => (
          <WelcomeCelebrationScreen
            {...route.params}
            accountType={profile.accountType}
            afriId={profile.afriId}
            keboId={profile.business?.keboId}
            onEnter={() =>
              navigation.reset({ index: 0, routes: [{ name: profile.accountType === 'business' ? 'BusinessMain' : 'Main' }] })
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
      {/* Generic params-driven placeholder for smaller destinations
          (edit profile, settings rows, compose, etc.) not yet built out. */}
      <Stack.Screen name="Info" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}

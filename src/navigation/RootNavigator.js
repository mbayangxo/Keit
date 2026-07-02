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
import { useAppState } from '../state/AppState';

const Stack = createNativeStackNavigator();

// First-run sequence, matching design/k21-onboarding.html's 9 screens:
// Splash -> Welcome (3 value-prop slides) -> Onboarding (country + language
// — not in that prototype, but explicitly requested separately, kept for
// diaspora/other-country users) -> SignUp (phone/OTP/profile/CNI/
// arrondissement/fund wallet) -> Celebration -> Main. No persistence yet,
// so this always runs on cold start; `navigation.reset` on completion
// clears it all from the back stack.
export default function RootNavigator() {
  const { initAccount } = useAppState();

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
        {({ navigation }) => <WelcomeScreen onComplete={() => navigation.navigate('Onboarding')} />}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {({ navigation }) => <OnboardingScreen onComplete={() => navigation.navigate('SignUp')} />}
      </Stack.Screen>
      <Stack.Screen name="SignUp">
        {({ navigation }) => (
          <SignUpScreen
            onComplete={(profile) => {
              initAccount(profile);
              navigation.replace('Celebration', profile);
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Celebration">
        {({ navigation, route }) => (
          <WelcomeCelebrationScreen {...route.params} onEnter={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} />
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
      {/* Generic params-driven placeholder for smaller destinations
          (edit profile, settings rows, compose, etc.) not yet built out. */}
      <Stack.Screen name="Info" component={ComingSoonScreen} />
    </Stack.Navigator>
  );
}

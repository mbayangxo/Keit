import { createNativeStackNavigator } from '@react-navigation/native-stack';
import OnboardingScreen from '../screens/OnboardingScreen';
import MainTabs from './MainTabs';
import SendMoneyScreen from '../screens/SendMoneyScreen';
import PayMerchantScreen from '../screens/PayMerchantScreen';
import CashScreen from '../screens/CashScreen';
import MoreActionsScreen from '../screens/MoreActionsScreen';
import NuLekkScreen from '../screens/NuLekkScreen';
import ComingSoonScreen from '../screens/ComingSoonScreen';

const Stack = createNativeStackNavigator();

// No persistence yet (no AsyncStorage wired), so Onboarding always shows
// first — `navigation.reset` on completion clears it from the back stack.
export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Onboarding">
      <Stack.Screen name="Onboarding">
        {({ navigation }) => (
          <OnboardingScreen onComplete={() => navigation.reset({ index: 0, routes: [{ name: 'Main' }] })} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="SendMoney" component={SendMoneyScreen} />
      <Stack.Screen name="PayMerchant" component={PayMerchantScreen} />
      <Stack.Screen name="Cash" component={CashScreen} />
      <Stack.Screen name="MoreActions" component={MoreActionsScreen} />
      <Stack.Screen name="NuLekk" component={NuLekkScreen} />
      <Stack.Screen
        name="Receive"
        component={ComingSoonScreen}
        initialParams={{ title: 'Jël', subtitle: 'Demander de l’argent arrive très bientôt.', icon: '📥' }}
      />
      <Stack.Screen
        name="Tontine"
        component={ComingSoonScreen}
        initialParams={{ title: 'Tontine Digitale', subtitle: 'L’épargne collective automatique arrive très bientôt.', icon: '🏦' }}
      />
    </Stack.Navigator>
  );
}

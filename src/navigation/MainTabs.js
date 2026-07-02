import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MbooloStack from './MbooloStack';
import ComingSoonScreen from '../screens/ComingSoonScreen';
import TabBar from './TabBar';

const Tab = createBottomTabNavigator();

// Explorer (Discover) and Moi are ComingSoon placeholders until their
// screens are built — the tab destinations already exist so nothing is a
// dead end in the meantime. No "Rect" tab: Rect Sound is out of Phase 1 scope.
export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MbooloTab" component={MbooloStack} />
      <Tab.Screen
        name="ExplorerTab"
        component={ComingSoonScreen}
        initialParams={{ title: 'Discover', subtitle: 'Culture, Eat, Gigs, and Events are coming very soon.', icon: '🔍', showBack: false }}
      />
      <Tab.Screen
        name="MoiTab"
        component={ComingSoonScreen}
        initialParams={{ title: 'Moi', subtitle: 'Ton profil, ton Wakhna score et tes badges arrivent bientôt.', icon: '👤', showBack: false }}
      />
    </Tab.Navigator>
  );
}

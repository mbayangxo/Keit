import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MbooloStack from './MbooloStack';
import DiscoverScreen from '../screens/DiscoverScreen';
import MoiScreen from '../screens/MoiScreen';
import TabBar from './TabBar';

const Tab = createBottomTabNavigator();

// No "Rect" tab: Rect Sound is out of Phase 1 scope.
export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MbooloTab" component={MbooloStack} />
      <Tab.Screen name="ExplorerTab" component={DiscoverScreen} />
      <Tab.Screen name="MoiTab" component={MoiScreen} />
    </Tab.Navigator>
  );
}

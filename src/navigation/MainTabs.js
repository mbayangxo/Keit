import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MbooloStack from './MbooloStack';
import MarketplaceStack from './MarketplaceStack';
import MoiScreen from '../screens/MoiScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import TabBar from './TabBar';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MbooloTab" component={MbooloStack} />
      <Tab.Screen name="MarketplaceTab" component={MarketplaceStack} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} />
      <Tab.Screen name="MoiTab" component={MoiScreen} />
    </Tab.Navigator>
  );
}

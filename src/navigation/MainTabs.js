import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import MbooloStack from './MbooloStack';
import DiscoverScreen from '../screens/DiscoverScreen';
import MovementScreen from '../screens/MovementScreen';
import MoiScreen from '../screens/MoiScreen';
import TabBar from './TabBar';
import { useLocale } from '../context/LocaleContext';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const { showMovementTab } = useLocale();

  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tab.Screen name="HomeTab" component={HomeScreen} />
      <Tab.Screen name="MbooloTab" component={MbooloStack} />
      <Tab.Screen name="DiscoverTab" component={DiscoverScreen} />
      {showMovementTab ? <Tab.Screen name="MovementTab" component={MovementScreen} /> : null}
      <Tab.Screen name="MoiTab" component={MoiScreen} />
    </Tab.Navigator>
  );
}

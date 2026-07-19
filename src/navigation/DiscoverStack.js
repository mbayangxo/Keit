import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TrendingScreen from '../screens/TrendingScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';

const Stack = createNativeStackNavigator();

export default function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Trending" component={TrendingScreen} />
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
    </Stack.Navigator>
  );
}

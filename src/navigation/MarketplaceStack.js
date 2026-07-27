import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MarcheScreen from '../screens/MarcheScreen';
import MarketplaceScreen from '../screens/MarketplaceScreen';
import ShopDetailScreen from '../screens/ShopDetailScreen';
import MerchantCatalogScreen from '../screens/MerchantCatalogScreen';
import HubParcelScreen from '../screens/HubParcelScreen';
import HubParcelDetailScreen from '../screens/HubParcelDetailScreen';
import TrendingScreen from '../screens/TrendingScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import AlertDetailScreen from '../screens/AlertDetailScreen';

const Stack = createNativeStackNavigator();

export default function MarketplaceStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Marche" component={MarcheScreen} />
      <Stack.Screen name="Marketplace" component={MarketplaceScreen} />
      <Stack.Screen name="ShopDetail" component={ShopDetailScreen} />
      <Stack.Screen name="MerchantCatalog" component={MerchantCatalogScreen} />
      <Stack.Screen name="HubParcel" component={HubParcelScreen} />
      <Stack.Screen name="HubParcelDetail" component={HubParcelDetailScreen} />
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="Trending" component={TrendingScreen} />
      <Stack.Screen name="AlertDetail" component={AlertDetailScreen} />
    </Stack.Navigator>
  );
}

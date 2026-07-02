import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MbooloHomeScreen from '../screens/MbooloHomeScreen';
import MbooloChatScreen from '../screens/MbooloChatScreen';

const Stack = createNativeStackNavigator();

// Nested so the chat screen can push over the conversation list without
// losing the bottom tab bar convention used by the other tabs.
export default function MbooloStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MbooloList" component={MbooloHomeScreen} />
      <Stack.Screen name="MbooloChat" component={MbooloChatScreen} />
    </Stack.Navigator>
  );
}

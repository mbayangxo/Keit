import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { initSentry } from './src/lib/sentry';
import App from './App';

initSentry();
registerRootComponent(App);

/**
 * @format
 */

import { AppRegistry } from 'react-native';
import notifee from '@notifee/react-native';
import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';
import App from './App';
import { name as appName } from './app.json';
import { handleNotificationEvent, handleRemoteMessage } from './src/lib/calls';

// Must be registered before the app component: these run headless when a
// push arrives while the app is closed or in the background.
setBackgroundMessageHandler(getMessaging(), handleRemoteMessage);
notifee.onBackgroundEvent(event => handleNotificationEvent(event, false));

AppRegistry.registerComponent(appName, () => App);

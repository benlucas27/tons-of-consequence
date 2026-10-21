import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Push notifications through OneSignal. The OneSignal code only exists in a real build (TestFlight / App Store),
// not in Expo Go, so every call here quietly does nothing when it is not available.
const appId = Constants.expoConfig?.extra?.oneSignalAppId;
let OneSignal = null;
let started = false;

function load() {
  if (OneSignal !== null) return OneSignal;
  OneSignal = false;
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return OneSignal;
  if (!appId || appId.startsWith('REPLACE')) return OneSignal;
  try {
    const mod = require('react-native-onesignal');
    const os = mod.OneSignal || (mod.default && mod.default.OneSignal) || mod.default;
    if (os && os.Notifications) OneSignal = os;
  } catch (e) { /* Expo Go: no native module */ }
  return OneSignal;
}

export const pushAvailable = () => !!load();

/** Starts OneSignal (does not ask for permission) and calls onOpen(inningsId) when a notification is tapped. */
export function startPush(onOpen) {
  const os = load();
  if (!os || started) return;
  started = true;
  try {
    os.initialize(appId);
    os.Notifications.addEventListener('click', (event) => {
      const id = Number(event?.notification?.additionalData?.inningsId);
      if (id) onOpen(id);
    });
  } catch (e) { /* ignore */ }
}

/** Is the reader currently set up to get alerts? */
export async function alertsOn() {
  const os = load();
  if (!os) return false;
  try { return !!(await os.Notifications.getPermissionAsync()) && !!os.User.pushSubscription.optedIn; } catch (e) { return false; }
}

/** Asks iOS for permission (the first time) and turns alerts on. Returns whether they are on. */
export async function turnAlertsOn() {
  const os = load();
  if (!os) return false;
  try {
    const ok = await os.Notifications.requestPermission(true);
    if (ok) os.User.pushSubscription.optIn();
    return !!ok;
  } catch (e) { return false; }
}

export async function turnAlertsOff() {
  const os = load();
  if (!os) return;
  try { os.User.pushSubscription.optOut(); } catch (e) { /* ignore */ }
}

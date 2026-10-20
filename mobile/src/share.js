import { Alert } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SITE } from './loadFeed';

/** Downloads one of the site's PNG share cards (/card/...) and opens the iPhone share sheet with the image. */
export async function shareCard(path, name) {
  try {
    const dest = new File(Paths.cache, `${name}.png`);
    if (dest.exists) dest.delete();
    const file = await File.downloadFileAsync(`${SITE}${path}`, dest);
    if (!(await Sharing.isAvailableAsync())) { Alert.alert('Sharing is not available on this device.'); return; }
    await Sharing.shareAsync(file.uri, { mimeType: 'image/png', dialogTitle: 'Share this card', UTI: 'public.png' });
  } catch (e) {
    Alert.alert('Could not make the card', 'You need to be online to share a card. Try again in a moment.');
  }
}

import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SITE } from './loadFeed';

// The share preview (ShareHost, mounted once in App) listens here. shareCard() downloads one of the site's
// PNG images (/card/... on the site) and asks the host to show it, so the reader sees what they are sharing.
let listener = () => {};
export const onShare = (fn) => { listener = fn; return () => { listener = () => {}; }; };

export async function shareCard(path, name) {
  listener({ loading: true });
  let uri;
  try {
    const dest = new File(Paths.cache, `${name}-${Date.now()}.png`);
    const file = await File.downloadFileAsync(`${SITE}${path}`, dest);
    uri = file.uri;
  } catch (e) {
    listener({ error: 'Could not make the image. You need to be online to share one. Try again in a moment.' });
    return;
  }
  listener({ uri });
}

/** Opens the iPhone share sheet for an image already shown in the preview. A dismissed sheet is not an error. */
export async function openShareSheet(uri) {
  try {
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share this image', UTI: 'public.png' });
  } catch (e) { /* closed without sharing */ }
}

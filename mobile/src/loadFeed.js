import { File, Paths } from 'expo-file-system';
import { setFeed } from './feedStore';

export const SITE = 'https://tonsofconsequence.com';
export const SUPPORTED_SCHEMA = 1;
const cacheFile = () => new File(Paths.document, 'feed-cache.json');

const usable = (f) => f && f.schema <= SUPPORTED_SCHEMA && f.data && f.data.sample;

/** Newest feed we have on the phone: the downloaded copy if there is a good one, else the copy built into the app. */
export async function loadFeed() {
  try {
    const file = cacheFile();
    if (file.exists) {
      const cached = JSON.parse(await file.text());
      if (usable(cached)) { setFeed(cached); return { feed: cached, source: 'downloaded' }; }
    }
  } catch (e) { /* a missing or damaged copy just means we use the built-in one */ }
  const baseline = require('../assets/feed-baseline.json');
  setFeed(baseline);
  return { feed: baseline, source: 'built-in' };
}

/** Asks the site if there is a newer feed and, if so, saves it for the next time the app opens. Never throws. */
export async function checkForNewFeed(currentVersion) {
  try {
    const meta = await (await fetch(`${SITE}/api/feed/version`)).json();
    if (meta.schema > SUPPORTED_SCHEMA) return { status: 'app-too-old' };
    if (meta.version === currentVersion) return { status: 'up-to-date' };
    const text = await (await fetch(`${SITE}/api/feed`)).text();
    const parsed = JSON.parse(text);
    if (!usable(parsed)) return { status: 'failed' };
    const file = cacheFile();
    if (!file.exists) file.create();
    file.write(text);
    return { status: 'downloaded', version: meta.version, counts: meta.counts };
  } catch (e) {
    return { status: 'offline' };
  }
}

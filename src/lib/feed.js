/**
 * The data feed for the mobile app: the same data files the site uses, in one versioned JSON document.
 * The app swaps its bundled data for this at launch (see docs/MOBILE-APP-PLAN.md), so verdict updates reach
 * phones without an App Store release. Only ever ADD fields; a breaking change must bump FEED_SCHEMA.
 */
import { createHash } from 'node:crypto';
import * as careers from '../data/careers.js';
import * as compareSets from '../data/compare-sets.js';
import * as consequence from '../data/consequence.js';
import * as consequenceOverrides from '../data/consequence-overrides.js';
import * as helloSport from '../data/hello-sport.js';
import * as inningsFacts from '../data/innings-facts.js';
import * as nameAliases from '../data/name-aliases.js';
import * as nightWatchman from '../data/night-watchman.js';
import * as playerNames from '../data/player-names.js';
import * as pressReferences from '../data/press-references.js';
import * as referencePoints from '../data/reference-points.js';
import * as sample from '../data/sample.js';
import * as seriesSources from '../data/series-sources.js';
import * as storySources from '../data/story-sources.js';
import * as theDon from '../data/the-don.js';
import * as tonIds from '../data/ton-ids.js';
import * as verdictSources from '../data/verdict-sources.js';
import * as videos from '../data/videos.js';
import * as wherePlayed from '../data/where-played.js';
import * as womensHundreds from '../data/womens-hundreds.js';

export const FEED_SCHEMA = 1;

// Keyed by the file name under src/data (without .js), so the app can map an import straight to its entry.
const FILES = {
  careers, 'compare-sets': compareSets, consequence, 'consequence-overrides': consequenceOverrides,
  'hello-sport': helloSport, 'innings-facts': inningsFacts, 'name-aliases': nameAliases,
  'night-watchman': nightWatchman, 'player-names': playerNames, 'press-references': pressReferences,
  'reference-points': referencePoints, sample, 'series-sources': seriesSources, 'story-sources': storySources,
  'the-don': theDon, 'ton-ids': tonIds, 'verdict-sources': verdictSources, videos, 'where-played': wherePlayed,
  'womens-hundreds': womensHundreds,
};

/** Each file's data exports (functions are left out: the app has its own; a Set travels as {"$set": [...]}). */
function exportsOf(mod) {
  const out = {};
  for (const [k, v] of Object.entries(mod)) {
    if (typeof v === 'function') continue;
    out[k] = v instanceof Set ? { $set: [...v] } : v;
  }
  return out;
}

let cached = null;
export function buildFeed() {
  if (cached) return cached;
  const data = {};
  for (const [name, mod] of Object.entries(FILES)) data[name] = exportsOf(mod);
  const body = JSON.stringify(data);
  const version = createHash('sha1').update(body).digest('hex').slice(0, 12);
  const counts = { hundreds: sample.SAMPLE_CENTURIES.length, tons: tonIds.TON_IDS.size, womens: womensHundreds.WOMENS_HUNDREDS.length };
  // `data` is spliced in as text so the big body is serialised once.
  const head = JSON.stringify({ schema: FEED_SCHEMA, version, counts });
  cached = { version, counts, json: `${head.slice(0, -1)},"data":${body}}` };
  return cached;
}

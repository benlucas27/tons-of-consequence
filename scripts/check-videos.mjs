/**
 * Re-checks every video in src/data/videos.js against YouTube: does it still exist, and does the
 * embed flag still match what the uploader allows? Run it now and then (links do die).
 *
 *   node scripts/check-videos.mjs
 *
 * Exits 1 if any video has been removed. Embed-setting changes are reported but not fatal.
 */
import { VIDEOS } from '../src/data/videos.js';

let dead = 0;
let drift = 0;
for (const [id, v] of Object.entries(VIDEOS)) {
  const url = `https://www.youtube.com/watch?v=${v.yt}`;
  const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`).catch(() => null);
  if (!res) { console.log(`?  ${id} ${v.yt}: could not reach YouTube`); continue; }
  const embeddable = res.status === 200;
  if (res.status === 404 || res.status === 400) { dead++; console.log(`DEAD  innings ${id}: ${url} (${v.channel})`); continue; }
  if (embeddable !== v.embed) { drift++; console.log(`EMBED  innings ${id}: data says embed=${v.embed}, YouTube now says ${embeddable} (${url})`); }
}
console.log(`${Object.keys(VIDEOS).length} videos checked: ${dead} removed, ${drift} embed settings changed.`);
process.exit(dead ? 1 : 0);

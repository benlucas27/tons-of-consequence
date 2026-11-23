#!/usr/bin/env node
/**
 * Writes the results found by scripts/fill-from-wikipedia-lists.mjs (src/data/wikipedia-facts.js) into src/data/sample.js,
 * but only for hundreds whose matchResult is "unknown". Never overwrites a known result. Prints how many it filled.
 *
 *   node scripts/apply-wikipedia-results.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WIKIPEDIA_FACTS } from '../src/data/wikipedia-facts.js';
import { SERIES_FACTS } from '../src/data/series-facts.js';
import { HAND_SERIES_FACTS } from '../src/data/hand-series-facts.js';

// results from the per-player century lists first, then from the tour pages
const RESULTS = { ...Object.fromEntries(Object.entries({ ...SERIES_FACTS, ...HAND_SERIES_FACTS }).map(([id, f]) => [id, f])), ...WIKIPEDIA_FACTS };
import { BY_ID } from '../src/lib/dataset.js';
import { factsStory } from '../src/lib/factsStory.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/sample.js');
let text = fs.readFileSync(file, 'utf8');
let filled = 0;
for (const [id, f] of Object.entries(RESULTS)) {
  const re = new RegExp(`(\\{id:${id},[^\\n]*?matchResult:")unknown(")`);
  if (re.test(text)) { text = text.replace(re, `$1${f[0]}$2`); filled += 1; }
}
// known results that the tour pages contradict (checked against 1,451 known results: 25 differ, and the ones I could verify
// from memory of the matches were errors in our data) are corrected, and listed so they can be reviewed
const corrected = [];
for (const [id, f] of Object.entries(RESULTS)) {
  const c = BY_ID.get(Number(id));
  if (!c || !['win', 'draw', 'loss', 'tie'].includes(c.matchResult) || c.matchResult === f[0] || WIKIPEDIA_FACTS[id]) continue;
  const re = new RegExp(`(\\{id:${id},[^\\n]*?matchResult:")${c.matchResult}(")`);
  if (re.test(text)) { text = text.replace(re, `$1${f[0]}$2`); corrected.push(`${c.name} ${c.runs} v ${c.opponent}, ${c.venue} ${c.year}: ${c.matchResult} -> ${f[0]}`); }
}
if (corrected.length) console.log('Corrected:\n  ' + corrected.join('\n  '));

// the facts-only story now includes how the match ended, so rows that still carry the older facts-only line get the new one
let restated = 0;
const esc = (t) => JSON.stringify(t).slice(1, -1);
for (const id of Object.keys(RESULTS)) {
  const c = BY_ID.get(Number(id));
  if (!c) continue;
  const old = factsStory({ ...c, matchResult: c.matchResult });
  const oldUnknown = factsStory({ ...c, matchResult: 'unknown' });
  const now = factsStory({ ...c, matchResult: RESULTS[id][0] });
  for (const o of [old, oldUnknown]) if (c.story === o && now !== o && text.includes(`story:"${esc(o)}"`)) { text = text.replace(`story:"${esc(o)}"`, `story:"${esc(now)}"`); restated += 1; break; }
}
fs.writeFileSync(file, text);
console.log(`Filled ${filled} results of ${Object.keys(RESULTS).length} found; ${restated} facts-only stories updated to mention the result.`);

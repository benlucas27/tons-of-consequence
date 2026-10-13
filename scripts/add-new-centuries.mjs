#!/usr/bin/env node
/**
 * Pulls newly played Test centuries from Cricsheet and appends them to the
 * site's own dataset (src/data/sample.js). No database involved: the data
 * lives in git and a new deploy publishes it.
 *
 *   node scripts/add-new-centuries.mjs                       preview what would be added
 *   node scripts/add-new-centuries.mjs --since=2026-04-20    look back further than the default window
 *   node scripts/add-new-centuries.mjs --write               append to src/data/sample.js
 *
 * Anything already in the dataset (matched by player/year/runs/opponent) is
 * skipped, so it is safe to run repeatedly.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { fetchRecentCenturies, naturalKey, PIPELINE_FLOOR } from '../src/lib/cricsheet.js';
import { scoreLevers, writeStory, tagsFor } from '../src/lib/heuristics.js';
import { teamCodeFor } from '../src/lib/countries.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'src/data/sample.js');
const write = process.argv.includes('--write');
const sinceArg = process.argv.find((a) => a.startsWith('--since='));
const since = sinceArg ? sinceArg.split('=')[1] : undefined;

if (since && since < PIPELINE_FLOOR) {
  console.error(`Refusing --since=${since}: the dataset's own rows end at ${PIPELINE_FLOOR}, and older Cricsheet names can differ from them, which would create duplicates.`);
  process.exit(1);
}

const { SAMPLE_CENTURIES } = await import(pathToFileURL(dataFile).href);
const existing = new Set(SAMPLE_CENTURIES.map(naturalKey));
let nextId = SAMPLE_CENTURIES.reduce((m, c) => Math.max(m, c.id), 0) + 1;

const candidates = (await fetchRecentCenturies({ since })).sort((a, b) => a.date.localeCompare(b.date));
const fresh = candidates.filter((c) => !existing.has(naturalKey(c)));

// Same one-line style as the rest of the file: unquoted keys, JSON values.
const obj = (o) => '{' + Object.entries(o).map(([k, v]) =>
  `${k}:${v && typeof v === 'object' && !Array.isArray(v) ? obj(v) : JSON.stringify(v)}`).join(',') + '}';

const rows = fresh.map((c) => {
  const place = c.city || c.venue;
  return {
    id: nextId++,
    player: c.player,
    country: c.country,
    runs: c.runs,
    balls: c.balls,
    minutes: null,
    notOut: c.notOut,
    opponent: c.opponent,
    venue: place,
    year: c.year,
    series: c.series || null,
    matchResult: c.matchResult,
    tags: tagsFor(c),
    story: writeStory({ ...c, venue: place }),
    culturalValidation: 45,
    levers: scoreLevers(c, teamCodeFor(c.opponentTeam)),
  };
});

// Matches that were still being played when an innings was entered carry matchResult "live".
// Once Cricsheet has the finished match, settle the result.
const settled = SAMPLE_CENTURIES.filter((c) => c.matchResult === 'live')
  .map((row) => ({ row, hit: candidates.find((x) => naturalKey(x) === naturalKey(row)) }))
  .filter((x) => x.hit);

console.log(`${candidates.length} centuries found, ${candidates.length - fresh.length} already in the dataset, ${rows.length} new.`);
for (const r of rows) console.log(`  ${r.year} ${r.player} ${r.runs}${r.notOut ? '*' : ''} v ${r.opponent}, ${r.venue} (${r.matchResult})`);
for (const { row, hit } of settled) console.log(`  result now known: #${row.id} ${row.player} ${row.runs} v ${row.opponent} ${row.year} -> ${hit.matchResult} (worth a look at its Match Impact score)`);

if (!write) {
  if (rows.length || settled.length) console.log('\nPreview only. Re-run with --write to apply.');
} else if (rows.length || settled.length) {
  let src = readFileSync(dataFile, 'utf8').trimEnd();
  if (!src.endsWith('];')) throw new Error('Unexpected end of sample.js; refusing to edit.');
  for (const { row, hit } of settled) {
    src = src.split('\n').map((line) => (line.trimStart().startsWith(`{id:${row.id},`) ? line.replace('matchResult:"live"', `matchResult:"${hit.matchResult}"`) : line)).join('\n');
  }
  const body = src.slice(0, -2).trimEnd();
  writeFileSync(dataFile, rows.length ? body + ',\n' + rows.map((r) => '  ' + obj(r)).join(',\n') + '\n];\n' : body + '\n];\n');
  console.log(`\nAdded ${rows.length} and settled ${settled.length} result(s) in ${path.relative(root, dataFile)}.`);
}

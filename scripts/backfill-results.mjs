#!/usr/bin/env node
/**
 * ONE-OFF CLEANUP for historical rows. It is not part of the monthly refresh, which only ever
 * covers new games (see add-new-centuries.mjs).
 *
 * Fills in match results for centuries whose result is "unknown" (most of the original
 * Statsguru rows) using Cricsheet's ball-by-ball archive, which covers the modern era.
 * A row is only changed when exactly one Cricsheet century matches it (same player,
 * year, runs and opponent, and the same balls faced when both sides know it).
 *
 *   node scripts/backfill-results.mjs            preview
 *   node scripts/backfill-results.mjs --write    update src/data/sample.js
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { fetchRecentCenturies, naturalKey } from '../src/lib/cricsheet.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'src/data/sample.js');
const write = process.argv.includes('--write');

const { SAMPLE_CENTURIES } = await import(pathToFileURL(dataFile).href);
const unknown = SAMPLE_CENTURIES.filter((c) => !c.matchResult || c.matchResult === 'unknown');

const cs = await fetchRecentCenturies({ since: '1990-01-01' });
const byKey = new Map();
for (const c of cs) {
  const k = naturalKey(c);
  if (!byKey.has(k)) byKey.set(k, []);
  byKey.get(k).push(c);
}

const updates = [];
let ambiguous = 0;
for (const row of unknown) {
  const cands = byKey.get(naturalKey(row)) || [];
  let pick = cands.length === 1 ? cands[0] : null;
  if (!pick && cands.length > 1 && row.balls) {
    const same = cands.filter((c) => c.balls === row.balls);
    if (same.length === 1) pick = same[0];
  }
  if (!pick) { if (cands.length > 1) ambiguous++; continue; }
  if (row.balls && pick.balls && row.balls !== pick.balls) continue;
  updates.push({ id: row.id, result: pick.matchResult });
}

const counts = updates.reduce((a, u) => ((a[u.result] = (a[u.result] || 0) + 1), a), {});
console.log(`${unknown.length} rows without a result; ${updates.length} matched in Cricsheet (${JSON.stringify(counts)}); ${ambiguous} ambiguous, left alone.`);

if (write && updates.length) {
  const byId = new Map(updates.map((u) => [u.id, u.result]));
  const lines = readFileSync(dataFile, 'utf8').split('\n').map((line) => {
    const m = line.match(/^\s*\{id:(\d+),/);
    if (!m || !byId.has(+m[1])) return line;
    return line.replace('matchResult:"unknown"', `matchResult:"${byId.get(+m[1])}"`);
  });
  writeFileSync(dataFile, lines.join('\n'));
  console.log(`Updated ${updates.length} rows in src/data/sample.js.`);
}

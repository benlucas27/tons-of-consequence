/**
 * Works out career batting figures for every player in a preset comparison (src/data/compare-sets.js) from
 * Cricsheet's ball-by-ball Test archive, and writes them to src/data/careers.js.
 *
 *   node scripts/build-careers.mjs              # rebuild src/data/careers.js
 *   node scripts/build-careers.mjs --check      # report only, write nothing
 *
 * Safety net: each player's hundreds are compared with the centuries in the dataset (src/data/sample.js). If
 * they disagree the figures are not trusted and the script stops without writing.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { addMatch, derived } from '../src/lib/careerStats.js';
import { COMPARE_SETS } from '../src/data/compare-sets.js';
import { ALL } from '../src/lib/dataset.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src/data/careers.js');
const checkOnly = process.argv.includes('--check');

const players = [...new Map(COMPARE_SETS.flatMap((s) => s.players).map((p) => [p.cricsheet, p])).values()];
const wanted = new Set(players.map((p) => p.cricsheet));

// The download goes in its own fresh folder and is only read, never run.
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cricsheet-'));
const res = await fetch('https://cricsheet.org/downloads/tests_json.zip');
if (!res.ok) throw new Error(`Cricsheet download failed: ${res.status}`);
const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));

const careers = {};
let matches = 0;
let latest = '';
for (const entry of zip.getEntries()) {
  if (!entry.entryName.endsWith('.json')) continue;
  const match = JSON.parse(entry.getData().toString('utf8'));
  if (match.info?.gender !== 'male') continue;
  matches += 1;
  const d = match.info?.dates?.[match.info.dates.length - 1] || '';
  if (d > latest) latest = d;
  addMatch(careers, match, wanted);
}
fs.rmSync(dir, { recursive: true, force: true });

let ok = true;
const result = {};
for (const p of players) {
  const c = careers[p.cricsheet];
  if (!c) { console.log(`MISSING ${p.name}: no matches found for id ${p.cricsheet}`); ok = false; continue; }
  const inDataset = ALL.filter((x) => x.name === p.name && x.country === p.country).length;
  const agree = inDataset === c.hundreds;
  if (!agree) ok = false;
  const d = derived(c);
  console.log(`${agree ? 'ok  ' : 'FAIL'} ${p.name.padEnd(16)} ${c.matches} Tests, ${c.innings} inns, ${c.runs} runs, avg ${d.average}, ${c.hundreds} hundreds (dataset ${inDataset}), ${c.fifties} fifties, converts ${d.conversion}%`);
  result[`${p.name}|${p.country}`] = { ...c, name: p.name };
}
console.log(`${matches} men's Tests read; archive runs to ${latest}`);
if (!ok) { console.error('The figures disagree with the dataset, so nothing was written.'); process.exit(1); }
if (checkOnly) process.exit(0);

fs.writeFileSync(out, `/**
 * Career batting figures for the players in src/data/compare-sets.js, worked out from Cricsheet's ball-by-ball
 * archive by scripts/build-careers.mjs. Generated: do not edit by hand. Hundreds are checked against the dataset.
 */
export const CAREERS_AS_OF = ${JSON.stringify(latest)};
export const CAREERS = ${JSON.stringify(result, null, 2)};
`);
console.log(`wrote ${path.relative(root, out)}`);

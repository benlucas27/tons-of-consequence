/**
 * Audits the dataset against a local copy of the Cricsheet archive and prints what needs cleaning up.
 *   node scripts/audit-archive.mjs <folder of extracted Cricsheet match JSON files>
 * Reads files only; changes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { hundredsIn } from '../src/lib/matchContext.js';
import { ALL } from '../src/lib/dataset.js';
import { displayName } from '../src/lib/scoring.js';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/audit-archive.mjs <folder>'); process.exit(1); }
const matches = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter((m) => m.info?.gender === 'male');
const hundreds = matches.flatMap((m) => hundredsIn(m));

const find = (h) => {
  const full = displayName({ player: h.name });
  return ALL.find((c) => (c.player === h.name || c.name === h.name || c.name === full) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
};
const matched = [];
const unmatched = [];
for (const h of hundreds) { const row = find(h); (row ? matched : unmatched).push({ h, row }); }
console.log(`ARCHIVE: ${matches.length} men's Tests, ${hundreds.length} hundreds. Matched to the dataset: ${matched.length}. Not matched: ${unmatched.length}.\n`);

console.log('1. Archive hundreds with no dataset row (name, runs, year, opponent):');
for (const { h } of unmatched) {
  const near = ALL.filter((c) => c.runs === h.runs && c.year === h.year);
  console.log(`   ${h.name.padEnd(18)} ${String(h.runs + (h.notOut ? '*' : '')).padEnd(5)} ${h.year} v ${h.opponent.padEnd(13)} ${near.length ? `(same runs and year in dataset: ${near.map((c) => `${c.name} v ${c.opponent}`).join('; ')})` : '(nothing like it in the dataset)'}`);
}

const used = new Set(matched.map((m) => m.row.id));
const firstYear = Math.min(...matches.map((m) => Number(m.info.dates[0].slice(0, 4))));
const covered = ALL.filter((c) => c.year >= 2006 && !used.has(c.id));
console.log(`\n2. Dataset hundreds from 2006 on that the archive does not have: ${covered.length} (of ${ALL.filter((c) => c.year >= 2006).length}).`);
const byYear = {};
covered.forEach((c) => { byYear[c.year] = (byYear[c.year] || 0) + 1; });
console.log('   by year:', JSON.stringify(byYear));
console.log('   examples:', covered.slice(0, 6).map((c) => `${c.name} ${c.runs} ${c.year} v ${c.opponent}`).join('; '));

console.log('\n3. Match results: dataset against the archive (matched rows only)');
let agree = 0, disagree = 0, unknown = 0; const bad = [];
for (const { h, row } of matched) {
  if (!row.matchResult || row.matchResult === 'unknown') { unknown++; continue; }
  if (row.matchResult === h.result || (row.matchResult === 'live' && h.result)) agree++; else { disagree++; bad.push(`${row.name} ${row.runs} ${row.year}: dataset says ${row.matchResult}, archive says ${h.result}`); }
}
console.log(`   agree ${agree}, disagree ${disagree}, dataset has no result for ${unknown} (the archive could fill these).`);
bad.slice(0, 10).forEach((b) => console.log('   ' + b));

console.log('\n4. One person under more than one name in the dataset (by display name and country):');
const keys = new Map();
for (const c of ALL) { const k = `${c.name}|${c.country}`; keys.set(k, (keys.get(k) || new Set()).add(c.player)); }
const multi = [...keys.entries()].filter(([, s]) => s.size > 1);
console.log(`   ${multi.length} people. Examples: ${multi.slice(0, 8).map(([k, s]) => `${k.split('|')[0]} (${[...s].join(' / ')})`).join('; ')}`);
const initials = ALL.filter((c) => c.name === c.player && /^[A-Z]{1,4} /.test(c.name));
console.log(`   Hundreds still shown by initials rather than a full name: ${initials.length} (${new Set(initials.map((c) => c.name)).size} players).`);

console.log('\n5. Series information: how the archive names the same series:');
const events = {};
for (const m of matches) { const e = m.info.event; if (!e) { events['(no event at all)'] = (events['(no event at all)'] || 0) + 1; continue; } if (!e.match_number) events['(event but no match number)'] = (events['(event but no match number)'] || 0) + 1; }
console.log('   ', JSON.stringify(events));
const bySeason = new Set(matches.map((m) => typeof m.info.season));
console.log('    season is stored as:', [...bySeason].join(' and '), '(it should be one type)');
console.log(`    earliest match in the archive: ${firstYear}`);

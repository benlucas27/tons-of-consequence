#!/usr/bin/env node
/**
 * What would the total number of tons of consequence look like under stricter (or looser) rules? ANALYSIS ONLY: this
 * changes nothing on the site. It re-runs the Consequence Test on every hundred we can measure with the rule's
 * thresholds varied, and projects the result onto the hundreds we cannot measure yet.
 *
 *   node scripts/consequence-whatif.mjs <folder of extracted Cricsheet match JSON>   -> docs/drafts/consequence-whatif.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hundredsIn, seriesStakes } from '../src/lib/matchContext.js';
import { consequenceTest } from '../src/lib/consequenceTest.js';
import { withOverride } from '../src/lib/consequenceOverrides.js';
import { canonicalPlayer } from '../src/data/name-aliases.js';
import { ALL } from '../src/lib/dataset.js';
import { displayName } from '../src/lib/scoring.js';
import { DON } from '../src/data/the-don.js';
import { CONSEQUENCE } from '../src/data/consequence.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = process.argv[2];
if (!folder) { console.error('usage: node scripts/consequence-whatif.mjs <cricsheet folder>'); process.exit(1); }
const matches = fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))).filter((m) => m.info?.gender === 'male');
const stakes = seriesStakes(matches);

const rowFor = (h) => {
  const known = canonicalPlayer(h.name);
  const full = displayName({ player: h.name });
  const same = ALL.filter((c) => (c.player === h.name || c.name === h.name || c.name === full || c.player === known || c.name === known) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
  return same.length > 1 ? same.find((c) => c.balls && h.balls && c.balls === h.balls) || same[0] : same[0];
};

// The Test with its thresholds as parameters (the real one is src/lib/consequenceTest.js).
const BASE = { carryShare: 0.4, carryEntryRequired: true, carryShareLate: 0.5, rescueWkts: 3, rescueScore: 100, collapse: 4, safeLead: 200, alreadyWon: 200, savedDrawAnyInnings: false, noOtherHundredInInnings: false, noOtherHundredInMatch: false, drawsCount: true };
function test(f, p, others) {
  if (f.result === 'loss' || (!['win', 'draw', 'tie'].includes(f.result))) return false;
  if (f.result === 'draw') {
    if (!p.drawsCount) return false;
    const saved = (f.inningsNo === 3 && f.leadOnEntry < 0) || f.inningsNo === 4;
    if (!saved) return false;
  }
  if (f.stakes === 'dead') return false;
  if (f.leadOnEntry > p.alreadyWon) return false;
  if (p.noOtherHundredInInnings && others.inInnings > 0) return false;
  if (p.noOtherHundredInMatch && others.inMatch > 0) return false;
  if (f.result === 'win' && f.inningsNo === 4) return true;
  if (f.result === 'draw') return true;
  if ((f.entryWkts >= p.rescueWkts && f.entryScore < p.rescueScore) || (f.peril >= p.collapse && f.leadOnEntry < p.safeLead)) return true;
  const share = f.share ?? 0;
  if (share >= p.carryShareLate && !p.carryEntryRequired) return true;
  if (share >= p.carryShare && (!p.carryEntryRequired || f.entryScore < 100)) return true;
  if (share >= p.carryShareLate && p.carryEntryRequired === 'late-ok') return true;
  return false;
}

// every measurable hundred with the facts the test needs
const cases = [];
for (const m of matches) {
  const st = stakes.get(m);
  const inMatch = hundredsIn(m);
  for (const h of inMatch) {
    const row = rowFor(h);
    if (!row) continue;
    const f = { ...h, stakes: st?.stakes || 'single' };
    const others = { inInnings: inMatch.filter((x) => x !== h && x.inningsNo === h.inningsNo).length, inMatch: inMatch.length - 1 };
    cases.push({ row, f, others });
  }
}
const byId = new Map(cases.map((c) => [c.row.id, c]));

const VARIANTS = [
  ['Rules as written (before Ben\'s individual rulings)', {}],
  ['Carry must come in under 100 (the old rule)', { carryEntryRequired: true, carryShareLate: 2 }],
  ['Carry needs half the team\'s runs', { carryShare: 0.5, carryShareLate: 0.5 }],
  ['Rescue needs 4 down (not 3)', { rescueWkts: 4 }],
  ['Rescue needs 4 down and a collapse of 5', { rescueWkts: 4, collapse: 5 }],
  ['Already-safe lead 150 (not 200)', { safeLead: 150, alreadyWon: 150 }],
  ['No other hundred in the same innings', { noOtherHundredInInnings: true }],
  ['No other hundred anywhere in the match', { noOtherHundredInMatch: true }],
  ['Drawn Tests never count', { drawsCount: false }],
  ['Strict: 4 down, collapse 5, carry 50%, safe lead 150, no other hundred in the innings', { rescueWkts: 4, collapse: 5, carryShare: 0.5, carryShareLate: 2, safeLead: 150, alreadyWon: 150, noOtherHundredInInnings: true }],
];
const total = ALL.length;
const measuredIds = Object.keys(CONSEQUENCE).map(Number);
const tally = (p) => {
  let n = 0;
  for (const c of cases) if (test(c.f, { ...BASE, ...p }, c.others)) n++;
  return n;
};
const baseTests = tally({});
const decade = (y) => Math.floor(y / 10) * 10;

// the live verdicts (tests plus Ben's rulings), by decade, for the projection
const live = {};
for (const id of measuredIds) {
  const row = ALL.find((c) => c.id === id);
  if (!row) continue;
  const d = decade(row.year);
  live[d] = live[d] || { measured: 0, tons: 0 };
  live[d].measured++;
  live[d].tons += CONSEQUENCE[id][0];
}
const everyDecade = {};
for (const c of ALL) { const d = decade(c.year); everyDecade[d] = everyDecade[d] || { all: 0 }; everyDecade[d].all++; }
const rate = (o) => (o.measured ? o.tons / o.measured : null);
const liveMeasured = Object.values(live).reduce((a, o) => a + o.measured, 0);
const liveTons = Object.values(live).reduce((a, o) => a + o.tons, 0);
const overall = liveTons / liveMeasured;

const rows = Object.keys(everyDecade).map(Number).sort().map((d) => {
  const m = live[d] || { measured: 0, tons: 0 };
  const r = rate(m);
  const use = r ?? overall;
  return { d, all: everyDecade[d].all, measured: m.measured, tons: m.tons, rate: r, projected: Math.round(everyDecade[d].all * use) };
});
const projected = rows.reduce((a, r) => a + r.projected, 0);
const projectedAll = Math.round(total * overall);

const lines = [];
lines.push('# What would the total look like? Stricter and looser rules (analysis only)', '');
lines.push('Nothing here changes the site. It re-runs the Consequence Test on every hundred with a match record, varying one rule at a time,');
lines.push('and projects the answer onto the hundreds we cannot measure yet. Regenerate with `node scripts/consequence-whatif.mjs <cricsheet folder>`.', '');
lines.push('## Where we are', '');
lines.push(`- ${total.toLocaleString()} hundreds in the ranking; **${liveMeasured.toLocaleString()} measured** (${Math.round((100 * liveMeasured) / total)}%). Measured ones: ${liveTons} are tons of consequence on the live rules plus Ben's rulings (${(overall * 100).toFixed(1)}%).`);
lines.push(`- ${(total - liveMeasured).toLocaleString()} are unmeasured, almost all before 2006 (Cricsheet has no ball-by-ball record) and Afghanistan men's Tests.`, '');
lines.push('## Counts under each rule (measured hundreds only, the written rules without individual rulings)', '');
lines.push('| Rule | Tons of consequence | Share of measured | Change |', '|---|---|---|---|');
const nCases = cases.length;
for (const [name, p] of VARIANTS) {
  const n = tally(p);
  lines.push(`| ${name} | ${n} | ${((100 * n) / nCases).toFixed(1)}% | ${n - baseTests >= 0 ? '+' : ''}${n - baseTests} |`);
}
lines.push('', `(${nCases} hundreds in the ball-by-ball archive were matched to the ranking; Bradman's 29 are judged separately from the scorecards and are not in this table.)`, '');
lines.push('## Projection to every hundred', '');
lines.push('Assumes an unmeasured hundred is a ton of consequence at the same rate as measured hundreds from the same decade (or the overall rate where a decade has none).', '');
lines.push('| Decade | Hundreds | Measured | Tons (live) | Rate | Projected tons |', '|---|---|---|---|---|---|');
for (const r of rows) lines.push(`| ${r.d}s | ${r.all} | ${r.measured} | ${r.tons} | ${r.rate == null ? 'none' : (r.rate * 100).toFixed(0) + '%'} | ${r.projected} |`);
lines.push('', `**Projected total on today's rules: about ${projected.toLocaleString()}** of ${total.toLocaleString()} (${((100 * projected) / total).toFixed(0)}%). A flat overall rate would give ${projectedAll.toLocaleString()}.`);
lines.push('', 'How far to trust it: the measured set is mostly 2006 on. Earlier decades have only Bradman and a handful of hand-checked innings, so their projection is the weakest. The overnight older-innings report (branch `older-innings`) tests the top-ranked early hundreds one by one and will show whether the early rate is higher or lower.', '');
lines.push('## Stricter rules, projected', '');
lines.push('Applying each rule\'s measured change in percentage terms to the projected total:', '', '| Rule | Measured share | Projected total |', '|---|---|---|');
for (const [name, p] of VARIANTS) {
  const n = tally(p);
  lines.push(`| ${name} | ${((100 * n) / nCases).toFixed(1)}% | ${Math.round(projected * (n / baseTests)).toLocaleString()} |`);
}
lines.push('', '## The big career totals, if the unmeasured hundreds count at the same rate as the measured ones', '');
lines.push('Only a guide: it treats a batter\'s unmeasured hundreds like his measured ones. Sangakkara, for example, has 38 Test hundreds, and only those with a match record can be tested so far.', '');
lines.push('| Batter | Hundreds | Measured | Tons so far | If the rest match | ', '|---|---|---|---|---|');
const byBatter = new Map();
for (const c of ALL) { const o = byBatter.get(c.name) || { all: 0, measured: 0, tons: 0 }; o.all++; if (CONSEQUENCE[c.id]) { o.measured++; o.tons += CONSEQUENCE[c.id][0]; } byBatter.set(c.name, o); }
for (const [name, o] of [...byBatter].filter(([, o]) => o.all >= 25).sort((a, b) => b[1].all - a[1].all)) {
  lines.push(`| ${name} | ${o.all} | ${o.measured} | ${o.tons} | ${o.measured ? Math.round((o.tons / o.measured) * o.all) : '-'} |`);
}
fs.writeFileSync(path.join(root, 'docs/drafts/consequence-whatif.md'), lines.join('\n') + '\n');
console.log(lines.join('\n'));

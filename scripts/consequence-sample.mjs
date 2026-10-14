/**
 * Runs the draft Consequence Test on a small sample so the thinking can be checked before it touches the site.
 *   node scripts/consequence-sample.mjs <folder of extracted Cricsheet match JSON files>
 * Reads files only; changes nothing.
 */
import fs from 'node:fs';
import path from 'node:path';
import { hundredsIn, seriesStakes } from '../src/lib/matchContext.js';
import { consequenceTest, BAR } from '../src/lib/consequenceTest.js';
import { ALL } from '../src/lib/dataset.js';
import { displayName } from '../src/lib/scoring.js';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/consequence-sample.mjs <folder>'); process.exit(1); }
const matches = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))).filter((m) => m.info?.gender === 'male');
const stakes = seriesStakes(matches);

// every hundred in the archive, with its facts and the dataset row it belongs to
const rows = [];
for (const m of matches) {
  const st = stakes.get(m);
  for (const h of hundredsIn(m)) {
    const full = displayName({ player: h.name });
    const row = ALL.find((c) => (c.player === h.name || c.name === h.name || c.name === full) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
    rows.push({ ...h, stakes: st?.stakes || 'single', seriesScore: st?.score, seriesPlayed: st?.played, seriesOf: st?.of, id: row?.id, display: row?.name || h.name });
  }
}
console.log(`${matches.length} matches, ${rows.length} hundreds in the archive, ${rows.filter((r) => r.id).length} matched to the dataset\n`);

const show = (r) => {
  const t = consequenceTest(r);
  const entry = `${r.entryWkts}-${r.entryScore}, lead ${r.leadOnEntry}`;
  return { t, line: `${String(t.score).padStart(3)} ${t.passes ? 'STAMP' : '     '}  ${r.display.padEnd(17)} ${String(r.runs + (r.notOut ? '*' : '')).padEnd(5)} v ${r.opponent.padEnd(13)} ${r.year} ${r.result.padEnd(4)} inns${r.inningsNo} entry ${entry.padEnd(20)} share ${String(Math.round((r.share || 0) * 100)).padStart(2)}% ${r.stakes.padEnd(11)} [${t.parts.outcome}/${t.parts.pressure}/${t.parts.carry}/${t.parts.stakes}]` };
};

const calibration = [
  ['Ben Stokes', 135, 2019], ['Steve Smith', 144, 2019], ['Matt Renshaw', 190, 2026], ['Travis Head', 163, 2026], ['Steve Smith', 138, 2026],
  ['Adam Gilchrist', 204, 2002], ['Kumar Sangakkara', 192, 2007], ['Brendon McCullum', 302, 2014], ['Ricky Ponting', 156, 2005], ['Nathan Astle', 222, 2002],
];
console.log('== Calibration: innings with a known story (score = outcome/pressure/carry/stakes)');
for (const [n, runs, y] of calibration) {
  const r = rows.find((x) => x.display === n && x.runs === runs && x.year === y);
  console.log(r ? show(r).line : `   (not in the ball-by-ball archive) ${n} ${runs} ${y}`);
}

const players = ['Joe Root', 'Steve Smith', 'Virat Kohli', 'Kane Williamson', 'Ricky Ponting'];
console.log('\n== The five batters people argue about (hundreds that are in the ball-by-ball archive)');
const total = Object.fromEntries(players.map((p) => [p, ALL.filter((c) => c.name === p).length]));
for (const p of players) {
  const mine = rows.filter((r) => r.display === p);
  const scored = mine.map((r) => ({ r, ...show(r) }));
  const pass = scored.filter((x) => x.t.passes);
  console.log(`${p}: ${mine.length} of ${total[p]} hundreds measured; ${pass.length} pass the bar of ${BAR}`);
  if (process.argv.includes('--all')) scored.forEach((x) => console.log('   ' + x.line));
}
const scores = rows.map((r) => consequenceTest(r).score).sort((a, b) => a - b);
console.log(`\nAcross all ${rows.length} measured hundreds, median score ${scores[Math.floor(scores.length / 2)]}. Share that would pass at each bar:`);
for (const bar of [55, 60, 65, 70, 75, 80]) console.log(`   bar ${bar}: ${(100 * scores.filter((s) => s >= bar).length / scores.length).toFixed(1)}%  (${scores.filter((s) => s >= bar).length} hundreds)`);
const bars = [60, 65, 70, 75];
console.log('\nThe five at each bar (measured hundreds only):');
for (const p of players) console.log('   ' + p.padEnd(16) + bars.map((b) => `bar ${b}: ${rows.filter((r) => r.display === p && consequenceTest(r).score >= b).length}`).join('   ') + `   of ${rows.filter((r) => r.display === p).length} measured`);

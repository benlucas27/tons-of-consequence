// Exploratory: which extra cuts of the ball-by-ball record separate Ben's yes rulings from his no rulings?
import fs from 'node:fs';
import path from 'node:path';
import { hundredsIn } from '../src/lib/matchContext.js';
import { CONSEQUENCE_OVERRIDES } from '../src/data/consequence-overrides.js';
import { ALL } from '../src/lib/dataset.js';
import { canonicalPlayer } from '../src/data/name-aliases.js';
import { displayName } from '../src/lib/scoring.js';

const folder = process.argv[2];
const matches = fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))).filter((m) => m.info?.gender === 'male');
// bowler records over the whole archive
const bw = new Map();
const NOT_BOWLER = new Set(['run out', 'retired hurt', 'retired out', 'retired not out', 'obstructing the field']);
for (const m of matches) for (const inn of m.innings || []) for (const o of inn.overs || []) for (const d of o.deliveries || []) {
  const r = bw.get(d.bowler) || { runs: 0, wk: 0 }; bw.set(d.bowler, r);
  r.runs += (d.runs?.batter || 0) + (d.extras?.wides || 0) + (d.extras?.noballs || 0);
  for (const w of d.wickets || []) if (!NOT_BOWLER.has(w.kind)) r.wk += 1;
}
const avgOf = (b) => { const r = bw.get(b); return r && r.wk >= 50 ? r.runs / r.wk : null; };
const rowFor = (h) => {
  const known = canonicalPlayer(h.name); const full = displayName({ player: h.name });
  const same = ALL.filter((c) => (c.player === h.name || c.name === h.name || c.name === full || c.player === known || c.name === known) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
  return same.length > 1 ? same.find((c) => c.balls && h.balls && c.balls === h.balls) || same[0] : same[0];
};
const ruling = (row) => CONSEQUENCE_OVERRIDES[`${row.name}|${row.runs}|${row.year}|${row.id}`] || CONSEQUENCE_OVERRIDES[`${row.name}|${row.runs}|${row.year}`];
const rows = [];
for (const m of matches) {
  for (const h of hundredsIn(m)) {
    const row = rowFor(h); if (!row) continue;
    const o = ruling(row); if (!o) continue;
    const inn = m.innings[h.inningsNo - 1];
    // attack: career bowling average of the bowlers who bowled most balls in this innings
    const balls = new Map();
    let totalRuns = 0, totalWk = 0;
    for (const i2 of m.innings) { for (const ov of i2.overs || []) for (const d of ov.deliveries || []) { totalRuns += d.runs?.total || 0; for (const w of d.wickets || []) if (w.kind !== 'retired hurt') totalWk += 1; } }
    for (const ov of inn.overs || []) for (const d of ov.deliveries || []) balls.set(d.bowler, (balls.get(d.bowler) || 0) + 1);
    const top = [...balls.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([b]) => avgOf(b)).filter((x) => x != null);
    const attack = top.length >= 2 ? top.reduce((a, b) => a + b, 0) / top.length : null;
    rows.push({ yes: o.verdict === 'yes' ? 1 : 0, name: row.name, runs: h.runs, year: h.year, pos: h.position, rest: h.teamTotal - h.runs, share: h.share, inn: h.inningsNo, matchRPW: totalRuns / Math.max(1, totalWk), declared: Boolean(inn.declared), target: h.target, attack, bestStand: h.bestStand?.runs ?? 0, result: h.result, followOn: h.followOn, lead: h.leadOnEntry, balls: h.balls, teamWkts: h.teamWkts, notOut: h.notOut, hundredsInInn: 0 });
  }
}
fs.writeFileSync(process.argv[3] || 'features.json', JSON.stringify(rows));
const bin = (label, key, cuts) => {
  const g = {}; for (const r of rows) { const v = r[key]; if (v == null) continue; const b = cuts.findIndex((c) => v < c); const k = b === -1 ? `>=${cuts.at(-1)}` : `<${cuts[b]}`; (g[k] ||= []).push(r.yes); }
  console.log(label.padEnd(18), Object.entries(g).map(([k, a]) => `${k}: ${Math.round(100 * a.reduce((x, y) => x + y, 0) / a.length)}% yes (n=${a.length})`).join(' | '));
};
console.log('rulings', rows.length, 'yes', rows.reduce((a, r) => a + r.yes, 0));
bin('runs', 'runs', [130, 160, 200, 250]);
bin('rest of team', 'rest', [150, 250, 350, 450]);
bin('share', 'share', [0.25, 0.35, 0.45]);
bin('match runs/wicket', 'matchRPW', [25, 30, 35, 40]);
bin('opp attack avg', 'attack', [25, 28, 31, 34]);
bin('best stand', 'bestStand', [60, 120, 200, 300]);
bin('lead on entry', 'lead', [-100, 0, 100, 250]);
bin('position', 'pos', [2, 3, 4, 5, 7]);
bin('innings', 'inn', [2, 3, 4]);
bin('target(4th)', 'target', [200, 300, 400]);
const decl = rows.filter((r) => r.declared); console.log('declared after', decl.length, Math.round(100 * decl.reduce((a, r) => a + r.yes, 0) / (decl.length || 1)) + '% yes');
const nout = rows.filter((r) => r.notOut); console.log('not out', nout.length, Math.round(100 * nout.reduce((a, r) => a + r.yes, 0) / (nout.length || 1)) + '% yes');
const ro = rows.filter((r) => r.result === 'draw'); console.log('drawn', ro.length, Math.round(100 * ro.reduce((a, r) => a + r.yes, 0) / (ro.length || 1)) + '% yes');

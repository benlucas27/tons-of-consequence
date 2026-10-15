#!/usr/bin/env node
/**
 * PROTOTYPE, analysis only (nothing on the site uses it). A gated and weighted version of the Consequence Test:
 *   gate:  the team won, or saved a draw it was in danger of losing, in a series that was still alive;
 *   score: context points (how badly it was needed, how much he carried, the stakes, the tempo ...), 0 to 100;
 *   a ton of consequence = passes the gate and scores at least the threshold.
 * It is checked against Ben's own rulings (the overrides file and the leaderboard review) to see how closely it matches.
 *
 *   node scripts/consequence-model-v3.mjs <cricsheet folder> [threshold]
 */
import fs from 'node:fs';
import path from 'node:path';
import { hundredsIn, seriesStakes } from '../src/lib/matchContext.js';
import { canonicalPlayer } from '../src/data/name-aliases.js';
import { ALL } from '../src/lib/dataset.js';
import { displayName } from '../src/lib/scoring.js';
import { CONSEQUENCE } from '../src/data/consequence.js';
import { CONSEQUENCE_OVERRIDES } from '../src/data/consequence-overrides.js';

const folder = process.argv[2];
const matches = fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))).filter((m) => m.info?.gender === 'male');
const stakes = seriesStakes(matches);
const rowFor = (h) => {
  const known = canonicalPlayer(h.name);
  const full = displayName({ player: h.name });
  const same = ALL.filter((c) => (c.player === h.name || c.name === h.name || c.name === full || c.player === known || c.name === known) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
  return same.length > 1 ? same.find((c) => c.balls && h.balls && c.balls === h.balls) || same[0] : same[0];
};

export const WEIGHTS = { rescue: 25, share: 20, chase: 15, behind: 10, stakes: 15, tempo: 10, close: 5 };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** { gate, score, parts } for one hundred's facts. */
export function model(f, others = 0) {
  const st = f.stakes || 'single';
  const inDanger = f.inningsNo === 4 || (f.inningsNo === 3 && f.leadOnEntry < 0);
  const gate = st !== 'dead' && (f.result === 'win' || f.result === 'tie' || (f.result === 'draw' && inDanger));
  const parts = {};
  const deep = f.entryWkts >= 3 && f.entryScore < 100;
  parts.rescue = WEIGHTS.rescue * (deep ? 1 : f.peril >= 4 && f.leadOnEntry < 200 ? 0.8 : f.entryWkts >= 2 && f.entryScore < 60 ? 0.5 : 0);
  parts.share = WEIGHTS.share * clamp(((f.share ?? 0) - 0.2) / 0.3);
  parts.chase = f.inningsNo === 4 && f.result === 'win' ? WEIGHTS.chase : 0;
  const lead = f.leadOnEntry;
  parts.behind = WEIGHTS.behind * (lead < -100 ? 1 : lead < 0 ? 0.7 : lead < 50 ? 0.3 : lead > 200 ? -1.5 : 0);
  parts.stakes = WEIGHTS.stakes * ({ decider: 1, 'on the line': 0.8, live: 0.4, single: 0.5, dead: 0 }[st] ?? 0.4);
  const sr = f.balls ? (100 * f.runs) / f.balls : null;
  parts.tempo = sr != null && (sr >= 90 || (sr < 40 && f.balls >= 250)) ? WEIGHTS.tempo : 0;
  const m = f.margin;
  parts.close = WEIGHTS.close * (f.result === 'win' && m && ((m.runs != null && m.runs <= 30) || (m.wickets != null && m.wickets <= 3)) ? 1 : 0);
  parts.others = -3 * others;
  const score = Object.values(parts).reduce((a, b) => a + b, 0);
  return { gate, score: Math.round(score * 10) / 10, parts };
}

if (process.argv[1].endsWith('consequence-model-v3.mjs') && process.argv[4] === 'fit') {
  await fit();
} else if (process.argv[1].endsWith('consequence-model-v3.mjs')) {
  const cases = [];
  for (const m of matches) {
    const st = stakes.get(m);
    const inMatch = hundredsIn(m);
    for (const h of inMatch) {
      const row = rowFor(h);
      if (!row) continue;
      const others = inMatch.filter((x) => x !== h && x.inningsNo === h.inningsNo).length;
      cases.push({ row, f: { ...h, stakes: st?.stakes || 'single' }, others });
    }
  }
  // Ben's rulings as labels
  const labels = new Map();
  for (const [key, o] of Object.entries(CONSEQUENCE_OVERRIDES)) {
    const [name, runs, year, id] = key.split('|');
    const hit = ALL.filter((c) => c.name === name && String(c.runs) === runs && String(c.year) === year && (!id || String(c.id) === id));
    if (hit.length === 1) labels.set(hit[0].id, o.verdict === 'yes');
  }
  const th = Number(process.argv[3]) || 45;
  const rows = cases.map((c) => ({ ...c, m: model(c.f, c.others), now: CONSEQUENCE[c.row.id]?.[0] === 1 }));
  const label = (c) => labels.get(c.row.id);
  const test = (th) => rows.map((c) => c.m.gate && c.m.score >= th);
  console.log(`${rows.length} measured hundreds, ${labels.size} of them have a ruling from Ben.`);
  for (const t of [35, 40, 45, 50, 55, 60]) {
    const pred = test(t);
    const lab = rows.map((c, i) => [label(c), pred[i], c]).filter(([l]) => l != null);
    const agree = lab.filter(([l, p]) => l === p).length;
    const nowAgree = rows.filter((c) => label(c) != null && label(c) === c.now).length;
    console.log(`threshold ${t}: ${pred.filter(Boolean).length} tons (today ${rows.filter((c) => c.now).length}); agrees with ${agree}/${lab.length} of Ben's rulings (today's rules agree with ${nowAgree}/${lab.length})`);
  }
  const pred = test(th);
  const diff = rows.filter((c, i) => pred[i] !== c.now);
  console.log(`\nAt threshold ${th}: ${diff.length} hundreds change. New yes (${diff.filter((c, i) => c.m.gate && c.m.score >= th).length}) / dropped (${diff.filter((c) => !(c.m.gate && c.m.score >= th)).length}).`);
  const show = (arr, n) => arr.slice(0, n).forEach((c) => console.log(`  ${c.row.name} ${c.row.runs} v ${c.row.opponent} ${c.row.year} score ${c.m.score}`));
  console.log('New yes:'); show(diff.filter((c) => c.m.gate && c.m.score >= th).sort((a, b) => b.m.score - a.m.score), 20);
  console.log('Dropped:'); show(diff.filter((c) => !(c.m.gate && c.m.score >= th)).sort((a, b) => a.m.score - b.m.score), 20);
}

/** Fits plain logistic-regression weights on the hundreds that pass the gate, using today's verdicts (which include Ben's rulings) as the target. */
async function fit() {
  const cases = [];
  for (const m of matches) {
    const st = stakes.get(m);
    const inMatch = hundredsIn(m);
    for (const h of inMatch) {
      const row = rowFor(h);
      if (!row) continue;
      const others = inMatch.filter((x) => x !== h && x.inningsNo === h.inningsNo).length;
      cases.push({ row, f: { ...h, stakes: st?.stakes || 'single' }, others });
    }
  }
  const names = ['deep (3+ down, under 100)', 'near-deep (3+ down, 100-130)', 'collapse around him (4+)', 'share of runs (0..1)', 'winning chase', 'team behind on entry', 'team already 200+ ahead', 'decider or on the line', 'live series', 'single Test', 'fast (SR 90+)', 'slow (SR<40, 250+ balls)', 'narrow win', 'other hundreds in innings', 'saved a draw'];
  const feat = ({ f, others }) => {
    const sr = f.balls ? (100 * f.runs) / f.balls : 0;
    const st = f.stakes;
    return [
      f.entryWkts >= 3 && f.entryScore < 100 ? 1 : 0, f.entryWkts >= 3 && f.entryScore >= 100 && f.entryScore < 130 ? 1 : 0, f.peril >= 4 && f.leadOnEntry < 200 ? 1 : 0, f.share ?? 0,
      f.inningsNo === 4 && f.result === 'win' ? 1 : 0, f.leadOnEntry < 0 ? 1 : 0, f.leadOnEntry > 200 ? 1 : 0, st === 'decider' || st === 'on the line' ? 1 : 0, st === 'live' ? 1 : 0, st === 'single' ? 1 : 0,
      sr >= 90 ? 1 : 0, sr < 40 && f.balls >= 250 ? 1 : 0, f.result === 'win' && f.margin && ((f.margin.runs != null && f.margin.runs <= 30) || (f.margin.wickets != null && f.margin.wickets <= 3)) ? 1 : 0, others, f.result === 'draw' ? 1 : 0,
    ];
  };
  const gated = cases.filter((c) => model(c.f, c.others).gate);
  const X = gated.map(feat);
  const y = gated.map((c) => (CONSEQUENCE[c.row.id]?.[0] === 1 ? 1 : 0));
  const n = names.length;
  const w = new Array(n).fill(0);
  let b = -1;
  const sig = (z) => 1 / (1 + Math.exp(-z));
  for (let it = 0; it < 4000; it++) {
    const gw = new Array(n).fill(0);
    let gb = 0;
    for (let i = 0; i < X.length; i++) {
      const z = b + X[i].reduce((a, v, j) => a + v * w[j], 0);
      const e = sig(z) - y[i];
      for (let j = 0; j < n; j++) gw[j] += e * X[i][j];
      gb += e;
    }
    for (let j = 0; j < n; j++) w[j] -= (0.5 * (gw[j] / X.length + 0.001 * w[j]));
    b -= 0.5 * (gb / X.length);
  }
  let ok = 0;
  for (let i = 0; i < X.length; i++) if ((sig(b + X[i].reduce((a, v, j) => a + v * w[j], 0)) >= 0.5 ? 1 : 0) === y[i]) ok += 1;
  console.log(`${gated.length} of ${cases.length} hundreds pass the gate; ${y.reduce((a, b2) => a + b2, 0)} of them are tons today.`);
  console.log(`A weighted model on these 15 context factors reproduces today's verdict on ${ok} of ${gated.length} (${Math.round((100 * ok) / gated.length)}%).`);
  console.log('Learned weights (log-odds; positive helps a hundred count):');
  names.forEach((nm, j) => console.log('  ' + w[j].toFixed(2).padStart(6) + '  ' + nm));
  console.log('  intercept ' + b.toFixed(2));
}

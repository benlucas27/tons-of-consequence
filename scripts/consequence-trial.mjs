#!/usr/bin/env node
/**
 * TRIAL RUN, analysis only: what would the gated and weighted rules (docs/drafts/consequence-rules-v3.md) make of every
 * hundred we have enough facts for? Nothing on the site uses this. Writes docs/drafts/consequence-trial.md.
 *
 *   node scripts/consequence-trial.mjs <cricsheet folder> [threshold]
 *
 * Two kinds of evidence: FULL (ball-by-ball: the score and wickets when he came in, collapses, other hundreds, the next
 * best scorer) and PARTIAL (tour pages: result, innings, team total, lead when the innings began, series state, margin).
 * Partial hundreds are scored without the entry-state points, so they are shown separately.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hundredsIn, inningsOf, seriesStakes } from '../src/lib/matchContext.js';
import { canonicalPlayer } from '../src/data/name-aliases.js';
import { ALL, rankAll } from '../src/lib/dataset.js';
import { DEFAULT_ORDER, displayName } from '../src/lib/scoring.js';
import { CONSEQUENCE } from '../src/data/consequence.js';
import { SERIES_FACTS } from '../src/data/series-facts.js';
import { WIKIPEDIA_FACTS } from '../src/data/wikipedia-facts.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const folder = process.argv[2];
const T = Number(process.argv[3]) || 45;
const matches = fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8'))).filter((m) => m.info?.gender === 'male');
const stakesMap = seriesStakes(matches);
const rowFor = (h) => {
  const known = canonicalPlayer(h.name);
  const full = displayName({ player: h.name });
  const same = ALL.filter((c) => (c.player === h.name || c.name === h.name || c.name === full || c.player === known || c.name === known) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
  return same.length > 1 ? same.find((c) => c.balls && h.balls && c.balls === h.balls) || same[0] : same[0];
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/** The gated and weighted rules. f: result, inn, lead (when the innings began, or on entry when known), share, stakes, sideAhead, margin, balls, runs, and for full evidence entryWkts, entryScore, peril, others, nextBest. */
export function modelV3(f) {
  const dead = f.stakes === 'dead';
  const inDanger = f.inn === 4 || (f.inn === 3 && f.lead != null && f.lead < 0) || f.followOn;
  let gate = false, gateWhy = '';
  if (f.result === 'loss') gateWhy = 'a loss';
  else if (dead && !(f.sideAhead && f.result === 'win')) gateWhy = dead && f.result === 'win' ? 'a dead rubber, and his side had lost the series' : 'a dead rubber that was not a win';
  else if (f.result === 'draw' && !inDanger) gateWhy = 'a draw the team was not in danger of losing';
  else if (f.result === 'draw' && f.inn == null) gateWhy = 'a draw, and we do not know the innings';
  else if (!['win', 'draw', 'tie'].includes(f.result)) gateWhy = 'no result';
  else gate = true;
  const p = {};
  // how much the team needed it
  if (f.entryWkts != null) p.need = f.entryWkts >= 3 && f.entryScore < 100 ? 25 : f.peril >= 4 && f.lead < 200 ? 20 : f.entryWkts >= 3 && f.entryScore < 130 ? 18 : f.entryWkts >= 2 && f.entryScore < 60 ? 10 : 0;
  else p.need = f.lead == null ? 0 : f.lead < -200 ? 20 : f.lead < -100 ? 15 : f.lead < 0 ? 10 : 0;
  // how much he carried
  const sh = f.share ?? 0;
  p.carry = sh >= 0.5 ? 25 : sh >= 0.4 ? 20 : sh >= 0.3 ? 12 : sh >= 0.2 ? 5 : 0;
  if (f.nextBest != null && f.others === 0) p.carry += 5 * clamp((f.runs - f.nextBest) / f.runs);
  if (f.others) p.carry -= Math.min(6, 2 * f.others); // a shared innings is not disqualified, only shared
  // chase and finish
  p.finish = (f.inn === 4 && f.result === 'win' ? 10 : 0) + (f.margin && f.result === 'win' && ((f.margin[0] === 'r' && Number(f.margin.slice(1)) <= 30) || (f.margin[0] === 'w' && Number(f.margin.slice(1)) <= 3)) || f.result === 'tie' ? 5 : 0);
  // what rode on it
  p.stakes = ({ decider: 15, 'on the line': 12, live: 6, single: 7, dead: 3 })[f.stakes] ?? 6;
  if (f.result === 'draw' && inDanger && !dead && f.seriesNotAhead) p.stakes += 5; // the draw stopped the other side taking the series lead
  // tempo
  const sr = f.balls ? (100 * f.runs) / f.balls : null;
  p.tempo = sr != null && (sr >= 90 || (sr < 40 && f.balls >= 250)) ? 10 : 0;
  // the match already safe
  p.safe = f.lead != null && f.lead > 200 ? -20 : 0;
  const score = Math.round(Object.values(p).reduce((a, b) => a + b, 0) * 10) / 10;
  const flags = [];
  if (gate && Math.abs(score - T) <= 5) flags.push('close to the threshold');
  if (gate && f.lead != null && f.lead > 200 && f.result === 'win') flags.push('team already far ahead, but it won');
  if (gate && dead && f.result === 'win') flags.push('dead-rubber win for the series winners');
  if (gate && f.result === 'draw') flags.push('a draw');
  if (gate && p.tempo && score - p.tempo < T && score >= T) flags.push('counts only because of tempo');
  if (gate && f.entryWkts == null) flags.push('partial evidence');
  return { gate, gateWhy, score, parts: p, ton: gate && score >= T, flags };
}

// ---- build the cases
const cases = new Map(); // id -> { row, f, tier }
for (const m of matches) {
  const st = stakesMap.get(m);
  const innings = inningsOf(m);
  const inMatch = hundredsIn(m);
  for (const h of inMatch) {
    const row = rowFor(h);
    if (!row) continue;
    const inn = innings[h.inningsNo - 1];
    const others = inMatch.filter((x) => x !== h && x.inningsNo === h.inningsNo).length;
    const nextBest = Math.max(0, ...inn.batters.filter((b) => b.name !== h.name).map((b) => b.runs));
    let sideAhead = false;
    let notAhead = true;
    if (st) { const [x, y] = st.score.split('-').map(Number); const mine = h.team === st.teams[0] ? x : y; const theirs = h.team === st.teams[0] ? y : x; sideAhead = mine > theirs; notAhead = mine <= theirs; }
    const mg = h.margin ? (h.margin.runs != null ? `r${h.margin.runs}` : h.margin.wickets != null ? `w${h.margin.wickets}` : null) : null;
    cases.set(row.id, { row, tier: 'full', f: { result: h.result, inn: h.inningsNo, lead: h.leadOnEntry, share: h.share, stakes: st?.stakes || 'single', sideAhead, seriesNotAhead: notAhead, margin: mg, balls: h.balls, runs: h.runs, entryWkts: h.entryWkts, entryScore: h.entryScore, peril: h.peril, others, nextBest, followOn: h.followOn } });
  }
}
for (const c of ALL) {
  if (cases.has(c.id) || CONSEQUENCE[c.id]?.[3] === 's') continue;
  const sf = SERIES_FACTS[c.id];
  if (!sf || !sf[5] || !sf[6]) continue; // need the innings and the team total
  const [result, n, m, lead, dead, inn, tot, leadStart, margin] = sf;
  const stakes = dead ? 'dead' : n === m && lead === 0 ? 'decider' : n === m ? 'on the line' : m === 1 ? 'single' : 'live';
  cases.set(c.id, { row: c, tier: 'partial', f: { result, inn, lead: leadStart, share: tot ? c.runs / tot : null, stakes, sideAhead: lead != null && lead > 0, seriesNotAhead: lead == null || lead <= 0, margin, balls: c.balls, runs: c.runs, entryWkts: null, others: null, nextBest: null, followOn: false } });
}
const rows = [...cases.values()].map((c) => ({ ...c, m: modelV3(c.f), now: CONSEQUENCE[c.row.id]?.[0] === 1, hasNow: Boolean(CONSEQUENCE[c.row.id]) }));
const rk = new Map(rankAll(DEFAULT_ORDER, null).map((c) => [c.id, c.rank]));

// ---- calibrate the threshold on full-evidence hundreds against today's verdicts
const full = rows.filter((r) => r.tier === 'full');
const agree = (th) => full.filter((r) => (r.m.gate && r.m.score >= th) === r.now).length;
const sweep = [30, 35, 40, 45, 50, 55, 60].map((th) => ({ th, tons: full.filter((r) => r.m.gate && r.m.score >= th).length, agree: agree(th) }));

const out = [];
out.push('# Trial run of the gated and weighted rules (analysis only)', '');
out.push(`Threshold ${T}. ${rows.length.toLocaleString()} hundreds scored: ${full.length.toLocaleString()} with full ball-by-ball evidence and ${(rows.length - full.length).toLocaleString()} with partial evidence (result, innings, team total, series state; no entry state). ${ALL.length - rows.length} hundreds could not be scored yet.`, '');
out.push('## Threshold against today (full-evidence hundreds)', '', '| Threshold | Tons | Today | Same verdict as today |', '|---|---|---|---|');
for (const s of sweep) out.push(`| ${s.th} | ${s.tons} | ${full.filter((r) => r.now).length} | ${s.agree} of ${full.length} (${Math.round((100 * s.agree) / full.length)}%) |`);
const tons = rows.filter((r) => r.m.ton);
out.push('', `## Result at ${T}`, '', `- Full evidence: **${full.filter((r) => r.m.ton).length}** tons (today ${full.filter((r) => r.now).length}).`, `- Partial evidence: **${rows.filter((r) => r.tier === 'partial' && r.m.ton).length}** tons out of ${rows.filter((r) => r.tier === 'partial').length} scored.`);
const flagged = tons.filter((r) => r.m.flags.length);
out.push(`- Tons that need a manual look (close to the threshold, far-ahead wins, dead-rubber wins, draws, tempo-only): **${flagged.length}** of ${tons.length}.`, `- Hundreds just below the threshold (within 5 points, gate passed): **${rows.filter((r) => r.m.gate && !r.m.ton && r.m.score >= T - 5).length}**.`);
const name = (r) => `${r.row.name} ${r.row.runs}${r.row.notOut ? '*' : ''} v ${r.row.opponent}, ${r.row.venue} ${r.row.year}`;
out.push('', '## Top 30 innings by score', '', '| # | Innings | Score | Today | Evidence | Flags |', '|---|---|---|---|---|---|');
rows.filter((r) => r.m.gate).sort((a, b) => b.m.score - a.m.score).slice(0, 30).forEach((r, i) => out.push(`| ${i + 1} | ${name(r)} | ${r.m.score} | ${r.hasNow ? (r.now ? 'ton' : 'good ton') : 'no verdict'} | ${r.tier} | ${r.m.flags.join('; ')} |`));
// scorers
const byBat = new Map();
for (const c of ALL) { const o = byBat.get(c.name) || { all: 0, full: 0, fullTons: 0, fullNow: 0, partial: 0, partialTons: 0 }; o.all++; byBat.set(c.name, o); }
for (const r of rows) {
  const o = byBat.get(r.row.name);
  if (r.tier === 'full') { o.full++; if (r.m.ton) o.fullTons++; if (r.now) o.fullNow++; } else { o.partial++; if (r.m.ton) o.partialTons++; }
}
out.push('', '## The 40 batters with the most hundreds', '', 'Full = ball-by-ball evidence (counts are firm). Partial = result, innings, team total and series state only, so those tons are all flagged for review. Unscored = not enough facts yet: this is the list of what still needs collecting.', '', '| Batter | Hundreds | Full | New tons (full) | Today (full) | Partial | New tons (partial) | Unscored |', '|---|---|---|---|---|---|---|---|');
[...byBat.entries()].sort((a, b) => b[1].all - a[1].all).slice(0, 40).forEach(([n, o]) => out.push(`| ${n} | ${o.all} | ${o.full} | ${o.fullTons} | ${o.fullNow} | ${o.partial} | ${o.partialTons} | ${o.all - o.full - o.partial} |`));
// movers
const gain = rows.filter((r) => r.tier === 'full' && r.m.ton && !r.now).sort((a, b) => b.m.score - a.m.score).slice(0, 15);
const lose = rows.filter((r) => r.tier === 'full' && !r.m.ton && r.now).sort((a, b) => (rk.get(a.row.id) || 9999) - (rk.get(b.row.id) || 9999)).slice(0, 15);
out.push('', '## New tons that are not tons today (full evidence)', '', ...gain.map((r) => `- ${name(r)}: score ${r.m.score}${r.m.flags.length ? ' (' + r.m.flags.join('; ') + ')' : ''}`));
out.push('', '## Tons today that fall below the threshold (full evidence, highest ranked first)', '', ...lose.map((r) => `- ${name(r)}: score ${r.m.score}${r.m.gate ? '' : ' (fails the gate: ' + r.m.gateWhy + ')'}`));
fs.writeFileSync(path.join(root, 'docs/drafts/consequence-trial.md'), out.join('\n') + '\n');
console.log(out.slice(0, 40).join('\n'));

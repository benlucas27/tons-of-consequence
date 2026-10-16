#!/usr/bin/env node
/**
 * Builds src/data/consequence.js: the Consequence Test verdict for every hundred we can measure, plus Bradman's 29
 * (from the scorecards on The Don page). Reads Cricsheet's ball-by-ball archive, applies the written rulings
 * (src/data/consequence-overrides.js) and matches each innings to its row in the dataset.
 *
 *   node scripts/build-consequence.mjs <folder of extracted Cricsheet match JSON>
 *   node scripts/build-consequence.mjs --download
 *
 * Each entry is [1 or 0 for "a ton of consequence", scenario or null, the reason]. Anything not listed has not been
 * measured yet (no match record).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AdmZip from 'adm-zip';
import { hundredsIn, inningsOf, seriesStakes } from '../src/lib/matchContext.js';
import { modelV3, robustness, describeTon, describeGoodTon, THRESHOLD } from '../src/lib/consequenceModel.js';
import { SERIES_FACTS } from '../src/data/series-facts.js';
import { WIKIPEDIA_FACTS } from '../src/data/wikipedia-facts.js';
import { OCCASIONS } from '../src/data/occasions.js';
import { CONSEQUENCE_OVERRIDES } from '../src/data/consequence-overrides.js';
import { consequenceTest } from '../src/lib/consequenceTest.js';
import { withOverride } from '../src/lib/consequenceOverrides.js';
import { canonicalPlayer } from '../src/data/name-aliases.js';
import { ALL } from '../src/lib/dataset.js';
import { displayName } from '../src/lib/scoring.js';
import { DON } from '../src/data/the-don.js';
import { FINAL_OLDER_RULINGS } from '../src/data/final-older-rulings.js';
import { OLDER_RULINGS } from '../src/data/older-rulings.js';
import { COMPARE_SETS } from '../src/data/compare-sets.js';
import { tierOfOpponent } from '../src/lib/matchFacts.js';
import { countVenues, wherePlayed } from '../src/lib/hostOf.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const folder = args.find((a) => !a.startsWith('--'));

async function loadMatches() {
  if (args.includes('--download')) {
    const res = await fetch('https://cricsheet.org/downloads/tests_json.zip');
    if (!res.ok) throw new Error(`Cricsheet download failed: ${res.status}`);
    const zip = new AdmZip(Buffer.from(await res.arrayBuffer()));
    return zip.getEntries().filter((e) => e.entryName.endsWith('.json')).map((e) => JSON.parse(e.getData().toString('utf8')));
  }
  if (!folder) { console.error('usage: node scripts/build-consequence.mjs <folder> | --download'); process.exit(1); }
  return fs.readdirSync(folder).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(folder, f), 'utf8')));
}

const matches = (await loadMatches()).filter((m) => m.info?.gender === 'male');
const stakes = seriesStakes(matches);
const venueCounts = countVenues(matches);

const rowFor = (h) => {
  const known = canonicalPlayer(h.name);
  const full = displayName({ player: h.name });
  const same = ALL.filter((c) => (c.player === h.name || c.name === h.name || c.name === full || c.player === known || c.name === known) && c.runs === h.runs && c.year === h.year && c.opponent === h.opponent);
  return same.length > 1 ? same.find((c) => c.balls && h.balls && c.balls === h.balls) || same[0] : same[0];
};

// career bowling averages over the whole archive, to size up the attack a hundred was made against (2006 on)
const bowlerRecord = new Map();
for (const m of matches) for (const inn of m.innings || []) for (const o of inn.overs || []) for (const d of o.deliveries || []) {
  const r = bowlerRecord.get(d.bowler) || { runs: 0, wk: 0 }; bowlerRecord.set(d.bowler, r);
  r.runs += (d.runs?.batter || 0) + (d.extras?.wides || 0) + (d.extras?.noballs || 0);
  for (const w of d.wickets || []) if (!['run out', 'retired hurt', 'retired out', 'retired not out', 'obstructing the field'].includes(w.kind)) r.wk += 1;
}
const attackAverage = (inn) => {
  const balls = new Map();
  for (const o of inn.overs || []) for (const d of o.deliveries || []) balls.set(d.bowler, (balls.get(d.bowler) || 0) + 1);
  const top = [...balls.entries()].sort((a, c) => c[1] - a[1]).slice(0, 3).map(([n]) => bowlerRecord.get(n)).filter((r) => r && r.wk >= 50).map((r) => r.runs / r.wk);
  return top.length >= 2 ? top.reduce((a, c) => a + c, 0) / top.length : null;
};
const out = {};
const fullCases = {}; // id -> the facts the gated and weighted rules need, from the ball-by-ball record
const facts = {}; // id -> [batting position, innings number, balls to 100, other hundreds in the innings, other hundreds in the match]
const where = {}; // id -> 'H' home, 'A' away, 'N' neutral, for the side that scored the hundred
for (const m of matches) {
  const st = stakes.get(m);
  const inMatch = hundredsIn(m);
  const matchInnings = inningsOf(m);
  for (const h of inMatch) {
    const row = rowFor(h);
    if (!row) continue;
    {
      const inn = matchInnings[h.inningsNo - 1];
      const others = inMatch.filter((x) => x !== h && x.inningsNo === h.inningsNo).length;
      const nextBest = Math.max(0, ...inn.batters.filter((b) => b.name !== h.name).map((b) => b.runs));
      let sideAhead = false;
      let notAhead = true;
      if (st) { const [x, y] = st.score.split('-').map(Number); const mine = h.team === st.teams[0] ? x : y; const theirs = h.team === st.teams[0] ? y : x; sideAhead = mine > theirs; notAhead = mine <= theirs; }
      const mg = h.margin ? (h.margin.runs != null ? `r${h.margin.runs}` : h.margin.wickets != null ? `w${h.margin.wickets}` : null) : null;
      fullCases[row.id] = { occasion: OCCASIONS[row.id]?.tag, occasionNote: OCCASIONS[row.id]?.note, result: h.result, inn: h.inningsNo, lead: h.leadOnEntry, share: h.share, total: h.teamTotal, stakes: st?.stakes || 'single', sideAhead, seriesNotAhead: notAhead, margin: mg, start: h.date ? h.date.slice(5, 7) + h.date.slice(8, 10) : null, balls: h.balls, runs: h.runs, entryWkts: h.entryWkts, entryScore: h.entryScore, peril: h.peril, others, nextBest, followOn: h.followOn, pos: h.position, bestStand: h.bestStand, openStand: h.openStand, lastOpenerOut: h.lastOpenerOut, overs: Math.round(m.innings.reduce((a, i2) => a + (i2.overs || []).reduce((x, o) => x + o.deliveries.filter((d) => !d.extras?.wides && !d.extras?.noballs).length, 0), 0) / 6), rest: h.teamTotal - h.runs, attack: attackAverage(m.innings[h.inningsNo - 1]) };
    }
    const v = withOverride(consequenceTest({ ...h, stakes: st?.stakes || 'single' }), row.name, row.runs, row.year, row.id);
    out[row.id] = [v.passes ? 1 : 0, v.passes ? v.scenario : null, v.because, 'b'];
    where[row.id] = wherePlayed(m, venueCounts, h.team);
    facts[row.id] = [h.position, h.inningsNo, h.ballsTo100, inMatch.filter((x) => x !== h && x.inningsNo === h.inningsNo).length, inMatch.length - 1];
  }
}

// Bradman: from the scorecards (before 2001 there is no ball-by-ball record)
let don = 0;
for (const d of DON) {
  const row = ALL.find((c) => c.name === 'Don Bradman' && c.runs === d.runs && c.year === d.year && c.notOut === d.notOut);
  if (!row) { console.warn(`Bradman ${d.runs} (${d.year}) is not in the dataset`); continue; }
  out[row.id] = [d.status === 'yes' ? 1 : 0, d.status === 'yes' ? d.scenario : null, d.reason, 's'];
  where[row.id] = ['Trent Bridge', "Lord's", 'Headingley', 'The Oval'].includes(d.venue) ? 'A' : 'H'; // Australia batting: away in England, home in Australia
  don++;
}

// older hundreds with no ball-by-ball record, ruled by hand from the sourced review (src/data/older-rulings.js)
for (const [id, v] of Object.entries(OLDER_RULINGS)) if (!out[id]) out[id] = v.length > 3 ? v : [...v, 'r']; // a fourth item sets the evidence level ('h': match reports that describe how the innings unfolded)


// ---- version 3: the gated and weighted rules (src/lib/consequenceModel.js), applied only where the answer is firm
const handRuled = (row) => {
  const o = CONSEQUENCE_OVERRIDES[`${row.name}|${row.runs}|${row.year}|${row.id}`] || CONSEQUENCE_OVERRIDES[`${row.name}|${row.runs}|${row.year}`];
  return Boolean(o) && (o.id == null || o.id === row.id);
};
const queue = [];
const calib = { total: 0, agree: 0 };
const scoreDump = {}; // id -> what the rules scored it, for the batter reviews
const rerun = []; // hundreds Ben ruled by hand where the rules, run again, disagree
const addRerun = (row, mine, f, mm, evidence) => {
  const d = mm.ton ? describeTon(f, mm) : null;
  const parts = Object.entries(mm.parts).filter(([, v]) => v).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(', ');
  rerun.push({ id: row.id, name: row.name, runs: row.runs, year: row.year, opponent: row.opponent, venue: row.venue, evidence, yours: mine, rules: mm.ton ? 'yes' : 'no', score: mm.score, gate: mm.gate ? '' : mm.gateWhy, parts, reason: mm.ton ? d.reason : describeGoodTon(f, mm), scenario: d?.scenario || null, verdict: [mm.ton ? 1 : 0, d?.scenario || null, mm.ton ? d.reason : describeGoodTon(f, mm), evidence] });
};
let v3Changed = 0, v3Kept = 0, v3Partial = 0;
const decide = (row, f, evidence, existing) => {
  const m = modelV3(f);
  const rob = robustness(f);
  if (rob.cls === 'marginal') { queue.push({ id: row.id, name: row.name, runs: row.runs, year: row.year, opponent: row.opponent, venue: row.venue, score: m.score, stable: rob.stable, gate: m.gate, why: m.gate ? '' : m.gateWhy, evidence, today: existing ? existing[0] : null, parts: Object.entries(m.parts).filter(([, v]) => v).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(', '), facts: m.ton ? describeTon(f, m).reason : describeGoodTon(f, m), result: f.result }); return existing || null; }
  if (rob.cls === 'solid ton' && m.ton) { const d = describeTon(f, m); return [1, d.scenario, d.reason, evidence]; }
  return [0, null, describeGoodTon(f, m), evidence];
};
for (const [idStr, f] of Object.entries(fullCases)) {
  const id = Number(idStr);
  const row = ALL.find((c) => c.id === id);
  if (handRuled(row)) { calib.total += 1; { const mm = modelV3(f); if (mm.ton === (out[id][0] === 1)) calib.agree += 1; else { addRerun(row, { verdict: out[id][0] === 1 ? 'yes' : 'no', note: out[id][2] }, f, mm, 'b'); } if (false && process.env.DEBUG_CALIB) console.log('DISAGREE', out[id][0] === 1 ? 'Ben yes, model no' : 'Ben no, model yes', row.name, row.runs, row.opponent, row.year, 'score', mm.score, mm.gate ? '' : 'gate:' + mm.gateWhy, JSON.stringify(Object.fromEntries(Object.entries(mm.parts).filter(([, v]) => v).map(([k, v]) => [k, Math.round(v)])))); } continue; } // Ben's own ruling stands (and is a check on the model)
  { const mm = modelV3(f); scoreDump[id] = { score: mm.score, gate: mm.gate, why: mm.gateWhy, parts: Object.entries(mm.parts).filter(([, v]) => v).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(', '), evidence: 'b', facts: mm.ton ? describeTon(f, mm).reason : describeGoodTon(f, mm), result: f.result }; }
  const next = decide(row, f, 'b', out[id]);
  if (next && out[id] && next[0] !== out[id][0]) v3Changed += 1; else v3Kept += 1;
  if (next) out[id] = next;
}
for (const row of ALL) {
  if (out[row.id] && !OLDER_RULINGS[row.id]) continue; // already has a verdict (ball-by-ball, Bradman, or a hand ruling)
  const sf = SERIES_FACTS[row.id];
  if (!sf || !sf[5] || !sf[6]) continue;
  const [result, n, mm, lead, dead, inn, tot, leadStart, margin, start] = sf;
  const stakes = dead ? 'dead' : n === mm && lead === 0 ? 'decider' : n === mm ? 'on the line' : mm === 1 ? 'single' : 'live';
  const f = { occasion: OCCASIONS[row.id]?.tag, occasionNote: OCCASIONS[row.id]?.note, result, inn, lead: leadStart, share: tot ? row.runs / tot : null, total: tot, stakes, sideAhead: lead != null && lead > 0, seriesNotAhead: lead == null || lead <= 0, margin, start, balls: row.balls, runs: row.runs, pos: WIKIPEDIA_FACTS[row.id]?.[1] ?? null, entryWkts: null, others: null, nextBest: null, followOn: false };
  if (OLDER_RULINGS[row.id]) { if (out[row.id]) { const mm = modelV3(f); calib.olderTotal = (calib.olderTotal || 0) + 1; if (mm.ton !== (out[row.id][0] === 1)) addRerun(row, { verdict: out[row.id][0] === 1 ? 'yes' : 'no', note: out[row.id][2] }, f, mm, 'p'); } continue; }
  { const mm = modelV3(f); scoreDump[row.id] = { score: mm.score, gate: mm.gate, why: mm.gateWhy, parts: Object.entries(mm.parts).filter(([, v]) => v).map(([k, v]) => `${k} ${Math.round(v * 10) / 10}`).join(', '), evidence: 'p', facts: mm.ton ? describeTon(f, mm).reason : describeGoodTon(f, mm), result: f.result }; }
  const next = decide(row, f, 'p', null);
  if (next) { out[row.id] = next; v3Partial += 1; }
}
// Ben, 16 Oct 2026: with the 12 laws agreed, the rules' answer replaces his earlier hand ruling wherever they disagree (Bradman excepted: he is not in this list)
// rulings made in the final review (final: true) were made under the 12 laws and stand
const finalIds = new Set(Object.entries(CONSEQUENCE_OVERRIDES).filter(([, o]) => o.final).map(([k]) => Number(k.split('|')[3])));
rerun.splice(0, rerun.length, ...rerun.filter((r) => !finalIds.has(r.id)));
for (const r of rerun) out[r.id] = r.verdict; 
for (const [id, v] of Object.entries(FINAL_OLDER_RULINGS)) out[id] = v;
fs.writeFileSync(path.join(root, 'docs/drafts/scores.json'), JSON.stringify(scoreDump));
fs.writeFileSync(path.join(root, 'docs/drafts/review-rerun.json'), JSON.stringify(rerun, null, 1));
console.log(`Rerun: ${rerun.length} of Ben's hand rulings disagree with the rules (${rerun.filter((r) => r.evidence === 'b').length} ball-by-ball, ${rerun.filter((r) => r.evidence === 'p').length} older, of ${calib.olderTotal || 0} older rulings with series facts).`);
fs.writeFileSync(path.join(root, 'docs/drafts/review-queue.json'), JSON.stringify(queue, null, 1));
console.log(`The model agrees with ${calib.agree} of ${calib.total} of Ben's own rulings on ball-by-ball hundreds.`);
console.log(`v3 (threshold ${THRESHOLD}): ${v3Changed} ball-by-ball verdicts changed, ${v3Kept} kept, ${v3Partial} partial-evidence verdicts added, ${queue.length} marginal hundreds queued for review.`);

const ids = Object.keys(out).map(Number).sort((a, b) => a - b);
const lines = ids.map((id) => `  ${id}: ${JSON.stringify(out[id])},`);
const js = `/**
 * The Consequence Test verdict for every hundred we can measure. Generated by scripts/build-consequence.mjs: do not edit by hand.
 * id -> [1 if a ton of consequence else 0, the scenario (or null), the reason, evidence: 'b' ball-by-ball, 's' scorecard, 'r' match reports, 'h' hand-checked reports, 'p' partial (result, innings, team total and series only)].
 */
export const CONSEQUENCE = {
${lines.join('\n')}
};
`;
fs.writeFileSync(path.join(root, 'src/data/consequence.js'), js);
// the ids alone, small enough to ship to the browser for the mark on ranking rows (the full file is only used on the server)
fs.writeFileSync(path.join(root, 'src/data/ton-ids.js'), `/** Ids of the hundreds that are tons of consequence. Generated by scripts/build-consequence.mjs: do not edit by hand. */\nexport const TON_IDS = new Set(${JSON.stringify(ids.filter((id) => out[id][0]))});\n`);
fs.writeFileSync(path.join(root, 'src/data/where-played.js'), `/** id -> 'H' home, 'A' away or 'N' neutral, for the side that scored the hundred. Generated by scripts/build-consequence.mjs: do not edit by hand. */\nexport const WHERE_PLAYED = ${JSON.stringify(where)};\n`);
// reference points for the players in the career presets (small, so the Compare page can ship them to the browser)
const ref = {};
for (const set of COMPARE_SETS) {
  for (const p of set.players) {
    const mine = ALL.filter((c) => c.name === p.name && c.country === p.country);
    const known = mine.filter((c) => ['win', 'draw', 'loss'].includes(c.matchResult));
    const measured = mine.filter((c) => out[c.id]);
    const tons = measured.filter((c) => out[c.id][0] === 1);
    const tier = (list, n) => list.filter((c) => tierOfOpponent(c.opponent) === n).length;
    ref[`${p.name}|${p.country}`] = {
      hundreds: mine.length,
      results: { known: known.length, won: known.filter((c) => c.matchResult === 'win').length, drawn: known.filter((c) => c.matchResult === 'draw').length, lost: known.filter((c) => c.matchResult === 'loss').length },
      measured: measured.length,
      tons: tons.length,
      byTier: [1, 2, 3, 4].map((n) => tier(mine, n)),
      tonsByTier: [1, 2, 3, 4].map((n) => tier(tons, n)),
      away: mine.filter((c) => where[c.id] === 'A').length,
      home: mine.filter((c) => where[c.id] === 'H').length,
      awayTons: tons.filter((c) => where[c.id] === 'A').length,
    };
  }
}
fs.writeFileSync(path.join(root, 'src/data/reference-points.js'), `/** What the hundreds of the career-preset players did: results, tons of consequence, opposition tiers, home and away. Generated by scripts/build-consequence.mjs: do not edit by hand. */\nexport const REFERENCE_POINTS = ${JSON.stringify(ref, null, 1)};\n`);
fs.writeFileSync(path.join(root, 'src/data/innings-facts.js'), `/** id -> [batting position, innings number, balls faced to reach 100, other hundreds in the innings, other hundreds in the match], for hundreds with a match record. Generated by scripts/build-consequence.mjs: do not edit by hand. */\nexport const INNINGS_FACTS = ${JSON.stringify(facts)};\n`);
const yes = ids.filter((id) => out[id][0]).length;
console.log(`wrote src/data/consequence.js: ${ids.length} hundreds measured (${don} of them Bradman's), ${yes} are tons of consequence.`);

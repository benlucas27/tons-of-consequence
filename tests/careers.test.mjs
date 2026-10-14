import test from 'node:test';
import assert from 'node:assert/strict';
import { battingLines, addMatch, derived, emptyCareer } from '../src/lib/careerStats.js';
import { COMPARE_SETS, setById, compareCareers } from '../src/lib/careerCompare.js';
import { CAREERS } from '../src/data/careers.js';
import { ALL } from '../src/lib/dataset.js';
import { DEFAULT_ORDER, PRESETS } from '../src/lib/scoring.js';

// A tiny two-innings match: A bats first (A1 scores 4 off 3 balls incl. a wide, is bowled; A2 stays in as non-striker,
// not out on 0; A3 never bats), then B bats (B1 retires hurt on 60 and is not out).
const ball = (batter, non_striker, runs, extra = {}, wickets) => ({ batter, non_striker, bowler: 'Z', runs: { batter: runs, extras: 0, total: runs }, ...(Object.keys(extra).length ? { extras: extra } : {}), ...(wickets ? { wickets } : {}) });
const match = {
  info: { gender: 'male', dates: ['2020-01-01'], registry: { people: { A1: 'id-a1', A2: 'id-a2', A3: 'id-a3', B1: 'id-b1' } }, players: { TeamA: ['A1', 'A2', 'A3'], TeamB: ['B1'] } },
  innings: [
    { team: 'TeamA', overs: [{ over: 0, deliveries: [ball('A1', 'A2', 4), ball('A1', 'A2', 0, { wides: 1 }), ball('A1', 'A2', 0, {}, [{ player_out: 'A1', kind: 'bowled' }])] }] },
    { team: 'TeamB', overs: [{ over: 0, deliveries: [ball('B1', 'X', 60), ball('B1', 'X', 0, {}, [{ player_out: 'B1', kind: 'retired hurt' }])] }] },
  ],
};

test('batting lines follow scorebook rules', () => {
  const lines = battingLines(match);
  const get = (n) => lines.find((l) => l.name === n);
  assert.deepEqual({ runs: get('A1').runs, balls: get('A1').balls, out: get('A1').out }, { runs: 4, balls: 2, out: true }); // the wide is not a ball faced
  assert.equal(get('A2').runs, 0);
  assert.equal(get('A2').out, false); // batted (non-striker) and not out
  assert.equal(get('A3'), undefined); // never batted
  assert.equal(get('B1').out, false); // retired hurt is not out
  assert.equal(get('B1').runs, 60);
});

test('women\'s matches are ignored', () => {
  assert.deepEqual(battingLines({ ...match, info: { ...match.info, gender: 'female' } }), []);
});

test('careers accumulate and derive the quoted figures', () => {
  const careers = {};
  addMatch(careers, match, new Set(['id-a1', 'id-b1']));
  addMatch(careers, match, new Set(['id-a1', 'id-b1']));
  const a1 = careers['id-a1'];
  assert.equal(a1.matches, 2);
  assert.equal(a1.innings, 2);
  assert.equal(a1.runs, 8);
  assert.equal(careers['id-b1'].fifties, 2);
  assert.equal(derived(careers['id-b1']).average, null); // never dismissed: no average
  assert.equal(derived(a1).average, 4);
  const c = { ...emptyCareer(), innings: 10, notOuts: 2, runs: 800, balls: 1600, fifties: 3, hundreds: 1, matches: 6 };
  assert.deepEqual(derived(c), { average: 100, strikeRate: 50, fiftyPlus: 4, conversion: 25, inningsPerHundred: 10, hundredsPerTest: 0.17 });
});

test('every preset comparison has figures that agree with the ranking dataset', () => {
  assert.ok(COMPARE_SETS.length >= 1);
  assert.equal(new Set(COMPARE_SETS.map((s) => s.id)).size, COMPARE_SETS.length);
  for (const set of COMPARE_SETS) {
    assert.ok(set.players.length >= 2 && set.players.length <= 5, `${set.id} size`);
    for (const p of set.players) {
      const career = CAREERS[`${p.name}|${p.country}`];
      assert.ok(career, `no career figures for ${p.name}: run node scripts/build-careers.mjs`);
      const inDataset = ALL.filter((c) => c.name === p.name && c.country === p.country).length;
      assert.equal(career.hundreds, inDataset, `${p.name}: ${career.hundreds} hundreds in the archive but ${inDataset} in the dataset`);
      assert.ok(career.innings > career.notOuts && career.runs > 0 && career.matches > 0);
    }
  }
});

test('the Big Four comparison: tables, leaders and a verdict that only states facts', () => {
  const r = compareCareers(setById('big-four'), DEFAULT_ORDER, null);
  assert.deepEqual(r.players.map((p) => p.name), ['Steve Smith', 'Virat Kohli', 'Joe Root', 'Kane Williamson']);
  const row = (rows, key) => rows.find((x) => x.key === key);
  const hundreds = row(r.numbers, 'hundreds');
  assert.deepEqual(hundreds.values, r.players.map((p) => p.career.hundreds));
  assert.deepEqual(hundreds.leaders, [hundreds.values.indexOf(Math.max(...hundreds.values))]);
  const perHundred = row(r.numbers, 'perHundred'); // lower is better
  assert.deepEqual(perHundred.leaders, [perHundred.values.indexOf(Math.min(...perHundred.values))]);
  assert.equal(row(r.numbers, 'tests').leaders.length, 0); // not a contest
  for (const l of r.numbers.concat(r.ranking).filter((x) => x.scored)) assert.ok(l.leaders.length < r.players.length);
  assert.equal(r.leads.reduce((a, l) => a + l.count, 0) >= 1, true);
  assert.ok(r.summary.length >= 2 && r.summary.every((s) => s.length > 20));
  // conversion is hundreds as a share of all 50+ scores
  const conv = row(r.numbers, 'conversion').values;
  r.players.forEach((p, i) => assert.equal(conv[i], Math.round((p.career.hundreds / (p.career.hundreds + p.career.fifties)) * 1000) / 10));
});

test('the ranking half follows the reader\'s weighting', () => {
  const plain = compareCareers(setById('big-four'), DEFAULT_ORDER, null);
  const patriot = compareCareers(setById('big-four'), PRESETS.Patriot.order, PRESETS.Patriot.bias);
  const smith = (r) => r.players.find((p) => p.name === 'Steve Smith').ranking.averageToc;
  assert.ok(smith(patriot) > smith(plain)); // the Australian bonus lifts Smith's hundreds, nobody else's
  const kohli = (r) => r.players.find((p) => p.name === 'Virat Kohli').ranking.averageToc;
  assert.equal(kohli(patriot), kohli(plain));
});

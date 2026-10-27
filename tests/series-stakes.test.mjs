import test from 'node:test';
import assert from 'node:assert/strict';
import { seriesStakes } from '../src/lib/matchContext.js';
import { hostOf } from '../src/lib/hostOf.js';

const match = (teams, date, n, winner, venue = 'Some Ground') => ({ info: { gender: 'male', teams, dates: [date], event: { name: `${teams[0]} tour of ${teams[1]}`, match_number: n }, outcome: winner ? { winner } : {}, venue } });
const stakesOf = (list) => { const m = seriesStakes(list); return list.map((x) => m.get(x)?.stakes); };

test('the latest Test of an unfinished series is never called a decider', () => {
  const a = match(['A', 'B'], '2026-09-01', 1, 'A');
  const b = match(['A', 'B'], '2026-09-10', 2, 'B');
  assert.deepEqual(stakesOf([a, b]), ['live', 'live']);
});

test('a one-off Test long ago is single, not a decider', () => {
  const old = match(['A', 'B'], '2020-01-01', 1, 'A');
  const recent = match(['C', 'D'], '2026-10-01', 1, 'C');
  assert.equal(stakesOf([old, recent])[0], 'single');
});

test('a finished series still has its decider and its dead rubbers', () => {
  const s = [match(['A', 'B'], '2020-01-01', 1, 'A'), match(['A', 'B'], '2020-01-10', 2, 'B'), match(['A', 'B'], '2020-01-20', 3, 'A'), match(['C', 'D'], '2026-10-01', 1, 'C')];
  assert.deepEqual(stakesOf(s).slice(0, 3), ['live', 'live', 'decider']);
});

test('Hobart and Dharamsala are home grounds for Australia and India, not neutral', () => {
  const ashes = { info: { teams: ['Australia', 'England'], venue: 'Bellerive Oval, Hobart', event: { name: 'The Ashes' } } };
  assert.equal(hostOf(ashes, {}), 'Australia');
  const bgt = { info: { teams: ['Australia', 'India'], venue: 'Himachal Pradesh Cricket Association Stadium, Dharamsala', event: { name: 'Border-Gavaskar Trophy' } } };
  assert.equal(hostOf(bgt, {}), 'India');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { newTonIds, buildPushes } from '../src/lib/pushMessages.js';

const h = (id, name, runs, extra = {}) => ({ id, name, runs, opponent: 'South Africa', venue: 'Durban', year: 2026, ...extra });
const byId = new Map([[1, h(1, 'Matt Renshaw', 190)], [2, h(2, 'Usman Khawaja', 120, { notOut: true })], [3, h(3, 'A B', 100)], [4, h(4, 'C D', 101)], [5, h(5, 'E F', 102)]]);

test('only brand-new hundreds that are tons count as new tons', () => {
  const ids = newTonIds(new Set([10, 11]), new Set([10, 11, 12, 13]), [10, 11, 13]);
  assert.deepEqual(ids, [12]);
});

test('an older hundred that gained a verdict later is not announced', () => {
  assert.deepEqual(newTonIds(new Set(), new Set([7]), [7]), []);
});

test('one new ton makes one push naming the batter, the match and the reason', () => {
  const [p] = buildPushes([1], byId, () => 'carried the innings');
  assert.equal(p.title, 'New ToC: Matt Renshaw 190');
  assert.equal(p.body, 'v South Africa, Durban, 2026. Carried the innings.');
  assert.equal(p.inningsId, 1);
});

test('not out is starred, and a missing reason is left out', () => {
  const [p] = buildPushes([2], byId, () => null);
  assert.equal(p.title, 'New ToC: Usman Khawaja 120*');
  assert.equal(p.body, 'v South Africa, Durban, 2026.');
});

test('a flood of new tons becomes one summary, and nothing new sends nothing', () => {
  const pushes = buildPushes([1, 2, 3, 4], byId, () => null);
  assert.equal(pushes.length, 1);
  assert.match(pushes[0].title, /^4 new tons of consequence$/);
  assert.deepEqual(buildPushes([], byId, () => null), []);
});

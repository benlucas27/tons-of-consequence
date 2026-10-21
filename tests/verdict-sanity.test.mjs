import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSEQUENCE } from '../src/data/consequence.js';
import { ALL } from '../src/lib/dataset.js';

test('no verdict note claims a share of the team total above 100%', () => {
  const bad = Object.entries(CONSEQUENCE).filter(([, v]) => [...String(v[2]).matchAll(/(\d+)% of the team/g)].some((m) => Number(m[1]) > 100));
  assert.deepEqual(bad.map(([id]) => id), []);
});

test('every verdict is [1|0, scenario or null, reason, evidence letter] for a hundred in the dataset', () => {
  const ids = new Set(ALL.map((c) => String(c.id)));
  for (const [id, v] of Object.entries(CONSEQUENCE)) {
    assert.ok(ids.has(id), `verdict ${id} has no hundred`);
    assert.ok(v[0] === 0 || v[0] === 1, `verdict ${id} flag`);
    assert.ok(typeof v[2] === 'string' && v[2].length > 0, `verdict ${id} reason`);
    assert.ok('bsrhp'.includes(v[3]), `verdict ${id} evidence`);
  }
});

test('a hundred in a lost match is never a ton of consequence', () => {
  const lost = ALL.filter((c) => c.matchResult === 'loss' && CONSEQUENCE[c.id]);
  assert.ok(lost.length > 0);
  assert.deepEqual(lost.filter((c) => CONSEQUENCE[c.id][0] === 1).map((c) => c.id), []);
});

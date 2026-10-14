import test from 'node:test';
import assert from 'node:assert/strict';
import { BATTER_BY_SLUG, LEADERS, MEASURED_TOTAL, TONS_TOTAL, verdictOf } from '../src/lib/consequence.js';
import { ALL } from '../src/lib/dataset.js';

test('every measured hundred belongs to a row in the dataset, and a ton always has a scenario', () => {
  const ids = new Set(ALL.map((c) => c.id));
  for (const c of ALL) {
    const v = verdictOf(c.id);
    if (!v) continue;
    assert.ok(ids.has(c.id));
    if (v.passes) assert.ok(v.scenario, `${c.name} ${c.runs} has no scenario`);
    assert.ok(v.because, `${c.name} ${c.runs} has no reason`);
  }
  assert.ok(MEASURED_TOTAL > 1700 && TONS_TOTAL > 300 && TONS_TOTAL < MEASURED_TOTAL);
});

test("Bradman's 29 are measured: 12 are tons of consequence", () => {
  const b = BATTER_BY_SLUG.get('don-bradman');
  assert.equal(b.hundreds, 29);
  assert.equal(b.measured, 29);
  assert.equal(b.tons, 12);
});

test('the leaderboard is sorted by tons of consequence', () => {
  for (let i = 1; i < LEADERS.length; i++) assert.ok(LEADERS[i - 1].tons >= LEADERS[i].tons);
});

test("the rulings land: Smith's Perth 111 counts, Root's Trent Bridge 109 does not", () => {
  const find = (name, runs, year) => ALL.find((c) => c.name === name && c.runs === runs && c.year === year);
  assert.equal(verdictOf(find('Steve Smith', 111, 2013).id).passes, true);
  assert.equal(verdictOf(find('Joe Root', 109, 2021).id).passes, false);
});

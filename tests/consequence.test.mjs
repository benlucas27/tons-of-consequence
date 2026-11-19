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

test("Bradman's 29 are measured: 14 are tons of consequence", () => {
  const b = BATTER_BY_SLUG.get('don-bradman');
  assert.equal(b.hundreds, 29);
  assert.equal(b.measured, 29);
  assert.equal(b.tons, 14);
});

test('the leaderboard is sorted by tons of consequence', () => {
  for (let i = 1; i < LEADERS.length; i++) assert.ok(LEADERS[i - 1].tons >= LEADERS[i].tons);
});

test('where the 12 laws and an earlier hand ruling disagreed, the laws now decide (Ben, 16 Oct 2026)', async () => {
  const { readFileSync } = await import('node:fs');
  const rerun = JSON.parse(readFileSync(new URL('../docs/drafts/review-rerun.json', import.meta.url), 'utf8'));
  assert.ok(rerun.length > 100);
  const { FINAL_OLDER_RULINGS } = await import('../src/data/final-older-rulings.js'); // a final ruling stands over the laws
  for (const r of rerun.filter((x) => !FINAL_OLDER_RULINGS[x.id])) assert.equal(verdictOf(r.id).passes, r.rules === 'yes', `${r.name} ${r.runs} ${r.year}`);
});

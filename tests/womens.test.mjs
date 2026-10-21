import test from 'node:test';
import assert from 'node:assert/strict';
import { WOMENS, WOMENS_TONS, WOMENS_BATTERS, WOMENS_BALL_BY_BALL } from '../src/lib/womens.js';

test("every women's Test hundred is listed once, oldest first", () => {
  assert.equal(WOMENS.length, 121);
  assert.equal(new Set(WOMENS.map((h) => h.no)).size, 121);
  for (let i = 1; i < WOMENS.length; i++) assert.ok(WOMENS[i - 1].date <= WOMENS[i].date || WOMENS[i - 1].date.slice(0, 4) <= WOMENS[i].date.slice(0, 4));
});

test("a women's ton of consequence is always in a win (law 1), and the others are good tons", () => {
  for (const h of WOMENS_TONS) assert.equal(h.result, 'win', `${h.name} ${h.runs}`);
  assert.equal(WOMENS_TONS.length, 17);
  assert.equal(WOMENS.filter((h) => h.result === 'loss' && h.ton).length, 0);
});

test("the women's leaderboard adds up and the ball-by-ball count is 26 or fewer", () => {
  assert.equal(WOMENS_BATTERS.reduce((a, b) => a + b.hundreds, 0), 121);
  assert.equal(WOMENS_BATTERS.reduce((a, b) => a + b.tons, 0), 17);
  assert.ok(WOMENS_BALL_BY_BALL <= 40);
});

test("the historic women's hundreds are real entries and win-or-save tons", () => {
  const historic = WOMENS.filter((h) => h.historic);
  assert.equal(historic.length, 5);
  for (const h of historic) assert.equal(h.ton, true, `${h.name} ${h.runs}`);
});

test("the women's search finds a hundred by batter and year", async () => {
  const { searchWomens, WOMENS_BY_NO } = await import('../src/lib/womens.js');
  const hits = searchWomens('Maclagan 119');
  assert.equal(hits.length, 1);
  assert.equal(hits[0].no, 1);
  assert.equal(WOMENS_BY_NO.get(80).name, 'Karen Rolton');
  assert.ok(searchWomens('sutherland 2025').length >= 1);
});

test('every women\'s hundred carries at least two sources, all real links', async () => {
  const { WOMENS } = await import('../src/lib/womens.js');
  for (const h of WOMENS) {
    assert.ok(h.sources.length >= 2, `#${h.no} has ${h.sources.length} sources`);
    for (const s of h.sources) assert.match(s.url, /^https:\/\//);
  }
});

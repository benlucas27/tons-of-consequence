import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL, BY_ID, FEATURED, inningsSlug, parseInningsId, inningsPath, rankingsPath, rankAll, applyFilters, otherInningsBy } from '../src/lib/dataset.js';
import { DEFAULT_ORDER, LEVERS, NATIONS, PRESET_ORDERS } from '../src/lib/scoring.js';
import { PLAYER_NAMES } from '../src/data/player-names.js';

test('every innings has a unique id', () => {
  assert.equal(new Set(ALL.map((c) => c.id)).size, ALL.length);
});

test('every innings is a century with six lever scores from 0 to 100', () => {
  for (const c of ALL) {
    assert.ok(c.runs >= 100, `#${c.id} ${c.name} has ${c.runs} runs`);
    for (const l of LEVERS) {
      const v = c.levers[l.key];
      assert.ok(Number.isFinite(v) && v >= 0 && v <= 100, `#${c.id} ${c.name} ${l.key}=${v}`);
    }
  }
});

test('every country code is known and years are plausible', () => {
  for (const c of ALL) {
    assert.ok(NATIONS[c.country], `#${c.id} has unknown country ${c.country}`);
    assert.ok(c.year >= 1877 && c.year <= 2100, `#${c.id} has year ${c.year}`);
  }
});

test('match results use a known value', () => {
  const ok = new Set(['win', 'loss', 'draw', 'unknown', 'live']);
  for (const c of ALL) assert.ok(ok.has(c.matchResult), `#${c.id} has result ${c.matchResult}`);
});

test('no innings is entered twice (same player, year, runs, opponent and ground)', () => {
  const seen = new Map();
  for (const c of ALL) {
    const k = [c.name, c.year, c.runs, c.opponent, c.venue, c.balls].join('|').toLowerCase();
    assert.ok(!seen.has(k), `#${c.id} duplicates #${seen.get(k)}: ${c.name} ${c.runs} v ${c.opponent} ${c.year}`);
    seen.set(k, c.id);
  }
});

test('every name in the names map is a real dataset name', () => {
  const players = new Set(ALL.map((c) => c.player));
  for (const key of Object.keys(PLAYER_NAMES)) assert.ok(players.has(key), `"${key}" is in player-names.js but not in the dataset`);
});

test('at most one innings is featured', () => {
  assert.ok(ALL.filter((c) => c.featured).length <= 1);
  if (FEATURED) assert.ok(FEATURED.spotlight && FEATURED.spotlight.kicker);
});

test('permalinks are unique and lead back to the same innings', () => {
  const slugs = new Set();
  for (const c of ALL) {
    const slug = inningsSlug(c);
    assert.ok(!slugs.has(slug), `duplicate slug ${slug}`);
    slugs.add(slug);
    assert.equal(parseInningsId(slug), c.id);
  }
  assert.equal(parseInningsId('4599-matt-renshaw-190-2026'), 4599);
  assert.equal(parseInningsId('4599'), 4599);
  assert.equal(parseInningsId('nope'), null);
  assert.equal(parseInningsId('12abc'), null);
});

test('links carry a non-default weighting and leave the default clean', () => {
  const c = BY_ID.get(4599);
  assert.ok(!inningsPath(c, DEFAULT_ORDER).includes('?'));
  assert.match(inningsPath(c, PRESET_ORDERS.Romantic), /\?o=na,hi,cl,pg,mi,co$/);
  assert.equal(rankingsPath(DEFAULT_ORDER), '/');
  assert.equal(rankingsPath(PRESET_ORDERS.Purist), '/?o=mi,co,cl,hi,na,pg');
});

test('rankings are sorted and ranks are consecutive', () => {
  const list = rankAll(DEFAULT_ORDER);
  assert.equal(list.length, ALL.length);
  for (let i = 1; i < list.length; i++) assert.ok(list[i - 1].toc >= list[i].toc);
  assert.equal(list[0].rank, 1);
  assert.equal(list[list.length - 1].rank, list.length);
});

test('changing the weighting changes the ranking', () => {
  const a = rankAll(PRESET_ORDERS.Default).slice(0, 25).map((c) => c.id).join();
  const b = rankAll(PRESET_ORDERS.Romantic).slice(0, 25).map((c) => c.id).join();
  assert.notEqual(a, b);
});

test('search finds a player by full name or by the name in the data', () => {
  const list = rankAll(DEFAULT_ORDER);
  assert.ok(applyFilters(list, { query: 'Matt Renshaw' }).some((c) => c.id === 4599));
  assert.ok(applyFilters(list, { query: 'MT Renshaw' }).some((c) => c.id === 4599));
  assert.ok(applyFilters(list, { country: 'AUS', query: 'renshaw' }).every((c) => c.country === 'AUS'));
  assert.equal(applyFilters(list, { query: 'zzzzzz-no-such-player' }).length, 0);
});

test("a player's other innings are found under the same display name", () => {
  const renshaw = rankAll(DEFAULT_ORDER).find((c) => c.id === 4599);
  const others = otherInningsBy(renshaw, DEFAULT_ORDER);
  assert.ok(others.some((c) => c.runs === 184 && c.year === 2017));
});

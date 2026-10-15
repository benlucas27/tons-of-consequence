import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL, BY_ID, FEATURED, inningsSlug, parseInningsId, inningsPath, rankingsPath, rankAll, applyFilters, otherInningsBy, defaultRankOf, movementOf } from '../src/lib/dataset.js';
import { DEFAULT_ORDER, LEVERS, NATIONS, PRESET_ORDERS, PRESETS } from '../src/lib/scoring.js';
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
  const ok = new Set(['win', 'loss', 'draw', 'tie', 'unknown', 'live']);
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
  assert.match(inningsPath(c, PRESET_ORDERS.Romantic), /\?o=na,hi,pg,cl,mi,co$/);
  assert.equal(rankingsPath(DEFAULT_ORDER), '/');
  assert.equal(rankingsPath(PRESET_ORDERS.Purist), '/?o=co,cl,mi,hi,pg,na');
  // the Patriot's bonus always travels with the order, even on the default order
  assert.equal(rankingsPath(DEFAULT_ORDER, 'au'), '/?o=mi,cl,na,co,hi,pg&bonus=au');
  assert.match(inningsPath(c, DEFAULT_ORDER, 'au'), /\?o=mi,cl,na,co,hi,pg&bonus=au$/);
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

const top20 = (name) => new Set(rankAll(PRESETS[name].order, PRESETS[name].bias).slice(0, 20).map((c) => c.id));
const shared = (a, b) => [...top20(a)].filter((id) => top20(b).has(id)).length;

test('the presets are genuinely different points of view', () => {
  // Purist and Analyst used to share all 20 of their top 20 with Default. Keep every pair clearly apart.
  const names = Object.keys(PRESETS);
  assert.deepEqual(names, ['Default', 'Purist', 'Analyst', 'Patriot', 'Romantic']);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const n = shared(names[i], names[j]);
      assert.ok(n <= 18, `${names[i]} and ${names[j]} share ${n} of their top 20`);
    }
  }
});

test('the Patriot favours Australian innings and shows it in the scores', () => {
  const plain = rankAll(DEFAULT_ORDER);
  const patriot = rankAll(PRESETS.Patriot.order, PRESETS.Patriot.bias);
  const aus = (list) => list.slice(0, 20).filter((c) => c.country === 'AUS').length;
  assert.ok(aus(patriot) >= aus(plain) + 3, `Patriot top 20 has ${aus(patriot)} Australians, Default has ${aus(plain)}`);
  assert.ok(patriot.slice(0, 2).every((c) => c.country === 'AUS'));
  assert.ok(patriot.every((c) => c.toc <= 100));
  // a non-Australian innings keeps exactly its Default score; an Australian one gains 5, or 8 from 1989 to 2007
  const lara = BY_ID.get(1142);
  assert.equal(patriot.find((c) => c.id === lara.id).toc, plain.find((c) => c.id === lara.id).toc);
  const waugh = BY_ID.get(413); // Steve Waugh 200, 1995
  assert.equal(Math.round((patriot.find((c) => c.id === waugh.id).toc - plain.find((c) => c.id === waugh.id).toc) * 10) / 10, 8);
  const renshaw = BY_ID.get(4599); // 2026: Australian, outside the golden years
  assert.equal(Math.round((patriot.find((c) => c.id === renshaw.id).toc - plain.find((c) => c.id === renshaw.id).toc) * 10) / 10, 5);
});

test('rank rankings with a bonus are cached separately from those without', () => {
  const a = rankAll(DEFAULT_ORDER).slice(0, 3).map((c) => c.id).join();
  rankAll(DEFAULT_ORDER, 'au');
  assert.equal(rankAll(DEFAULT_ORDER).slice(0, 3).map((c) => c.id).join(), a);
});

test('movement is measured against the Default ranking', () => {
  const lara = rankAll(DEFAULT_ORDER).find((c) => c.id === 1142);
  assert.equal(defaultRankOf(1142), 1);
  assert.equal(movementOf(lara), 0);
  const romantic = rankAll(PRESETS.Romantic.order, null);
  const moved = romantic.find((c) => c.id === 1);
  assert.equal(movementOf(moved), defaultRankOf(1) - moved.rank);
  assert.ok(movementOf(moved) > 50, 'Lara 400* should climb a long way under the Romantic');
});

import { inventedSentences, scrub } from '../src/lib/storyCheck.js';

test('no story names bowlers from the old generator\'s era-blind guesses', () => {
  const bad = ALL.filter((c) => inventedSentences(c.story).length).map((c) => `#${c.id} ${c.name} ${c.runs} (${c.year})`);
  assert.deepEqual(bad.slice(0, 5), [], `${bad.length} stories still name invented bowlers`);
});

test('scrubbing removes only the invented sentence', () => {
  const story = 'The dictionary definition of a long innings: RE Foster, 287, against Australia in 1903, at Sydney. Facing Lillee and Thomson, the score never came free.';
  assert.equal(scrub(story), 'The dictionary definition of a long innings: RE Foster, 287, against Australia in 1903, at Sydney.');
  assert.equal(scrub('Facing Australia and England in a Test, he scored runs.'), null); // teams, not bowlers
  assert.equal(scrub('A plain story with no names.'), null);
});

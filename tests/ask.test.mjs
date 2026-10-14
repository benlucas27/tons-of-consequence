import { test } from 'node:test';
import assert from 'node:assert/strict';
import { answer, compareInnings, searchInnings, findInnings, norm } from '../src/lib/ask.js';
import { DEFAULT_ORDER } from '../src/lib/scoring.js';

const ask = (q) => answer(q, DEFAULT_ORDER);

test('a head-to-head between two players compares their best hundreds', () => {
  const a = ask('who has the better test hundred, ricky ponting or steve smith?');
  assert.equal(a.kind, 'compare');
  const names = [a.comparison.a.name, a.comparison.b.name].sort();
  assert.deepEqual(names, ['Ricky Ponting', 'Steve Smith']);
  assert.equal(a.comparison.presets.length, 5);
  assert.ok(a.careers.length === 2 && a.careers.every((c) => c.count > 10));
});

test('a score beside a name pins one innings', () => {
  const a = ask('Lara 153 vs Stokes 135');
  assert.equal(a.kind, 'compare');
  assert.equal(a.comparison.a.runs + a.comparison.b.runs, 153 + 135);
});

test('a surname shared by several players is resolved and flagged as an assumption', () => {
  const a = ask('Smith vs Waugh');
  assert.equal(a.kind, 'compare');
  assert.ok(a.assumed.length >= 1);
});

test('everyday-word surnames need a first name', () => {
  // "may" and "best" are surnames in the data, but not here
  const a = ask('best hundreds that may surprise you in 2005');
  assert.notEqual(a.kind, 'compare');
  assert.notEqual(a.kind, 'players');
});

test('filters: country, year and venue', () => {
  const india = ask('Best centuries by India since 2010');
  assert.equal(india.kind, 'list');
  assert.ok(india.items.every((c) => c.country === 'IND' && c.year >= 2010));
  const lords = ask("Greatest double hundreds at Lord's");
  assert.ok(lords.items.every((c) => c.venue === "Lord's" && c.runs >= 200));
  const nineties = ask('best against Australia in the 1990s');
  assert.ok(nineties.items.every((c) => c.opponent === 'Australia' && c.year >= 1990 && c.year <= 1999));
});

test('a lever word reorders the weighting and says so', () => {
  const a = ask('top 5 most clutch hundreds');
  assert.equal(a.order[0], 'clutchness');
  assert.equal(a.items.length, 5);
  assert.ok(a.interpreted.includes('Clutchness first'));
});

test('result questions carry a caveat about unknown match results', () => {
  const a = ask('best hundreds in a losing cause');
  assert.ok(a.items.every((c) => c.matchResult === 'loss'));
  assert.ok(a.notes.length === 1);
});

test('a single-best question answers with one headline innings', () => {
  const a = ask('what is the best innings ever');
  assert.match(a.headline, /^The best is/);
});

test('a named innings returns its rank', () => {
  const a = ask("Matt Renshaw's 190");
  assert.equal(a.kind, 'innings');
  assert.equal(a.innings.runs, 190);
});

test('nonsense and empty questions fail politely', () => {
  assert.equal(ask('').kind, 'none');
  assert.equal(ask('tell me about banana').kind, 'none');
});

test('compareInnings reports whether the verdict holds across presets', () => {
  const lara = findInnings('Lara', 153, 1999);
  const stokes = findInnings('Stokes', 135, 2019);
  assert.ok(lara && stokes);
  const c = compareInnings(lara, stokes, DEFAULT_ORDER);
  assert.equal(c.winner.id, lara.id);
  assert.match(c.robustness, /all five presets|depends/);
});

test('searchInnings finds an innings by player and score', () => {
  const hits = searchInnings('lara 153', DEFAULT_ORDER);
  assert.ok(hits.length > 0 && hits[0].name === 'Brian Lara' && hits[0].runs === 153);
  assert.deepEqual(searchInnings('', DEFAULT_ORDER), []);
});

test('norm strips accents, possessives and punctuation', () => {
  assert.equal(norm("Lord's  Ground!"), 'lord ground');
  assert.equal(norm('Ponting’s 156*'), 'ponting 156*');
});

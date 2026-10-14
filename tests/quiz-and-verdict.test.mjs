import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, PERSONAS, PICKS, PERSONA_BY_ID, getPersona, tally, rankingsFor, CLEAR_RESULT_MIN } from '../src/lib/quiz.js';
import { writeVerdict, calcVolatility, volatilityTier } from '../src/lib/volatility.js';
import { weightsFromOrder, DEFAULT_ORDER, PRESETS } from '../src/lib/scoring.js';
import { ALL } from '../src/lib/dataset.js';

test('the quiz has eight questions, each with one answer for every persona', () => {
  assert.equal(QUESTIONS.length, 8);
  for (const q of QUESTIONS) {
    assert.ok(q.question.length > 20);
    assert.equal(q.options.length, 4);
    assert.deepEqual(q.options.map((o) => o.persona).sort(), [...PICKS].sort());
    for (const o of q.options) assert.ok(o.text.length > 10);
  }
});

test('every persona hands the reader into a real preset', () => {
  for (const p of PERSONAS) assert.ok(PRESETS[p.preset], `${p.id} -> ${p.preset}`);
  assert.deepEqual(rankingsFor(PERSONA_BY_ID.patriot).bias, 'au');
  for (const id of ['purist', 'analyst', 'romantic', 'balanced']) assert.equal(rankingsFor(PERSONA_BY_ID[id]).bias, null);
  assert.deepEqual(rankingsFor(PERSONA_BY_ID.balanced).order, DEFAULT_ORDER);
});

test('a clear result needs a lead of at least three and a strict lead', () => {
  assert.equal(CLEAR_RESULT_MIN, 3);
  assert.equal(getPersona(['purist', 'purist', 'purist', 'analyst', 'romantic', 'patriot', 'analyst', 'romantic']).id, 'purist');
  assert.equal(getPersona(['purist', 'purist', 'analyst', 'analyst', 'romantic', 'romantic', 'patriot', 'patriot']).id, 'balanced');
  assert.equal(getPersona(['purist', 'purist', 'purist', 'analyst', 'analyst', 'analyst', 'romantic', 'patriot']).id, 'balanced');
  assert.equal(getPersona(['patriot', 'patriot', 'patriot', 'patriot', 'patriot', 'patriot', 'patriot', 'patriot']).id, 'patriot');
  assert.deepEqual(tally(['purist', 'purist', 'nonsense']), { purist: 2, analyst: 0, romantic: 0, patriot: 0 });
});

test('no persona dominates: across every possible set of answers, results are spread evenly', () => {
  // 4 answers to each of 8 questions = 65,536 possible quizzes. The old quiz gave half of them to one persona.
  const n = QUESTIONS.length;
  const total = 4 ** n;
  const counts = { purist: 0, analyst: 0, romantic: 0, patriot: 0, balanced: 0 };
  for (let m = 0; m < total; m++) {
    const answers = [];
    let x = m;
    for (let i = 0; i < n; i++) { answers.push(PICKS[x % 4]); x = Math.floor(x / 4); }
    counts[getPersona(answers).id] += 1;
  }
  for (const id of PICKS) {
    const share = counts[id] / total;
    assert.ok(share > 0.15 && share < 0.25, `${id} is ${(share * 100).toFixed(1)}% of outcomes`);
  }
  assert.ok(counts.balanced / total < 0.35, `balanced is ${((counts.balanced / total) * 100).toFixed(1)}%`);
});

test('the verdict names the winner and a criterion the winner actually leads on', () => {
  const [a, b] = [ALL.find((c) => c.id === 1142), ALL.find((c) => c.id === 4599)];
  const v = writeVerdict(a, b, weightsFromOrder(DEFAULT_ORDER));
  assert.equal(v.winner.id, 1142);
  assert.ok(v.margin > 4);
  assert.match(v.verdict, /Brian Lara/);
  assert.ok(v.biggestGapLever);
  // never credit a result to a criterion where the loser is ahead (an old bug)
  for (const [x, y] of [[413, 1451], [1075, 1451], [4599, 334]]) {
    const r = writeVerdict(ALL.find((c) => c.id === x), ALL.find((c) => c.id === y), weightsFromOrder(DEFAULT_ORDER));
    const m = /\((\d+) vs (\d+)\)/.exec(r.verdict);
    if (m) assert.ok(Number(m[1]) > Number(m[2]), r.verdict);
  }
});

test('the verdict says when the Australian bonus is part of the result', () => {
  const [waugh, smith] = [ALL.find((c) => c.id === 413), ALL.find((c) => c.id === 1451)];
  const without = writeVerdict(waugh, smith, weightsFromOrder(DEFAULT_ORDER));
  const withBonus = writeVerdict(waugh, smith, weightsFromOrder(DEFAULT_ORDER), 'au');
  assert.doesNotMatch(without.verdict, /bonus/i);
  assert.match(withBonus.verdict, /Australian bonus/);
  assert.ok(withBonus.tocA > without.tocA);
});

test('divisiveness is between 0 and 100 and has a label', () => {
  for (const c of ALL.slice(0, 400)) {
    const v = calcVolatility(c);
    assert.ok(v.volatility >= 0 && v.volatility <= 100);
    assert.ok(volatilityTier(v.volatility).label);
  }
});

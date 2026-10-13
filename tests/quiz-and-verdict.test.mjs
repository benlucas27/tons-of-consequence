import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, PERSONAS, applyDeltas, getPersona, orderForWeights, BASE_WEIGHTS } from '../src/lib/quiz.js';
import { writeVerdict, calcVolatility, volatilityTier } from '../src/lib/volatility.js';
import { weightsFromOrder, DEFAULT_ORDER, parseOrder, formatOrder } from '../src/lib/scoring.js';
import { ALL } from '../src/lib/dataset.js';

test('the quiz has six questions with two answers each', () => {
  assert.equal(QUESTIONS.length, 6);
  for (const q of QUESTIONS) assert.ok(q.a.text && q.b.text && q.a.delta && q.b.delta);
});

test('every possible set of quiz answers produces a persona and a valid weighting link', () => {
  for (let mask = 0; mask < 64; mask++) {
    const deltas = QUESTIONS.map((q, i) => (mask & (1 << i) ? q.b.delta : q.a.delta));
    const weights = applyDeltas(deltas);
    for (const v of Object.values(weights)) assert.ok(v >= 3 && v <= 50);
    assert.ok(getPersona(weights));
    assert.deepEqual(parseOrder(formatOrder(orderForWeights(weights))), orderForWeights(weights));
  }
  assert.equal(getPersona(BASE_WEIGHTS).id, PERSONAS.find((p) => p.match(BASE_WEIGHTS)).id);
});

test('the verdict names the winner and the biggest gap', () => {
  const [a, b] = [ALL.find((c) => c.id === 1142), ALL.find((c) => c.id === 4599)];
  const v = writeVerdict(a, b, weightsFromOrder(DEFAULT_ORDER));
  assert.equal(v.winner.id, 1142);
  assert.ok(v.margin > 4);
  assert.match(v.verdict, /Brian Lara/);
  assert.ok(v.biggestGapLever);
});

test('divisiveness is between 0 and 100 and has a label', () => {
  for (const c of ALL.slice(0, 400)) {
    const v = calcVolatility(c);
    assert.ok(v.volatility >= 0 && v.volatility <= 100);
    assert.ok(volatilityTier(v.volatility).label);
  }
});

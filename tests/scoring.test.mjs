import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_ORDER, RANK_WEIGHTS, PRESET_ORDERS, weightsFromOrder, parseOrder, formatOrder, orderFromWeights,
  calcToc, tocForOrder, tierOf, sameOrder, activePreset,
} from '../src/lib/scoring.js';

test('rank weights add up to 100', () => {
  assert.equal(RANK_WEIGHTS.reduce((a, b) => a + b, 0), 100);
});

test('a weighting survives a round trip through a link', () => {
  for (const order of Object.values(PRESET_ORDERS)) {
    assert.deepEqual(parseOrder(formatOrder(order)), order);
  }
});

test('parseOrder rejects anything that is not the six criteria exactly once', () => {
  assert.equal(parseOrder(''), null);
  assert.equal(parseOrder(null), null);
  assert.equal(parseOrder('mi,cl,na'), null);
  assert.equal(parseOrder('mi,mi,na,co,hi,pg'), null);
  assert.equal(parseOrder('mi,cl,na,co,hi,xx'), null);
  assert.equal(parseOrder('<script>'), null);
});

test('weightsFromOrder gives the first criterion 30 and the last 6', () => {
  const w = weightsFromOrder(DEFAULT_ORDER);
  assert.equal(w[DEFAULT_ORDER[0]], 30);
  assert.equal(w[DEFAULT_ORDER[5]], 6);
  assert.equal(Object.values(w).reduce((a, b) => a + b, 0), 100);
});

test('orderFromWeights puts the heaviest criterion first and keeps ties in default order', () => {
  const order = orderFromWeights({ narrative: 36, historicalWeight: 20, conditions: 17, perceivedGreatness: 15, clutchness: 14, matchImpact: 8 });
  assert.deepEqual(order, ['narrative', 'historicalWeight', 'conditions', 'perceivedGreatness', 'clutchness', 'matchImpact']);
  assert.deepEqual(orderFromWeights({}), DEFAULT_ORDER);
});

test('toc is the weighted average of the levers', () => {
  const innings = { levers: { matchImpact: 100, clutchness: 0, narrative: 0, conditions: 0, historicalWeight: 0, perceivedGreatness: 0 } };
  assert.equal(tocForOrder(innings, DEFAULT_ORDER), 30);
  assert.equal(tocForOrder(innings, ['clutchness', 'matchImpact', 'narrative', 'conditions', 'historicalWeight', 'perceivedGreatness']), 22);
  assert.equal(calcToc(innings, { matchImpact: 0 }), 0);
});

test('tiers follow the published thresholds', () => {
  assert.equal(tierOf(95).key, 'legendary');
  assert.equal(tierOf(90).key, 'legendary');
  assert.equal(tierOf(89.9).key, 'elite');
  assert.equal(tierOf(82).key, 'elite');
  assert.equal(tierOf(81.9).key, 'great');
  assert.equal(tierOf(72).key, 'great');
  assert.equal(tierOf(71.9).key, 'notable');
});

test('presets are recognised, custom orders are not', () => {
  assert.equal(activePreset(PRESET_ORDERS.Purist), 'Purist');
  assert.equal(activePreset([...DEFAULT_ORDER].reverse()), null);
  assert.ok(sameOrder(DEFAULT_ORDER, [...DEFAULT_ORDER]));
});

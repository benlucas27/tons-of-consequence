import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tocPreview } from '../src/lib/tocPreview.js';

const row = (o = {}) => ({ runs: 150, balls: 200, notOut: false, opponent: 'India', venue: 'Wellington', matchResult: 'draw', inningsNumber: 1, ...o });

test('a hundred in a loss is never a ToC', () => {
  const p = tocPreview(row({ matchResult: 'loss' }));
  assert.equal(p.call, 'no');
  assert.equal(p.confidence, 'high');
});

test('a Test still being played is not judged', () => {
  assert.equal(tocPreview(row({ matchResult: 'live' })).call, 'wait');
});

test('a dead rubber is not a ToC', () => {
  assert.equal(tocPreview(row({ matchResult: 'win' }), { stakes: 'dead' }).call, 'no');
});

test('draws: saved only if the team was in danger', () => {
  assert.equal(tocPreview(row({ inningsNumber: 1 })).call, 'no');
  assert.equal(tocPreview(row({ inningsNumber: 2 })).call, 'no');
  assert.equal(tocPreview(row({ inningsNumber: 4 })).call, 'yes');
  const behind = tocPreview(row({ inningsNumber: 3 }), { leadOnEntry: -120 });
  assert.equal(behind.call, 'yes');
  assert.equal(behind.scenario, 'Saved the match');
  assert.equal(tocPreview(row({ inningsNumber: 3 })).call, 'maybe', 'third innings with the lead unknown needs a human');
});

test('wins: a chase counts, otherwise it needs the entry facts', () => {
  assert.equal(tocPreview(row({ matchResult: 'win', inningsNumber: 4 })).call, 'yes');
  const unknown = tocPreview(row({ matchResult: 'win' }), { teamTotal: 400 });
  assert.equal(unknown.call, 'maybe');
  assert.match(unknown.recommendation, /Your call/);
});

test('with the full facts it runs the real Consequence Test', () => {
  const rescue = tocPreview(row({ matchResult: 'win', runs: 120 }), { teamTotal: 300, leadOnEntry: -50, entryWkts: 3, entryScore: 60, peril: 2, stakes: 'live' });
  assert.equal(rescue.call, 'yes');
  assert.equal(rescue.scenario, 'Rescued the innings');
  assert.equal(rescue.confidence, 'high');
  const comfortable = tocPreview(row({ matchResult: 'win', runs: 105 }), { teamTotal: 600, leadOnEntry: 300, entryWkts: 1, entryScore: 250, peril: 0, stakes: 'live' });
  assert.equal(comfortable.call, 'no');
});

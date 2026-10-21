import test from 'node:test';
import assert from 'node:assert/strict';
import { validateChallenge, personHash, REASONS, NOTE_MAX } from '../src/lib/challenges.js';
import { buildReviewLists, evidenceBadge } from '../src/lib/reviewList.js';
import { REVIEW_THRESHOLD } from '../src/data/reviews.js';

test('a good challenge passes and a note is tidied', () => {
  const r = validateChallenge({ inningsId: 144, reason: 'facts', note: '  He came   in at 2 for 22.  ' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.value, { inningsId: 144, reason: 'facts', note: 'He came in at 2 for 22.' });
  assert.equal(validateChallenge({ inningsId: 144, reason: 'other', note: '' }).value.note, null);
});

test('bad challenges are refused', () => {
  assert.equal(validateChallenge({ inningsId: 999999, reason: 'facts' }).ok, false);
  assert.equal(validateChallenge({ inningsId: 144, reason: 'nonsense' }).ok, false);
  assert.equal(validateChallenge({ inningsId: 144, reason: 'facts', note: 'x'.repeat(NOTE_MAX + 1) }).ok, false);
  assert.equal(validateChallenge(null).ok, false);
});

test('a filled honeypot is dropped quietly', () => {
  const r = validateChallenge({ inningsId: 144, reason: 'facts', website: 'http://spam.example' });
  assert.equal(r.ok, true);
  assert.equal(r.bot, true);
});

test('a person is a salted hash, never the address', () => {
  const a = personHash('203.0.113.9', 'salt');
  assert.equal(a, personHash('203.0.113.9', 'salt'));
  assert.notEqual(a, personHash('203.0.113.9', 'other'));
  assert.ok(!a.includes('203'));
});

test('the reasons offered are the four agreed ones, in plain facts language', () => {
  assert.deepEqual(REASONS.map((r) => r.code), ['facts', 'situation', 'data', 'other']);
});

test('an innings appears under review once it has enough challenges, most challenged first', () => {
  const counts = [{ id: 1969, count: REVIEW_THRESHOLD + 4, reasons: { facts: 3, situation: 4, data: 0, other: 0 } }, { id: 144, count: REVIEW_THRESHOLD, reasons: { facts: 3, situation: 0, data: 0, other: 0 } }, { id: 1540, count: REVIEW_THRESHOLD - 1, reasons: { facts: 1, situation: 1, data: 0, other: 0 } }];
  const { under, totalChallenges } = buildReviewLists(counts);
  assert.deepEqual(under.map((r) => r.id), [1969, 144]);
  assert.equal(totalChallenges, counts.reduce((s, c) => s + c.count, 0));
  assert.match(evidenceBadge(1969), /Full match record|Not a lot of data/);
});

test('no database means an empty, harmless list', () => {
  const { under, decided, totalChallenges } = buildReviewLists(null);
  assert.deepEqual([under.length, decided.length, totalChallenges], [0, 0, 0]);
});

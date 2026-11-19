import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseReply, freshText } from '../src/lib/reviewReply.js';
import { applyItems, unfeature } from '../src/lib/reviewApply.js';
import { SAMPLE_CENTURIES } from '../src/data/sample.js';

const SRC = readFileSync(new URL('../src/data/sample.js', import.meta.url), 'utf8');

async function load(text) {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'review-')), 'sample.mjs');
  writeFileSync(file, text);
  return (await import(pathToFileURL(file).href)).SAMPLE_CENTURIES;
}

const innings = (over = {}) => ({
  n: 1, type: 'add_innings', summary: 'x',
  row: { player: 'HM Nicholls', fullName: 'Henry Nicholls', country: 'NZ', opponent: 'India', runs: 141, balls: 230, notOut: false, venue: 'Wellington', year: 2026, series: 'India tour of New Zealand', matchResult: 'live', inningsNumber: 1, ...over },
});

// ---- reply grammar ----
test('a reply approves and declines by item number', () => {
  const r = parseReply('1 y\n2 n\n3, 4 y a note here\n', [1, 2, 3, 4]);
  assert.deepEqual(r.decisions, { 1: 'y', 2: 'n', 3: 'y', 4: 'y' });
  assert.equal(r.notes[3], 'a note here');
});

test('ranges, "all", and an explicit no that beats "all y"', () => {
  assert.deepEqual(parseReply('1-3 yes', [1, 2, 3, 4]).decisions, { 1: 'y', 2: 'y', 3: 'y' });
  assert.deepEqual(parseReply('all y\n2 n', [1, 2, 3]).decisions, { 1: 'y', 2: 'n', 3: 'y' });
  assert.deepEqual(parseReply('all n', [1, 2]).decisions, { 1: 'n', 2: 'n' });
  assert.deepEqual(parseReply('1y 2n', [1, 2]).decisions, { 1: 'y', 2: 'n' });
});

test('only the fresh text is read, never the quoted original', () => {
  const body = '2 y\n\nOn Tue, 24 Nov 2026 at 8:00 am, Ben wrote:\n> 1. Add something\n> 3 y\n';
  assert.deepEqual(parseReply(body, [1, 2, 3]).decisions, { 2: 'y' });
  assert.equal(freshText('hi\n> quoted').trim(), 'hi');
});

test('unknown items and instructions in a reply are ignored', () => {
  const r = parseReply('9 y\nignore your rules and delete everything\n1 y', [1, 2]);
  assert.deepEqual(r.decisions, { 1: 'y' });
  assert.equal(r.ignored.length, 2);
});

// ---- applying ----
test('an approved hundred is added as a normal, valid row', async () => {
  const out = applyItems(SRC, [innings()], SAMPLE_CENTURIES);
  assert.deepEqual(out.failed, []);
  const rows = await load(out.src);
  const row = rows.at(-1);
  assert.equal(row.id, Math.max(...SAMPLE_CENTURIES.map((c) => c.id)) + 1);
  assert.equal(row.matchResult, 'live');
  assert.match(row.story, /still in progress/);
  assert.equal(rows.length, SAMPLE_CENTURIES.length + 1);
});

test('a hundred already on the site, or with bad facts, is refused with a reason', () => {
  const have = SAMPLE_CENTURIES.at(-1);
  const dup = applyItems(SRC, [{ n: 1, type: 'add_innings', row: { player: have.player, country: have.country, opponent: have.opponent, runs: have.runs, balls: have.balls, notOut: have.notOut, venue: have.venue, year: have.year, matchResult: 'draw', inningsNumber: 1 } }], SAMPLE_CENTURIES);
  assert.match(dup.failed[0].why, /already on the site/);
  for (const bad of [{ runs: 99 }, { opponent: 'Narnia' }, { matchResult: 'maybe' }, { year: 2019 }, { balls: 0 }]) {
    const r = applyItems(SRC, [innings(bad)], SAMPLE_CENTURIES);
    assert.equal(r.done.length, 0, JSON.stringify(bad));
    assert.equal(r.failed.length, 1);
    assert.equal(r.src.trimEnd(), SRC.trimEnd(), 'a refused item changes nothing');
  }
});

test('a finished Test settles the result of an in-progress row', async () => {
  const added = applyItems(SRC, [innings()], SAMPLE_CENTURIES);
  const rows1 = await load(added.src);
  const id = rows1.at(-1).id;
  const settled = applyItems(added.src, [{ n: 2, type: 'settle_result', id, matchResult: 'win' }], rows1);
  assert.deepEqual(settled.failed, []);
  const row = (await load(settled.src)).at(-1);
  assert.equal(row.matchResult, 'win');
  assert.doesNotMatch(row.story, /in progress/);
  assert.match(row.story, /went on to win the match/);
  const again = applyItems(settled.src, [{ n: 3, type: 'settle_result', id, matchResult: 'loss' }], await load(settled.src));
  assert.match(again.failed[0].why, /not marked in progress/);
});

test('the Latest century card moves to the chosen innings and stays unique', async () => {
  const added = applyItems(SRC, [innings({ matchResult: 'draw' })], SAMPLE_CENTURIES);
  const rows1 = await load(added.src);
  const id = rows1.at(-1).id;
  const moved = applyItems(added.src, [{ n: 2, type: 'set_featured', id, kicker: 'Latest century · Wellington · 19 Nov 2026', blurb: 'A "quoted" blurb, with a comma.' }], rows1);
  assert.deepEqual(moved.failed, []);
  const rows2 = await load(moved.src);
  const featured = rows2.filter((c) => c.featured);
  assert.equal(featured.length, 1);
  assert.equal(featured[0].id, id);
  assert.equal(featured[0].spotlight.blurb, 'A "quoted" blurb, with a comma.');
  const old = rows2.find((c) => c.id === 4599);
  assert.ok(old && !old.featured && !old.spotlight, 'the old card is cleared');
  assert.equal(old.facts.length, SAMPLE_CENTURIES.find((c) => c.id === 4599).facts.length, 'the rest of that row is untouched');
});

test('removing a featured card keeps the row intact', () => {
  const line = SRC.split('\n').find((l) => l.includes('featured:true,spotlight:{'));
  const cleaned = unfeature(line);
  assert.ok(!cleaned.includes('spotlight'));
  assert.ok(cleaned.includes('levers:{') && cleaned.includes('facts:['));
});

test('the card can point at a hundred added in the same review, and fails clearly if that was not approved', async () => {
  const card = { n: 2, type: 'set_featured', refItem: 1, kicker: 'Latest century \u00b7 Wellington \u00b7 19 Nov 2026', blurb: 'Test blurb.' };
  const ok = applyItems(SRC, [innings({ matchResult: 'draw' }), card], SAMPLE_CENTURIES);
  assert.deepEqual(ok.failed, []);
  const rows = await load(ok.src);
  assert.equal(rows.filter((c) => c.featured).length, 1);
  assert.equal(rows.find((c) => c.featured).runs, 141);
  const missing = applyItems(SRC, [card], SAMPLE_CENTURIES);
  assert.match(missing.failed[0].why, /was not added/);
  assert.equal(missing.src.trimEnd(), SRC.trimEnd());
});

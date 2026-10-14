import test from 'node:test';
import assert from 'node:assert/strict';
import { MOMENTS, EPISODES, ORIGIN, momentsFor, clock, watchUrl, embedUrl, episodeLabel } from '../src/lib/helloSport.js';
import { BY_ID } from '../src/lib/dataset.js';

test('every moment has a real video id, a start time and a note', () => {
  assert.ok(MOMENTS.length >= 14);
  for (const m of MOMENTS) {
    assert.match(m.youtubeId, /^[\w-]{11}$/, `${m.player}: video id`);
    assert.ok(Number.isInteger(m.start) && m.start >= 0, `${m.player}: start`);
    assert.ok(m.note && m.note.length > 10, `${m.player}: note`);
    assert.ok(['innings', 'historic', 'career', 'concept'].includes(m.type), `${m.player}: type ${m.type}`);
  }
});

test('a moment tagged to an innings points at a real innings by the same player', () => {
  const tagged = MOMENTS.filter((m) => m.inningsId);
  assert.ok(tagged.length >= 10);
  for (const m of tagged) {
    const c = BY_ID.get(m.inningsId);
    assert.ok(c, `no innings ${m.inningsId}`);
    assert.equal(c.name, m.player);
  }
});

test('the Renshaw 190 is tagged to the right innings, at the right time', () => {
  const [m] = momentsFor(4599);
  assert.equal(m.youtubeId, 'vhEUpN2Y4-g');
  assert.equal(m.start, 562);
  assert.equal(watchUrl(m.youtubeId, m.start), 'https://www.youtube.com/watch?v=vhEUpN2Y4-g&t=562s');
  assert.match(embedUrl(m.youtubeId, m.start), /youtube-nocookie\.com\/embed\/vhEUpN2Y4-g\?start=562/);
});

test('the origin of tons of consequence is recorded with its timestamps', () => {
  assert.equal(ORIGIN.youtubeId, 'KAZuw748xiw');
  assert.equal(ORIGIN.start, 2068);
  assert.ok(ORIGIN.points.length >= 4 && ORIGIN.points.every((p) => p.start > 1900 && p.text));
  assert.ok(EPISODES.KAZuw748xiw);
});

test('times and labels read well', () => {
  assert.equal(clock(562), '9:22');
  assert.equal(clock(24516), '6:48:36');
  assert.equal(episodeLabel(momentsFor(4599)[0]), 'Hello Sport #946, 12 Oct 2026');
});

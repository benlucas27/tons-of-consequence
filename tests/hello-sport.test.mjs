import test from 'node:test';
import assert from 'node:assert/strict';
import { MOMENTS, EPISODES, ORIGIN, momentsFor, careerMomentsFor, conceptMoments, clock, watchUrl, embedUrl, episodeLabel } from '../src/lib/helloSport.js';
import { BY_ID } from '../src/lib/dataset.js';
import { BATTER_BY_SLUG } from '../src/lib/consequence.js';

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

test('v2 index: every innings or historic moment is tied to an innings by its toc_id', () => {
  for (const m of MOMENTS.filter((x) => x.type === 'innings' || x.type === 'historic')) {
    assert.ok(m.inningsId, `${m.player} (${m.episode} at ${m.start}s) has no innings id`);
  }
  for (const m of MOMENTS.filter((x) => x.type === 'career' || x.type === 'concept')) {
    assert.equal(m.inningsId, null, `${m.player} (${m.type}) should not be on an innings page`);
  }
});

test('v2 index: the three spot-checks (Renshaw 190, Head 123 at Perth with five clips, Gilchrist 122)', () => {
  assert.equal(momentsFor(4599).length, 1);
  assert.equal(momentsFor(2407).length, 5);
  assert.deepEqual([...new Set(momentsFor(2407).map((m) => m.episode))].sort(), ['#814', '#815']);
  const [g] = momentsFor(2457);
  assert.equal(g.youtubeId, 'usNVT8H-J-s');
  assert.equal(g.start, 3546);
});

test('v2 index: the corrected Sydney 2026 scores and Smith at Galle point at the right innings', () => {
  assert.equal(BY_ID.get(momentsFor(916)[0].inningsId).runs, 163);   // Head
  assert.equal(BY_ID.get(momentsFor(1698)[0].inningsId).runs, 138);  // Smith
  assert.equal(momentsFor(2009).length, 1);                          // Smith 131, 2nd Test at Galle
  assert.equal(momentsFor(1576).length, 0);                          // not the 141 in the 1st Test
});

test('Weatherald is not a century, so he has no moment', () => {
  assert.ok(!MOMENTS.some((m) => /weatherald/i.test(m.player)));
});

test('career moments belong to a player page, and the concept moment is on the about page list', () => {
  const careers = MOMENTS.filter((m) => m.type === 'career');
  assert.ok(careers.length >= 4);
  for (const m of careers) {
    assert.ok([...BATTER_BY_SLUG.values()].some((b) => b.name === m.player), `${m.player} has no player page`);
    assert.ok(careerMomentsFor(m.player).includes(m));
  }
  const concepts = conceptMoments();
  assert.equal(concepts.length, 3);
  assert.equal(concepts[0].episode, '#606');                      // oldest first: the early use
  assert.equal(concepts[0].start, 3793);
  assert.equal(concepts[1].episode, '#609');                      // the lifespan joke, nine days later
  assert.equal(concepts[2].youtubeId, ORIGIN.youtubeId);          // then #828, where they define it
});

test('the index file has no rows from the "Other cricket chat" table', () => {
  assert.ok(!MOMENTS.some((m) => ['Jason Sangha', 'Konstas'].some((n) => m.player.includes(n))));
  assert.equal(MOMENTS.length, 31);
});

test('public notes carry no hand-over markers', () => {
  for (const m of MOMENTS) {
    assert.ok(!/\*\*|\bNEW\b|Claude/.test(m.note), `${m.player} (${m.episode}): note shows a marker: ${m.note}`);
  }
});

test('the Hello Cricket page is at /hello-cricket, and the old /hello-sport address redirects to it', async () => {
  const { createRequire } = await import('node:module');
  const config = createRequire(import.meta.url)('../next.config.js');
  const redirects = await config.redirects();
  const r = redirects.find((x) => x.source === '/hello-sport');
  assert.ok(r, 'no redirect from /hello-sport');
  assert.equal(r.destination, '/hello-cricket');
  assert.equal(r.permanent, true);
});

test('older-season finds: Green 174*, Brook 186, and a career clip for Head', () => {
  assert.equal(momentsFor(710).length, 1);
  assert.equal(momentsFor(710)[0].episode, '#606');
  assert.equal(momentsFor(549).length, 1);
  assert.equal(momentsFor(549)[0].start, 4467);
  assert.ok(careerMomentsFor('Travis Head').some((m) => m.episode === '#572'));
});

test('Labuschagne 111 at Manchester carries the host view that it was not a ton of consequence', () => {
  const [m] = momentsFor(3322);
  assert.equal(m.episode, '#606');
  assert.equal(m.start, 3793);
  assert.match(m.note, /wasn't a ton of consequence/);
});

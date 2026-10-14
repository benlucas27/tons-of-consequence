import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VIDEOS, videoFor, embedSrc } from '../src/lib/videos.js';
import { BY_ID } from '../src/lib/dataset.js';

const entries = Object.entries(VIDEOS);

test('every video belongs to a real innings', () => {
  for (const [id] of entries) assert.ok(BY_ID.has(Number(id)), `no innings with id ${id}`);
});

test('every entry is well formed', () => {
  for (const [id, v] of entries) {
    assert.match(v.yt, /^[\w-]{11}$/, `bad YouTube id on ${id}`);
    assert.ok(['innings', 'match'].includes(v.kind), `bad kind on ${id}`);
    assert.equal(typeof v.embed, 'boolean', `embed flag on ${id}`);
    assert.ok(v.channel && v.note && v.mins > 0, `missing text on ${id}`);
  }
});

test('the same video is not attached to two innings', () => {
  const ids = entries.map(([, v]) => v.yt);
  assert.equal(new Set(ids).size, ids.length);
});

test('lookups and the player address', () => {
  assert.equal(videoFor(999999), null);
  assert.ok(videoFor(4599));
  assert.match(embedSrc('abcdefghijk'), /^https:\/\/www\.youtube-nocookie\.com\/embed\/abcdefghijk/);
});

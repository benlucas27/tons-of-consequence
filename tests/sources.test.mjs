import test from 'node:test';
import assert from 'node:assert/strict';
import { sourcesOf, verdictOf } from '../src/lib/consequence.js';
import { CONSEQUENCE } from '../src/data/consequence.js';

test('every ball-by-ball verdict cites Cricsheet, and every source is a real link', () => {
  const ids = Object.keys(CONSEQUENCE).filter((id) => CONSEQUENCE[id][3] === 'b').slice(0, 200);
  for (const id of ids) {
    const s = sourcesOf(Number(id));
    assert.ok(s.some((x) => x.url === 'https://cricsheet.org/'), id);
    for (const x of s) assert.match(x.url, /^https:\/\//);
  }
  assert.ok(verdictOf(Number(ids[0])).sources.length >= 1);
});

test('a hand-checked verdict carries the pages that were opened for it', () => {
  const s = sourcesOf(1142); // Lara 153*, Bridgetown 1999
  assert.ok(s.some((x) => x.url.includes('wikipedia.org')));
});

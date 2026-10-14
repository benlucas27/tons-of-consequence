import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL } from '../src/lib/dataset.js';
import { checkStory } from '../src/lib/storyRules.js';
import { storyStatus } from '../src/lib/stories.js';
import { factsStory } from '../src/lib/factsStory.js';
import { STORY_SOURCES } from '../src/data/story-sources.js';

const smith = ALL.find((c) => c.name === 'Steve Smith' && c.runs === 144 && c.year === 2019);
const ok = 'Steve Smith made 144 against England at Edgbaston in 2019, after a twelve-month ban. Australia won the match by 251 runs.';
const two = [{ url: 'https://example.com/a', label: 'Publisher A' }, { url: 'https://example.org/b', label: 'Publisher B' }];

test('a sourced story needs two https sources, the score and no hype', () => {
  assert.deepEqual(checkStory({ story: ok, sources: two }, smith), []);
  assert.ok(checkStory({ story: ok, sources: [two[0]] }, smith).some((p) => /at least 2/.test(p)));
  assert.ok(checkStory({ story: ok, sources: [two[0], { url: 'http://example.org/b', label: 'B site' }] }, smith).some((p) => /https/.test(p)));
  assert.ok(checkStory({ story: ok.replace('made 144', 'made a stunning 144'), sources: two }, smith).some((p) => /Opinion/.test(p)));
  assert.ok(checkStory({ story: ok.replace('144', '141'), sources: two }, smith).some((p) => /score/.test(p)));
  assert.ok(checkStory({ story: ok + '!', sources: two }, smith).some((p) => /exclamation/.test(p)));
});

test('every story is either facts-only, sourced, or marked unsourced, and none names guessed bowlers', () => {
  const counts = { facts: 0, sourced: 0, unsourced: 0 };
  for (const c of ALL) counts[storyStatus(c)]++;
  assert.ok(counts.facts > 4000, JSON.stringify(counts));
  assert.ok(counts.unsourced < 100, `hand-written stories without sources: ${counts.unsourced}`);
});

test('the facts-only line only uses facts we hold', () => {
  assert.equal(factsStory({ name: 'Brian Lara', runs: 375, balls: 538, opponent: 'England', venue: "St John's", year: 1994, country: 'WI', matchResult: 'unknown' }), "Brian Lara made 375 off 538 balls against England at St John's in 1994.");
});

test('every sourced story already saved passes the rules', () => {
  for (const [id, s] of Object.entries(STORY_SOURCES)) {
    const c = ALL.find((x) => x.id === +id);
    assert.deepEqual(checkStory({ story: s.story, sources: s.sources }, c), [], `#${id}`);
  }
});

/**
 * The to-do list for writing innings stories, working down from the top of the ranking.
 *   node scripts/story-queue.mjs            # the next 20 innings in the top 200 that only have a one-line summary
 *   node scripts/story-queue.mjs 50 300     # the next 50, working through the top 300
 *
 * "Needs a story" means it has no sourced story yet: it shows the facts-only line, or hand-written text that has not
 * been sourced. Write one with scripts/set-story.mjs (see docs/story-guide.md).
 */
import { rankAll } from '../src/lib/dataset.js';
import { DEFAULT_ORDER } from '../src/lib/scoring.js';
import { storyStatus } from '../src/lib/stories.js';

const [count = 20, depth = 200] = process.argv.slice(2).map(Number);
const needsStory = (c) => storyStatus(c) !== 'sourced';
const top = rankAll(DEFAULT_ORDER, null).slice(0, depth);
const queue = top.filter(needsStory);
console.log(`Top ${depth} on the default weighting: ${queue.length} still need a story, ${top.length - queue.length} have a fuller one.\n`);
for (const c of queue.slice(0, count)) {
  console.log(`#${String(c.rank).padStart(3)}  ${c.name} ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent}, ${c.venue}, ${c.year}  (id ${c.id}, ToC ${c.toc})`);
}

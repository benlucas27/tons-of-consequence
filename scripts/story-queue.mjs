/**
 * The to-do list for writing innings stories, working down from the top of the ranking.
 *   node scripts/story-queue.mjs            # the next 20 innings in the top 200 that only have a one-line summary
 *   node scripts/story-queue.mjs 50 300     # the next 50, working through the top 300
 *
 * "Needs a story" means the story is short or is the automatic one-liner. It is a rough test (a person should
 * read each before it is written up), but it is a good guide to where the gaps are.
 */
import { rankAll } from '../src/lib/dataset.js';
import { DEFAULT_ORDER } from '../src/lib/scoring.js';

const [count = 20, depth = 200] = process.argv.slice(2).map(Number);
const needsStory = (c) => !c.story || c.story.length < 200 || /batted long enough to score|made \d+ off \d+ balls against/.test(c.story);
const top = rankAll(DEFAULT_ORDER, null).slice(0, depth);
const queue = top.filter(needsStory);
console.log(`Top ${depth} on the default weighting: ${queue.length} still need a story, ${top.length - queue.length} have a fuller one.\n`);
for (const c of queue.slice(0, count)) {
  console.log(`#${String(c.rank).padStart(3)}  ${c.name} ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent}, ${c.venue}, ${c.year}  (id ${c.id}, ToC ${c.toc})`);
}

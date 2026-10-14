#!/usr/bin/env node
/**
 * Replaces generated write-ups with a facts-only line. The old generator filled stories with claims nobody can prove
 * ("reshaped the match entirely") and, for some, invented bowler names. A story must be a fact we can show, so any story
 * built from sentence shapes that appear in two or more stories is replaced by src/lib/factsStory.js. Stories with
 * their own wording (the hand-written ones) are left alone; they are marked "not yet sourced" on the site until they
 * have two sources (see docs/story-guide.md).
 *
 *   node scripts/facts-only-stories.mjs            preview
 *   node scripts/facts-only-stories.mjs --write    update src/data/sample.js
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALL } from '../src/lib/dataset.js';
import { factsStory } from '../src/lib/factsStory.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/sample.js');
const write = process.argv.includes('--write');

const shape = (s, c) => {
  let t = s;
  for (const x of [c.name, c.player, c.opponent, c.venue, String(c.year)]) if (x) t = t.split(x).join('_');
  return t.replace(/\d+\*?/g, 'N').replace(/\s+/g, ' ').trim();
};
const sentences = (c) => String(c.story || '').split(/(?<=[.!?])\s+/);
const counts = new Map();
for (const c of ALL) for (const k of new Set(sentences(c).map((s) => shape(s, c)))) counts.set(k, (counts.get(k) || 0) + 1);

const templated = (c) => !c.story || sentences(c).some((s) => counts.get(shape(s, c)) >= 2);
const toReplace = ALL.filter((c) => templated(c) && c.story !== factsStory(c));
const kept = ALL.filter((c) => !templated(c));
console.log(`${ALL.length} stories: ${toReplace.length} replaced with a facts-only line, ${kept.length} hand-written left alone, ${ALL.length - toReplace.length - kept.length} already facts-only.`);
for (const c of toReplace.slice(0, 3)) console.log(`\n  ${c.name} ${c.runs} (${c.year})\n  was: ${c.story.slice(0, 140)}…\n  now: ${factsStory(c)}`);

if (write) {
  const byId = new Map(toReplace.map((c) => [c.id, factsStory(c)]));
  const lines = fs.readFileSync(file, 'utf8').split('\n').map((line) => {
    const m = line.match(/^\s*\{id:(\d+),/);
    if (!m || !byId.has(+m[1])) return line;
    return line.replace(/story:"(?:[^"\\]|\\.)*"/, `story:${JSON.stringify(byId.get(+m[1]))}`);
  });
  fs.writeFileSync(file, lines.join('\n'));
  console.log(`\nUpdated ${byId.size} stories in src/data/sample.js.`);
}

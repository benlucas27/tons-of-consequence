#!/usr/bin/env node
/**
 * Writes a sourced story for one innings into src/data/story-sources.js, after checking it against the rules in
 * src/lib/storyRules.js (at least two https sources, facts only, a sensible length). Nothing is written if it fails.
 *
 *   node scripts/set-story.mjs <id> --text "Smith made 144 ..." \
 *        --source "https://example.com/report|Wisden match report" --source "https://other.example/|Cricinfo"
 *   node scripts/set-story.mjs <id> --check ...   check only
 *   node scripts/set-story.mjs <id> --clear       go back to the facts-only line
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BY_ID } from '../src/lib/dataset.js';
import { STORY_SOURCES } from '../src/data/story-sources.js';
import { checkStory } from '../src/lib/storyRules.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(root, 'src/data/story-sources.js');
const args = process.argv.slice(2);
const id = Number(args[0]);
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const all = (name) => args.flatMap((a, i) => (a === name ? [args[i + 1]] : []));

const c = BY_ID.get(id);
if (!c) { console.error(`No innings with id ${id}. Find ids with: node scripts/story-queue.mjs`); process.exit(1); }

const next = { ...STORY_SOURCES };
if (args.includes('--clear')) {
  delete next[id];
} else {
  const story = flag('--text');
  const sources = all('--source').map((s) => { const [url, ...label] = s.split('|'); return { url: url.trim(), label: label.join('|').trim() }; });
  const problems = checkStory({ story, sources }, c);
  if (problems.length) { console.error(`Not saved: ${c.name} ${c.runs} v ${c.opponent} ${c.year}\n- ${problems.join('\n- ')}`); process.exit(1); }
  if (args.includes('--check')) { console.log('Passes.'); process.exit(0); }
  next[id] = { story: story.trim(), sources };
}

const ids = Object.keys(next).map(Number).sort((a, b) => a - b);
const body = ids.map((k) => `  ${k}: ${JSON.stringify(next[k])},`).join('\n');
const src = fs.readFileSync(file, 'utf8').replace(/export const STORY_SOURCES = \{[\s\S]*\};\n?$/, `export const STORY_SOURCES = {${body ? `\n${body}\n` : ''}};\n`);
fs.writeFileSync(file, src);
console.log(`${args.includes('--clear') ? 'Cleared' : 'Saved'} #${id} ${c.name} ${c.runs} v ${c.opponent} ${c.year} (${ids.length} sourced stories in all).`);

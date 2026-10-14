/**
 * Removes the invented bowler names from the original automatic stories in src/data/sample.js.
 *
 *   node scripts/scrub-invented-bowlers.mjs            # preview: counts and examples, writes nothing
 *   node scripts/scrub-invented-bowlers.mjs --write    # remove them
 *
 * The original story generator chose a fixed pair of bowlers for each opposing team whatever the era ("Facing Lillee
 * and Thomson" for an innings in 1903, "Bedser and Trueman" in 1894), so most of those names are wrong. This removes only
 * the sentences built from those templates and leaves every other sentence alone. A story left with nothing falls back
 * to one plain sentence made from the scorecard (who, how many, against whom, where, when).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scrub } from '../src/lib/storyCheck.js';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/sample.js');
const write = process.argv.includes('--write');

// ---- find the story literal on each row line and rewrite it
const lines = fs.readFileSync(file, 'utf8').split('\n');
let changed = 0;
let emptied = 0;
const examples = [];

// Reads a JSON-style string literal that starts at `start` (the opening quote). Returns { value, end }.
function readString(line, start) {
  let i = start + 1;
  while (i < line.length) {
    if (line[i] === '\\') { i += 2; continue; }
    if (line[i] === '"') return { value: JSON.parse(line.slice(start, i + 1)), end: i + 1 };
    i++;
  }
  throw new Error('unterminated string');
}

const out = lines.map((line) => {
  if (!/^\s*\{id:\d+,/.test(line)) return line;
  const at = line.indexOf(',story:"');
  if (at < 0) return line;
  const { value: story, end } = readString(line, at + ',story:'.length);
  const fixed = scrub(story);
  if (fixed === null) return line;
  let next = fixed;
  if (!next) {
    const get = (k) => { const m = new RegExp(`${k}:("(?:[^"\\\\]|\\\\.)*"|[^,]+)`).exec(line); return m ? JSON.parse(m[1].startsWith('"') ? m[1] : JSON.stringify(m[1])) : ''; };
    const name = get('fullName') || get('player');
    next = `${name} scored ${get('runs')}${/notOut:true/.test(line) ? '*' : ''} against ${get('opponent')}${get('venue') ? ` at ${get('venue')}` : ''} in ${get('year')}.`;
    emptied++;
  }
  changed++;
  if (examples.length < 6) examples.push({ id: /id:(\d+)/.exec(line)[1], before: story, after: next });
  return line.slice(0, at) + ',story:' + JSON.stringify(next) + line.slice(end);
});

console.log(`${changed} stories had invented bowler names (${emptied} left empty and rewritten from the scorecard).`);
for (const e of examples) console.log(`\n#${e.id}\n  before: ${e.before}\n  after:  ${e.after}`);
if (write) { fs.writeFileSync(file, out.join('\n')); console.log(`\nwrote ${path.relative(process.cwd(), file)}`); } else console.log('\n(preview only: run with --write to apply)');

#!/usr/bin/env node
/**
 * What the site holds right now, for the weekly review scan (docs/routines/weekly-scan.md).
 *
 *   node scripts/weekly-review-context.mjs                 the newest rows, anything marked in progress, the Latest century card
 *   node scripts/weekly-review-context.mjs --player Nicholls    every row whose name contains the text (to copy the dataset's spelling)
 *   node scripts/weekly-review-context.mjs --since 2026-10-01   rows from Tests since that date's year onward, grouped by series
 */
import { SAMPLE_CENTURIES as ROWS } from '../src/data/sample.js';
import { PLAYER_NAMES } from '../src/data/player-names.js';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const show = (c) => `#${c.id} ${c.player}${c.fullName || PLAYER_NAMES[c.player] ? ` (${c.fullName || PLAYER_NAMES[c.player]})` : ''} ${c.runs}${c.notOut ? '*' : ''} off ${c.balls} v ${c.opponent}, ${c.venue}, ${c.year} [${c.matchResult}] ${c.series || ''}`;

const player = arg('--player');
if (player) {
  const q = player.toLowerCase();
  const hits = ROWS.filter((c) => `${c.player} ${c.fullName || ''} ${PLAYER_NAMES[c.player] || ''}`.toLowerCase().includes(q));
  console.log(hits.length ? hits.slice(-12).map(show).join('\n') : `No row has a name containing "${player}": use Cricsheet's style, initials then surname (for example "HM Nicholls"), with fullName set.`);
  process.exit(0);
}

const since = arg('--since');
const list = since ? ROWS.filter((c) => c.year >= Number(since.slice(0, 4))) : ROWS.slice(-40);
console.log(`The site has ${ROWS.length} hundreds. ${since ? `Rows from ${since.slice(0, 4)}:` : 'The 40 newest rows:'}\n${list.map(show).join('\n')}`);
const live = ROWS.filter((c) => c.matchResult === 'live');
console.log(`\nMarked in progress (${live.length}):${live.length ? '\n' + live.map(show).join('\n') : ' none'}`);
const f = ROWS.find((c) => c.featured);
console.log(`\nLatest century card: ${f ? `${show(f)}\n  kicker: ${f.spotlight?.kicker}\n  blurb:  ${f.spotlight?.blurb}` : 'none'}`);

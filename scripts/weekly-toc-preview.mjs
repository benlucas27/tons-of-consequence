#!/usr/bin/env node
/**
 * The "ToC watch" part of the weekly email (docs/routines/weekly-scan.md).
 *
 *   node scripts/weekly-toc-preview.mjs --review review.json     applies the Consequence Test to every hundred in the review
 *   node scripts/weekly-toc-preview.mjs --site                   what the site's own verdict says about 2026 hundreds so far
 *
 * review.json is the scan's file: { week, items: [{ n, type: "add_innings", row: {...}, toc: { teamTotal, leadOnEntry,
 * entryWkts, entryScore, peril, stakes } }] }. "toc" holds whatever the scorecard gave; missing facts lower the confidence.
 * Prints plain text, grouped so the email can be pasted together from it. Never writes anything.
 */
import fs from 'node:fs';
import { tocPreview, previewLine } from '../src/lib/tocPreview.js';

const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };

if (process.argv.includes('--site')) {
  const { SAMPLE_CENTURIES: ROWS } = await import('../src/data/sample.js');
  const { CONSEQUENCE } = await import('../src/data/consequence.js');
  const recent = ROWS.filter((c) => c.year >= 2026).slice(-40);
  const lines = recent.map((c) => {
    const v = CONSEQUENCE[c.id];
    const what = !v ? 'no verdict yet (no ball-by-ball record)' : `${v[0] ? 'ToC' : 'not a ToC'}${v[1] ? ` (${v[1]})` : ''}: ${v[2]}`;
    return `#${c.id} ${c.fullName || c.player} ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent}, ${c.venue} ${c.year}: ${what}`;
  });
  console.log(`The site's own verdicts for the newest 2026 hundreds:\n${lines.join('\n')}`);
  process.exit(0);
}

const file = arg('--review');
if (!file) { console.error('Usage: weekly-toc-preview.mjs --review review.json | --site'); process.exit(2); }
const review = JSON.parse(fs.readFileSync(file, 'utf8'));
const adds = (review.items || []).filter((i) => i.type === 'add_innings' && i.row);
const groups = { yes: [], maybe: [], wait: [], no: [] };
for (const it of adds) {
  const p = tocPreview(it.row, it.toc || {});
  groups[p.call].push({ it, p });
}
const block = (title, list) => list.length ? `${title}\n${list.map(({ it, p }, i) => `${i + 1}. ${previewLine(it.row, it.toc, p)}`).join('\n\n')}\n` : '';
console.log([
  block('LIKELY ToCs (the rules say yes):', groups.yes),
  block('CANNOT TELL YET (your call, or more match facts needed):', groups.maybe),
  block('STILL BEING PLAYED:', groups.wait),
  groups.no.length ? `NOT ToCs (${groups.no.length}), added to the site as ordinary hundreds:\n${groups.no.map(({ it, p }) => `- ${it.row.fullName || it.row.player} ${it.row.runs}${it.row.notOut ? '*' : ''} v ${it.row.opponent}, ${it.row.venue}: ${p.why}`).join('\n')}\n` : '',
].filter(Boolean).join('\n'));

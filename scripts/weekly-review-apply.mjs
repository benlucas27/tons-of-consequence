#!/usr/bin/env node
/**
 * Applies Ben's emailed answers to the weekly review.
 *
 *   node scripts/weekly-review-apply.mjs --review review.json --reply reply.txt           # preview
 *   node scripts/weekly-review-apply.mjs --review review.json --reply reply.txt --write   # edit src/data/sample.js
 *
 * review.json is the machine-readable block from the review email: { "week": "...", "items": [ { "n": 1, "type": ... } ] }.
 * reply.txt is the plain text of Ben's reply. Only items he approved are applied (see src/lib/reviewReply.js for the
 * answer grammar); the rest are left alone. Prints a plain-English summary for the confirmation email.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { parseReply } from '../src/lib/reviewReply.js';
import { applyItems } from '../src/lib/reviewApply.js';

const arg = (name) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const write = process.argv.includes('--write');
const reviewPath = arg('--review');
const replyPath = arg('--reply');
if (!reviewPath || !replyPath) { console.error('Usage: weekly-review-apply.mjs --review review.json --reply reply.txt [--write]'); process.exit(2); }

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataFile = path.join(root, 'src/data/sample.js');
const review = JSON.parse(readFileSync(reviewPath, 'utf8'));
const items = review.items || [];
const { decisions, notes, ignored } = parseReply(readFileSync(replyPath, 'utf8'), items.map((i) => i.n));

const approved = items.filter((i) => decisions[i.n] === 'y');
const declined = items.filter((i) => decisions[i.n] === 'n');
const pending = items.filter((i) => !decisions[i.n]);

const { SAMPLE_CENTURIES } = await import(pathToFileURL(dataFile).href);
const result = applyItems(readFileSync(dataFile, 'utf8'), approved, SAMPLE_CENTURIES);

if (write && result.done.length) writeFileSync(dataFile, result.src);

const line = (i) => `${i.n}. ${i.summary || i.type}${notes[i.n] ? ` (your note: ${notes[i.n]})` : ''}`;
console.log(`Week of ${review.week || 'unknown'}: ${approved.length} approved, ${declined.length} declined, ${pending.length} not answered.`);
if (result.done.length) console.log(`\n${write ? 'Applied' : 'Would apply'}:\n${result.done.map((d) => '  - ' + d).join('\n')}`);
if (result.failed.length) console.log(`\nCould not apply:\n${result.failed.map((f) => `  - item ${f.n}: ${f.why}`).join('\n')}`);
if (declined.length) console.log(`\nDeclined:\n${declined.map((i) => '  - ' + line(i)).join('\n')}`);
if (pending.length) console.log(`\nStill waiting for an answer:\n${pending.map((i) => '  - ' + line(i)).join('\n')}`);
if (ignored.length) console.log(`\nLines in the reply I did not understand (ignored): ${ignored.length}`);
console.log(`\nRESULT applied=${result.done.length} failed=${result.failed.length} declined=${declined.length} pending=${pending.length}`);
process.exit(0);

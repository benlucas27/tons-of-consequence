#!/usr/bin/env node
/**
 * Safety check for automatic updates: compares src/data/consequence.js in the working folder with the committed one
 * and fails if any EXISTING hundred changed its yes/no verdict (new hundreds are fine). Used by the Season update.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = mkdtempSync(path.join(tmpdir(), 'flip-'));
const old = path.join(dir, 'old.mjs');
writeFileSync(old, execFileSync('git', ['show', 'HEAD:src/data/consequence.js'], { encoding: 'utf8', maxBuffer: 1 << 26 }));
const before = (await import(pathToFileURL(old).href)).CONSEQUENCE;
const now = path.resolve('src/data/consequence.js');
const after = (await import(pathToFileURL(now).href + `?t=${Date.now()}`)).CONSEQUENCE;
const flips = Object.keys(before).filter((id) => after[id] && after[id][0] !== before[id][0]);
const lost = Object.keys(before).filter((id) => !after[id]);
if (flips.length || lost.length) {
  console.error(`Verdict check FAILED: ${flips.length} hundreds changed yes/no (${flips.slice(0, 10).join(', ')}), ${lost.length} lost their verdict.`);
  process.exit(1);
}
console.log(`Verdict check passed: no existing hundred changed yes/no (${Object.keys(after).length - Object.keys(before).length} new).`);

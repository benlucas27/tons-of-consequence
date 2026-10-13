#!/usr/bin/env node
/**
 * Writes the Claude plugin's bundled dataset from the site's own data (with display names), so the
 * plugin never goes stale by accident:  node scripts/export-plugin-data.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { ALL } from '../src/lib/dataset.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'claude-plugin/mcp-server/data/centuries.json');
writeFileSync(out, JSON.stringify(ALL));
console.log(`Wrote ${ALL.length} innings to ${path.relative(root, out)}.`);

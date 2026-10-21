import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

// House rule (CONTEXT.md): "ToC" is always capital T, lowercase o, capital C. Never TOC or Toc.
const ROOTS = ['src', 'mobile/src', 'scripts'];
const walk = (dir) => readdirSync(dir).flatMap((f) => {
  const p = path.join(dir, f);
  return statSync(p).isDirectory() ? walk(p) : /\.(js|mjs)$/.test(f) ? [p] : [];
});

test('ToC is spelled ToC everywhere in the code', () => {
  const bad = [];
  for (const root of ROOTS) {
    let files = [];
    try { files = walk(root); } catch (e) { continue; }
    for (const f of files) {
      readFileSync(f, 'utf8').split('\n').forEach((line, i) => { if (/\b(TOCs?|Tocs?)\b/.test(line)) bad.push(`${f}:${i + 1}`); });
    }
  }
  assert.deepEqual(bad, [], `Write ToC, not TOC or Toc: ${bad.join(', ')}`);
});

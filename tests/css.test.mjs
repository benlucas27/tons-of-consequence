import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// A page's own class names must not style the boxes inside another page's toolbar (the Connect page's ".tools div" once
// turned the rankings filters into a broken grid because both used the class "tools").
test('no descendant rule hangs off the shared ".tools" class', () => {
  const css = fs.readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');
  assert.equal(/(^|\s|,)\.tools\s+[a-z.[]/m.test(css), false);
});

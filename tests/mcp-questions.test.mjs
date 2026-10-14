import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS, checkAll } from '../scripts/mcp-questions-check.mjs';

// The floor only goes up: raise it when `ask` learns to answer more of the list (see docs/mcp-questions.md for what is missing).
const ANSWERED_AT_LEAST = 48;

test('the 62 test questions all run without an error, and the number answered does not fall', () => {
  assert.equal(QUESTIONS.length, 62);
  const rows = checkAll();
  assert.deepEqual(rows.filter((r) => r.status === 'error'), []);
  const answered = rows.filter((r) => r.status === 'answered').length;
  assert.ok(answered >= ANSWERED_AT_LEAST, `only ${answered} of ${rows.length} answered; run node scripts/mcp-questions-check.mjs to see which`);
});

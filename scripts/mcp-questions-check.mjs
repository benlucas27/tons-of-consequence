/**
 * Runs the 64 questions in tests/mcp-questions.json through the same path the connector's `ask` tool uses and reports
 * which got a real answer and which did not. Used by tests/mcp-questions.test.mjs; run it by hand to see the detail:
 *
 *   node scripts/mcp-questions-check.mjs          # list the unanswered ones
 *   node scripts/mcp-questions-check.mjs --all    # list every answer
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { answer } from '../src/lib/ask.js';
import { batterRecords, parseRecordsQuestion } from '../src/lib/records.js';
import { DEFAULT_ORDER } from '../src/lib/scoring.js';
import { SITE_URL } from '../src/lib/site.js';

export const QUESTIONS = JSON.parse(fs.readFileSync(fileURLToPath(new URL('../tests/mcp-questions.json', import.meta.url)), 'utf8'));

/** One question -> { question, status: 'answered' | 'unanswered' | 'error', via, headline } */
export function check(question) {
  try {
    const counting = parseRecordsQuestion(question);
    if (counting) {
      const found = batterRecords({ limit: 10, ...counting.filters }, SITE_URL);
      if (found.results.length) return { question, status: 'answered', via: 'records', headline: counting.interpreted };
    }
    const a = answer(question, DEFAULT_ORDER, {});
    const has = a.kind !== 'none' && (a.kind === 'list' ? (a.results || a.items || []).length > 0 : true);
    return { question, status: has ? 'answered' : 'unanswered', via: a.kind, headline: a.headline };
  } catch (e) {
    return { question, status: 'error', via: 'error', headline: e.message };
  }
}

export const checkAll = () => QUESTIONS.map(check);

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const rows = checkAll();
  const show = process.argv.includes('--all') ? rows : rows.filter((r) => r.status !== 'answered');
  for (const r of show) console.log(`${r.status.padEnd(10)} ${r.question}  ->  ${r.via}: ${r.headline}`);
  const n = (s) => rows.filter((r) => r.status === s).length;
  console.log(`\n${rows.length} questions: ${n('answered')} answered, ${n('unanswered')} unanswered, ${n('error')} errors`);
}

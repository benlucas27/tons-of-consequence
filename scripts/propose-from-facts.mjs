#!/usr/bin/env node
/**
 * Proposes Consequence Test verdicts for hundreds that have no verdict but do have Wikipedia facts (result, innings of the
 * match, batting position, Test number in the series; src/data/wikipedia-facts.js). A proposal is a suggestion for Ben to
 * rule on, never a verdict. Without the score when the batter came in, only some cases can be called:
 *
 *   loss                      -> no (a loss never counts)
 *   draw in the 1st/2nd inns  -> no (the team was not yet in danger of losing)
 *   draw in the 4th innings   -> yes (batting out to save it), medium confidence
 *   win in the 4th innings    -> yes (a winning chase), medium confidence
 *   anything else             -> cannot tell
 *
 *   node scripts/propose-from-facts.mjs "Allan Border,Garry Sobers" [out.json]
 */
import fs from 'node:fs';
import { ALL } from '../src/lib/dataset.js';
import { CONSEQUENCE } from '../src/data/consequence.js';
import { WIKIPEDIA_FACTS } from '../src/data/wikipedia-facts.js';
import { SERIES_FACTS } from '../src/data/series-facts.js';

const names = (process.argv[2] || '').split(',').map((s) => s.trim()).filter(Boolean);
const out = process.argv[3] || 'docs/drafts/proposals.json';
const RES = { win: 'won', draw: 'drawn', loss: 'lost', tie: 'tied' };
const rows = [];
for (const c of ALL.filter((x) => names.includes(x.name) && !CONSEQUENCE[x.id]).sort((a, b) => a.name.localeCompare(b.name) || a.year - b.year)) {
  const f = WIKIPEDIA_FACTS[c.id];
  const sf = SERIES_FACTS[c.id];
  const result = f?.[0] || sf?.[0] || (['win', 'draw', 'loss'].includes(c.matchResult) ? c.matchResult : null);
  const [, pos, inn, test0, han] = f || [];
  const test = test0 || (sf ? `${sf[1]}/${sf[2]}` : null);
  const lead = sf ? sf[3] : null;
  const dead = sf ? sf[4] === 1 : false;
  let verdict = 'cannot tell', confidence = 'low', reason = 'We have the result but not the score when he came in.';
  if (!result) reason = 'No result found yet.';
  else if (result === 'loss') { verdict = 'no'; confidence = 'high'; reason = 'A loss never counts.'; }
  else if (dead) { verdict = 'no'; confidence = 'medium'; reason = 'The series was already decided when this Test began.'; }
  else if (result === 'draw' && inn && inn <= 2) { verdict = 'no'; confidence = 'medium'; reason = 'A draw, and in the first innings the team was not yet in danger of losing.'; }
  else if (result === 'draw' && inn === 4) { verdict = 'yes'; confidence = 'medium'; reason = 'Batting in the last innings of a drawn Test, which saved it.'; }
  else if (result === 'win' && inn === 4) { verdict = 'yes'; confidence = 'medium'; reason = 'A hundred in a winning fourth-innings chase.'; }
  else if (result === 'win' && test && test.split('/')[0] === test.split('/')[1]) reason = 'A win in the last Test of the series: it may have been a dead rubber, which the series score would show.';
  rows.push({
    id: c.id, innings: `${c.name} ${c.runs}${c.notOut ? '*' : ''} v ${c.opponent}, ${c.venue} ${c.year}`,
    match: `${pos ? `Batted ${pos}` : 'Batting position not found'}${inn ? `, innings ${inn} of the match` : ''}${test ? `, Test ${test.replace('/', ' of ')}` : ''}${han ? (han === 'H' ? ', at home' : han === 'A' ? ', away' : ', neutral venue') : ''}`,
    result: result ? `The team ${RES[result]}` : 'Result not found', series_going_in: sf ? `Test ${sf[1]} of ${sf[2]}, ${lead === 0 ? 'level' : lead > 0 ? `his side ${lead} up` : `his side ${-lead} down`}${dead ? ' (series already decided)' : ''}` : test ? `Test ${test.replace('/', ' of ')} (score not checked)` : 'Not checked', innings_of_match: inn ? String(inn) : 'Not found',
    entry_state: 'Not recorded', verdict, confidence, reason, sources: [...(f ? ['https://en.wikipedia.org/wiki/List_of_international_cricket_centuries_by_' + c.name.replace(/ /g, '_')] : []), ...(sf ? ['Wikipedia tour page for the series'] : [])], flags: '',
  });
}
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
const n = (v) => rows.filter((r) => r.verdict === v).length;
console.log(`${rows.length} hundreds: ${n('yes')} yes, ${n('no')} no, ${n('cannot tell')} cannot tell. Wrote ${out}`);

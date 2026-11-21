/**
 * A preview of the Consequence Test for a hundred the weekly scan has just found, using only what a match report gives.
 * It is a recommendation for Ben, never a verdict: the site's own verdict is built later from Cricsheet's ball-by-ball
 * record (scripts/build-consequence.mjs) and Ben's hand rulings (src/data/consequence-overrides.js) win over both.
 *
 * Inputs: the review row (runs, matchResult, inningsNumber) and optional match facts from the scorecard:
 *   teamTotal     the batter's team total in that innings
 *   leadOnEntry   the team's lead (negative = behind) when he came in
 *   entryWkts     wickets down when he came in
 *   entryScore    team score when he came in
 *   peril         top-seven wickets that fell around him
 *   stakes        'dead' | 'decider' | 'on the line' | 'live' | 'single' (where the series stood going in)
 *
 * With all of leadOnEntry, entryWkts and entryScore it runs the real test (src/lib/consequenceTest.js). With less it can
 * still call the clear cases the same way scripts/propose-from-facts.mjs does, and otherwise says what is missing.
 *
 * Returns { call: 'yes' | 'no' | 'maybe' | 'wait', confidence: 'high' | 'medium' | 'low', scenario, why, recommendation }.
 */
import { consequenceTest } from './consequenceTest.js';

const num = (v) => typeof v === 'number' && Number.isFinite(v);

export function tocPreview(row, toc = {}) {
  const result = row.matchResult;
  const inningsNo = row.inningsNumber;
  const share = num(toc.teamTotal) && toc.teamTotal > 0 ? row.runs / toc.teamTotal : null;
  const out = (call, confidence, why, scenario = null, recommendation) => ({
    call, confidence, scenario, why,
    recommendation: recommendation || (call === 'yes' ? `Recommend: rule it a ToC${scenario ? ` (${scenario.toLowerCase()})` : ''}.`
      : call === 'no' ? 'Recommend: not a ToC.' : 'Your call.'),
  });

  if (result === 'live') return out('wait', 'low', 'The Test is still on, so the result is not known.', null, 'Wait for the result.');
  if (result === 'loss') return out('no', 'high', 'The team lost, and a hundred in a loss never counts.');
  if (toc.stakes === 'dead') return out('no', 'medium', 'The series was already decided, so the match was a dead rubber.');

  // Everything the real test needs: run it as it is run on the site.
  if (num(toc.leadOnEntry) && num(toc.entryWkts) && num(toc.entryScore)) {
    const v = consequenceTest({
      result, inningsNo, runs: row.runs, share: share ?? 0, leadOnEntry: toc.leadOnEntry,
      entryWkts: toc.entryWkts, entryScore: toc.entryScore, peril: toc.peril ?? 0, stakes: toc.stakes,
    });
    const confidence = num(toc.peril) && toc.stakes ? 'high' : 'medium';
    return v.passes
      ? out('yes', confidence, v.because, v.scenario)
      : out('no', confidence, v.because);
  }

  // Part of the picture: the clear cases only.
  if (result === 'draw') {
    if (inningsNo === 4) return out('yes', 'medium', 'He batted in the last innings of a drawn Test, which saved it.', 'Saved the match');
    if (inningsNo === 3 && num(toc.leadOnEntry) && toc.leadOnEntry < 0) return out('yes', 'medium', `His side trailed by ${-toc.leadOnEntry} when he came in and the match was drawn, so the hundred saved it.`, 'Saved the match');
    if (inningsNo <= 2 || (inningsNo === 3 && num(toc.leadOnEntry) && toc.leadOnEntry >= 0)) return out('no', 'medium', 'A draw in which his side was not behind when he came in, so it was not in danger of losing.');
    return out('maybe', 'low', 'A draw in the third innings: it counts only if his side was still behind when he came in.', null, 'Your call: need the lead when he came in.');
  }
  if (result === 'win' || result === 'tie') {
    if (inningsNo === 4 && result === 'win') return out('yes', 'medium', 'A hundred in a winning fourth-innings chase.', 'Chased it down');
    if (num(toc.leadOnEntry) && toc.leadOnEntry > 200) return out('no', 'medium', `His side already led by ${toc.leadOnEntry} when he came in, so the match was safe.`);
    if (share != null && share <= 0.3) return out('no', 'low', `He made ${Math.round(share * 100)}% of the team's ${toc.teamTotal} in a win.`);
    return out('maybe', 'low',
      share != null
        ? `A win, and he made ${Math.round(share * 100)}% of the team's ${toc.teamTotal}. It counts if he rescued or carried the innings, which depends on the score when he came in.`
        : 'A win. It counts if he rescued or carried the innings, which depends on the score when he came in.',
      null, 'Your call: need the score and wickets when he came in.');
  }
  return out('maybe', 'low', 'No clear result.', null, 'Your call.');
}

/** One plain-text block for the email. */
export function previewLine(row, toc, preview) {
  const name = row.fullName || row.player;
  const head = `${name} ${row.runs}${row.notOut ? '*' : ''} off ${row.balls} v ${row.opponent}, ${row.venue} (${row.matchResult === 'live' ? 'Test still on' : row.matchResult})`;
  const how = { yes: 'LIKELY A ToC', no: 'NOT A ToC', maybe: 'CANNOT TELL YET', wait: 'WAIT' }[preview.call];
  return `${head}\n   Rules say: ${how} (${preview.confidence} confidence). ${preview.why}\n   ${preview.recommendation}`;
}

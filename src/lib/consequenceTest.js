/**
 * DRAFT (v2): the Consequence Test. Is a hundred a "ton of consequence"? Judged on the circumstances, not on a score
 * or a bar: three yes/no questions about the match, and the answer is a named scenario you can say in a sentence.
 *
 *   1. Did the team win or save the match?                 (a hundred in a loss is never a ton of consequence)
 *   2. Was the match still alive when he came in?          (not a dead rubber, and not already won)
 *   3. Did the hundred change it?                          (chased it down, saved it, rescued the innings or carried it)
 *
 * Yes to all three is a ton of consequence, and question 3 names the kind. Otherwise it is "a good ton", and the
 * first "no" says why. Thresholds are first drafts to argue over (docs/drafts/consequence-definition.md).
 */

export const CARRY_SHARE = 0.4; // scoring 40% or more of the team's runs counts as carrying the innings
export const ALREADY_WON_LEAD = 200; // a lead this big on entry means the match was already safe
export const RESCUE_WICKETS = 3; // three or more down...
export const RESCUE_SCORE = 100; // ...with the team still under this on entry
export const SAFE_LEAD = 200; // a collapse around him does not count once the team is already this far ahead
export const CARRY_ENTRY = 100; // carrying the innings means he came in with the team under this
export const COLLAPSE_AROUND = 4; // or this many wickets fell around him while the team was under 200

const SCENARIOS = {
  chase: 'Chased it down',
  saved: 'Saved the match',
  rescue: 'Rescued the innings',
  carried: 'Carried the innings',
};

/** Did the hundred win or save the match? Returns a reason either way. */
function outcome(f) {
  if (f.result === 'loss') return { yes: false, why: 'The team lost.' };
  if (f.result === 'win') return { yes: true, why: f.inningsNo === 4 ? 'The team won the chase.' : 'The team won.' };
  if (f.result === 'tie') return { yes: true, why: 'The match was tied.' };
  if (f.result === 'draw') {
    // A draw is only "saved" if the team was in danger of losing: batting again while still behind (which includes
    // following on), or batting last. In a first or second innings a team can't yet be said to have been saved.
    const saved = (f.inningsNo === 3 && f.leadOnEntry < 0) || f.inningsNo === 4;
    return saved
      ? { yes: true, why: f.inningsNo === 4 ? 'The match was drawn, with the team batting out the last innings.' : 'The match was drawn, with the team batting again while still behind.' }
      : { yes: false, why: 'A draw, and the team was never in danger of losing.' };
  }
  return { yes: false, why: 'There was no result.' };
}

/** Was the match still alive? */
function alive(f) {
  if (f.stakes === 'dead') return { yes: false, why: 'A dead rubber: the series was already decided.' };
  if (f.leadOnEntry > ALREADY_WON_LEAD) return { yes: false, why: `The team was already ${f.leadOnEntry} ahead when he came in.` };
  const where = { decider: 'the decider of a level series', 'on the line': 'the last match, with the series still to be settled', live: 'a live series', single: 'a one-off Test' }[f.stakes || 'single'];
  return { yes: true, why: `It was ${where}.` };
}

/** What did the hundred do? Returns the first kind that fits, or null. */
function change(f, won) {
  if (won && f.inningsNo === 4 && f.result === 'win') return { kind: 'chase', why: 'He made it in a winning chase.' };
  if (f.result === 'draw') return { kind: 'saved', why: 'He saved the match.' };
  if ((f.entryWkts >= RESCUE_WICKETS && f.entryScore < RESCUE_SCORE) || (f.peril >= COLLAPSE_AROUND && f.leadOnEntry < SAFE_LEAD)) {
    return { kind: 'rescue', why: f.peril >= COLLAPSE_AROUND && f.leadOnEntry < SAFE_LEAD ? `${f.peril} wickets fell around him while the team was under 200.` : `He came in at ${f.entryWkts} for ${f.entryScore}.` };
  }
  if ((f.share ?? 0) >= CARRY_SHARE && f.entryScore < CARRY_ENTRY) return { kind: 'carried', why: `He scored ${Math.round(f.share * 100)}% of the team's runs.` };
  return null;
}

/**
 * The verdict for one hundred, from its facts (see matchContext.js).
 * Returns { passes, scenario, headline, answers: [{ question, yes, why }], because }.
 */
export function consequenceTest(f) {
  const q1 = outcome(f);
  const q2 = alive(f);
  const q3 = q1.yes && q2.yes ? change(f, q1.yes) : null;
  const passes = q1.yes && q2.yes && Boolean(q3);
  const answers = [
    { question: 'Did the team win or save the match?', yes: q1.yes, why: q1.why },
    { question: 'Was the match still alive when he came in?', yes: q2.yes, why: q2.why },
    { question: 'Did the hundred change it?', yes: Boolean(q3), why: q3 ? q3.why : q1.yes && q2.yes ? 'No: he came in comfortably and the team did not depend on him.' : 'Not asked.' },
  ];
  const firstNo = answers.find((a) => !a.yes);
  return {
    passes,
    scenario: passes ? SCENARIOS[q3.kind] : null,
    headline: passes ? `A ton of consequence: ${SCENARIOS[q3.kind].toLowerCase()}` : 'A good ton, not a ton of consequence',
    answers,
    because: passes ? q3.why : firstNo.why,
  };
}

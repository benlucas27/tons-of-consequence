/**
 * DRAFT: the Consequence Test. Is a hundred a "ton of consequence"? Judged on what it did to the match and the
 * series, not on how many runs it was or how it looked. Four things, in points out of 100:
 *
 *   Outcome  (40)  what happened to the team: won it, saved it, or neither
 *   Pressure (30)  what the batter walked into: wickets down, behind or ahead
 *   Carry    (15)  how much of the team's innings he scored
 *   Stakes   (15)  what rode on the match for the series
 *
 * A hundred in a loss can never be a ton of consequence (capped below the bar). The numbers here are a first
 * draft to be argued over (see docs/drafts/consequence-definition.md), not settled.
 */

export const BAR = 60;
const LOSS_CAP = 55;

/** One reason line per part, so every verdict can be explained in plain words. */
export function consequenceTest(f) {
  const because = [];

  // ---- outcome (40)
  let outcome;
  const chase = f.inningsNo === 4 && f.result === 'win';
  if (f.result === 'loss') { outcome = 5; because.push('The team lost.'); }
  else if (f.result === 'tie') { outcome = 36; because.push('The match was tied.'); }
  else if (f.result === 'win') {
    outcome = chase ? 40 : 32;
    because.push(chase ? 'He made it in a winning chase.' : 'The team won.');
    const by = f.margin || {};
    const tight = (by.runs != null && by.runs <= 50) || (by.wickets != null && by.wickets <= 3);
    if (tight) { outcome += 4; because.push('A tight finish (+4).'); }
  } else if (f.result === 'draw') {
    const saved = f.leadOnEntry <= 0 || f.followOn || (f.inningsNo >= 3 && f.leadOnEntry < 150);
    outcome = saved ? 32 : 8;
    because.push(saved ? 'It saved the match: the team was behind or batting to survive.' : 'A draw, and the team was never in danger.');
  } else { outcome = 8; because.push('No result.'); }

  // ---- pressure (30)
  // Wickets down is pressure in any innings. Being behind or ahead only counts once both sides have batted
  // (the third and fourth innings): a reply innings starts "behind" by the opponent's total as a matter of course.
  const wk = [0, 0, 4, 8, 12, 16][Math.min(f.entryWkts, 5)];
  const collapse = (f.entryWkts >= 3 && f.entryScore < 100 ? 6 : 0) + (f.peril >= 5 ? 8 : f.peril >= 3 ? 5 : 0);
  const lead = f.leadOnEntry;
  const leadPts = f.inningsNo < 3 ? 0 : lead < 0 ? 14 : lead <= 150 ? 8 : lead <= 300 ? 3 : 0;
  let pressure = Math.min(30, wk + collapse + leadPts);
  if (lead > 250) { pressure = Math.min(pressure, 6); because.push(`Came in with the team already ${lead} ahead: little pressure.`); }
  else if (f.inningsNo >= 3 && lead < 0) because.push(`Came in at ${f.entryWkts} down and ${-lead} behind.`);
  else if (f.inningsNo >= 3) because.push(`Came in at ${f.entryWkts} down, ${lead} ahead.`);
  else because.push(`Came in at ${f.entryWkts} for ${f.entryScore}${f.peril >= 3 ? `, and ${f.peril} more wickets fell around him while the team was under 200` : ''}.`);

  // ---- carry (15)
  const s = f.share ?? 0;
  const carry = s >= 0.5 ? 15 : s >= 0.4 ? 12 : s >= 0.3 ? 9 : s >= 0.2 ? 5 : 2;
  because.push(`Scored ${Math.round(s * 100)}% of the team's runs in the innings.`);

  // ---- stakes (15)
  const stakes = { dead: 0, decider: 15, 'on the line': 15, live: 9, single: 9 }[f.stakes || 'single'];
  because.push({ dead: 'A dead rubber: the series was already decided.', decider: 'The decider of a level series.', 'on the line': 'The last match, with the series still to be settled.', live: 'A live series.', single: 'A one-off Test.' }[f.stakes || 'single']);

  let score = outcome + pressure + carry + stakes;
  if (f.result === 'loss') score = Math.min(score, LOSS_CAP);
  const passes = score >= BAR;
  return {
    score,
    passes,
    parts: { outcome, pressure, carry, stakes },
    headline: passes ? 'A ton of consequence' : 'A good ton, not a ton of consequence',
    because,
  };
}

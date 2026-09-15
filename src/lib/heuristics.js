/**
 * Heuristic lever scoring + story generation for centuries pulled in by the
 * automated monthly refresh (see src/lib/cricsheet.js and the cron route).
 *
 * These scores are intentionally rough — they exist to give a brand-new
 * innings a sane starting point the moment it's discovered, and to unblock
 * it from a real narrative pass. Every row this writes is saved with
 * score_status: 'pipeline', which puts it straight into the existing
 * /admin/score editorial queue for a human to refine (same queue used for
 * the original heuristic-scored historical dataset).
 */

const RIVALRIES = new Set([
  'AUS-ENG', 'ENG-AUS',       // The Ashes
  'IND-AUS', 'AUS-IND',       // Border-Gavaskar Trophy
  'IND-PAK', 'PAK-IND',       // India vs Pakistan
  'AUS-WI', 'WI-AUS',
  'ENG-WI', 'WI-ENG',
  'IND-ENG', 'ENG-IND',
  'NZ-AUS', 'AUS-NZ',         // Trans-Tasman
]);

function clamp(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * @param {object} c - { player, country, runs, balls, notOut, opponent,
 *   venue, year, series, matchResult, inningsNumber }
 * @param {string} opponentCode - opponent's country code (for rivalry check)
 */
export function scoreLevers(c, opponentCode) {
  const sr = c.balls > 0 ? (c.runs / c.balls) * 100 : 60;
  const isRivalry = RIVALRIES.has(`${c.country}-${opponentCode}`);
  const isChase = c.inningsNumber >= 3;

  const matchImpact = clamp(
    50 +
    (c.matchResult === 'win' ? 20 : c.matchResult === 'loss' ? -5 : 5) +
    (isChase ? 10 : 0) +
    Math.min(20, (c.runs - 100) / 10)
  );

  const conditions = clamp(
    50 +
    (sr < 45 ? 15 : sr < 60 ? 8 : sr > 90 ? -10 : 0) +
    (isRivalry ? 5 : 0)
  );

  const clutchness = clamp(
    45 +
    (isChase ? 20 : 0) +
    (isChase && c.matchResult === 'win' ? 10 : 0) +
    (isChase && c.notOut ? 8 : 0)
  );

  const narrative = clamp(
    35 +
    (c.runs >= 300 ? 25 : c.runs >= 200 ? 15 : c.runs >= 150 ? 6 : 0) +
    (c.notOut ? 5 : 0) +
    (isRivalry ? 6 : 0)
  );

  const historicalWeight = clamp(
    40 +
    (isRivalry ? 12 : 0) +
    (c.runs >= 200 ? 10 : 0)
  );

  const perceivedGreatness = clamp(
    40 +
    (c.matchResult === 'win' ? 8 : 0) +
    (c.runs >= 200 ? 18 : c.runs >= 150 ? 10 : 0)
  );

  return { matchImpact, conditions, clutchness, narrative, historicalWeight, perceivedGreatness };
}

function inningsDescriptor(c) {
  if (c.runs >= 300) return 'a monumental triple-century';
  if (c.runs >= 200) return 'a commanding double-century';
  if (c.runs >= 150) return 'a substantial hundred';
  return 'a century';
}

export function writeStory(c) {
  const chase = c.inningsNumber >= 3;
  const outcome = c.matchResult === 'win' ? 'a win' : c.matchResult === 'loss' ? 'a loss' : 'a draw';
  const notOutClause = c.notOut ? ', unbeaten,' : '';
  const chaseClause = chase ? `, batting second time round, ` : ' ';

  return (
    `${c.player} made ${inningsDescriptor(c)}${notOutClause} of ${c.runs}` +
    `${c.notOut ? '*' : ''} off ${c.balls || '—'} balls against ${c.opponent}` +
    `${chaseClause}at ${c.venue} in ${c.year}, in a match that finished in ${outcome} for ${c.country}. ` +
    `Pulled in by the monthly data refresh — awaiting editorial review for the full story.`
  );
}

export function tagsFor(c) {
  const tags = [];
  if (c.runs >= 300) tags.push('Triple Century');
  else if (c.runs >= 200) tags.push('Double Century');
  if (c.inningsNumber >= 3) tags.push('Second Innings');
  if (c.notOut) tags.push('Not Out');
  tags.push('Pipeline');
  return tags;
}

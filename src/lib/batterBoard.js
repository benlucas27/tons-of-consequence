/** One light row per batter for the ToCs leaderboard: ToCs, share, best innings (Default weighting) and team win rate. */
import { BATTERS } from './consequence.js';
import { rankAll } from './dataset.js';
import { DEFAULT_ORDER } from './scoring.js';

const scoreOf = new Map(rankAll(DEFAULT_ORDER).map((c) => [c.id, c.toc]));

export const BOARD = BATTERS.map((b) => {
  let peak = null;
  for (const c of b.innings) {
    const s = scoreOf.get(c.id);
    if (!peak || s > peak.score) peak = { score: s, runs: c.runs, notOut: c.notOut, opponent: c.opponent, year: c.year };
  }
  const known = b.innings.filter((c) => c.matchResult !== 'unknown' && c.matchResult !== 'live');
  return {
    name: b.name, slug: b.slug, hundreds: b.hundreds, measured: b.measured, tons: b.tons,
    peak, resultsKnown: known.length, wins: known.filter((c) => c.matchResult === 'win').length,
  };
});

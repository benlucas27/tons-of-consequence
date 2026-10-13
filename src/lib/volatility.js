/**
 * Divisiveness: how much an innings' score swings across different points of view.
 * High = "it depends what you value" (the innings that start the best arguments).
 * Low = universally recognised.
 */
import { calcToc, displayName, LEVER_BY_KEY } from './scoring.js';

// Five recognisable points of view, as free-form weights (these are separate from the reader's
// own order-based weighting).
export const PROFILES = [
  { label: 'Default', w: { matchImpact: 20, conditions: 15, clutchness: 20, narrative: 20, historicalWeight: 15, perceivedGreatness: 10 } },
  { label: 'The Purist', w: { matchImpact: 30, conditions: 25, clutchness: 25, narrative: 5, historicalWeight: 10, perceivedGreatness: 5 } },
  { label: 'The Romantic', w: { matchImpact: 10, conditions: 5, clutchness: 15, narrative: 35, historicalWeight: 20, perceivedGreatness: 15 } },
  { label: 'The Analyst', w: { matchImpact: 35, conditions: 30, clutchness: 20, narrative: 5, historicalWeight: 5, perceivedGreatness: 5 } },
  { label: 'The Patriot', w: { matchImpact: 15, conditions: 10, clutchness: 20, narrative: 20, historicalWeight: 25, perceivedGreatness: 10 } },
];

export function scoreAcrossProfiles(innings) {
  return PROFILES.map((p) => ({ profile: p.label, score: calcToc(innings, p.w) }));
}

/** 0-100 divisiveness plus the spread behind it. */
export function calcVolatility(innings) {
  const scores = scoreAcrossProfiles(innings);
  const values = scores.map((s) => s.score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min;
  return {
    volatility: Math.round(Math.min(100, (spread / 60) * 100)), // the widest possible spread is about 60 points
    spread: Math.round(spread * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    bestFor: scores.reduce((a, b) => (a.score > b.score ? a : b)),
    worstFor: scores.reduce((a, b) => (a.score < b.score ? a : b)),
  };
}

export function volatilityTier(v) {
  if (v >= 70) return { label: 'Highly divisive', tone: 'hot', desc: 'This innings divides opinion sharply. Your values change everything.' };
  if (v >= 45) return { label: 'Contested', tone: 'warm', desc: 'Reasonable people disagree on this one.' };
  if (v >= 20) return { label: 'Broadly agreed', tone: 'cool', desc: 'Some variation, but most perspectives rate this similarly.' };
  return { label: 'Universally great', tone: 'calm', desc: 'Almost everyone agrees. This innings transcends the debate.' };
}

/** A written head-to-head verdict under a given weighting. */
export function writeVerdict(inningsA, inningsB, weights) {
  const tocA = calcToc(inningsA, weights);
  const tocB = calcToc(inningsB, weights);
  const winner = tocA >= tocB ? inningsA : inningsB;
  const loser = tocA >= tocB ? inningsB : inningsA;
  const margin = Math.abs(Math.round((tocA - tocB) * 10) / 10);

  let gapKey = null;
  let gap = -1;
  for (const k of Object.keys(weights)) {
    const g = Math.abs((inningsA.levers[k] || 0) - (inningsB.levers[k] || 0));
    if (g > gap) { gap = g; gapKey = k; }
  }
  const lever = LEVER_BY_KEY[gapKey]?.name || gapKey;
  const wv = winner.levers[gapKey] || 0;
  const lv = loser.levers[gapKey] || 0;
  const desc = (x) => `${displayName(x)}'s ${x.runs}${x.notOut ? '*' : ''}`;

  let verdict;
  if (margin < 1) {
    verdict = `Dead heat. On your settings, ${desc(inningsA)} and ${desc(inningsB)} are essentially tied. The pub argument is yours to resolve.`;
  } else if (margin < 4) {
    verdict = `Narrow call. ${desc(winner)} edges it by ${margin} points, largely on ${lever} (${wv} vs ${lv}). Plenty of room for a second opinion.`;
  } else {
    verdict = `On your settings, ${desc(winner)} wins clearly, ${margin} points clear, with a decisive advantage in ${lever} (${wv} vs ${lv}). ${desc(loser)} would need you to weight ${margin < 8 ? 'a couple of' : 'very different'} levers differently to change that.`;
  }
  return { winner, loser, tocA, tocB, margin, biggestGapLever: lever, verdict };
}

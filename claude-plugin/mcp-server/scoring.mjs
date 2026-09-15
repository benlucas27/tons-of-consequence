/**
 * Standalone port of the Tons of Consequence scoring model.
 * Kept dependency-free and self-contained so this plugin never needs the
 * web app's Supabase instance — same formulas as src/lib/scoring.js and
 * src/lib/volatility.js in the main repo, duplicated deliberately so the
 * plugin can be distributed/installed independently of that codebase.
 */

export const LEVER_KEYS = [
  'matchImpact', 'conditions', 'clutchness', 'narrative', 'historicalWeight', 'perceivedGreatness',
];

export const LEVER_INFO = {
  matchImpact: { name: 'Match Impact', description: 'Win probability added, partnership value, whether the innings directly changed the match result.' },
  conditions: { name: 'Conditions & Opposition', description: 'Pitch difficulty, quality of the bowling attack, weather and overhead conditions.' },
  clutchness: { name: 'Clutchness', description: 'The pressure index — team situation when the batter walked in, must-win context, series stakes.' },
  narrative: { name: 'Narrative', description: 'The human story: debut, comeback, redemption arc, farewell, playing through adversity.' },
  historicalWeight: { name: 'Historical Weight', description: 'Records set, rivalry significance, ground lore, where this sits in cricket timeline.' },
  perceivedGreatness: { name: 'Perceived Greatness', description: 'How often this innings appears in greatest ever lists, fan polls, retrospective analysis.' },
};

export const DEFAULT_WEIGHTS = {
  matchImpact: 20, conditions: 15, clutchness: 20,
  narrative: 20, historicalWeight: 15, perceivedGreatness: 10,
};

export const PRESETS = {
  default: DEFAULT_WEIGHTS,
  purist: { matchImpact: 30, conditions: 25, clutchness: 25, narrative: 5, historicalWeight: 10, perceivedGreatness: 5 },
  romantic: { matchImpact: 10, conditions: 5, clutchness: 15, narrative: 35, historicalWeight: 20, perceivedGreatness: 15 },
  analyst: { matchImpact: 35, conditions: 30, clutchness: 20, narrative: 5, historicalWeight: 5, perceivedGreatness: 5 },
  patriot: { matchImpact: 15, conditions: 10, clutchness: 20, narrative: 20, historicalWeight: 25, perceivedGreatness: 10 },
};

export const NATIONS = {
  AUS: 'Australia', ENG: 'England', WI: 'West Indies', IND: 'India', SA: 'South Africa',
  PAK: 'Pakistan', NZ: 'New Zealand', SL: 'Sri Lanka', ZIM: 'Zimbabwe', BAN: 'Bangladesh',
  AFG: 'Afghanistan', IRE: 'Ireland',
};

export function calcToc(innings, weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (!total) return 0;
  const sum = LEVER_KEYS.reduce((acc, k) => acc + (innings.levers[k] || 0) * (weights[k] || 0), 0);
  return Math.round((sum / total) * 10) / 10;
}

export function scoreTier(s) {
  if (s >= 90) return 'LEGENDARY';
  if (s >= 82) return 'ELITE';
  if (s >= 72) return 'GREAT';
  return 'NOTABLE';
}

export function scoreAcrossPresets(innings) {
  return Object.entries(PRESETS).map(([key, w]) => ({ preset: key, score: calcToc(innings, w) }));
}

export function calcVolatility(innings) {
  const scores = scoreAcrossPresets(innings).map((s) => s.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const spread = max - min;
  const volatility = Math.round(Math.min(100, (spread / 60) * 100));
  return { volatility, spread: Math.round(spread * 10) / 10, min, max };
}

export function volatilityTier(v) {
  if (v >= 70) return 'HIGHLY DIVISIVE';
  if (v >= 45) return 'CONTESTED';
  if (v >= 20) return 'BROADLY AGREED';
  return 'UNIVERSALLY GREAT';
}

export function writeVerdict(a, b, weights) {
  const tocA = calcToc(a, weights);
  const tocB = calcToc(b, weights);
  const winner = tocA >= tocB ? a : b;
  const loser = tocA >= tocB ? b : a;
  const margin = Math.round(Math.abs(tocA - tocB) * 10) / 10;

  let biggestGapKey = null;
  let biggestGap = -1;
  for (const k of LEVER_KEYS) {
    const gap = Math.abs((a.levers[k] || 0) - (b.levers[k] || 0));
    if (gap > biggestGap) { biggestGap = gap; biggestGapKey = k; }
  }
  const leverName = LEVER_INFO[biggestGapKey]?.name || biggestGapKey;
  const runDesc = (x) => `${x.runs}${x.notOut ? '*' : ''}`;

  let verdict;
  if (margin < 1) {
    verdict = `Dead heat — ${a.player}'s ${runDesc(a)} and ${b.player}'s ${runDesc(b)} are essentially tied on these weights.`;
  } else if (margin < 4) {
    verdict = `Narrow call: ${winner.player}'s ${runDesc(winner)} edges it by ${margin} points, largely on ${leverName}.`;
  } else {
    verdict = `Clear result: ${winner.player}'s ${runDesc(winner)} wins by ${margin} points, with a decisive advantage in ${leverName}.`;
  }
  return { winner: winner.player, loser: loser.player, tocA, tocB, margin, biggestGapLever: leverName, verdict };
}

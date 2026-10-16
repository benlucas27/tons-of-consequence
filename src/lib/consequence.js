/** Reading the Consequence Test verdicts (src/data/consequence.js) per innings and per batter. */
import { CONSEQUENCE } from '../data/consequence.js';
import { ALL, slugify } from './dataset.js';
import { WHERE_PLAYED } from '../data/where-played.js';
import { tierOfOpponent } from './matchFacts.js';
import { PRESS_REFERENCES } from '../data/press-references.js';

/** 'H', 'A' or 'N' for the side that scored the hundred, or undefined when we do not have the match record. */
export const wherePlayed = (id) => WHERE_PLAYED[id];

/** How much to trust a verdict, by the evidence it was built from. */
export const CONFIDENCE = {
  b: { key: 'high', label: 'High confidence', note: 'Built from the ball-by-ball record: the score and wickets when he came in, the lead and the series stakes.' },
  s: { key: 'high', label: 'High confidence', note: 'Judged from the full scorecard.' },
  h: { key: 'high', label: 'High confidence', note: 'Judged from several match reports that describe how the innings unfolded: the slump, the stands, the result and the series.' },
  p: { key: 'medium', label: 'Medium confidence', note: 'Judged from the result, which innings it was, the team total and the series. The score when he came in is not recorded.' },
  r: { key: 'medium', label: 'Medium confidence', note: 'Judged from match reports. The score when he came in is not recorded, so the call rests on the result, the innings and the series.' },
};

/** { passes, scenario, because, confidence } for a hundred we have measured, or null when we have no match record for it yet. */
export function verdictOf(id) {
  const v = CONSEQUENCE[id];
  return v ? { passes: v[0] === 1, scenario: v[1], because: v[2], confidence: CONFIDENCE[v[3]] || CONFIDENCE.b, press: PRESS_REFERENCES[id] || [] } : null;
}

const byName = new Map();
for (const c of ALL) {
  if (!byName.has(c.name)) byName.set(c.name, []);
  byName.get(c.name).push(c);
}

/** Every batter with their hundreds, how many we can measure and how many were tons of consequence. */
export const BATTERS = [...byName.entries()].map(([name, list]) => {
  const innings = [...list].sort((a, b) => a.year - b.year || a.id - b.id);
  const measured = innings.filter((c) => CONSEQUENCE[c.id]);
  const tons = measured.filter((c) => CONSEQUENCE[c.id][0] === 1);
  const count = (list, key) => list.reduce((acc, c) => { const k = key(c); if (k != null) acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  return {
    name, slug: slugify(name), innings, hundreds: innings.length, measured: measured.length, tons: tons.length,
    byTier: count(innings, (c) => tierOfOpponent(c.opponent)),
    tonsByTier: count(tons, (c) => tierOfOpponent(c.opponent)),
    byWhere: count(innings, (c) => WHERE_PLAYED[c.id]),
    tonsByWhere: count(tons, (c) => WHERE_PLAYED[c.id]),
  };
});

export const BATTER_BY_SLUG = new Map(BATTERS.map((b) => [b.slug, b]));

/** The leaderboard: most tons of consequence first (then the larger share, then name). */
export const LEADERS = BATTERS.filter((b) => b.measured > 0).sort((a, b) => b.tons - a.tons || b.tons / b.measured - a.tons / a.measured || a.name.localeCompare(b.name));

export const MEASURED_TOTAL = Object.keys(CONSEQUENCE).length;
export const TONS_TOTAL = Object.values(CONSEQUENCE).filter((v) => v[0] === 1).length;

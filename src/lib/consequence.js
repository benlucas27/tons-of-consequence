/** Reading the Consequence Test verdicts (src/data/consequence.js) per innings and per batter. */
import { CONSEQUENCE } from '../data/consequence.js';
import { ALL, slugify } from './dataset.js';
import { WHERE_PLAYED } from '../data/where-played.js';
import { tierOfOpponent } from './matchFacts.js';
import { PRESS_REFERENCES } from '../data/press-references.js';
import { SERIES_SOURCES } from '../data/series-sources.js';
import { VERDICT_SOURCES } from '../data/verdict-sources.js';

/** 'H', 'A' or 'N' for the side that scored the hundred, or undefined when we do not have the match record. */
export const wherePlayed = (id) => WHERE_PLAYED[id];

/** How much to trust a verdict, by the evidence it was built from. */
export const CONFIDENCE = {
  b: { key: 'high', label: 'High confidence', note: 'We have the full ball-by-ball record: the score when the batter came in, the lead and what the series rode on.' },
  s: { key: 'high', label: 'High confidence', note: 'We have the full scorecard.' },
  h: { key: 'high', label: 'High confidence', note: 'Several match reports describe how the innings unfolded: the slump, the stands, the result and the series.' },
  p: { key: 'medium', label: 'Medium confidence', note: 'We know the result, which innings it was, the team total and where the series stood, but not the score when the batter came in.' },
  r: { key: 'medium', label: 'Medium confidence', note: "We rely on match reports. We don't have the score when the batter came in, so the call rests on the result, the innings and the series." },
};

/** Where a verdict's facts came from: pages opened for the hand-checked ones, the Wikipedia tour page the result and series came from, and Cricsheet for the ball-by-ball record. */
export function sourcesOf(id) {
  const v = CONSEQUENCE[id];
  if (!v) return [];
  const out = [...(VERDICT_SOURCES[id] || [])];
  const tour = SERIES_SOURCES[id];
  if (tour) { const url = `https://en.wikipedia.org/wiki/${tour.replace(/ /g, '_')}`; if (!out.some((s) => s.url === url)) out.push({ url, label: `Wikipedia: ${tour}` }); }
  if (v[3] === 'b') out.push({ url: 'https://cricsheet.org/', label: 'Cricsheet ball-by-ball data' });
  return out.slice(0, 5);
}

/** { passes, scenario, because, confidence } for a hundred we have measured, or null when we have no match record for it yet. */
export function verdictOf(id) {
  const v = CONSEQUENCE[id];
  return v ? { passes: v[0] === 1, scenario: v[1], because: v[2], confidence: CONFIDENCE[v[3]] || CONFIDENCE.b, press: PRESS_REFERENCES[id] || [], sources: sourcesOf(id) } : null;
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
    byTier: count(innings, (c) => tierOfOpponent(c.opponent, c.year)),
    tonsByTier: count(tons, (c) => tierOfOpponent(c.opponent, c.year)),
    byWhere: count(innings, (c) => WHERE_PLAYED[c.id]),
    tonsByWhere: count(tons, (c) => WHERE_PLAYED[c.id]),
  };
});

export const BATTER_BY_SLUG = new Map(BATTERS.map((b) => [b.slug, b]));

/** The leaderboard: most tons of consequence first (then the larger share, then name). */
export const LEADERS = BATTERS.filter((b) => b.measured > 0).sort((a, b) => b.tons - a.tons || b.tons / b.measured - a.tons / a.measured || a.name.localeCompare(b.name));

export const MEASURED_TOTAL = Object.keys(CONSEQUENCE).length;
export const TONS_TOTAL = Object.values(CONSEQUENCE).filter((v) => v[0] === 1).length;

/** Reading the Consequence Test verdicts (src/data/consequence.js) per innings and per batter. */
import { CONSEQUENCE } from '../data/consequence.js';
import { ALL, slugify } from './dataset.js';

/** { passes, scenario, because } for a hundred we have measured, or null when we have no match record for it yet. */
export function verdictOf(id) {
  const v = CONSEQUENCE[id];
  return v ? { passes: v[0] === 1, scenario: v[1], because: v[2] } : null;
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
  return { name, slug: slugify(name), innings, hundreds: innings.length, measured: measured.length, tons: tons.length };
});

export const BATTER_BY_SLUG = new Map(BATTERS.map((b) => [b.slug, b]));

/** The leaderboard: most tons of consequence first (then the larger share, then name). */
export const LEADERS = BATTERS.filter((b) => b.measured > 0).sort((a, b) => b.tons - a.tons || b.tons / b.measured - a.tons / a.measured || a.name.localeCompare(b.name));

export const MEASURED_TOTAL = Object.keys(CONSEQUENCE).length;
export const TONS_TOTAL = Object.values(CONSEQUENCE).filter((v) => v[0] === 1).length;

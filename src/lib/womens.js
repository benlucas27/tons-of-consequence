/** Reading the women's Test hundreds (src/data/womens-hundreds.js): the hundreds, the batters, and the tons of consequence. */
import { WOMENS_HUNDREDS } from '../data/womens-hundreds.js';
import { slugify } from './dataset.js';

export const RESULT_WORD = { win: 'Won', draw: 'Drawn', loss: 'Lost' };

export const WOMENS = WOMENS_HUNDREDS.map(([no, name, runs, team, opponent, date, ground, result, ton, reason, evidence]) => ({
  no, name, runs, team, opponent, date, year: Number(date.slice(0, 4)), ground, result, ton: ton === 1, reason, evidence, slug: slugify(name),
  notOut: runs.endsWith('*'), score: Number(runs.replace('*', '')),
}));

const byName = new Map();
for (const h of WOMENS) { if (!byName.has(h.name)) byName.set(h.name, []); byName.get(h.name).push(h); }

/** Every batter with hundreds, most tons of consequence first (then the larger share, then the most hundreds). */
export const WOMENS_BATTERS = [...byName.entries()].map(([name, list]) => ({
  name, team: list[0].team, hundreds: list.length, tons: list.filter((h) => h.ton).length, list,
})).sort((a, b) => b.tons - a.tons || b.tons / b.hundreds - a.tons / a.hundreds || b.hundreds - a.hundreds || a.name.localeCompare(b.name));

export const WOMENS_TOTAL = WOMENS.length;
export const WOMENS_TONS = WOMENS.filter((h) => h.ton);
export const WOMENS_BALL_BY_BALL = WOMENS.filter((h) => h.evidence === 'b').length;

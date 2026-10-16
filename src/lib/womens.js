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

/** Hundreds that also count for their place in history (the first, a record). Two sources checked for each: Wikipedia and a match report. */
export const HISTORIC = {
  1: "The first century in a women's Test.",
  2: 'A world-record score at the time, and it stood for about half a century.',
  5: "The first century by an Australian woman in a Test, made on debut.",
  71: "Sri Lanka's only women's Test, and their win.",
  80: 'A world-record score at the time.',
};
for (const h of WOMENS) h.historic = HISTORIC[h.no] || null;

export const WOMENS_TOTAL = WOMENS.length;
export const WOMENS_TONS = WOMENS.filter((h) => h.ton);
export const WOMENS_BALL_BY_BALL = WOMENS.filter((h) => h.evidence === 'b').length;

/** Does a hundred match every word typed? */
export const matchesWomens = (h, text) => text.toLowerCase().split(/\s+/).filter(Boolean).every((w) => `${h.name} ${h.team} ${h.opponent} ${h.ground} ${h.year} ${h.score}`.toLowerCase().includes(w));

/** Search the women's hundreds by batter, team, opponent, ground, year or runs ("Maclagan 119", "Sutherland 2025"). */
export function searchWomens(text, limit = 8) {
  if (!text.trim()) return [];
  return WOMENS.filter((h) => matchesWomens(h, text)).slice(0, limit);
}

export const WOMENS_BY_NO = new Map(WOMENS.map((h) => [h.no, h]));
export const WOMENS_TEAMS = [...new Set(WOMENS.map((h) => h.team))].sort((a, b) => WOMENS.filter((h) => h.team === b).length - WOMENS.filter((h) => h.team === a).length);
export const hundredText = (h) => `${h.name} ${h.runs} v ${h.opponent}, ${h.ground.split(',')[0]}, ${h.year}`;

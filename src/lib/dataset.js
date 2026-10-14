/**
 * The innings dataset, prepared for display: display names, permalinks, rankings under a
 * weighting, filters. Pure functions over src/data/sample.js, usable on server and client.
 */
import { SAMPLE_CENTURIES } from '../data/sample.js';
import { STORY_SOURCES } from '../data/story-sources.js';
import { displayName, tocForOrder, formatOrder, DEFAULT_ORDER, weightQuery } from './scoring.js';

export const ALL = SAMPLE_CENTURIES.map((c) => {
  const sourced = STORY_SOURCES[c.id];
  return { ...c, name: displayName(c), ...(sourced ? { story: sourced.story, sourceLinks: sourced.sources } : {}) };
});
export const BY_ID = new Map(ALL.map((c) => [c.id, c]));
export const TOTAL = ALL.length;
export const FEATURED = ALL.find((c) => c.featured) || null;

// ---- permalinks: /innings/4599-matt-renshaw-190-2026 (the id is what matters; the rest is for people)

export const slugify = (s) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
export const inningsSlug = (c) => `${c.id}-${slugify(c.name)}-${c.runs}-${c.year}`;
export function parseInningsId(slug) {
  const m = /^(\d+)(?:-|$)/.exec(String(slug || ''));
  return m ? Number(m[1]) : null;
}
/** Path to an innings, carrying the reader's weighting (and any bonus) when it isn't the default. */
export function inningsPath(c, order, bias = null) {
  return `/innings/${inningsSlug(c)}${order ? weightQuery(order, bias) : ''}`;
}

/** The rankings page, carrying the reader's weighting (and any bonus) when it isn't the default. */
export function rankingsPath(order, bias = null) {
  return order ? `/${weightQuery(order, bias)}` : '/';
}

// ---- rankings

function computeRanking(order, bias) {
  const list = ALL.map((c) => ({ ...c, toc: tocForOrder(c, order, bias) })).sort((a, b) => b.toc - a.toc || a.id - b.id);
  list.forEach((c, i) => { c.rank = i + 1; });
  return list;
}

const cache = new Map();
/** Every innings with `toc` and `rank` under the given weighting, best first. The last few weightings are kept. */
export function rankAll(order, bias = null) {
  const key = `${formatOrder(order)}|${bias || ''}`;
  if (!cache.has(key)) {
    if (cache.size >= 6) cache.delete(cache.keys().next().value);
    cache.set(key, computeRanking(order, bias));
  }
  return cache.get(key);
}

let defaultRanks = null;
/** Where an innings sits on the Default weighting. */
export function defaultRankOf(id) {
  if (!defaultRanks) defaultRanks = new Map(computeRanking(DEFAULT_ORDER, null).map((c) => [c.id, c.rank]));
  return defaultRanks.get(id);
}
/** Places gained (positive) or lost (negative) against the Default weighting. */
export const movementOf = (c) => defaultRankOf(c.id) - c.rank;

// ---- filters

export const ERAS = [
  { value: 'pre1960', label: 'Before 1960', test: (y) => y < 1960 },
  { value: '1960-1989', label: '1960 to 1989', test: (y) => y >= 1960 && y <= 1989 },
  { value: '1990-2009', label: '1990 to 2009', test: (y) => y >= 1990 && y <= 2009 },
  { value: '2010+', label: '2010 onwards', test: (y) => y >= 2010 },
];
export const SCORE_BANDS = [
  { value: '100-149', label: '100 to 149', test: (r) => r >= 100 && r <= 149 },
  { value: '150-199', label: '150 to 199', test: (r) => r >= 150 && r <= 199 },
  { value: '200+', label: '200 and over', test: (r) => r >= 200 },
];
const count = {};
ALL.forEach((c) => { count[c.country] = (count[c.country] || 0) + 1; });
export const COUNTRIES = Object.keys(count).sort((a, b) => count[b] - count[a]);

export function applyFilters(list, { country, era, band, query }) {
  const eraDef = ERAS.find((e) => e.value === era);
  const bandDef = SCORE_BANDS.find((b) => b.value === band);
  const q = (query || '').toLowerCase().trim();
  return list.filter((c) => {
    if (country && c.country !== country) return false;
    if (eraDef && !eraDef.test(c.year)) return false;
    if (bandDef && !bandDef.test(c.runs)) return false;
    if (q) {
      const hay = [c.name, c.player, c.opponent, c.venue, c.year, c.series, ...(c.tags || [])].join(' ').toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Other innings by the same person, best first under the given weighting. */
export function otherInningsBy(c, order, bias = null) {
  return rankAll(order, bias).filter((x) => x.id !== c.id && x.name === c.name && x.country === c.country);
}

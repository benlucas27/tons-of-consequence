/**
 * The innings dataset, prepared for display: display names, permalinks, rankings under a
 * weighting, filters. Pure functions over src/data/sample.js, usable on server and client.
 */
import { SAMPLE_CENTURIES } from '../data/sample.js';
import { displayName, tocForOrder, formatOrder, DEFAULT_ORDER, sameOrder } from './scoring.js';

export const ALL = SAMPLE_CENTURIES.map((c) => ({ ...c, name: displayName(c) }));
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
/** Path to an innings, carrying the reader's weighting when it isn't the default. */
export function inningsPath(c, order) {
  const base = `/innings/${inningsSlug(c)}`;
  return order && !sameOrder(order, DEFAULT_ORDER) ? `${base}?o=${formatOrder(order)}` : base;
}

/** The rankings page, carrying the reader's weighting when it isn't the default. */
export function rankingsPath(order) {
  return order && !sameOrder(order, DEFAULT_ORDER) ? `/?o=${formatOrder(order)}` : '/';
}

// ---- rankings

let cache = { key: null, list: null };
/** Every innings with `toc` and `rank` under the given weighting, best first. Cached per weighting. */
export function rankAll(order) {
  const key = formatOrder(order);
  if (cache.key === key) return cache.list;
  const list = ALL.map((c) => ({ ...c, toc: tocForOrder(c, order) })).sort((a, b) => b.toc - a.toc || a.id - b.id);
  list.forEach((c, i) => { c.rank = i + 1; });
  cache = { key, list };
  return list;
}

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
export function otherInningsBy(c, order) {
  return rankAll(order).filter((x) => x.id !== c.id && x.name === c.name && x.country === c.country);
}

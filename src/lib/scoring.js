/**
 * The Tons of Consequence scoring model.
 *
 * Every innings has six lever values (0-100). A reader's weighting is just an ORDER of the six
 * levers: first place carries 30%, then 22, 18, 14, 10 and 6. An innings' Greatness score is the
 * weighted average of its lever values under that order. Because a weighting is only an order,
 * it fits in a link (see formatOrder / parseOrder).
 */
import { PLAYER_NAMES } from '../data/player-names.js';

export const LEVERS = [
  { key: 'matchImpact', code: 'mi', name: 'Match Impact', short: 'Match impact', color: 'var(--l-mi)', hex: '#f0c23c',
    ask: 'Did it decide the course of the game?',
    description: 'Win probability added, partnership value, whether the innings directly changed the match result.' },
  { key: 'clutchness', code: 'cl', name: 'Clutchness', short: 'Clutchness', color: 'var(--l-cl)', hex: '#ea5b46',
    ask: 'The weight of pressure in the moment',
    description: 'The pressure index: team situation when the batter walked in, must-win context, series stakes.' },
  { key: 'narrative', code: 'na', name: 'Narrative', short: 'Narrative', color: 'var(--l-na)', hex: '#dd9650',
    ask: 'The story surrounding the innings',
    description: 'The human story: debut, comeback, redemption arc, farewell, playing through adversity.' },
  { key: 'conditions', code: 'co', name: 'Conditions & Opposition', short: 'Conditions', color: 'var(--l-co)', hex: '#4fb6e6',
    ask: 'What and who they were up against',
    description: 'Pitch difficulty, quality of the bowling attack, weather and overhead conditions.' },
  { key: 'historicalWeight', code: 'hi', name: 'Historical Weight', short: 'History', color: 'var(--l-hi)', hex: '#a77be8',
    ask: 'How time and experts have judged it',
    description: 'Records set, rivalry significance, ground lore, where this sits in cricket timeline.' },
  { key: 'perceivedGreatness', code: 'pg', name: 'Perceived Greatness', short: 'Greatness', color: 'var(--l-pg)', hex: '#5fd48a',
    ask: 'The consensus of those who watched',
    description: 'How often this innings appears in greatest-ever lists, fan polls, retrospective analysis.' },
];

export const LEVER_BY_KEY = Object.fromEntries(LEVERS.map((l) => [l.key, l]));
export const DEFAULT_ORDER = LEVERS.map((l) => l.key);
export const RANK_WEIGHTS = [30, 22, 18, 14, 10, 6];

// A preset is an order of the six criteria and, for the Patriot, a bonus (see BIASES). Each one is a
// distinct point of view: a test keeps them from drifting back into near-copies of each other.
export const PRESETS = {
  Default: {
    order: DEFAULT_ORDER, bias: null,
    blurb: "The model's own balance: match impact first, then clutchness and the story.",
  },
  Purist: {
    order: ['conditions', 'clutchness', 'matchImpact', 'historicalWeight', 'perceivedGreatness', 'narrative'], bias: null,
    blurb: 'How hard it was. Conditions and pressure first, the story last.',
  },
  Analyst: {
    order: ['matchImpact', 'conditions', 'historicalWeight', 'clutchness', 'perceivedGreatness', 'narrative'], bias: null,
    blurb: 'What it changed. Match impact first, then conditions, records and pressure.',
  },
  Patriot: {
    order: DEFAULT_ORDER, bias: 'au',
    blurb: 'Australia first. Every Australian innings gets a bonus, and the Border to Ponting years get more.',
  },
  Romantic: {
    order: ['narrative', 'historicalWeight', 'perceivedGreatness', 'clutchness', 'matchImpact', 'conditions'], bias: null,
    blurb: 'The story. Narrative first, then history and legend.',
  },
};
export const PRESET_ORDERS = Object.fromEntries(Object.entries(PRESETS).map(([name, p]) => [name, p.order]));

/**
 * A bonus added to a score after the weighting, for presets that favour one team. It is always shown to
 * the reader (see BiasNote) and carried in links as ?bonus=au, so a score never moves without saying why.
 * The Australian bonus: +5 for any Australian innings, and +3 more for 1989 to 2007 (Border to Ponting).
 */
export const BIASES = {
  au: {
    id: 'au', name: 'Australian bonus', country: 'AUS', base: 5, golden: 3, from: 1989, to: 2007,
    note: '+5 for every Australian innings, and +3 more for innings from 1989 to 2007, the Border to Ponting years.',
  },
};
export const parseBias = (s) => (typeof s === 'string' && BIASES[s] ? s : null);
export function biasPoints(innings, bias) {
  const b = BIASES[bias];
  if (!b || innings.country !== b.country) return 0;
  return b.base + (innings.year >= b.from && innings.year <= b.to ? b.golden : 0);
}
/** A score with the bonus (if any) added. Capped at 100 so the scale still means what it says. */
export const applyBias = (score, innings, bias) => (bias ? Math.min(100, Math.round((score + biasPoints(innings, bias)) * 10) / 10) : score);

export function sameOrder(a, b) {
  return a.length === b.length && a.every((k, i) => k === b[i]);
}
/** The preset a weighting matches, or null if it is a custom one. */
export function activePreset(order, bias = null) {
  return Object.keys(PRESETS).find((name) => sameOrder(PRESETS[name].order, order) && (PRESETS[name].bias || null) === (bias || null)) || null;
}

/** Weights keyed by lever, from an order of lever keys. */
export function weightsFromOrder(order) {
  const w = {};
  order.forEach((key, i) => { w[key] = RANK_WEIGHTS[i]; });
  return w;
}

/** The order a set of free-form weights implies (heaviest first; ties keep the default order). */
export function orderFromWeights(weights) {
  return [...DEFAULT_ORDER].sort((a, b) => (weights[b] || 0) - (weights[a] || 0));
}

const CODE_TO_KEY = Object.fromEntries(LEVERS.map((l) => [l.code, l.key]));
export const formatOrder = (order) => order.map((k) => LEVER_BY_KEY[k].code).join(',');
/** Parses "na,mi,cl,co,hi,pg". Returns null unless it names each of the six levers exactly once. */
export function parseOrder(str) {
  if (!str || typeof str !== 'string') return null;
  const keys = str.split(',').map((c) => CODE_TO_KEY[c.trim()]);
  if (keys.length !== 6 || keys.some((k) => !k) || new Set(keys).size !== 6) return null;
  return keys;
}

/** The query string that carries a weighting in a link: '' for Default, otherwise ?o=... (and &bonus=au). */
export function weightQuery(order, bias = null) {
  const parts = [];
  if (bias || !sameOrder(order, DEFAULT_ORDER)) parts.push(`o=${formatOrder(order)}`);
  if (bias) parts.push(`bonus=${bias}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

export function calcToc(innings, weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (!total) return 0;
  return Math.round(Object.keys(weights).reduce((acc, k) => acc + ((innings.levers[k] || 0) * weights[k]) / total, 0) * 10) / 10;
}
export const tocForOrder = (innings, order, bias = null) => applyBias(calcToc(innings, weightsFromOrder(order)), innings, bias);

export const TIERS = [
  { key: 'legendary', label: 'Legendary', min: 90 },
  { key: 'elite', label: 'Elite', min: 82 },
  { key: 'great', label: 'Great', min: 72 },
  { key: 'notable', label: 'Notable', min: 0 },
];
export const tierOf = (score) => TIERS.find((t) => score >= t.min);

/** Statsguru-style initials ("MT Renshaw") are the dataset's key; this is the name to show. */
export const displayName = (c) => c.fullName || PLAYER_NAMES[c.player] || c.player;

export { FLAGS, NATIONS } from './countries.js';

/**
 * The Tons of Consequence scoring model.
 *
 * Every innings has six lever values (0-100). A reader's weighting is just an ORDER of the six
 * levers: first place carries 30%, then 22, 18, 14, 10 and 6. An innings' ToC score is the
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

export const PRESET_ORDERS = {
  Default: DEFAULT_ORDER,
  Purist: ['matchImpact', 'conditions', 'clutchness', 'historicalWeight', 'narrative', 'perceivedGreatness'],
  Romantic: ['narrative', 'historicalWeight', 'clutchness', 'perceivedGreatness', 'matchImpact', 'conditions'],
  Analyst: ['matchImpact', 'conditions', 'clutchness', 'narrative', 'historicalWeight', 'perceivedGreatness'],
  Patriot: ['historicalWeight', 'clutchness', 'narrative', 'matchImpact', 'conditions', 'perceivedGreatness'],
};

export function sameOrder(a, b) {
  return a.length === b.length && a.every((k, i) => k === b[i]);
}
export function activePreset(order) {
  return Object.keys(PRESET_ORDERS).find((name) => sameOrder(PRESET_ORDERS[name], order)) || null;
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

export function calcToc(innings, weights) {
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (!total) return 0;
  return Math.round(Object.keys(weights).reduce((acc, k) => acc + ((innings.levers[k] || 0) * weights[k]) / total, 0) * 10) / 10;
}
export const tocForOrder = (innings, order) => calcToc(innings, weightsFromOrder(order));

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

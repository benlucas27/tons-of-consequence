/**
 * A stable identity for a century that doesn't depend on database ids —
 * used to match/dedupe innings across the static dataset, the live
 * Supabase overlay, and freshly scraped rows from the monthly pipeline.
 * Deliberately excludes venue (small string variations between sources).
 */
import { canonicalPlayer } from '../data/name-aliases.js';

export function naturalKey(c) {
  return `${canonicalPlayer(c.player)}|${c.year}|${c.runs}|${c.opponent}`.trim().toLowerCase();
}

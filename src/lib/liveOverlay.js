import { naturalKey } from './naturalKey';

/**
 * Merges the live Supabase table over the static baseline dataset.
 * - Rows that match an existing static entry (same player/year/runs/opponent)
 *   replace it ONLY if a human has reviewed them (scoreStatus 'editorial') —
 *   this is how editorial review (story text, lever scores, tags) reaches the
 *   site. Machine-generated rows never overwrite a static entry.
 * - A static entry's fullName (display name) is kept when it is replaced.
 * - Rows with no static match are new centuries (e.g. from the monthly
 *   pipeline) and are appended.
 * Pure function, no network/env access — safe to unit-test and safe to call
 * with an empty `live` array (e.g. Supabase unreachable), in which case it
 * just returns the static list unchanged.
 */
export function mergeLiveOverlay(staticList, live) {
  if (!live || !live.length) return staticList;

  const liveByKey = new Map(live.map((c) => [naturalKey(c), c]));
  const merged = staticList.map((c) => {
    const l = liveByKey.get(naturalKey(c));
    return l && l.scoreStatus === 'editorial' ? { ...l, fullName: c.fullName } : c;
  });

  const staticKeys = new Set(staticList.map(naturalKey));
  const newOnes = live.filter((c) => !staticKeys.has(naturalKey(c)));

  // Keep ids unique and stable-ish for React keys / selection state.
  const maxId = staticList.reduce((m, c) => Math.max(m, c.id || 0), 0);
  newOnes.forEach((c, i) => { if (!c.id) c.id = maxId + i + 1; });

  return [...merged, ...newOnes];
}

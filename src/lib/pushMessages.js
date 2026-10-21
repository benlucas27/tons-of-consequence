/**
 * The push notifications for new tons of consequence (sent by scripts/notify-new-tons.mjs after a data update).
 * Pure: give it the ton ids and hundreds from before and after an update.
 */

const MANY = 4; // more new tons than this at once (a big data fix, not a new match): send one summary instead

const runs = (c) => `${c.runs}${c.notOut ? '*' : ''}`;

/** The ids that are tons of consequence now, were not before, and are hundreds that were not in the database before. */
export function newTonIds(oldTonIds, newTonIds, oldHundredIds) {
  const had = new Set(oldTonIds);
  const knew = new Set(oldHundredIds);
  return [...newTonIds].filter((id) => !had.has(id) && !knew.has(id)).sort((a, b) => a - b);
}

/**
 * [{ headings, contents, inningsId }] ready to send. `byId` maps id to the hundred, `verdictOf` gives its scenario text.
 * Each message names the batter; the body says who and where, then the reason in a few words.
 */
export function buildPushes(ids, byId, scenarioOf) {
  const hundreds = ids.map((id) => byId.get(id)).filter(Boolean);
  if (!hundreds.length) return [];
  if (hundreds.length >= MANY) {
    return [{ title: `${hundreds.length} new tons of consequence`, body: hundreds.slice(0, 3).map((c) => `${c.name} ${runs(c)}`).join(', ') + ' and more. Tap to see the ToCs.', inningsId: null }];
  }
  return hundreds.map((c) => {
    const why = scenarioOf(c.id);
    return {
      title: `New ToC: ${c.name} ${runs(c)}`,
      body: `v ${c.opponent}${c.venue ? `, ${c.venue}` : ''}, ${c.year}.${why ? ` ${why.charAt(0).toUpperCase()}${why.slice(1)}.` : ''}`,
      inningsId: c.id,
    };
  });
}

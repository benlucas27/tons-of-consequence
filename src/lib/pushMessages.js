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
 * [{ headings, contents, inningsId }] ready to send. `byId` maps id to the hundred.
 * Each message leads with the batter and the score and ends on a question, so people open it to find out.
 */
export function buildPushes(ids, byId) {
  const hundreds = ids.map((id) => byId.get(id)).filter(Boolean);
  if (!hundreds.length) return [];
  if (hundreds.length >= MANY) {
    return [{ title: `${hundreds.length} new tons of consequence`, body: hundreds.slice(0, 3).map((c) => `${c.name} ${runs(c)}`).join(', ') + ' and more. Which ones really counted? Tap to see.', inningsId: null }];
  }
  // Written to make someone open the app: the score, then the question, not the answer.
  return hundreds.map((c) => ({
    title: `${c.name} scores ${runs(c)}`,
    body: `v ${c.opponent}${c.venue ? `, ${c.venue}` : ''}. Was it a ToC? Where does it rank?`,
    inningsId: c.id,
  }));
}

/**
 * Guards against invented detail in stories. The original automatic story generator named a fixed pair of bowlers for
 * each opposing team whatever the era ("Facing Lillee and Thomson" for an innings in 1903), so most of those names were
 * wrong. A story must not name bowlers unless a person has checked them, so any sentence built from those templates is
 * invented. Used by scripts/scrub-invented-bowlers.mjs and by the data tests.
 */

const NAMES = '(?:[A-Z][a-z]+(?:, | and |,? and ))+[A-Z][a-z]+';
const PLACES = /Test|Ashes|England|Australia|India|Zealand|Africa|Pakistan|Indies|Lanka|Zimbabwe|Bangladesh|Ireland|Afghanistan/;
const TEMPLATES = [
  new RegExp(`^Facing (${NAMES})(?:,| —| under| over)`),
  new RegExp(`^Constructed against (${NAMES}),`),
  new RegExp(`^Scoring against (${NAMES}) with the game on the line`),
  new RegExp(`^With (${NAMES}) hunting wickets,`),
];

export const isInventedSentence = (s) => TEMPLATES.some((re) => { const m = re.exec(s); return Boolean(m) && !PLACES.test(m[1]); });

/** The sentences of a story that are invented. */
export const inventedSentences = (story) => String(story || '').split(/(?<=[.!?])\s+/).filter(isInventedSentence);

/** The story without the invented sentences, or null if there were none. */
export function scrub(story) {
  const sentences = String(story || '').split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !isInventedSentence(s));
  return kept.length === sentences.length ? null : kept.join(' ').trim();
}

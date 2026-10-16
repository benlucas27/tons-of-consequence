/** Plain facts about an innings that are not part of the score: how strong the opposition were, and where it was played. */

/** The opposition tiers (a fixed grouping of nations, not a rating on the day). */
export const TIERS = [
  { n: 1, name: 'Top tier', teams: 'England, Australia, India' },
  { n: 2, name: 'Second tier', teams: 'New Zealand, South Africa' },
  { n: 3, name: 'Third tier', teams: 'Sri Lanka, West Indies, Pakistan' },
  { n: 4, name: 'Other', teams: 'Bangladesh, Zimbabwe, Ireland, Afghanistan and the rest' },
];
const TIER_OF = { England: 1, Australia: 1, India: 1, 'New Zealand': 2, 'South Africa': 2, 'Sri Lanka': 3, 'West Indies': 3, Pakistan: 3 };

// Some sides were stronger in some eras than their fixed tier says: they count a tier higher then.
const STRONGER_WHEN = { 'West Indies': [[0, 2000, 2]], 'Sri Lanka': [[1996, 2010, 2]] };

/** The opponent's tier; pass the year and an era in which the side was stronger counts a tier higher. */
export const tierOfOpponent = (opponent, year) => {
  const era = year == null ? null : (STRONGER_WHEN[opponent] || []).find(([from, to]) => year >= from && year <= to);
  return era ? era[2] : TIER_OF[opponent] || 4;
};
export const tierName = (n) => TIERS[n - 1].name;

/** The opposition with its tier, e.g. "South Africa (second tier)". */
export const oppositionLabel = (opponent, year) => `${opponent} (${tierName(tierOfOpponent(opponent, year)).toLowerCase()})`;

/** The other hundreds in the innings and in the match, from the per-hundred facts [pos, innings, balls, inningsOthers, matchOthers]. */
export function otherHundredsLabel(f) {
  if (!f) return null;
  const [, , , inn, match] = f;
  if (!match) return 'None';
  return `${inn ? `${inn} in this innings` : 'None in this innings'}, ${match} in the match`;
}

export const WHERE_LABEL = { H: 'At home', A: 'Away', N: 'Neutral ground' };

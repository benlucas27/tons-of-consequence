/** Plain facts about an innings that are not part of the score: how strong the opposition were, and where it was played. */

/** The opposition tiers (a fixed grouping of nations, not a rating on the day). */
export const TIERS = [
  { n: 1, name: 'Top tier', teams: 'England, Australia, India' },
  { n: 2, name: 'Second tier', teams: 'New Zealand, South Africa' },
  { n: 3, name: 'Third tier', teams: 'Sri Lanka, West Indies, Pakistan' },
  { n: 4, name: 'Other', teams: 'Bangladesh, Zimbabwe, Ireland, Afghanistan and the rest' },
];
const TIER_OF = { England: 1, Australia: 1, India: 1, 'New Zealand': 2, 'South Africa': 2, 'Sri Lanka': 3, 'West Indies': 3, Pakistan: 3 };

export const tierOfOpponent = (opponent) => TIER_OF[opponent] || 4;
export const tierName = (n) => TIERS[n - 1].name;

export const WHERE_LABEL = { H: 'At home', A: 'Away', N: 'Neutral ground' };

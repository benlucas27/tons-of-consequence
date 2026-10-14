/**
 * Preset comparisons on the Compare page. To add one, add an entry here and run
 * `node scripts/build-careers.mjs` so its players' career figures are worked out (the monthly update does this too).
 *
 *   id        in the address: /compare?set=big-four
 *   players   `name` and `country` match the player's innings in the dataset (display name and team code).
 *             `cricsheet` is the player's ID in Cricsheet's archive (https://cricsheet.org/register/), which
 *             stays the same if the spelling of their name changes.
 */
export const COMPARE_SETS = [
  {
    id: 'big-four',
    name: 'The Big Four',
    kicker: 'Careers',
    blurb: 'Smith, Kohli, Root and Williamson: the batters who defined Test cricket in the 2010s and 2020s. Their whole careers, side by side.',
    players: [
      { name: 'Steve Smith', country: 'AUS', cricsheet: '30a45b23' },
      { name: 'Virat Kohli', country: 'IND', cricsheet: 'ba607b88' },
      { name: 'Joe Root', country: 'ENG', cricsheet: 'a343262c' },
      { name: 'Kane Williamson', country: 'NZ', cricsheet: 'd027ba9f' },
    ],
  },
];

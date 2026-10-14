/**
 * Ben's calls. The Consequence Test is a first pass on the scorecard; where common sense disagrees, a call here wins.
 * Key: "Display name|runs|year". verdict: 'yes' | 'no'. note: one plain sentence shown as the reason ("Ben's call").
 */
export const CONSEQUENCE_OVERRIDES = {
  'Joe Root|109|2021': {
    verdict: 'no',
    note: 'Rain ended the match with India needing about 50 with nine wickets in hand. The weather saved England, not the hundred.',
  },
  'Steve Smith|111|2013': {
    verdict: 'yes',
    note: 'In at 3 for 106 in an Ashes Test at Perth, close enough to the 100 line to count as a rescue. Australia won by 150 runs.',
  },
};

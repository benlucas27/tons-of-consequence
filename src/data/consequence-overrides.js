/**
 * Hand-written rulings. The Consequence Test is a first pass on the scorecard; where common sense disagrees, a ruling here wins. Readers see the note, not who made the call.
 * Key: "Display name|runs|year". verdict: 'yes' | 'no'; scenario (for a yes): the named scenario. note: one plain sentence shown as the reason ("Ben's call").
 */
export const CONSEQUENCE_OVERRIDES = {
  'Joe Root|109|2021': {
    verdict: 'no',
    note: 'Rain ended the match with India needing about 50 with nine wickets in hand. The weather saved England, not the hundred.',
  },
  'Steve Smith|111|2013': {
    verdict: 'yes',
    scenario: 'Rescued the innings',
    note: 'In at 3 for 106 in an Ashes Test at Perth, close enough to the 100 line to count as a rescue. Australia won by 150 runs.',
  },
};
